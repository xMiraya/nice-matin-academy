import type { Metadata } from "next";
import { Award, CalendarCheck, Gauge, Target } from "lucide-react";
import { DEMO_COMMERCIAL_DASHBOARD, DEMO_COMMERCIAL_SESSIONS } from "@/src/data/demo-commercial";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { DEMO_SESSION_JULIE } from "@/src/data/demo-session-julie";
import { getCompetencyLabel } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { Badge, DemoBadge, TechnicalTestBadge } from "@/src/components/StatusBadge";
import { RealReportsPanel } from "@/src/components/coach/RealReportsPanel";
import { ButtonLink } from "@/src/components/Button";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { SessionTable } from "@/src/components/SessionTable";
import { CoachPriorityCard } from "@/src/components/CoachPriorityCard";
import { ScoreBar } from "@/src/components/ScoreGauge";

export const metadata: Metadata = {
  title: "Alexandre Jégo",
  description: "Fiche de suivi individuelle.",
};

const LEVEL_LABELS = {
  debutant: "Niveau débutant",
  intermediaire: "Niveau intermédiaire",
  confirme: "Niveau confirmé",
} as const;

export default function FicheAlexandreJegoPage() {
  const data = DEMO_COMMERCIAL_DASHBOARD;
  const { profile } = data;
  // Repère visuel : la moyenne d'équipe est reportée sur chaque axe du radar.
  const teamReference = data.competencyScores.map((score) => ({
    competencyId: score.competencyId,
    score: DEMO_MANAGER_DASHBOARD.teamAverageScore,
  }));

  const sorted = [...data.competencyScores].sort((a, b) => b.score - a.score);
  const strong = sorted.slice(0, 3);
  const fragile = [...sorted].reverse().slice(0, 3);

  const technicalSession = {
    id: DEMO_SESSION_JULIE.id,
    href: "/manager/simulations/demo-julie",
    title: DEMO_SESSION_JULIE.title,
    date: DEMO_SESSION_JULIE.date,
    objectiveLabel: DEMO_SESSION_JULIE.objectiveLabel,
    difficulty: DEMO_SESSION_JULIE.difficulty,
    durationSeconds: DEMO_SESSION_JULIE.durationSeconds,
    score: DEMO_SESSION_JULIE.globalScore,
    status: DEMO_SESSION_JULIE.status,
    technicalTest: true,
  };

  return (
    <>
      <PageHeader
        eyebrow="Fiche commercial"
        title={`${profile.firstName} ${profile.lastName}`}
        description="Suivi individuel : niveau actuel, évolution et axes d'accompagnement proposés."
        back={{ href: "/manager/commerciaux", label: "Commerciaux" }}
        actions={
          <ButtonLink href="/manager/simulations/demo-julie" variant="secondary">
            Compte rendu du test Julie
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">{profile.role}</Badge>
            <Badge>{profile.team}</Badge>
            {profile.level ? <Badge>{LEVEL_LABELS[profile.level]}</Badge> : null}
          </>
        }
      />

      <div className="mb-8">
        <RealReportsPanel title="Analyses réelles de ce commercial" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 border-t border-line pt-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Suivi individuel</h2>
        <DemoBadge>Données de démonstration</DemoBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Score moyen"
          value={data.averageScore}
          unit="/ 100"
          icon={<Gauge size={18} aria-hidden />}
          delta={data.thirtyDayProgress}
        />
        <MetricCard
          label="Simulations terminées"
          value={DEMO_COMMERCIAL_SESSIONS.filter((s) => s.status === "terminee").length}
          icon={<CalendarCheck size={18} aria-hidden />}
          hint={`${DEMO_COMMERCIAL_SESSIONS.length} simulations engagées au total.`}
        />
        <MetricCard
          label="Compétence solide"
          value={strong[0].score}
          unit="/ 100"
          icon={<Award size={18} aria-hidden />}
          hint={getCompetencyLabel(strong[0].competencyId)}
        />
        <MetricCard
          label="Priorité d'accompagnement"
          value={fragile[0].score}
          unit="/ 100"
          icon={<Target size={18} aria-hidden />}
          hint={getCompetencyLabel(fragile[0].competencyId)}
          accent
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Profil de compétences"
          description="Comparaison avec la moyenne d'équipe."
          className="lg:col-span-3"
        >
          <CompetencyRadar
            scores={data.competencyScores}
            seriesLabel={profile.firstName}
            comparison={{ label: "Moyenne d'équipe", scores: teamReference }}
          />
        </Panel>

        <Panel title="Évolution" description="Six dernières simulations." className="lg:col-span-2">
          <ProgressChart data={data.scoreHistory} />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Compétences solides" description="Points d'appui à valoriser en entretien.">
          <div className="space-y-4">
            {strong.map((score) => (
              <ScoreBar
                key={score.competencyId}
                score={score.score}
                label={getCompetencyLabel(score.competencyId)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Compétences à accompagner" description="Axes de progression prioritaires.">
          <div className="space-y-4">
            {fragile.map((score) => (
              <ScoreBar
                key={score.competencyId}
                score={score.score}
                label={getCompetencyLabel(score.competencyId)}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <CoachPriorityCard priority={data.nextFocus} accent />
      </div>

      <div className="mt-6 space-y-6">
        <Panel title="Historique des simulations" description="Entraînements pris en compte dans les statistiques.">
          <SessionTable sessions={DEMO_COMMERCIAL_SESSIONS} />
        </Panel>

        <Panel
          title="Appel de validation technique"
          description="Test de la voix de Julie, exclu du calcul du score moyen."
          action={<TechnicalTestBadge />}
        >
          <SessionTable sessions={[technicalSession]} />
        </Panel>
      </div>
    </>
  );
}
