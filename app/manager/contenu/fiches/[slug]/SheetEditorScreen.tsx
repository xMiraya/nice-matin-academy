"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Save, UploadCloud } from "lucide-react";
import type { MethodologySheet } from "@/src/types/methodology";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Button, ButtonLink } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { EditableList } from "@/src/components/content/EditableList";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import {
  getOverride,
  publish,
  revertToOriginal,
  saveDraft,
} from "@/src/lib/content/content-overrides-repository";
import type { SheetPatch } from "@/src/lib/content/content-overrides-repository";
import { useContentStatus } from "@/src/lib/content/use-effective-content";

interface EditableFields {
  objective: string;
  stakes: string[];
  goodReflexes: string[];
  phrasesToUse: string[];
  phrasesToAvoid: string[];
  usefulQuestions: string[];
  checklist: string[];
  trainerTip: string;
}

function fieldsFromSheetAndOverride(base: MethodologySheet): EditableFields {
  const override = getOverride("sheet", base.slug);
  const patch = (override?.patch ?? {}) as SheetPatch;
  return {
    objective: patch.objective ?? base.objective,
    stakes: patch.stakes ?? [...base.stakes],
    goodReflexes: patch.goodReflexes ?? [...base.goodReflexes],
    phrasesToUse: patch.phrasesToUse ?? [...base.phrasesToUse],
    phrasesToAvoid: patch.phrasesToAvoid ?? [...base.phrasesToAvoid],
    usefulQuestions: patch.usefulQuestions ?? [...base.usefulQuestions],
    checklist: patch.checklist ?? [...base.checklist],
    trainerTip: patch.trainerTip ?? base.trainerTip.text,
  };
}

const AUTHOR = `${DEMO_MANAGER_DASHBOARD.profile.firstName} ${DEMO_MANAGER_DASHBOARD.profile.lastName}`;

/**
 * Éditeur d'une fiche méthodologique.
 *
 * Sept des dix blocs de la fiche sont modifiables ici : l'objectif, les
 * quatre listes courtes, la checklist et le conseil du formateur. La méthode
 * en quatre étapes, la situation terrain et les niveaux de maîtrise restent
 * au contenu d'origine dans cette version — ce sont des structures à champs
 * multiples qui demanderaient un éditeur dédié à chacune.
 */
export function SheetEditorScreen({ sheet }: { sheet: MethodologySheet }) {
  const status = useContentStatus("sheet", sheet.slug);
  const [fields, setFields] = useState<EditableFields>(() => fieldsFromSheetAndOverride(sheet));
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function buildPatch(): SheetPatch {
    return {
      objective: fields.objective,
      stakes: fields.stakes.filter((item) => item.trim().length > 0),
      goodReflexes: fields.goodReflexes.filter((item) => item.trim().length > 0),
      phrasesToUse: fields.phrasesToUse.filter((item) => item.trim().length > 0),
      phrasesToAvoid: fields.phrasesToAvoid.filter((item) => item.trim().length > 0),
      usefulQuestions: fields.usefulQuestions.filter((item) => item.trim().length > 0),
      checklist: fields.checklist.filter((item) => item.trim().length > 0),
      trainerTip: fields.trainerTip,
    };
  }

  function handleSaveDraft() {
    saveDraft("sheet", sheet.slug, buildPatch(), AUTHOR);
    setSavedMessage("Brouillon enregistré, invisible des commerciaux.");
  }

  function handlePublish() {
    publish("sheet", sheet.slug, buildPatch(), AUTHOR);
    setSavedMessage("Publié : les commerciaux voient désormais cette version.");
  }

  function handleRevert() {
    revertToOriginal("sheet", sheet.slug);
    setFields(fieldsFromSheetAndOverride(sheet));
    setSavedMessage("Contenu d'origine restauré.");
  }

  return (
    <>
      <PageHeader
        eyebrow="Contenu pédagogique"
        title={`${sheet.number}. ${sheet.title}`}
        description="Sept des dix blocs sont modifiables ici. La méthode en quatre étapes, la situation terrain et les niveaux de maîtrise restent au contenu d'origine dans cette version."
        back={{ href: "/manager/contenu/fiches", label: "Fiches méthodologiques" }}
        actions={
          <ButtonLink href={`/commercial/fiches/${sheet.slug}`} variant="secondary" target="_blank">
            Voir la fiche publiée
          </ButtonLink>
        }
        meta={
          <>
            {status === "published" ? (
              <Badge tone="positif" dot>
                Version publiée modifiée
              </Badge>
            ) : status === "draft" ? (
              <Badge tone="vigilance">Brouillon non publié</Badge>
            ) : (
              <Badge>Contenu d&apos;origine, non modifié</Badge>
            )}
          </>
        }
      />

      <div className="space-y-5">
        <Panel title="Objectif" description="Bloc affiché en haut de la fiche, une ligne.">
          <textarea
            value={fields.objective}
            onChange={(event) => setFields((current) => ({ ...current, objective: event.target.value }))}
            rows={2}
            className="w-full resize-none rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-brand-accent"
          />
        </Panel>

        <Panel title="Enjeu de la compétence" description="Bloc 01 : trois puces maximum.">
          <EditableList
            label="Puces"
            items={fields.stakes}
            onChange={(items) => setFields((current) => ({ ...current, stakes: items }))}
          />
        </Panel>

        <Panel title="Les bons réflexes" description="Bloc 03 : quatre à six réflexes.">
          <EditableList
            label="Réflexes"
            items={fields.goodReflexes}
            onChange={(items) => setFields((current) => ({ ...current, goodReflexes: items }))}
          />
        </Panel>

        <Panel title="À dire" description="Bloc 04 : trois à cinq formulations, sans les guillemets.">
          <EditableList
            label="Formulations"
            items={fields.phrasesToUse}
            onChange={(items) => setFields((current) => ({ ...current, phrasesToUse: items }))}
          />
        </Panel>

        <Panel title="À éviter" description="Bloc 05 : quatre à six erreurs fréquentes.">
          <EditableList
            label="Erreurs"
            items={fields.phrasesToAvoid}
            onChange={(items) => setFields((current) => ({ ...current, phrasesToAvoid: items }))}
          />
        </Panel>

        <Panel title="Questions utiles" description="Bloc 07 : trois à cinq questions.">
          <EditableList
            label="Questions"
            items={fields.usefulQuestions}
            onChange={(items) => setFields((current) => ({ ...current, usefulQuestions: items }))}
          />
        </Panel>

        <Panel title="Checklist avant de poursuivre" description="Bloc 09 : trois à cinq items.">
          <EditableList
            label="Items"
            items={fields.checklist}
            onChange={(items) => setFields((current) => ({ ...current, checklist: items }))}
          />
        </Panel>

        <Panel title="Conseil du formateur" description="Bloc 10.">
          <textarea
            value={fields.trainerTip}
            onChange={(event) => setFields((current) => ({ ...current, trainerTip: event.target.value }))}
            rows={3}
            className="w-full resize-none rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-brand-accent"
          />
        </Panel>

        <div className="nm-card sticky bottom-4 flex flex-wrap items-center gap-3 p-4">
          <Button variant="secondary" onClick={handleSaveDraft}>
            <Save size={15} aria-hidden />
            Enregistrer le brouillon
          </Button>
          <Button onClick={handlePublish}>
            <UploadCloud size={15} aria-hidden />
            Publier
          </Button>
          {status !== "original" ? (
            <Button variant="ghost" onClick={handleRevert}>
              <RotateCcw size={15} aria-hidden />
              Revenir au contenu d&apos;origine
            </Button>
          ) : null}
          {savedMessage ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-positive">
              <CheckCircle2 size={15} aria-hidden />
              {savedMessage}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
