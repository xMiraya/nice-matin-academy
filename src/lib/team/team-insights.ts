import type {
  CompetencyId,
  ManagerDashboard,
  PedagogicalAlert,
  TeamMember,
  UserProfile,
} from "@/src/types";
import type { CoachReport } from "@/src/types/coach";
import { COMPETENCIES, getCompetencyLabel } from "@/src/data/competencies";
import { computeReportInsights, toSessionSummary } from "@/src/lib/reports/report-insights";

/**
 * Agrégats d'équipe calculés à partir des comptes rendus réels.
 * Aucune donnée fictive : sans simulation, les compteurs restent à zéro.
 */

const DAY = 86_400_000;

const mean = (values: number[]) =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

export const memberHref = (profile: UserProfile) => `/manager/commerciaux/${profile.slug}`;

export function reportsOf(reports: CoachReport[], profile: UserProfile): CoachReport[] {
  return reports.filter((report) => report.commercial.id === profile.id);
}

/** Écart entre première et dernière simulation des trente derniers jours. */
function progressOver30Days(reports: CoachReport[], now: number): number {
  const recent = reports
    .filter((report) => now - Date.parse(report.generatedAt) <= 30 * DAY)
    .sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt));
  if (recent.length < 2) return 0;
  return (recent.at(-1)?.overallScore ?? 0) - (recent[0]?.overallScore ?? 0);
}

export function buildTeamMember(
  profile: UserProfile,
  reports: CoachReport[],
  now = Date.now(),
): TeamMember {
  const own = reportsOf(reports, profile);
  const insights = computeReportInsights(own, "/manager/simulations");
  const last = [...own].sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];
  return {
    profile,
    averageScore: insights.averageScore ?? 0,
    sessionsCount: own.length,
    progress: progressOver30Days(own, now),
    lastSessionDate: last ? last.session.date.slice(0, 10) : null,
    competencyScores: insights.hasReports ? insights.competencyAverages : [],
    href: memberHref(profile),
  };
}

const RANGES: { range: string; min: number; max: number }[] = [
  { range: "0-40", min: 0, max: 40 },
  { range: "41-55", min: 41, max: 55 },
  { range: "56-70", min: 56, max: 70 },
  { range: "71-85", min: 71, max: 85 },
  { range: "86-100", min: 86, max: 100 },
];

/** Numéro de semaine ISO (S01 à S53) d'une date. */
function isoWeek(timestamp: number): { key: string; label: string } {
  const date = new Date(timestamp);
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((target.getTime() - yearStart) / DAY + 1) / 7);
  return {
    key: `${target.getUTCFullYear()}-${String(week).padStart(2, "0")}`,
    label: `S${String(week).padStart(2, "0")}`,
  };
}

/** Moyenne d'équipe par compétence, calculée sur les commerciaux ayant au moins une simulation. */
export function teamCompetencyAverages(
  members: TeamMember[],
): { competencyId: CompetencyId; score: number }[] {
  const withData = members.filter((member) => member.competencyScores.length > 0);
  return COMPETENCIES.map((competency) => ({
    competencyId: competency.id as CompetencyId,
    score: mean(
      withData.map(
        (member) =>
          member.competencyScores.find((score) => score.competencyId === competency.id)?.score ?? 0,
      ),
    ),
  }));
}

export function buildManagerDashboard(
  manager: UserProfile,
  team: UserProfile[],
  reports: CoachReport[],
  now = Date.now(),
): ManagerDashboard {
  const members = team.map((profile) => buildTeamMember(profile, reports, now));
  const teamIds = new Set(team.map((profile) => profile.id));
  const teamReports = reports.filter((report) => teamIds.has(report.commercial.id));
  const withData = members.filter((member) => member.sessionsCount > 0);

  const weeks = new Map<string, { label: string; scores: number[] }>();
  for (const report of [...teamReports].sort(
    (a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt),
  )) {
    const { key, label } = isoWeek(Date.parse(report.generatedAt));
    const bucket = weeks.get(key) ?? { label, scores: [] };
    bucket.scores.push(report.overallScore);
    weeks.set(key, bucket);
  }
  const weeklyEvolution = [...weeks.values()].slice(-8).map((bucket) => ({
    week: bucket.label,
    score: mean(bucket.scores),
    sessions: bucket.scores.length,
  }));

  const scoreDistribution = RANGES.map(({ range, min, max }) => ({
    range,
    count: withData.filter((member) => member.averageScore >= min && member.averageScore <= max)
      .length,
  }));

  const active30 = members.filter(
    (member) =>
      member.lastSessionDate !== null &&
      now - Date.parse(`${member.lastSessionDate}T12:00:00`) <= 30 * DAY,
  ).length;

  const withProgress = withData.filter((member) => member.progress !== 0);
  const averages = teamCompetencyAverages(members);
  const teamAverageScore = mean(teamReports.map((report) => report.overallScore));

  const alerts: PedagogicalAlert[] = [];
  if (withData.length > 0) {
    const weakest = [...averages].sort((a, b) => a.score - b.score)[0];
    if (weakest && weakest.score < 60) {
      alerts.push({
        id: "team-weakest",
        level: "priorite",
        title: `${getCompetencyLabel(weakest.competencyId)} à renforcer sur l'ensemble de l'équipe`,
        detail: `Moyenne de ${weakest.score} / 100 sur cette compétence, pour une moyenne générale de ${teamAverageScore}. Un atelier collectif peut être proposé.`,
      });
    }
    for (const member of withData.filter((m) => m.averageScore < 55).slice(0, 2)) {
      const name = `${member.profile.firstName} ${member.profile.lastName}`;
      alerts.push({
        id: `low-${member.profile.id}`,
        level: "vigilance",
        title: "Accompagnement individuel recommandé",
        detail: `${name} est à ${member.averageScore} / 100 de moyenne. Un point d'accompagnement peut consolider ses bases.`,
        repName: name,
      });
    }
  }
  const idle = members.filter(
    (m) =>
      m.lastSessionDate === null ||
      now - Date.parse(`${m.lastSessionDate}T12:00:00`) > 14 * DAY,
  );
  for (const member of idle.slice(0, 2)) {
    const name = `${member.profile.firstName} ${member.profile.lastName}`;
    alerts.push({
      id: `idle-${member.profile.id}`,
      level: "information",
      title: "Reprise d'entraînement suggérée",
      detail: member.lastSessionDate
        ? `${name} n'a pas réalisé de simulation depuis plus de deux semaines. Une relance bienveillante suffit généralement.`
        : `${name} n'a pas encore réalisé de simulation.`,
      repName: name,
    });
  }

  return {
    profile: manager,
    organisation: "Nice-Matin",
    repsCount: members.length,
    sessionsCount: teamReports.length,
    participationRate: members.length === 0 ? 0 : Math.round((active30 / members.length) * 100),
    teamAverageScore,
    averageProgress: mean(withProgress.map((member) => member.progress)),
    competenciesToStrengthen:
      withData.length === 0 ? 0 : averages.filter((entry) => entry.score < 60).length,
    weeklyEvolution,
    scoreDistribution,
    members,
    alerts,
    recentSessions: [...teamReports]
      .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))
      .map((report) => toSessionSummary(report, "/manager/simulations")),
  };
}
