import type { TavusPerceptionAnalysis, TavusTranscriptEntry } from "@/src/types/coach";

/**
 * Récupération d'une conversation Tavus côté serveur.
 *
 * TODO sécurité : ajouter authentification, autorisation, limitation de débit et
 * stockage interne avant production.
 *
 * `TAVUS_API_KEY` est lue depuis l'environnement, transmise uniquement dans
 * l'en-tête `x-api-key`, et n'est jamais journalisée ni renvoyée.
 */

const TAVUS_TIMEOUT_MS = 15_000;

/** Format prudent : bloque toute injection de chemin dans l'URL Tavus. */
const CONVERSATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidConversationId(value: string): boolean {
  return CONVERSATION_ID_PATTERN.test(value);
}

export type TavusFetchOutcome =
  | { kind: "ok"; conversation: TavusConversationData }
  | { kind: "not_found" }
  | { kind: "not_configured" }
  | { kind: "credits_exhausted" }
  | { kind: "upstream_error" };

export interface TavusConversationData {
  conversationId: string;
  conversationName: string;
  /** Statut brut Tavus : `active`, `ended`, … */
  status: string;
  createdAt: string;
  /** Durée de session en secondes, estimée à partir des événements. */
  durationSeconds: number;
  shutdownReason: string | null;
  hasShutdown: boolean;
  transcriptReady: boolean;
  /** Transcript filtré : uniquement les tours réellement prononcés. */
  transcript: TavusTranscriptEntry[];
  perception: TavusPerceptionAnalysis | null;
}

interface TavusEvent {
  event_type?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
}

interface RawTranscriptEntry {
  role?: unknown;
  content?: unknown;
  seconds_from_start?: unknown;
  duration?: unknown;
}

/**
 * Appelle l'API Tavus et renvoie une vue nettoyée de la conversation.
 * Aucune donnée secrète (clé, prompt système, identifiants techniques internes)
 * n'est incluse dans le résultat.
 */
export async function getTavusConversation(conversationId: string): Promise<TavusFetchOutcome> {
  if (!isValidConversationId(conversationId)) {
    return { kind: "not_found" };
  }

  const apiKey = process.env.TAVUS_API_KEY?.trim();
  const expectedPalId = process.env.TAVUS_PAL_ID;
  if (!apiKey || !expectedPalId) {
    return { kind: "not_configured" };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://tavusapi.com/v2/conversations/${encodeURIComponent(conversationId)}?verbose=true`,
      {
        method: "GET",
        headers: { "x-api-key": apiKey },
        signal: AbortSignal.timeout(TAVUS_TIMEOUT_MS),
        cache: "no-store",
      },
    );
  } catch {
    return { kind: "upstream_error" };
  }

  if (response.status === 404) return { kind: "not_found" };
  if (response.status === 402) return { kind: "credits_exhausted" };

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const lowered = body.toLowerCase();

    if (lowered.includes("out of conversational credits")) {
      return { kind: "credits_exhausted" };
    }
    // Tavus répond 400 « Invalid conversation_id » pour un identifiant inconnu :
    // pour l'appelant, il s'agit bien d'une conversation introuvable.
    if (response.status === 400 && lowered.includes("invalid conversation_id")) {
      return { kind: "not_found" };
    }
    return { kind: "upstream_error" };
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await response.json()) as Record<string, unknown>;
  } catch {
    return { kind: "upstream_error" };
  }

  // La conversation doit appartenir au personnage configuré pour cette plateforme.
  if (typeof raw.pal_id === "string" && raw.pal_id !== expectedPalId) {
    return { kind: "not_found" };
  }

  return { kind: "ok", conversation: buildConversationData(conversationId, raw) };
}

function buildConversationData(
  conversationId: string,
  raw: Record<string, unknown>,
): TavusConversationData {
  const events = Array.isArray(raw.events) ? (raw.events as TavusEvent[]) : [];

  const transcriptEvent = events.find((e) => e.event_type === "application.transcription_ready");
  const perceptionEvent = events.find((e) => e.event_type === "application.perception_analysis");
  const shutdownEvent = events.find((e) => e.event_type === "system.shutdown");
  const joinedEvent = events.find((e) => e.event_type === "system.replica_joined");

  const transcript = filterTranscript(transcriptEvent?.properties?.transcript);

  const perceptionRaw = perceptionEvent?.properties?.analysis;
  const perception =
    typeof perceptionRaw === "string" && perceptionRaw.trim().length > 0
      ? redactPerceptionAnalysis(perceptionRaw)
      : null;

  const shutdownReason =
    typeof shutdownEvent?.properties?.shutdown_reason === "string"
      ? (shutdownEvent.properties.shutdown_reason as string)
      : null;

  return {
    conversationId,
    conversationName: typeof raw.conversation_name === "string" ? raw.conversation_name : "",
    status: typeof raw.status === "string" ? raw.status : "unknown",
    createdAt: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
    durationSeconds: estimateDurationSeconds(joinedEvent, shutdownEvent, transcript),
    shutdownReason,
    hasShutdown: Boolean(shutdownEvent),
    transcriptReady: Boolean(transcriptEvent),
    transcript,
    perception,
  };
}

/**
 * Filtrage strict du transcript.
 *
 * Tavus place le prompt maître de Julie et les repères techniques dans des
 * entrées `role=system`. Elles sont supprimées ici, à la source : seules les
 * paroles réellement échangées poursuivent leur chemin vers le Coach.
 */
export function filterTranscript(rawTranscript: unknown): TavusTranscriptEntry[] {
  if (!Array.isArray(rawTranscript)) return [];

  const entries: TavusTranscriptEntry[] = [];

  for (const item of rawTranscript as RawTranscriptEntry[]) {
    if (!item || typeof item !== "object") continue;

    // Liste blanche explicite : tout rôle inconnu (system, tool, …) est écarté.
    if (item.role !== "user" && item.role !== "assistant") continue;

    if (typeof item.content !== "string") continue;
    const content = item.content.trim();
    if (content.length === 0) continue;

    entries.push({
      role: item.role,
      content,
      secondsFromStart: toFiniteNumber(item.seconds_from_start) ?? 0,
      durationSeconds: toFiniteNumber(item.duration),
    });
  }

  return entries.sort((a, b) => a.secondsFromStart - b.secondsFromStart);
}

/**
 * Retire de l'analyse de perception tout descripteur physique ou démographique.
 *
 * Tavus décrit spontanément l'apparence de la personne filmée (teint, sexe
 * supposé, tranche d'âge, vêtements). Ces éléments ne doivent jamais servir à
 * évaluer un commercial : ils sont supprimés avant tout envoi au Coach.
 */
export function redactPerceptionAnalysis(analysis: string): TavusPerceptionAnalysis {
  // Sections dont l'intitulé porte sur l'apparence : retirées intégralement.
  const SENSITIVE_SECTION = /visual|appearance|physical|demographic|identity|background/i;
  // Filet de sécurité au niveau de la phrase, pour les autres sections.
  const SENSITIVE_TERMS =
    /\b(skin|skinned|complexion|male|female|man|woman|gender|age[ds]?|\d{2}s\b|years old|hair|beard|ethnic|race|racial|origin|nationality|religio|disab|health|illness|wearing|clothing|shirt|glasses|attractive|handsome|pretty)\b/i;

  let redacted = false;

  // Le texte Tavus est une liste à puces « *   **Intitulé :** contenu ».
  const sections = analysis
    .split(/\n(?=\s*\*\s)/)
    .map((section) => section.trim())
    .filter((section) => section.length > 0);

  const kept: string[] = [];

  for (const section of sections) {
    const labelMatch = section.match(/\*\*(.+?)\*\*/);
    const label = labelMatch?.[1] ?? "";

    if (SENSITIVE_SECTION.test(label)) {
      redacted = true;
      continue;
    }

    // Découpage phrase à phrase pour ne retirer que ce qui est problématique.
    const sentences = section.split(/(?<=\.)\s+/);
    const keptSentences = sentences.filter((sentence) => {
      if (SENSITIVE_TERMS.test(sentence)) {
        redacted = true;
        return false;
      }
      return true;
    });

    const rebuilt = keptSentences.join(" ").trim();
    if (rebuilt.length > 0) kept.push(rebuilt);
  }

  return {
    summary: kept.join("\n").trim(),
    redacted,
  };
}

/**
 * Durée de la session : entre l'arrivée du personnage et l'extinction.
 * À défaut d'événements, on retombe sur l'amplitude du transcript.
 */
function estimateDurationSeconds(
  joinedEvent: TavusEvent | undefined,
  shutdownEvent: TavusEvent | undefined,
  transcript: TavusTranscriptEntry[],
): number {
  const start = joinedEvent?.timestamp ? Date.parse(joinedEvent.timestamp) : NaN;
  const end = shutdownEvent?.timestamp ? Date.parse(shutdownEvent.timestamp) : NaN;

  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    return Math.round((end - start) / 1000);
  }

  const last = transcript.at(-1);
  if (last) {
    return Math.round(last.secondsFromStart + (last.durationSeconds ?? 0));
  }

  return 0;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
