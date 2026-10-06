import type { Metadata } from "next";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { requireRole } from "@/src/server/auth";
import { runTavusDiagnostic } from "@/src/server/tavus-diagnostic";

export const metadata: Metadata = {
  title: "Diagnostic Tavus",
  description: "Contrôle en lecture seule de l'intégration Tavus.",
};

// Le diagnostic doit refléter l'état réel à chaque ouverture de la page.
export const dynamic = "force-dynamic";

const yesNo = (value: boolean | null) => (value === null ? "non déterminé" : value ? "oui" : "non");
const show = (value: string | number | null) => (value === null || value === "" ? "—" : String(value));

function Row({ term, detail, tone }: { term: string; detail: string; tone?: "ok" | "ko" }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
      <dt className="text-sm text-graphite">{term}</dt>
      <dd
        className={
          tone === "ok"
            ? "break-all text-right text-sm font-semibold text-positive"
            : tone === "ko"
              ? "break-all text-right text-sm font-semibold text-danger"
              : "break-all text-right text-sm font-medium text-ink"
        }
      >
        {detail}
      </dd>
    </div>
  );
}

/** Diagnostic exécuté côté serveur : seules des requêtes GET partent vers Tavus, la clé n'est jamais affichée. */
export default async function DiagnosticTavusPage() {
  await requireRole("manager");
  const d = await runTavusDiagnostic();
  const firstProbe = d.probes[0];
  const authOk = firstProbe?.ok === true;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Diagnostic Tavus"
        description="Lecture seule : aucune conversation n'est créée, rien n'est modifié chez Tavus, aucune minute n'est consommée."
        actions={
          <ButtonLink href="/manager/diagnostic-tavus" variant="secondary">
            Relancer le test
          </ButtonLink>
        }
        meta={
          <Badge tone={authOk ? "positif" : "critique"} dot>
            {authOk ? "Authentification Tavus valide" : "Authentification Tavus en échec"}
          </Badge>
        }
      />

      <div className="space-y-5">
        <Panel title="Clé API (valeur jamais affichée)" description={`Contrôle effectué le ${new Date(d.ranAt).toLocaleString("fr-FR")}.`}>
          <dl className="space-y-2.5">
            <Row term="TAVUS_API_KEY présente" detail={d.key.present ? "oui" : "non"} tone={d.key.present ? "ok" : "ko"} />
            <Row term="Longueur avant trim" detail={String(d.key.lengthBeforeTrim)} />
            <Row term="Longueur après trim" detail={String(d.key.lengthAfterTrim)} />
            <Row
              term="Espaces en début ou fin"
              detail={d.key.leadingOrTrailingWhitespace ? "oui" : "non"}
              tone={d.key.leadingOrTrailingWhitespace ? "ko" : "ok"}
            />
            <Row
              term="Retour ligne (\r ou \n)"
              detail={d.key.containsCarriageReturnOrNewline ? "oui" : "non"}
              tone={d.key.containsCarriageReturnOrNewline ? "ko" : "ok"}
            />
            <Row term="Espace à l'intérieur" detail={d.key.containsInnerWhitespace ? "oui" : "non"} tone={d.key.containsInnerWhitespace ? "ko" : "ok"} />
            <Row term="Entourée de guillemets" detail={d.key.wrappedInQuotes ? "oui" : "non"} tone={d.key.wrappedInQuotes ? "ko" : "ok"} />
            <Row term="Caractères non ASCII" detail={d.key.nonAsciiCharacters ? "oui" : "non"} tone={d.key.nonAsciiCharacters ? "ko" : "ok"} />
          </dl>
        </Panel>

        <Panel title="Requêtes envoyées à Tavus (GET uniquement)">
          {d.probes.length === 0 ? (
            <p className="text-sm text-graphite">Aucune requête envoyée : la clé est absente ou vide.</p>
          ) : (
            <ul className="space-y-4">
              {d.probes.map((probe) => (
                <li key={probe.endpoint} className="rounded-md bg-mist/70 p-4">
                  <p className="text-sm font-semibold text-ink">{probe.label}</p>
                  <dl className="mt-2 space-y-2">
                    <Row term="Endpoint" detail={probe.endpoint} />
                    <Row term="Code HTTP" detail={show(probe.httpStatus)} tone={probe.ok ? "ok" : "ko"} />
                    <Row term="Résultat" detail={probe.ok ? "succès" : "échec"} tone={probe.ok ? "ok" : "ko"} />
                    <Row term="Message Tavus" detail={show(probe.message)} />
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="PAL configuré">
          <dl className="space-y-2.5">
            <Row term="TAVUS_PAL_ID" detail={show(d.palId)} />
            <Row term="PAL trouvé" detail={d.pal.found ? "oui" : "non"} tone={d.pal.found ? "ok" : "ko"} />
            <Row term="Présent dans la liste des PAL" detail={yesNo(d.pal.inListing)} />
            <Row term="Nom du PAL" detail={show(d.pal.name)} />
            <Row
              term={`Nom attendu « ${d.pal.expectedName} »`}
              detail={d.pal.found ? (d.pal.matchesExpectedName ? "conforme" : "différent") : "non déterminé"}
              tone={d.pal.found ? (d.pal.matchesExpectedName ? "ok" : "ko") : undefined}
            />
            <Row term="Statut" detail={show(d.pal.status)} />
            <Row term="Mode du pipeline" detail={show(d.pal.pipelineMode)} />
            <Row term="Face par défaut du PAL" detail={show(d.pal.defaultReplicaId)} />
            <Row term="Identique à TAVUS_FACE_ID" detail={yesNo(d.pal.defaultReplicaMatchesFaceId)} />
            <Row term="Modèle conversationnel" detail={show(d.pal.llmModel)} />
            <Row term="Inférence spéculative" detail={yesNo(d.pal.speculativeInference)} />
            <Row term="Moteur vocal" detail={show(d.pal.ttsEngine)} />
            <Row term="Voix externe" detail={show(d.pal.ttsVoiceId)} />
            <Row term="Contrôle d'émotion vocale" detail={yesNo(d.pal.ttsEmotionControl)} />
            <Row term="Perception (Raven)" detail={show(d.pal.perceptionModel)} />
            <Row term="Détection de tour (Sparrow)" detail={show(d.pal.turnDetectionModel)} />
            <Row term="Patience de prise de parole" detail={show(d.pal.turnTakingPatience)} />
            <Row term="Taille du prompt système (caractères)" detail={show(d.pal.systemPromptChars)} />
          </dl>
        </Panel>

        <Panel title="Face configuré">
          <dl className="space-y-2.5">
            <Row term="TAVUS_FACE_ID" detail={show(d.faceId)} />
            <Row term="Face trouvé" detail={d.face.found ? "oui" : "non"} tone={d.face.found ? "ok" : "ko"} />
            <Row term="Nom" detail={show(d.face.name)} />
            <Row term="Statut" detail={show(d.face.status)} />
            <Row term="Modèle" detail={show(d.face.model)} />
          </dl>
        </Panel>
      </div>
    </>
  );
}
