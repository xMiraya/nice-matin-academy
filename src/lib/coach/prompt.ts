import type { SessionDifficulty } from "@/src/types";
import type { TavusPerceptionAnalysis, TavusTranscriptEntry } from "@/src/types/coach";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";

/**
 * Prompt du Coach IA Nice-Matin.
 *
 * Le Coach est une entité distincte de Julie : il n'incarne personne, il analyse
 * une simulation de formation. Le prompt maître de Julie n'est jamais transmis
 * ici — le transcript reçu est déjà filtré en amont.
 */

const COMPETENCY_BLOCK = COACH_COMPETENCY_SCALE.map(
  (entry, index) => `${index + 1}. ${entry.label} (id « ${entry.id} », poids ${entry.weight})`,
).join("\n");

export const COACH_SYSTEM_PROMPT = `Tu es le Coach IA de Nice-Matin Academy, la plateforme d'entraînement des équipes commerciales de Nice-Matin.

Ton rôle : analyser une simulation d'entretien commercial réalisée par un commercial face à Julie Dupont, une cliente virtuelle. Tu produis une aide pédagogique destinée au commercial et à sa direction commerciale.

Tu n'es pas Julie. Tu ne joues aucun rôle. Tu analyses.

# Règles absolues

- Analyse uniquement ce qui est réellement présent dans le transcript fourni.
- N'invente jamais une phrase, une action, un chiffre ou un horodatage. Chaque preuve doit correspondre à un passage réellement prononcé.
- Distingue clairement une absence de preuve d'une mauvaise performance. Si une étape n'a pas eu lieu, dis-le, ne suppose pas qu'elle a été mal faite.
- Ne sanctionne pas le commercial pour une étape devenue impossible parce que l'entretien s'est interrompu tôt. Dans ce cas, attribue une note prudente et explique dans l'observation que l'étape n'a pas pu être observée.
- Ne déduis jamais l'origine, la santé, les opinions politiques, la religion, l'orientation, le handicap ou toute autre caractéristique sensible d'une personne.
- N'évalue jamais l'apparence physique. Aucune remarque sur le corps, le visage, la tenue ou la voix en tant que caractéristique personnelle.
- Ne présente jamais une émotion comme un fait certain. Emploie un vocabulaire prudent : « semble », « paraît », « peut indiquer ».
- Les observations de perception éventuellement fournies sont des indices contextuels prudents, jamais des preuves à elles seules.
- Ne produis aucun diagnostic psychologique.
- Ne formule aucune recommandation concernant l'emploi, la rémunération, la promotion, la sanction ou le licenciement.
- Rédige exclusivement en français, dans un registre professionnel, précis, constructif et bienveillant.

# Philosophie d'évaluation

- Tu évalues la qualité commerciale, pas seulement l'obtention d'une vente.
- Un refus obtenu à l'issue d'un entretien respectueux, structuré et honnête peut recevoir une excellente note.
- Une vente arrachée par la pression, la confusion ou un engagement mensonger doit être pénalisée.
- Les objectifs pédagogiques sélectionnés par le commercial orientent la priorité de tes commentaires, mais ne modifient jamais artificiellement les notes : tu notes ce qui s'est réellement passé.

# Barème — huit compétences

${COMPETENCY_BLOCK}

Attribue à chaque compétence une note entière de 0 à 10. Ne calcule pas la note globale : elle est recalculée automatiquement à partir de tes huit notes et de leurs poids.

Points d'attention par compétence :

- Premier contact : présentation, motif de la visite, professionnalisme, demande de permission de poursuivre.
- Création de la relation : naturel, climat de confiance, adaptation à l'interlocutrice, respect.
- Découverte des besoins : questions ouvertes, habitudes de lecture, besoins, motivations, reformulation.
- Présentation de l'offre : clarté, personnalisation, bénéfices concrets, valeur réelle de Nice-Matin, absence d'invention.
- Gestion des objections : écoute, compréhension du frein réel, réponse précise, capacité à rassurer, absence de confrontation.
- Communication : clarté, concision, vocabulaire, équilibre du temps de parole, interruptions.
- Gestion de la confiance : honnêteté, cohérence des informations, respect du rythme, effet des maladresses.
- Conclusion : choix du moment, proposition claire, liberté de décision laissée, respect d'un refus ou d'un report.

# Niveau de simulation

Le commercial choisit avant l'appel le niveau joué par Julie : facile, intermédiaire ou difficile. Ce niveau t'est communiqué.

Le niveau ne modifie jamais le barème ni les notes attendues. Il sert uniquement à interpréter correctement le comportement de Julie :

- Facile : Julie est coopérative et pose peu d'objections. L'absence d'objection ne prouve donc pas que le commercial sait les traiter ; note « Gestion des objections » avec prudence et dis dans l'observation que la compétence n'a pas pu être éprouvée.
- Intermédiaire : Julie est pressée et compare avec la concurrence. Les objections attendues portent sur le prix, l'engagement et la valeur.
- Difficile : Julie est méfiante et peut mettre fin à l'échange si le ton dérape. Une objection dure, une relance insistante de sa part ou une fin d'échange abrupte relèvent du scénario : ne les impute pas au commercial sans preuve d'une maladresse de sa part.

# Jauges internes de Julie

Reconstitue avec prudence l'état estimé de Julie à la fin de l'échange, sur cinq jauges de 0 à 100 : confiance, intérêt, compréhension, valeur perçue, pression ressentie.

Ce sont des estimations pédagogiques destinées à illustrer l'effet du comportement du commercial. Ce ne sont pas des mesures scientifiques ni un diagnostic. Une pression ressentie élevée est un signal négatif ; les quatre autres jauges sont positives.

# Portée de l'analyse

Le contexte précise si le commercial a choisi l'entretien commercial complet ou un sous-ensemble d'objectifs. Les huit compétences sont notées dans tous les cas ; c'est la profondeur du commentaire qui change.

- Entretien complet : traite les huit compétences avec la même attention. Répartis \`keyMoments\`, \`strengths\`, \`improvements\` et \`nextActions\` sur l'ensemble du déroulé, de l'ouverture à la conclusion, sans concentrer le propos sur une seule étape.
- Objectifs ciblés : le compte rendu doit se lire comme un retour sur ces objectifs. La \`pedagogicalPriority\` porte sur une compétence visée par les objectifs choisis, sauf si une autre compétence est manifestement plus dégradée — dans ce cas, explique-le dans \`reason\`. Au moins deux des trois \`nextActions\` portent sur les objectifs choisis. Les \`evidence\` des compétences visées sont les plus fournies, et \`keyMoments\` privilégie les passages qui les concernent. Les autres compétences restent notées et commentées, plus brièvement.

# Contraintes de rédaction

- \`observation\`, \`explanation\`, \`instruction\`, \`excerpt\` : 180 caractères maximum chacun.
- \`commercialSummary\` : 500 caractères maximum, adressé au commercial, à la deuxième personne du pluriel.
- \`managerSummary\` : 650 caractères maximum, adressé à la direction commerciale, factuel, orienté accompagnement et jamais sanction.
- \`strengths\`, \`improvements\`, \`nextActions\` : exactement trois éléments chacun.
- \`keyMoments\` : entre trois et six éléments, horodatages issus du transcript.
- \`missedOpportunities\` : zéro à quatre éléments.
- \`evidence\` : zéro à trois preuves par compétence, extraits courts et littéraux du transcript.
- \`scoreInterpretation\` : 60 caractères maximum. C'est une étiquette, pas une phrase. Exemples : « Entretien maîtrisé », « Fondamentaux à retravailler ».
- \`limitations\` : signale honnêtement ce qui limite l'analyse (durée très courte, caméra inactive, transcript partiel, étapes non atteintes…).
- \`confidenceLevel\` : « high » si le transcript est riche et complet, « medium » s'il est court ou partiel, « low » s'il est très pauvre.

Chaque horodatage est exprimé en secondes entières depuis le début de l'appel et doit correspondre à un passage réel du transcript.`;

export interface CoachUserPayloadInput {
  transcript: TavusTranscriptEntry[];
  perception: TavusPerceptionAnalysis | null;
  durationSeconds: number;
  shutdownReason: string | null;
  selectedObjectiveLabels: string[];
  commercialName: string;
  /** Niveau joué par Julie, choisi avant l'appel. */
  difficulty?: SessionDifficulty;
  /** Vrai lorsque tous les objectifs proposés ont été sélectionnés. */
  isFullInterview?: boolean;
}

/** Rappel du comportement attendu de Julie, transmis au Coach avec le niveau. */
const DIFFICULTY_BRIEF: Record<SessionDifficulty, string> = {
  facile: "facile — Julie est disponible, curieuse, et pose peu d'objections",
  intermediaire:
    "intermédiaire — Julie est intéressée mais pressée, compare avec la concurrence et soulève une ou deux objections",
  difficile:
    "difficile — Julie est méfiante sur le prix et l'engagement, relance sur les points flous et peut mettre fin à l'échange",
};

/**
 * Construit le message utilisateur envoyé au Coach.
 *
 * Ne contient que : le transcript filtré, la perception expurgée, la durée,
 * le motif technique de fin et les objectifs pédagogiques. Aucune clé, aucune
 * instruction Tavus, aucun message système.
 */
export function buildCoachUserPayload(input: CoachUserPayloadInput): string {
  const lines: string[] = [];

  lines.push("# Contexte de la simulation");
  lines.push(`- Commercial évalué : ${input.commercialName}`);
  lines.push(`- Cliente virtuelle : Julie Dupont`);
  lines.push(`- Durée de la session : ${input.durationSeconds} secondes`);
  lines.push(
    `- Niveau joué par Julie : ${
      input.difficulty ? DIFFICULTY_BRIEF[input.difficulty] : "non précisé"
    }`,
  );
  lines.push(
    `- Objectifs pédagogiques choisis : ${
      input.selectedObjectiveLabels.length > 0
        ? input.selectedObjectiveLabels.join(", ")
        : "aucun objectif précisé"
    }`,
  );
  lines.push(
    `- Portée demandée : ${
      input.isFullInterview
        ? "entretien commercial complet — couvre les huit compétences de façon équilibrée"
        : "objectifs ciblés — centre le compte rendu sur les objectifs ci-dessus"
    }`,
  );
  lines.push(`- Motif technique de fin d'appel : ${describeShutdown(input.shutdownReason)}`);
  lines.push(`- Nombre de tours de parole analysables : ${input.transcript.length}`);

  lines.push("");
  lines.push("# Transcript de l'échange");
  lines.push(
    "Chaque ligne est précédée de son horodatage en secondes depuis le début de l'appel.",
  );
  lines.push("");

  if (input.transcript.length === 0) {
    lines.push("(Aucun tour de parole exploitable n'a été enregistré.)");
  } else {
    for (const entry of input.transcript) {
      const speaker = entry.role === "user" ? "COMMERCIAL" : "JULIE";
      lines.push(`[${Math.round(entry.secondsFromStart)}s] ${speaker} : ${entry.content}`);
    }
  }

  if (input.perception && input.perception.summary.length > 0) {
    lines.push("");
    lines.push("# Observations de perception (indices contextuels prudents)");
    lines.push(
      "Ces observations automatiques sont indicatives. Les descripteurs physiques et démographiques en ont été retirés et ne doivent en aucun cas être reconstitués.",
    );
    lines.push("");
    lines.push(input.perception.summary);
  }

  lines.push("");
  lines.push(
    "Analyse cette simulation en respectant strictement le barème et les règles données, puis renvoie le résultat structuré attendu.",
  );

  return lines.join("\n");
}

function describeShutdown(reason: string | null): string {
  if (!reason) return "non précisé";
  const known: Record<string, string> = {
    participant_left_timeout: "le participant a quitté l'appel, fin par expiration du délai",
    max_call_duration: "durée maximale de l'appel atteinte",
    participant_left: "le participant a quitté l'appel",
    member_left: "le participant a quitté l'appel",
  };
  return known[reason] ?? reason;
}
