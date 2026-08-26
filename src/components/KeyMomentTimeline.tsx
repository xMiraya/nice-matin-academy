import { AlertTriangle, CheckCircle2, CircleAlert, Dot } from "lucide-react";
import type { KeyMoment, KeyMomentTone } from "@/src/types";
import { cx } from "@/src/lib/format";

const TONE: Record<
  KeyMomentTone,
  { dot: string; text: string; icon: typeof CircleAlert; label: string }
> = {
  positif: { dot: "bg-positive", text: "text-positive", icon: CheckCircle2, label: "Point fort" },
  vigilance: { dot: "bg-warning", text: "text-warning", icon: CircleAlert, label: "Vigilance" },
  critique: { dot: "bg-danger", text: "text-danger", icon: AlertTriangle, label: "Critique" },
  neutre: { dot: "bg-graphite", text: "text-graphite", icon: Dot, label: "Repère" },
};

/** Chronologie verticale horodatée des moments clés de l'échange. */
export function KeyMomentTimeline({ moments }: { moments: KeyMoment[] }) {
  return (
    <ol className="relative space-y-0">
      {moments.map((moment, index) => {
        const tone = TONE[moment.tone];
        const Icon = tone.icon;
        const isLast = index === moments.length - 1;
        return (
          <li key={`${moment.timestamp}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cx(
                  "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                  tone.dot,
                )}
              >
                <Icon size={13} aria-hidden />
              </span>
              {!isLast ? <span className="mt-1 w-px flex-1 bg-line" aria-hidden /> : null}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {moment.timestamp}
                </span>
                <span className={cx("text-[11px] font-semibold uppercase tracking-[0.1em]", tone.text)}>
                  {tone.label}
                </span>
              </div>
              <p className="mt-1 font-medium leading-snug text-ink">{moment.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-graphite">{moment.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
