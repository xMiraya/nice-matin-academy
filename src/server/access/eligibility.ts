/**
 * Règle d'éligibilité à une simulation, sous forme de fonction pure.
 *
 * Aucune entrée/sortie ici : les données (seuil, prérequis, tentatives,
 * dérogation) sont lues en base par le service, puis passées à `evaluate`.
 * Cela rend la règle entièrement testable et impossible à influencer depuis
 * le navigateur.
 */

export type RequirementKind = "QUIZ" | "ASSESSMENT";

export interface Requirement {
  id: string;
  kind: RequirementKind;
  targetId: string;
  title: string;
  /** Seuil propre au prérequis ; `null` = seuil global. */
  requiredScore: number | null;
  active: boolean;
}

export interface Attempt {
  userId: string;
  kind: RequirementKind;
  targetId: string;
  /** Score 0–100, non arrondi (deux décimales). */
  score: number;
}

export interface AccessOverride {
  id: string;
  userId: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export interface RequirementStatus {
  title: string;
  type: RequirementKind;
  targetId: string;
  completed: boolean;
  bestScore: number | null;
  requiredScore: number;
  passed: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  /** Seuil global en vigueur. */
  requiredScore: number;
  message: string;
  requirements: RequirementStatus[];
  passedCount: number;
  totalCount: number;
  /** Vrai si l'accès repose sur une dérogation et non sur les scores. */
  viaOverride: boolean;
  override: { reason: string; grantedAt: string; expiresAt: string | null } | null;
}

export const MESSAGE_LOCKED =
  "Vous devez obtenir au moins {seuil}/100 à chaque QCM et évaluation obligatoire avant de pouvoir vous entraîner avec Julie.";
export const MESSAGE_UNLOCKED =
  "Vous avez validé tous les prérequis. Vous pouvez maintenant commencer votre simulation.";

/** Une dérogation vaut tant qu'elle n'est ni annulée ni expirée. */
export function isOverrideActive(override: AccessOverride, now: Date): boolean {
  if (override.revokedAt) return false;
  if (override.expiresAt && Date.parse(override.expiresAt) <= now.getTime()) return false;
  return true;
}

export interface EvaluateInput {
  userId: string;
  threshold: number;
  requirements: Requirement[];
  attempts: Attempt[];
  overrides: AccessOverride[];
  now: Date;
}

export function evaluate(input: EvaluateInput): EligibilityResult {
  const { userId, threshold, now } = input;

  // Défense en profondeur : seules les tentatives de CET utilisateur comptent,
  // même si l'appelant en a transmis d'autres par erreur.
  const own = input.attempts.filter((attempt) => attempt.userId === userId);

  const statuses: RequirementStatus[] = input.requirements
    .filter((requirement) => requirement.active)
    .map((requirement) => {
      const scores = own
        .filter((a) => a.kind === requirement.kind && a.targetId === requirement.targetId)
        .map((a) => a.score);
      const bestScore = scores.length > 0 ? Math.max(...scores) : null;
      const requiredScore = requirement.requiredScore ?? threshold;
      return {
        title: requirement.title,
        type: requirement.kind,
        targetId: requirement.targetId,
        completed: bestScore !== null,
        bestScore,
        requiredScore,
        // Chaque prérequis doit atteindre le seuil individuellement : aucune moyenne.
        passed: bestScore !== null && bestScore >= requiredScore,
      };
    });

  const passedCount = statuses.filter((s) => s.passed).length;
  const byScores = passedCount === statuses.length;

  const activeOverride = input.overrides.find(
    (o) => o.userId === userId && isOverrideActive(o, now),
  );
  const viaOverride = !byScores && Boolean(activeOverride);
  const eligible = byScores || viaOverride;

  return {
    eligible,
    requiredScore: threshold,
    message: eligible ? MESSAGE_UNLOCKED : MESSAGE_LOCKED.replace("{seuil}", String(threshold)),
    requirements: statuses,
    passedCount,
    totalCount: statuses.length,
    viaOverride,
    override:
      viaOverride && activeOverride
        ? {
            reason: activeOverride.reason,
            grantedAt: activeOverride.grantedAt,
            expiresAt: activeOverride.expiresAt,
          }
        : null,
  };
}

/** Résultat renvoyé à un utilisateur non identifié : jamais éligible. */
export function unauthenticatedResult(threshold: number): EligibilityResult {
  return {
    eligible: false,
    requiredScore: threshold,
    message: "Connectez-vous pour accéder à Julie.",
    requirements: [],
    passedCount: 0,
    totalCount: 0,
    viaOverride: false,
    override: null,
  };
}
