import type { LevelId, MasteryBand } from '@/src/types/qcm/quiz';

/**
 * Parametrage pedagogique de l'application.
 * TOUS les seuils de ce fichier sont provisoires et doivent etre valides par
 * l'equipe formation Nice-Matin avant publication (voir
 * docs/CONTENT-A-VALIDER-NICE-MATIN.md).
 */

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? 'Academie commerciale - Entrainement';

export const STORAGE_NAMESPACE =
  process.env.NEXT_PUBLIC_STORAGE_NAMESPACE ?? 'nm-academie-qcm.v1';

/**
 * Progression libre : toutes les evaluations sont accessibles (defaut pilote).
 * Progression conditionnelle : le niveau N+1 se debloque au-dela d'un seuil.
 */
export type ProgressionMode = 'libre' | 'conditionnelle';

export const PROGRESSION_MODE: ProgressionMode =
  process.env.NEXT_PUBLIC_PROGRESSION_MODE === 'conditionnelle' ? 'conditionnelle' : 'libre';

/** Pourcentage minimal pour debloquer le niveau suivant en mode conditionnel. */
export const UNLOCK_THRESHOLD_PERCENT = 65;

/** Bandes de maitrise, du plus faible au plus eleve. Seuils PROVISOIRES. */
export const MASTERY_BANDS: readonly MasteryBand[] = [
  {
    id: 'fondamentaux',
    minPercent: 0,
    label: 'Fondamentaux a reprendre',
    message:
      "Les bases de la methode ne sont pas encore stabilisees. Reprenez les entrainements cibles competence par competence, puis refaites cette evaluation : c'est le chemin le plus rapide.",
  },
  {
    id: 'fragile',
    minPercent: 50,
    label: 'Acquis fragiles',
    message:
      "Les grands principes sont compris, mais leur application reste irreguliere. Travaillez en priorite les deux competences les plus basses avant de repasser l'evaluation.",
  },
  {
    id: 'operationnel',
    minPercent: 65,
    label: 'Niveau operationnel',
    message:
      "La methode est appliquee correctement dans la majorite des situations. Les ecarts restants concernent surtout les cas nuances : ciblez-les avec les entrainements dedies.",
  },
  {
    id: 'bonne-maitrise',
    minPercent: 80,
    label: 'Bonne maitrise',
    message:
      "La methode est solide et appliquee avec regularite. Le niveau superieur constitue la suite logique, avec des situations plus ambigues.",
  },
  {
    id: 'avancee',
    minPercent: 90,
    label: 'Maitrise avancee',
    message:
      "L'ensemble des competences est maitrise, y compris sur les situations nuancees. Vous pouvez utiliser les entrainements comme entretien regulier plutot que comme remediation.",
  },
];

/** Seuil au-dessus duquel une competence est consideree comme maitrisee. */
export const STRENGTH_RATIO = 0.8;
/** Seuil en-dessous duquel une competence est signalee a retravailler. */
export const IMPROVE_RATIO = 0.65;

/** Nombre de questions tirees a chaque session d'entrainement cible. */
export const TRAINING_SAMPLE_SIZE = 10;

/** Libelles des cinq niveaux, utilises dans la progression visuelle. */
export const LEVEL_LABELS: Readonly<Record<LevelId, string>> = {
  1: 'Fondamentaux',
  2: 'Application',
  3: 'Adaptation',
  4: 'Situations difficiles',
  5: 'Maitrise commerciale',
};

/**
 * Regle de notation des questions a choix multiples, annoncee a l'utilisateur
 * avant chaque evaluation.
 */
export const MULTIPLE_CHOICE_RULE =
  "Pour les questions a choix multiples, chaque bonne reponse cochee rapporte une part des points. Une reponse incorrecte cochee annule une part equivalente, sans jamais faire descendre la question sous zero point.";
