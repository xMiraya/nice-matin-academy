"use client";

import { useMemo, useState } from "react";
import { Check, Clock, ListChecks, Mic, Play, Video, XCircle } from "lucide-react";
import type { SessionDifficulty } from "@/src/types";
import { FULL_INTERVIEW_OPTION, OBJECTIVES } from "@/src/data/competencies";
import { Panel } from "@/src/components/Panel";
import { Badge, DemoBadge } from "@/src/components/StatusBadge";
import { Button, ButtonLink } from "@/src/components/Button";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
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

export function SimulationSetup() {
  const [difficulty, setDifficulty] = useState<SessionDifficulty>("intermediaire");
  // Sélection multiple : prête à être transmise au Coach IA et enregistrée dans Supabase.
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([OBJECTIVES[3].id]);
  const [cameraChecked, setCameraChecked] = useState(false);
  const [micChecked, setMicChecked] = useState(false);

  const selectedDifficulty = DIFFICULTIES.find((d) => d.id === difficulty) ?? DIFFICULTIES[1];

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
        Colonne latérale : personnage, matériel, lancement.
        Le bloc reste collé en haut au défilement pour que le récapitulatif et
        le bouton de lancement restent visibles pendant qu'on parcourt les
        objectifs et les conditions.
      */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Panel
            title="Votre interlocutrice"
            action={<DemoBadge>Personnage virtuel</DemoBadge>}
            bodyClassName="p-0 sm:p-0"
          >
            {/* Portrait pleine largeur : on voit qui on va avoir en face. */}
            <div className="relative aspect-[4/3] w-full overflow-hidden border-y border-line">
              <CharacterAvatar />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-4 pb-3.5 pt-10">
                <p className="text-base font-semibold text-white">Julie Dupont</p>
                <p className="mt-0.5 text-sm text-white/75">
                  42 ans, cadre à Nice, lectrice occasionnelle
                </p>
              </div>
            </div>
            <p className="p-5 text-sm leading-relaxed text-graphite sm:p-6">
              Julie évalue en continu sa confiance, son intérêt, sa compréhension, la valeur
              qu&apos;elle perçoit et la pression qu&apos;elle ressent. Ces cinq jauges apparaissent
              dans votre compte rendu.
            </p>
          </Panel>

          <Panel title="Récapitulatif">
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
                    ? "Objectif unique — l’analyse se concentre dessus"
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

            {hasSelection ? (
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
                Lancer la simulation
              </ButtonLink>
            ) : (
              <>
                <Button disabled className="mt-5 w-full">
                  <Play size={17} aria-hidden />
                  Lancer la simulation
                </Button>
                <p className="mt-2 text-xs font-medium text-danger">
                  Sélectionnez au moins un objectif pédagogique.
                </p>
              </>
            )}

            {hasSelection && (!cameraChecked || !micChecked) ? (
              <p className="mt-3 text-xs leading-relaxed text-graphite">
                Pensez à vérifier votre caméra et votre microphone avant de commencer.
              </p>
            ) : null}
            {hasSelection && cameraChecked && micChecked ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-positive">
                <Check size={14} aria-hidden />
                Matériel vérifié.
              </p>
            ) : null}

            <div className="mt-4 border-t border-line pt-4">
              <Badge tone="marque">Tavus — intégration à venir</Badge>
            </div>
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
      <Panel className="mt-6" title="Avant de lancer" action={<DemoBadge>Visuel</DemoBadge>}>
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
            <div className="mt-3 flex flex-wrap items-start gap-4">
              <div className="w-full max-w-[220px] overflow-hidden rounded-md border border-line bg-ink/95">
                <div className="flex aspect-video items-center justify-center px-3 text-center">
                  <span className="text-xs text-white/60">Aperçu caméra désactivé</span>
                </div>
              </div>

              <div className="min-w-[220px] flex-1 space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-line px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-mist">
                  <input
                    type="checkbox"
                    checked={cameraChecked}
                    onChange={(event) => setCameraChecked(event.target.checked)}
                    className="h-4 w-4 accent-[#001a64]"
                  />
                  <Video size={16} className="text-graphite" aria-hidden />
                  <span className="text-sm text-ink">Ma caméra fonctionne</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-line px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-mist">
                  <input
                    type="checkbox"
                    checked={micChecked}
                    onChange={(event) => setMicChecked(event.target.checked)}
                    className="h-4 w-4 accent-[#001a64]"
                  />
                  <Mic size={16} className="text-graphite" aria-hidden />
                  <span className="text-sm text-ink">Mon microphone fonctionne</span>
                </label>
                <p className="text-xs leading-relaxed text-graphite">
                  Test purement visuel : aucun périphérique n&apos;est réellement sollicité.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
