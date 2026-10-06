"use client";

import { MicrophoneCheckPanel } from "@/src/components/media/MicrophoneCheckPanel";
import { useMicrophoneCheck } from "@/src/lib/media/use-microphone-check";
import { useMemo, useState } from "react";
import { Check, Clock, Lock, ListChecks, Play, XCircle } from "lucide-react";
import type { SessionDifficulty } from "@/src/types";
import { FULL_INTERVIEW_OPTION, OBJECTIVES } from "@/src/data/competencies";
import { Panel } from "@/src/components/Panel";
import { Badge, DemoBadge } from "@/src/components/StatusBadge";
import { Button, ButtonLink } from "@/src/components/Button";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import type { JulieAccess } from "@/src/lib/access/julie-access";
import { JulieAccessPanel, hrefFor } from "@/src/components/access/JulieAccessPanel";
import { useJulieAccess } from "@/src/lib/access/julie-access";
import { cx } from "@/src/lib/format";
import { storeSelectedDifficulty, storeSelectedObjectiveIds } from "@/src/lib/session-storage";

const DIFFICULTIES: {
  id: SessionDifficulty;
  label: string;
  detail: string;
  duration: string;
}[] = [
  {
    id: "facile",
    label: "Facile",
    detail: "Julie est disponible, curieuse et pose peu d'objections.",
    duration: "5 à 7 minutes",
  },
  {
    id: "intermediaire",
    label: "Intermédiaire",
    detail: "Julie est intéressée mais pressée, et compare avec la concurrence.",
    duration: "8 à 10 minutes",
  },
  {
    id: "difficile",
    label: "Difficile",
    detail: "Julie est méfiante sur le prix et met fin à l'échange si le ton dérape.",
    duration: "10 à 12 minutes",
  },
];

const CONDITIONS = [
  "L'échange se déroule en visioconférence, caméra allumée.",
  "Julie réagit en temps réel : ton, rythme et vocabulaire comptent autant que les arguments.",
  "Vous pouvez interrompre l'appel à tout moment ; l'analyse sera tout de même produite.",
  "L'entretien est analysé automatiquement dès la fin de l'appel.",
];

/** Case à cocher visuelle, dupliquée dans les cartes d'objectif et l'option « entretien complet ». */
function CardCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors",
        checked ? "border-brand bg-brand text-white" : "border-line bg-white",
      )}
    >
      {checked ? <Check size={13} strokeWidth={3} /> : null}
    </span>
  );
}

export function SimulationSetup({
  initialAccess,
  notice,
}: {
  initialAccess?: JulieAccess;
  notice?: string;
}) {
  const julie = useJulieAccess(initialAccess);
  const unlocked = julie.status === "ready" && julie.access.eligible;
  const [difficulty, setDifficulty] = useState<SessionDifficulty>("intermediaire");
  // Sélection multiple : prête à être transmise au Coach IA et enregistrée dans Supabase.
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([OBJECTIVES[3].id]);
  // Contrôle réel du matériel, lancé à la demande de l'utilisateur.
  const mic = useMicrophoneCheck({ autoStart: false });
  const cameraChecked = mic.camera === "ok";
  const micChecked = mic.status === "ready";

  const selectedDifficulty = DIFFICULTIES.find((d) => d.id === difficulty) ?? DIFFICULTIES[1];

  /*
    Le portrait suit le niveau : Julie ouverte en facile, neutre en
    intermédiaire, sceptique en difficile. C'est la seule promesse visuelle
    faite avant l'appel, elle doit correspondre à ce qui va se passer.
  */
  const mood = difficulty === "facile" ? "ouverte" : difficulty === "difficile" ? "sceptique" : "serein";

  const selectedObjectives = useMemo(
    () => OBJECTIVES.filter((objective) => selectedObjectiveIds.includes(objective.id)),
    [selectedObjectiveIds],
  );
  const isFullInterview = selectedObjectiveIds.length === OBJECTIVES.length;
  const hasSelection = selectedObjectiveIds.length > 0;

  function toggleObjective(id: string) {
    setSelectedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function selectAll() {
    setSelectedObjectiveIds(OBJECTIVES.map((objective) => objective.id));
  }

  function clearSelection() {
    setSelectedObjectiveIds([]);
  }

  function toggleFullInterview() {
    if (isFullInterview) {
      clearSelection();
    } else {
      selectAll();
    }
  }

  const counterLabel = isFullInterview
    ? "Tous les objectifs sélectionnés"
    : `${selectedObjectiveIds.length} objectif${selectedObjectiveIds.length > 1 ? "s" : ""} sélectionné${selectedObjectiveIds.length > 1 ? "s" : ""}`;

  return (
    <>
      {notice ? (
        <p role="alert" className="mb-4 rounded-md bg-warning-soft px-4 py-3 text-sm font-medium text-ink">
          {notice}
        </p>
      ) : null}
      <div className="mb-6">
        <JulieAccessPanel state={julie} onRetry={julie.reload} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Niveau de difficulté"
            description="Le comportement de Julie s'adapte au niveau choisi."
          >
            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Niveau"
            >
              {DIFFICULTIES.map((item) => {
                const active = item.id === difficulty;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setDifficulty(item.id);
                      // Enregistré tout de suite : le niveau pilote le
                      // comportement de Julie et l'étiquette du compte rendu.
                      storeSelectedDifficulty(item.id);
                    }}
                    className={cx(
                      "rounded-md border p-4 text-left transition-colors",
                      active ? "border-brand bg-brand-soft" : "border-line bg-white hover:bg-mist",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{item.label}</span>
                      {active ? <Check size={16} className="text-brand" aria-hidden /> : null}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-graphite">
                      {item.detail}
                    </span>
                    <span className="mt-3 flex items-center gap-1.5 text-xs font-medium text-graphite">
                      <Clock size={13} aria-hidden />
                      {item.duration}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Objectifs pédagogiques"
            description="Le Coach IA priorisera son analyse sur les objectifs retenus ; les autres compétences restent observées."
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  <ListChecks size={15} aria-hidden />
                  Tout sélectionner
                </button>
                <span className="text-line" aria-hidden>
                  |
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="flex items-center gap-1.5 text-sm font-semibold text-graphite hover:text-ink"
                >
                  <XCircle size={15} aria-hidden />
                  Effacer la sélection
                </button>
              </div>
            }
          >
            {/* Option mise en avant : coche automatiquement les six objectifs */}
            <button
              type="button"
              role="checkbox"
              aria-checked={isFullInterview}
              onClick={toggleFullInterview}
              className={cx(
                "mb-4 flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors",
                isFullInterview
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-white hover:bg-mist",
              )}
            >
              <CardCheckbox checked={isFullInterview} />
              <span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {FULL_INTERVIEW_OPTION.label}
                  </span>
                  <Badge tone="marque">Recommandé</Badge>
                </span>
                <span className="mt-1.5 block text-sm leading-snug text-graphite">
                  {FULL_INTERVIEW_OPTION.description}
                </span>
              </span>
            </button>

            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              role="group"
              aria-label="Objectifs pédagogiques"
            >
              {OBJECTIVES.map((objective) => {
                const active = selectedObjectiveIds.includes(objective.id);
                return (
                  <button
                    key={objective.id}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    onClick={() => toggleObjective(objective.id)}
                    className={cx(
                      "flex items-start gap-3 rounded-md border p-4 text-left transition-colors",
                      active ? "border-brand bg-brand-soft" : "border-line bg-white hover:bg-mist",
                    )}
                  >
                    <CardCheckbox checked={active} />
                    <span>
                      <span className="text-sm font-semibold text-ink">{objective.label}</span>
                      <span className="mt-1.5 block text-sm leading-snug text-graphite">
                        {objective.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm font-medium text-graphite">{counterLabel}</p>
          </Panel>
        </div>

        {/*
        Colonne latérale : personnage puis récapitulatif.
        Elle n'est volontairement pas collante et sa dernière carte s'étire
        jusqu'en bas de la rangée : une colonne plus courte que sa voisine —
        a fortiori décalée par un `sticky` — laissait une bande blanche au pied
        de l'autre colonne. Les deux colonnes se terminent maintenant sur la
        même ligne, quelle que soit la largeur d'écran.
      */}
        <div className="flex flex-col gap-6">
          <Panel
            title="Votre interlocutrice"
            action={<DemoBadge>Personnage virtuel</DemoBadge>}
            bodyClassName="p-0 sm:p-0"
          >
            {/* Portrait pleine largeur : on voit qui on va avoir en face. */}
            <div className="relative aspect-[4/3] w-full overflow-hidden border-y border-line">
              <CharacterAvatar mood={mood} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-4 pb-3.5 pt-10">
                <p className="text-base font-semibold text-white">Julie Dupont</p>
                <p className="mt-0.5 text-sm text-white/75">
                  Une trentaine d&apos;années, cadre à Nice, lectrice occasionnelle
                </p>
              </div>
            </div>
            <p className="p-5 text-sm leading-relaxed text-graphite sm:p-6">
              Julie évalue en continu sa confiance, son intérêt, sa compréhension, la valeur
              qu&apos;elle perçoit et la pression qu&apos;elle ressent. Ces cinq jauges apparaissent
              dans votre compte rendu.
            </p>
          </Panel>

          <Panel title="Récapitulatif" className="flex-1" bodyClassName="flex flex-col">
            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-graphite">Personnage</dt>
                <dd className="text-right font-medium text-ink">Julie Dupont</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-graphite">Niveau</dt>
                <dd className="text-right font-medium text-ink">{selectedDifficulty.label}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-graphite">Durée indicative</dt>
                <dd className="text-right font-medium text-ink">{selectedDifficulty.duration}</dd>
              </div>
            </dl>

            <div className="mt-3 border-t border-line pt-3">
              <p className="text-sm text-graphite">
                {isFullInterview
                  ? "Entretien commercial complet"
                  : selectedObjectiveIds.length === 1
                    ? "Objectif unique : l’analyse se concentre dessus"
                    : "Objectifs"}
              </p>
              {hasSelection ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {isFullInterview ? (
                    <Badge tone="marque">Toutes les compétences</Badge>
                  ) : (
                    selectedObjectives.map((objective) => (
                      <Badge key={objective.id}>{objective.label}</Badge>
                    ))
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-graphite">Aucun objectif sélectionné.</p>
              )}
            </div>

            {hasSelection && unlocked ? (
              <ButtonLink
                href="/commercial/appel"
                className="mt-5 w-full"
                onClick={() => {
                  storeSelectedObjectiveIds(selectedObjectiveIds);
                  // Le niveau par défaut n'a jamais été cliqué : on le confirme ici.
                  storeSelectedDifficulty(difficulty);
                }}
              >
                <Play size={17} aria-hidden />
                Démarrer la simulation
              </ButtonLink>
            ) : (
              <>
                {hasSelection && julie.status === "ready" && !julie.access.eligible ? (
                  <ButtonLink
                    href={hrefFor(julie.access.requirements.find((r) => !r.passed) ?? julie.access.requirements[0])}
                    className="mt-5 w-full"
                  >
                    <Lock size={17} aria-hidden />
                    Terminer les prérequis
                  </ButtonLink>
                ) : (
                  <Button disabled className="mt-5 w-full">
                    <Play size={17} aria-hidden />
                    Démarrer la simulation
                  </Button>
                )}
                <p className="mt-2 text-xs font-medium text-danger">
                  {!hasSelection
                    ? "Sélectionnez au moins un objectif pédagogique."
                    : "Validez d’abord les prérequis pour débloquer Julie."}
                </p>
              </>
            )}

            {hasSelection && unlocked && (!cameraChecked || !micChecked) ? (
              <p className="mt-3 text-xs leading-relaxed text-graphite">
                Pensez à vérifier votre caméra et votre microphone avant de commencer.
              </p>
            ) : null}
            {hasSelection && unlocked && cameraChecked && micChecked ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-positive">
                <Check size={14} aria-hidden />
                Matériel vérifié.
              </p>
            ) : null}
          </Panel>
        </div>
      </div>

      {/*
        Dernière rangée, sur toute la largeur de la page.
        Les deux blocs vivaient auparavant dans une colonne : le plus court
        laissait une bande blanche sous lui, à côté du récapitulatif. Réunis
        dans une seule carte pleine largeur, avec un aperçu caméra de taille
        fixe posé à côté de ses cases plutôt qu'au-dessus, ils se terminent
        à la même hauteur et ferment la page proprement.
      */}
      <Panel className="mt-6" title="Avant de lancer">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
          <div>
            <p className="nm-label">Conditions de la simulation</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {CONDITIONS.map((condition) => (
                <li key={condition} className="flex gap-3 text-sm leading-relaxed text-graphite">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {condition}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:border-l lg:border-line lg:pl-8">
            <p className="nm-label">Test caméra et microphone</p>
            <MicrophoneCheckPanel check={mic} className="mt-3" />
          </div>
        </div>
      </Panel>
    </>
  );
}
