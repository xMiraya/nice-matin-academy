import type { CompetencyId } from "@/src/types/qcm/competency";
import type { LevelId } from "@/src/types/qcm/quiz";

/**
 * Préfixe unique des routes de l'entraînement QCM à l'intérieur de l'espace
 * commercial. Toutes les liaisons internes passent par ces fonctions : changer
 * l'emplacement de la rubrique ne demande alors qu'une seule modification.
 */
export const QCM_BASE = "/commercial/qcm";

export const qcmRoutes = {
  home: QCM_BASE,
  training: `${QCM_BASE}/entrainement`,
  trainingFor: (competency: CompetencyId) => `${QCM_BASE}/entrainement/${competency}`,
  assessments: `${QCM_BASE}/evaluations`,
  assessmentFor: (level: LevelId) => `${QCM_BASE}/evaluations/${level}`,
  result: (resultId: string) => `${QCM_BASE}/resultats/${resultId}`,
  progress: `${QCM_BASE}/progression`,
  /** La méthode détaillée vit désormais dans les fiches méthodologiques. */
  method: "/commercial/fiches",
} as const;
