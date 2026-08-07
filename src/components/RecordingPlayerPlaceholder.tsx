import { VideoOff } from "lucide-react";
import { DemoBadge } from "@/src/components/StatusBadge";

interface RecordingPlayerPlaceholderProps {
  notice?: string;
  detail?: string;
}

/**
 * Emplacement du lecteur d'enregistrement. Le lecteur est volontairement
 * désactivé : aucun enregistrement n'est disponible à ce stade du prototype.
 */
export function RecordingPlayerPlaceholder({
  notice = "Aucun enregistrement disponible pour ce test",
  detail = "L'enregistrement vidéo des simulations sera rattaché au compte rendu lors d'une prochaine étape.",
}: RecordingPlayerPlaceholderProps) {
  return (
    <div>
      <div
        className="flex aspect-video w-full flex-col items-center justify-center rounded-md border border-line bg-ink/95 px-6 text-center"
        role="img"
        aria-label={notice}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70">
          <VideoOff size={22} aria-hidden />
        </span>
        <p className="mt-4 text-sm font-semibold text-white">{notice}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <DemoBadge>Lecteur désactivé</DemoBadge>
        <p className="text-sm leading-relaxed text-graphite">{detail}</p>
      </div>
    </div>
  );
}
