import { getCompetency } from '@/src/data/qcm/competencies';
import { qcmRoutes } from '@/src/data/qcm/routes';
import { LEVEL_LABELS } from '@/src/data/qcm/config';
import type { AssessmentResult, LevelId, Recommendation } from '@/src/types/qcm/quiz';

/**
 * Construit une liste de recommandations a partir d'un resultat.
 * Les recommandations restent factuelles : pas de comparaison entre commerciaux,
 * pas de felicitations excessives.
 */
export function recommendationsFor(result: AssessmentResult): readonly Recommendation[] {
  const items: Recommendation[] = [];

  result.toImprove.forEach((id, rank) => {
    const competency = getCompetency(id);
    const score = result.perCompetency.find((c) => c.competency === id);
    const percent = score ? Math.round(score.ratio * 100) : 0;
    items.push({
      kind: 'training',
      title: `Entrainement cible : ${competency.label}`,
      reason:
        rank === 0
          ? `Ecart le plus marque de cette evaluation : ${percent} % sur cette competence.`
          : `Ecart egalement significatif : ${percent} % sur cette competence.`,
      href: qcmRoutes.trainingFor(competency.id),
    });
  });

  if (result.toImprove.length === 0 && result.percent < 100) {
    const weakest = [...result.perCompetency]
      .filter((c) => c.questionCount > 0)
      .sort((a, b) => a.ratio - b.ratio)[0];
    if (weakest) {
      const competency = getCompetency(weakest.competency);
      items.push({
        kind: 'training',
        title: `Entretien : ${competency.label}`,
        reason: "Aucune competence n'est en difficulte ; celle-ci reste la plus perfectible.",
        href: qcmRoutes.trainingFor(competency.id),
      });
    }
  }

  if (result.percent >= 65 && result.level < 5) {
    const next = (result.level + 1) as LevelId;
    items.push({
      kind: 'assessment',
      title: `Passer le niveau ${next} - ${LEVEL_LABELS[next]}`,
      reason: 'Le resultat obtenu indique que le niveau superieur est abordable.',
      href: qcmRoutes.assessmentFor(next),
    });
  } else if (result.percent < 65) {
    items.push({
      kind: 'assessment',
      title: `Refaire le niveau ${result.level} - ${LEVEL_LABELS[result.level]}`,
      reason: 'Les questions sont retirees aleatoirement : la seconde passation mesure la comprehension, pas la memorisation.',
      href: qcmRoutes.assessmentFor(result.level),
    });
  }

  if (result.percent < 50) {
    items.push({
      kind: 'method',
      title: 'Relire la methode commerciale',
      reason: 'Une relecture des huit competences aide a structurer les entrainements suivants.',
      href: qcmRoutes.method,
    });
  }

  return items;
}
