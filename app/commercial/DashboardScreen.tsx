"use client";

import { Award, CalendarCheck, Gauge, Target, TrendingUp, Video } from "lucide-react";
import {
  DEMO_COMMERCIAL_DASHBOARD,
  DEMO_COMMERCIAL_TECHNICAL_SESSION,
} from "@/src/data/demo-commercial";
import { getCompetencyLabel } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { ButtonLink } from "@/src/components/Button";
import { Badge, DemoBadge, TechnicalTestBadge } from "@/src/components/StatusBadge";
import { CoachPriorityCard } from "@/src/components/CoachPriorityCard";
import { SessionTable } from "@/src/components/SessionTable";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { ScoreBar } from "@/src/components/ScoreGauge";
import { useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights } from "@/src/lib/reports/report-insights";

const LEVEL_LABELS = {
  debutant: "Niveau débutant",
  intermediaire: "Niveau intermédiaire",
  confirme: "Niveau confirmé",
} as const;

/**
 * Tableau de bord du commercial.
 *
 * Les comptes rendus réels du Coach sont prioritaires. Les données de
 * démonstration restent visibles mais toujours identifiées comme telles :
 * les deux ensembles ne sont jamais fondus dans une même moyenne.
 */
export function DashboardScreen() {
  const reports = useReports();
  const insights = computeReportInsights(reports, "/commercial/simulations");

  const demo = DEMO_COMMERCIAL_DASHBOARD;
  const { profile } = demo;

  const demoStrongest = demo.competencyScores.find((s) => s.competencyId === demo.strongest);
  const demoPriority = demo.competencyScores.find((s) => s.competencyId === demo.priority);

  const useReal = insights.hasReports;

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title={`Bonjour ${profile.firstName}`}
        description={
          useReal
            ? "Vos chiffres sont calculés à partir de vos analyses réelles du Coach IA."
            : "Voici où vous en êtes sur les huit compétences suivies par le Coach IA."
        }
        actions={
          <ButtonLink href="/commercial/nouvelle-simulation">
            <Video size={17} aria-hidden />
            Commencer une simulation
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">{profile.role}</Badge>
            <Badge>{profile.team}</Badge>
            {profile.level ? <Badge>{LEVEL_LABELS[profile.level]}</Badge> : null}
            {useReal ? (
              <Badge tone="positif">
                {insights.count} analyse{insights.count > 1 ? "s" : ""} réelle
                {insights.count > 1 ? "s" : ""}
              </Badge>
            ) : (
              <DemoBadge>Données de démonstration</DemoBadge>
            )}
          </>
        }
      />

      {/* Chiffres clés — réels si disponibles, sinon démonstration */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={useReal ? "Dernière note" : "Score moyen"}
          value={useReal ? (insights.latestScore ?? 0) : demo.averageScore}
          unit="/ 100"
          icon={<Gauge size={18} aria-hidden />}
          delta={useReal ? (insights.progression ?? undefined) : demo.thirtyDayProgress}
          deltaSuffix={useReal ? "pts depuis la 1re analyse" : "pts / 30 j"}
        />
        <MetricCard
          label="Simulations analysées"
          value={useReal ? insights.count : demo.sessionsCount}
          icon={<CalendarCheck size={18} aria-hidden />}
          hint={
            useReal
              ? `Moyenne de vos analyses : ${insights.averageScore} / 100.`
              : `${demo.participationStreakWeeks} semaines consécutives d'entraînement.`
          }
        />
        <MetricCard
          label="Meilleure compétence"
          value={useReal ? (insights.strongest?.score ?? 0) : (demoStrongest?.score ?? 0)}
          unit="/ 100"
          icon={<Award size={18} aria-hidden />}
          hint={useReal ? insights.strongest?.label : getCompetencyLabel(demo.strongest)}
        />
        <MetricCard
          label="Compétence prioritaire"
          value={useReal ? (insights.priority?.score ?? 0) : (demoPriority?.score ?? 0)}
          unit="/ 100"
          icon={<Target size={18} aria-hidden />}
          hint={useReal ? insights.priority?.label : getCompetencyLabel(demo.priority)}
          accent
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Profil de compétences"
          description={
            useReal
              ? "Moyenne de vos analyses réelles, sur les huit compétences du barème."
              : "Exemple de profil, à titre d'illustration."
          }
          className="lg:col-span-3"
          action={useReal ? null : <DemoBadge />}
        >
          <CompetencyRadar
            scores={useReal ? insights.competencyAverages : demo.competencyScores}
            seriesLabel={useReal ? "Vos analyses" : "Exemple"}
          />
        </Panel>

        <Panel
          title="Évolution des scores"
          description={useReal ? "Une valeur par analyse réalisée." : "Exemple d'évolution."}
          className="lg:col-span-2"
          action={useReal ? null : <DemoBadge />}
        >
          {useReal && insights.scoreHistory.length < 2 ? (
            <div className="flex h-[260px] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-semibold text-ink">
                Une seule analyse pour le moment
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                La courbe d&apos;évolution apparaîtra dès votre deuxième simulation analysée.
              </p>
            </div>
          ) : (
            <ProgressChart data={useReal ? insights.scoreHistory : demo.scoreHistory} />
          )}
          {useReal && insights.progression !== null ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-graphite">
              <TrendingUp size={16} className="text-positive" aria-hidden />
              <span>
                <span className="font-semibold text-positive">
                  {insights.progression >= 0 ? "+" : ""}
                  {insights.progression} points
                </span>{" "}
                depuis votre première analyse.
              </span>
            </p>
          ) : null}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CoachPriorityCard
            priority={
              useReal && insights.priority
                ? {
                    title: `Travailler : ${insights.priority.label}`,
                    diagnostic: `Sur vos analyses réelles, cette compétence est à ${insights.priority.score} / 100, la plus fragile des huit.`,
                    action:
                      "Sélectionnez cet objectif lors de votre prochaine simulation pour concentrer l'analyse dessus.",
                    competencyId: insights.priority.id as typeof demo.priority,
                  }
                : demo.nextFocus
            }
            accent
            showMascot
            actionHref="/commercial/nouvelle-simulation"
            actionLabel="Travailler cette compétence"
          />
        </div>

        <Panel
          title="Détail des compétences"
          description={useReal ? "Moyennes issues de vos analyses réelles." : undefined}
          className="lg:col-span-3"
          action={useReal ? null : <DemoBadge />}
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {[...(useReal ? insights.competencyAverages : demo.competencyScores)]
              .sort((a, b) => b.score - a.score)
              .map((score) => (
                <ScoreBar
                  key={score.competencyId}
                  score={score.score}
                  label={getCompetencyLabel(score.competencyId)}
                />
              ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        {useReal ? (
          <Panel
            title="Vos analyses"
            description="Comptes rendus réellement produits par le Coach IA."
            action={
              <ButtonLink href="/commercial/simulations" variant="secondary">
                Tout l&apos;historique
              </ButtonLink>
            }
          >
            <SessionTable sessions={insights.sessions.slice(0, 3)} />
          </Panel>
        ) : (
          <Panel
            title="Dernières simulations"
            description="Historique d'illustration, en attendant vos premières analyses."
            action={<DemoBadge />}
          >
            <SessionTable sessions={demo.recentSessions} />
          </Panel>
        )}

        <Panel
          title="Appel de validation technique"
          description="Cet échange a servi à valider la voix française de Julie. Il n'entre pas dans vos statistiques."
          action={<TechnicalTestBadge />}
        >
          <SessionTable sessions={[DEMO_COMMERCIAL_TECHNICAL_SESSION]} />
        </Panel>
      </div>
    </>
  );
}
