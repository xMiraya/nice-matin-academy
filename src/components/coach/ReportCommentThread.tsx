"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Panel } from "@/src/components/Panel";
import { Button } from "@/src/components/Button";
import { Avatar } from "@/src/components/Avatar";
import { photoForName } from "@/src/data/team-photos";
import { addComment } from "@/src/lib/comments/comment-repository";
import { useReportComments } from "@/src/lib/comments/use-comments";
import { pushNotification } from "@/src/lib/notifications/notification-repository";
import { cx } from "@/src/lib/format";

/** « il y a 5 min », « le 12 août à 14:32 ». */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 60) return diffMinutes <= 0 ? "à l'instant" : `il y a ${diffMinutes} min`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

interface ReportCommentThreadProps {
  reportId: string;
  /** Peut écrire un commentaire : le manager sur la fiche du commercial. */
  canWrite: boolean;
  authorName: string;
  authorRole: "manager" | "commercial";
  /**
   * Notification envoyée à l'auteur d'un nouveau commentaire, côté commercial
   * uniquement — le manager n'a pas de page de notifications dans cette
   * maquette.
   */
  notifyRecipientId?: string;
  notifyHref?: string;
}

/**
 * Fil de commentaires attaché à un compte rendu.
 *
 * Visible des deux côtés (commercial et manager) : le manager peut écrire, le
 * commercial ne peut que lire — le champ de saisie n'apparaît tout simplement
 * pas pour lui. L'envoi d'un commentaire pousse une notification réelle au
 * commercial concerné.
 */
export function ReportCommentThread({
  reportId,
  canWrite,
  authorName,
  authorRole,
  notifyRecipientId,
  notifyHref,
}: ReportCommentThreadProps) {
  const comments = useReportComments(reportId);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    addComment({ reportId, authorName, authorRole, text });

    if (notifyRecipientId) {
      pushNotification({
        kind: "coach-comment",
        recipientId: notifyRecipientId,
        authorName,
        title: "Nouveau commentaire sur votre simulation",
        message: text,
        href: notifyHref ?? `/commercial/simulations/${reportId}`,
      });
    }

    setDraft("");
    setSent(true);
    window.setTimeout(() => setSent(false), 3000);
  }

  return (
    <Panel
      title="Commentaires"
      description={
        canWrite
          ? "Votre retour est transmis au commercial par notification."
          : "Retours de votre manager sur cette simulation."
      }
    >
      {comments.length === 0 ? (
        <p className="text-sm leading-relaxed text-graphite">
          {canWrite
            ? "Aucun commentaire pour le moment. Le vôtre sera transmis dès l'envoi."
            : "Aucun commentaire n'a encore été laissé sur cette simulation."}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar
                photo={photoForName(comment.authorName)}
                initials={comment.authorName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
                size="sm"
                tone={comment.authorRole === "manager" ? "navy" : "auto"}
              />
              <div className="min-w-0 flex-1 rounded-md bg-mist/70 px-3.5 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-ink">{comment.authorName}</span>
                  <span className="text-xs text-muted">{formatWhen(comment.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-graphite">{comment.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <form onSubmit={handleSubmit} className={cx(comments.length > 0 && "mt-5 border-t border-line pt-5")}>
          <label htmlFor="manager-comment" className="mb-2 block text-sm font-medium text-ink">
            Votre retour sur cette simulation
          </label>
          <textarea
            id="manager-comment"
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ce que vous voulez que le commercial retienne de cet entretien…"
            className="w-full resize-none rounded-sm border border-line bg-white px-3.5 py-3 text-sm text-ink transition-colors placeholder:text-muted focus:border-brand-accent"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" size="sm" disabled={draft.trim().length === 0}>
              <Send size={14} aria-hidden />
              Envoyer au commercial
            </Button>
            {sent ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-positive">
                <CheckCircle2 size={14} aria-hidden />
                Commentaire envoyé, notification transmise.
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </Panel>
  );
}
