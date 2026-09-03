"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Save, UploadCloud } from "lucide-react";
import type { ChoiceQuestion } from "@/src/types/qcm/quiz";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Button } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import {
  getOverride,
  publish,
  revertToOriginal,
  saveDraft,
} from "@/src/lib/content/content-overrides-repository";
import type { QuestionOptionPatch, QuestionPatch } from "@/src/lib/content/content-overrides-repository";
import { useContentStatus } from "@/src/lib/content/use-effective-content";
import { cx } from "@/src/lib/format";

interface EditableFields {
  prompt: string;
  explanation: string;
  fieldTip: string;
  options: QuestionOptionPatch[];
}

function fieldsFromQuestion(question: ChoiceQuestion): EditableFields {
  const override = getOverride("question", question.id);
  const patch = (override?.patch ?? {}) as QuestionPatch;
  return {
    prompt: patch.prompt ?? question.prompt,
    explanation: patch.explanation ?? question.explanation,
    fieldTip: patch.fieldTip ?? question.fieldTip,
    options: (patch.options ?? question.options).map((option) => ({ ...option })),
  };
}

const AUTHOR = `${DEMO_MANAGER_DASHBOARD.profile.firstName} ${DEMO_MANAGER_DASHBOARD.profile.lastName}`;

/**
 * Éditeur d'une question de QCM à choix (unique, multiple, ou vrai/faux).
 *
 * Pour une question à choix unique ou vrai/faux, cocher une option comme
 * correcte décoche automatiquement les autres — la logique de notation exige
 * exactement une bonne réponse dans ces deux formats.
 */
export function QuestionEditorScreen({ question }: { question: ChoiceQuestion }) {
  const status = useContentStatus("question", question.id);
  const [fields, setFields] = useState<EditableFields>(() => fieldsFromQuestion(question));
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const singleAnswer = question.kind === "single" || question.kind === "true-false";

  function updateOption(index: number, patch: Partial<QuestionOptionPatch>) {
    setFields((current) => {
      const options = current.options.map((option, optionIndex) => {
        if (optionIndex === index) return { ...option, ...patch };
        if (singleAnswer && patch.correct) return { ...option, correct: false };
        return option;
      });
      return { ...current, options };
    });
  }

  function buildPatch(): QuestionPatch {
    return {
      prompt: fields.prompt,
      explanation: fields.explanation,
      fieldTip: fields.fieldTip,
      options: fields.options,
    };
  }

  const hasCorrectAnswer = fields.options.some((option) => option.correct);

  function handleSaveDraft() {
    saveDraft("question", question.id, buildPatch(), AUTHOR);
    setSavedMessage("Brouillon enregistré — invisible des commerciaux.");
  }

  function handlePublish() {
    if (!hasCorrectAnswer) {
      setSavedMessage("Cochez au moins une bonne réponse avant de publier.");
      return;
    }
    publish("question", question.id, buildPatch(), AUTHOR);
    setSavedMessage("Publié : les commerciaux voient désormais cette version, notation comprise.");
  }

  function handleRevert() {
    revertToOriginal("question", question.id);
    setFields(fieldsFromQuestion(question));
    setSavedMessage("Contenu d'origine restauré.");
  }

  return (
    <>
      <PageHeader
        eyebrow="Contenu pédagogique"
        title="Modifier la question"
        description="La correction et le score des commerciaux suivent les bonnes réponses cochées ici, dès la publication."
        back={{ href: "/manager/contenu/qcm", label: "Questions de QCM" }}
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
        <Panel title="Énoncé">
          <textarea
            value={fields.prompt}
            onChange={(event) => setFields((current) => ({ ...current, prompt: event.target.value }))}
            rows={3}
            className="w-full resize-none rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-brand-accent"
          />
        </Panel>

        <Panel
          title="Propositions de réponse"
          description={
            singleAnswer
              ? "Une seule bonne réponse : la cocher décoche automatiquement les autres."
              : "Plusieurs bonnes réponses possibles."
          }
        >
          <ul className="space-y-3">
            {fields.options.map((option, index) => (
              <li
                key={option.id}
                className={cx(
                  "rounded-md border p-3.5",
                  option.correct ? "border-positive-bright/40 bg-positive-soft" : "border-line bg-mist/50",
                )}
              >
                <label className="flex items-start gap-3">
                  <input
                    type={singleAnswer ? "radio" : "checkbox"}
                    name="correct-option"
                    checked={option.correct}
                    onChange={(event) => updateOption(index, { correct: event.target.checked })}
                    className="mt-1 h-4 w-4 accent-[#001a64]"
                  />
                  <span className="min-w-0 flex-1 space-y-2">
                    <textarea
                      value={option.label}
                      onChange={(event) => updateOption(index, { label: event.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-brand-accent"
                    />
                    <textarea
                      value={option.rationale}
                      onChange={(event) => updateOption(index, { rationale: event.target.value })}
                      rows={2}
                      placeholder="Explication affichée à la correction pour cette option"
                      className="w-full resize-none rounded-sm border border-line bg-white px-3 py-2 text-xs text-graphite transition-colors placeholder:text-muted focus:border-brand-accent"
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {!hasCorrectAnswer ? (
            <p className="mt-3 text-xs font-medium text-danger">
              Aucune option n&apos;est cochée comme correcte.
            </p>
          ) : null}
        </Panel>

        <Panel title="Explication pédagogique" description="Affichée à la correction, sous la question.">
          <textarea
            value={fields.explanation}
            onChange={(event) =>
              setFields((current) => ({ ...current, explanation: event.target.value }))
            }
            rows={3}
            className="w-full resize-none rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-brand-accent"
          />
        </Panel>

        <Panel title="Conseil terrain">
          <textarea
            value={fields.fieldTip}
            onChange={(event) => setFields((current) => ({ ...current, fieldTip: event.target.value }))}
            rows={2}
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
