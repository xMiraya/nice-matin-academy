import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileBarChart, GraduationCap } from "lucide-react";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { EmptyState } from "@/src/components/EmptyState";
import { DemoBadge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import {
  ScoreDistributionChart,
  WeeklyEvolutionChart,
} from "@/src/components/charts/ProgressChart";

export const metadata: Metadata = {
  title: "Rapports",
  description: "Synthèses périodiques du dispositif d'entraînement.",
};

export default function ManagerRapportsPage() {
  const data = DEMO_MANAGER_DASHBOARD;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Rapports"
        description="Synthèse du dispositif d'entraînement sur les sept dernières semaines."
        actions={<DemoBadge>Export bientôt disponible</DemoBadge>}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Commerciaux suivis" value={data.repsCount} />
        <MetricCard label="Simulations" value={data.sessionsCount} />
        <MetricCard label="Participation" value={data.participationRate} unit="%" />
        <MetricCard
          label="Score moyen"
          value={data.teamAverageScore}
          unit="/ 100"
          delta={data.averageProgress}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Évolution hebdomadaire">
          <WeeklyEvolutionChart data={data.weeklyEvolution} />
        </Panel>
        <Panel title="Répartition des scores">
          <ScoreDistributionChart data={data.scoreDistribution} />
        </Panel>
      </div>

      <div className="mt-5">
        <EmptyState
          image="/images/etats/aucune-notification.jpg"
          icon={<FileBarChart size={20} aria-hidden />}
          title="Rapports exportables en préparation"
          description="La génération de synthèses mensuelles au format document sera ajoutée après la connexion des données réelles."
          action={
            <ButtonLink href="/manager" variant="secondary">
              Revenir à la vue équipe
            </ButtonLink>
          }
        />
      </div>

      {/*
        Le contenu pédagogique n'a pas sa place dans la navigation principale
        du manager — c'est une tâche occasionnelle, pas un tableau de bord
        consulté au quotidien. Elle reste accessible ici, en fin de page.
      */}
      <div className="mt-8 border-t border-line pt-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Contenu pédagogique</h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-graphite">
          Modifiez les fiches méthodologiques et les questions de QCM vues par les commerciaux.
          Vos modifications restent en brouillon, invisibles d&apos;eux, jusqu&apos;à ce que vous les
          publiiez.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/manager/contenu/fiches"
              className="nm-card-link group flex items-center gap-3 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                <BookOpen size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink group-hover:text-brand">
                  Fiches méthodologiques
                </span>
                <span className="block text-xs text-graphite">Modifier le contenu des 8 fiches</span>
              </span>
              <ArrowRight
                size={15}
                aria-hidden
                className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </Link>
          </li>
          <li>
            <Link href="/manager/contenu/qcm" className="nm-card-link group flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                <GraduationCap size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink group-hover:text-brand">
                  Questions de QCM
                </span>
                <span className="block text-xs text-graphite">Modifier l&apos;énoncé et les réponses</span>
              </span>
              <ArrowRight
                size={15}
                aria-hidden
                className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
