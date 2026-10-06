import "server-only";

/**
 * Diagnostic de l'intégration Tavus, exécuté côté serveur uniquement.
 *
 * Garanties :
 * - uniquement des requêtes GET de lecture (aucune conversation, aucune écriture) ;
 * - la clé API n'est jamais renvoyée ni journalisée : seules sa présence, ses
 *   longueurs et des indicateurs booléens sortent de ce module ;
 * - toute réponse Tavus affichée est tronquée et expurgée de la clé.
 */

const BASE = "https://tavusapi.com";
const TIMEOUT_MS = 15_000;
const EXPECTED_PAL_NAME = "NM Prospect P001";

export interface KeyReport {
  present: boolean;
  lengthBeforeTrim: number;
  lengthAfterTrim: number;
  leadingOrTrailingWhitespace: boolean;
  containsCarriageReturnOrNewline: boolean;
  containsInnerWhitespace: boolean;
  wrappedInQuotes: boolean;
  nonAsciiCharacters: boolean;
}

export interface Probe {
  label: string;
  /** Chemin interrogé, sans aucun secret. */
  endpoint: string;
  httpStatus: number | null;
  ok: boolean;
  /** Message renvoyé par Tavus (tronqué), ou erreur réseau. */
  message: string | null;
  data: unknown;
}

export interface TavusDiagnostic {
  ranAt: string;
  key: KeyReport;
  palId: string | null;
  faceId: string | null;
  probes: Probe[];
  pal: {
    found: boolean;
    name: string | null;
    matchesExpectedName: boolean;
    expectedName: string;
    inListing: boolean | null;
    pipelineMode: string | null;
    defaultReplicaId: string | null;
    defaultReplicaMatchesFaceId: boolean | null;
    llmModel: string | null;
    ttsEngine: string | null;
    ttsVoiceId: string | null;
    ttsEmotionControl: boolean | null;
    perceptionModel: string | null;
    turnDetectionModel: string | null;
    turnTakingPatience: string | null;
    speculativeInference: boolean | null;
    systemPromptChars: number | null;
    status: string | null;
  };
  face: {
    found: boolean;
    name: string | null;
    status: string | null;
    model: string | null;
  };
}

export function inspectKey(raw: string | undefined): KeyReport {
  const value = raw ?? "";
  const trimmed = value.trim();
  return {
    present: value.length > 0,
    lengthBeforeTrim: value.length,
    lengthAfterTrim: trimmed.length,
    leadingOrTrailingWhitespace: value !== trimmed,
    containsCarriageReturnOrNewline: /[\r\n]/.test(value),
    containsInnerWhitespace: /\s/.test(trimmed),
    wrappedInQuotes: /^["'].*["']$/.test(trimmed),
    nonAsciiCharacters: /[^\x20-\x7E\s]/.test(value),
  };
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
const bool = (value: unknown): boolean | null => (typeof value === "boolean" ? value : null);

/** Extrait un message lisible d'une réponse d'erreur Tavus, sans jamais renvoyer la clé. */
function safeMessage(body: unknown, rawText: string, secret: string): string | null {
  const record = asRecord(body);
  const candidate = str(record.message) ?? str(record.error) ?? str(record.detail) ?? rawText;
  if (!candidate) return null;
  const cleaned = secret ? candidate.split(secret).join("[clé masquée]") : candidate;
  return cleaned.slice(0, 300);
}

async function get(
  label: string,
  path: string,
  secret: string,
  headers: Record<string, string>,
): Promise<Probe> {
  const probe: Probe = { label, endpoint: `GET ${path}`, httpStatus: null, ok: false, message: null, data: null };
  try {
    const response = await fetch(`${BASE}${path}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    probe.httpStatus = response.status;
    probe.ok = response.ok;
    const text = await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    probe.data = json;
    probe.message = response.ok ? null : safeMessage(json, text, secret);
  } catch (error) {
    // Typiquement : en-tête invalide (retour ligne dans la clé) ou réseau.
    probe.message = `Requête non envoyée : ${error instanceof Error ? error.name : "erreur"}`;
  }
  console.info(
    `[diagnostic Tavus] ${probe.endpoint} -> ${probe.httpStatus ?? "aucune réponse"} (${probe.ok ? "ok" : "échec"})`,
  );
  return probe;
}

export async function runTavusDiagnostic(): Promise<TavusDiagnostic> {
  const rawKey = process.env.TAVUS_API_KEY;
  const apiKey = rawKey?.trim() ?? "";
  const palId = process.env.TAVUS_PAL_ID?.trim() || null;
  const faceId = process.env.TAVUS_FACE_ID?.trim() || null;
  const key = inspectKey(rawKey);
  console.info(
    `[diagnostic Tavus] clé présente=${key.present} longueur=${key.lengthBeforeTrim}->${key.lengthAfterTrim} parasites=${key.leadingOrTrailingWhitespace || key.containsCarriageReturnOrNewline}`,
  );

  const probes: Probe[] = [];
  const headers = { "x-api-key": apiKey };

  const emptyPal: TavusDiagnostic["pal"] = {
    found: false, name: null, matchesExpectedName: false, expectedName: EXPECTED_PAL_NAME, inListing: null,
    pipelineMode: null, defaultReplicaId: null, defaultReplicaMatchesFaceId: null, llmModel: null,
    ttsEngine: null, ttsVoiceId: null, ttsEmotionControl: null, perceptionModel: null,
    turnDetectionModel: null, turnTakingPatience: null, speculativeInference: null,
    systemPromptChars: null, status: null,
  };
  const emptyFace: TavusDiagnostic["face"] = { found: false, name: null, status: null, model: null };
  const base = { ranAt: new Date().toISOString(), key, palId, faceId };

  // Aucune réponse brute ne sort de ce module : seuls les champs utiles sont extraits.
  const clean = () => probes.map((p) => ({ ...p, data: null }));

  if (!key.present || key.lengthAfterTrim === 0) {
    return { ...base, probes: clean(), pal: emptyPal, face: emptyFace };
  }

  // 1. Listing : test d'authentification le plus simple, gratuit.
  const listing = await get("Liste des PAL", "/v2/personas?limit=100", apiKey, headers);
  probes.push(listing);

  // Si l'authentification échoue, inutile d'insister : on s'arrête là.
  if (!listing.ok && (listing.httpStatus === 401 || listing.httpStatus === 403 || listing.httpStatus === null)) {
    return { ...base, probes: clean(), pal: emptyPal, face: emptyFace };
  }

  const pal = { ...emptyPal };
  const face = { ...emptyFace };

  const listed = asRecord(listing.data).data;
  if (Array.isArray(listed) && palId) {
    pal.inListing = listed.some((item) => str(asRecord(item).persona_id) === palId);
  }

  // 2. Le PAL configuré.
  if (palId) {
    const palProbe = await get("PAL configuré", `/v2/personas/${encodeURIComponent(palId)}`, apiKey, headers);
    probes.push({ ...palProbe, data: null });
    if (palProbe.ok) {
      const record = asRecord(palProbe.data);
      const layers = asRecord(record.layers);
      const flow = asRecord(layers.conversational_flow);
      pal.found = true;
      pal.name = str(record.persona_name);
      pal.matchesExpectedName = pal.name === EXPECTED_PAL_NAME;
      pal.pipelineMode = str(record.pipeline_mode);
      pal.defaultReplicaId = str(record.default_replica_id) ?? str(record.default_face_id);
      pal.defaultReplicaMatchesFaceId = faceId && pal.defaultReplicaId ? pal.defaultReplicaId === faceId : null;
      pal.llmModel = str(asRecord(layers.llm).model);
      pal.ttsEngine = str(asRecord(layers.tts).tts_engine);
      pal.ttsVoiceId = str(asRecord(layers.tts).external_voice_id);
      pal.ttsEmotionControl = bool(asRecord(layers.tts).tts_emotion_control);
      pal.perceptionModel = str(asRecord(layers.perception).perception_model);
      pal.turnDetectionModel = str(flow.turn_detection_model);
      pal.turnTakingPatience = str(flow.turn_taking_patience);
      pal.speculativeInference = bool(asRecord(layers.llm).speculative_inference);
      pal.systemPromptChars = typeof record.system_prompt === "string" ? record.system_prompt.length : null;
      pal.status = str(record.status);
    }
  }

  // 3. Le Face configuré (réplique), en GET uniquement.
  if (faceId) {
    let faceProbe = await get("Face configuré", `/v2/replicas/${encodeURIComponent(faceId)}`, apiKey, headers);
    if (faceProbe.httpStatus === 404) {
      faceProbe = await get("Face configuré (chemin alternatif)", `/v2/faces/${encodeURIComponent(faceId)}`, apiKey, headers);
    }
    probes.push({ ...faceProbe, data: null });
    if (faceProbe.ok) {
      const record = asRecord(faceProbe.data);
      face.found = true;
      face.name = str(record.replica_name) ?? str(record.face_name) ?? str(record.name);
      face.status = str(record.status);
      face.model = str(record.model_name) ?? str(record.model);
    }
  }

  return { ...base, probes: clean(), pal, face };
}
