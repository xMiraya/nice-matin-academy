import { VideoOff } from "lucide-react";
import { DemoBadge } from "@/src/components/StatusBadge";

interface RecordingPlayerPlaceholderProps {
  notice?: string;
  detail?: string;
}

/**
 * Emplacement du lecteur d'enregistrement. Le lecteur est volontairement
 * désactivé : aucun enregistrement n'est disponible à ce stade du prototype.
 *
 * Le bloc reste volontairement bas : un cadre 16/9 vide déséquilibrait la
 * rangée et ouvrait une zone morte à droite, à côté du transcript replié.
 */
export function RecordingPlayerPlaceholder({
  notice = "Aucun enregistrement disponible pour ce test",
  detail = "L'enregistrement vidéo des simulations sera rattaché au compte rendu lors d'une prochaine étape.",
}: RecordingPlayerPlaceholderProps) {
  return (
    <div>
      <div
        className="flex items-center gap-4 rounded-md border border-line bg-ink/95 px-5 py-4"
        role="img"
        aria-label={notice}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
          <VideoOff size={20} aria-hidden />
        </span>
        <p className="text-sm font-semibold leading-snug text-white">{notice}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <DemoBadge>Lecteur désactivé</DemoBadge>
        <p className="text-sm leading-relaxed text-graphite">{detail}</p>
      </div>
    </div>
  );
}
