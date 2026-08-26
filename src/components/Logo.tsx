import { cx } from "@/src/lib/format";

/**
 * Logotype officiel Nice-Matin.
 *
 * Le tracé provient du fichier `logo_nicematin.svg` publié par nicematin.com.
 * Il est repris tel quel, en une seule forme composée, et prend la couleur du
 * texte environnant (`currentColor`) pour fonctionner sur fond clair comme sur
 * fond marine.
 */
export function NiceMatinWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 103 16"
      role="img"
      aria-label="Nice-Matin"
      className={className}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M90.3831 2.0073C90.3831 3.11632 89.4831 4.0146 88.3721 4.0146C87.2616 4.0146 86.3612 3.11632 86.3612 2.0073C86.3612 0.898776 87.2616 0 88.3721 0C89.4831 0 90.3831 0.898776 90.3831 2.0073ZM16.2484 2.0073C16.2484 3.11632 15.3485 4.0146 14.2375 4.0146C13.127 4.0146 12.2266 3.11632 12.2266 2.0073C12.2266 0.898776 13.127 0 14.2375 0C15.3485 0 16.2484 0.898776 16.2484 2.0073ZM0 4.5991H3.91708V6.16299C4.63881 5.23681 5.66949 4.35199 7.25718 4.35199C9.62799 4.35199 11.0505 5.91638 11.0505 8.4473V15.7322H7.1334V9.70279C7.1334 8.48865 6.49403 7.83001 5.56667 7.83001C4.61834 7.83001 3.91708 8.48865 3.91708 9.70279V15.7322H0V4.5991ZM12.2868 15.7322H16.2039V4.59915H12.2868V15.7322ZM33.2532 4.35229C37.1084 4.35229 38.8812 7.17167 38.8812 10.4434C38.8812 10.6905 38.8812 10.9785 38.8608 11.2461H31.3974C31.7069 12.4602 32.5933 13.0775 33.8097 13.0775C34.7375 13.0775 35.4797 12.7277 36.2838 11.946L38.4485 13.7361C37.3764 15.0943 35.8301 16 33.6035 16C30.0987 16 27.6246 13.6743 27.6246 10.2172V10.1759C27.6246 6.92456 29.9545 4.35229 33.2532 4.35229ZM23.0484 4.37271C25.3369 4.37271 26.8622 5.36067 27.8105 6.86278L25.1512 8.83819C24.6152 8.09735 24.0172 7.6654 23.0689 7.6654C21.8116 7.6654 20.8838 8.77641 20.8838 10.135V10.1759C20.8838 11.6167 21.7907 12.7073 23.1103 12.7073C24.0382 12.7073 24.6356 12.2754 25.254 11.5544L27.8724 13.4482C26.8417 14.9712 25.3574 16 22.9042 16C19.5436 16 17.0695 13.3659 17.0695 10.2172V10.1759C17.0695 7.02719 19.5232 4.37271 23.0484 4.37271ZM33.2736 7.23345C32.2425 7.23345 31.5417 8.03557 31.3356 9.24972H35.2117C35.0675 8.01515 34.3457 7.23345 33.2736 7.23345ZM39.9734 11.0196H46.7355V7.58295H39.9734V11.0196ZM47.7456 4.5991H51.6627V6.12214C52.3844 5.19596 53.4151 4.35199 54.9818 4.35199C56.4662 4.35199 57.6002 5.01062 58.1982 6.16299C59.1669 5.05198 60.3009 4.35199 61.9301 4.35199C64.3009 4.35199 65.7438 5.83367 65.7438 8.42687V15.7322H61.8267V9.68237C61.8267 8.46772 61.2288 7.83001 60.3009 7.83001C59.3736 7.83001 58.6928 8.46772 58.6928 9.68237V15.7322H54.7757V9.68237C54.7757 8.46772 54.1778 7.83001 53.2499 7.83001C52.3225 7.83001 51.6627 8.46772 51.6627 9.68237V15.7322H47.7456V4.5991ZM66.3409 12.5425V12.5016C66.3409 10.1969 68.0933 9.00315 70.7117 9.00315C71.7424 9.00315 72.7526 9.20891 73.392 9.4351V9.24977C73.392 8.0974 72.6702 7.43876 71.1654 7.43876C69.9905 7.43876 69.0831 7.66545 68.0933 8.05655L67.2892 5.29894C68.547 4.78429 69.8872 4.43454 71.8043 4.43454C73.8042 4.43454 75.1648 4.90784 76.0518 5.79267C76.8968 6.61572 77.2472 7.76808 77.2472 9.33247V15.732H73.3715V14.5801C72.6084 15.4236 71.5572 15.9796 70.0933 15.9796C67.9695 15.9796 66.3409 14.765 66.3409 12.5425ZM73.4334 11.699V11.1843C73.0416 11.0194 72.4851 10.8964 71.9076 10.8964C70.7736 10.8964 70.1138 11.4519 70.1138 12.2754V12.3163C70.1138 13.0775 70.6912 13.5304 71.4953 13.5304C72.6293 13.5304 73.4334 12.81 73.4334 11.699ZM78.9582 12.2752V7.7479H77.639V4.5992H78.9582V1.77981H82.8758V4.5992H85.4732V7.7479H82.8758V11.5134C82.8758 12.2956 83.2256 12.6249 83.9474 12.6249C84.463 12.6249 84.9576 12.4809 85.4317 12.2547V15.3207C84.731 15.7118 83.8031 15.9589 82.7106 15.9589C80.3602 15.9589 78.9582 14.9296 78.9582 12.2752ZM86.3799 15.7322H90.297V4.59915H86.3799V15.7322ZM91.6162 4.5991H95.5338V6.16299C96.255 5.23681 97.2862 4.35199 98.8734 4.35199C101.244 4.35199 102.667 5.91638 102.667 8.4473V15.7322H98.7496V9.70279C98.7496 8.48865 98.1107 7.83001 97.1828 7.83001C96.2345 7.83001 95.5338 8.48865 95.5338 9.70279V15.7322H91.6162V4.5991Z"
      />
    </svg>
  );
}

/**
 * Monogramme carré : le « m » du logotype officiel, isolé du tracé complet et
 * posé sur l'aplat bleu marine de la charte. Sert de marque compacte dans la
 * barre latérale repliée, sur mobile et en favicon d'interface.
 */
export function NiceMatinMark({
  className,
  tone = "navy",
}: {
  className?: string;
  tone?: "navy" | "white" | "outline";
}) {
  const surface =
    tone === "white"
      ? "bg-white text-brand"
      : tone === "outline"
        ? "border border-white/25 bg-white/10 text-white"
        : "nm-navy";

  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center rounded-md",
        surface,
        className,
      )}
    >
      <svg viewBox="47.5 4 18.5 12" className="h-[38%] w-auto" fill="currentColor">
        <path d="M47.7456 4.5991H51.6627V6.12214C52.3844 5.19596 53.4151 4.35199 54.9818 4.35199C56.4662 4.35199 57.6002 5.01062 58.1982 6.16299C59.1669 5.05198 60.3009 4.35199 61.9301 4.35199C64.3009 4.35199 65.7438 5.83367 65.7438 8.42687V15.7322H61.8267V9.68237C61.8267 8.46772 61.2288 7.83001 60.3009 7.83001C59.3736 7.83001 58.6928 8.46772 58.6928 9.68237V15.7322H54.7757V9.68237C54.7757 8.46772 54.1778 7.83001 53.2499 7.83001C52.3225 7.83001 51.6627 8.46772 51.6627 9.68237V15.7322H47.7456V4.5991Z" />
      </svg>
    </span>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** « dark » pour un affichage sur fond marine. */
  tone?: "light" | "dark";
  /** Masque la mention « Academy » et le monogramme. */
  wordmarkOnly?: boolean;
  className?: string;
}

const SIZES = {
  sm: { mark: "h-8 w-8", word: "h-3", sub: "text-[9px]", gap: "gap-2.5" },
  md: { mark: "h-10 w-10", word: "h-3.5", sub: "text-[10px]", gap: "gap-3" },
  lg: { mark: "h-14 w-14", word: "h-5", sub: "text-xs", gap: "gap-4" },
} as const;

/** Verrouillage logotype officiel Nice-Matin + mention « Academy ». */
export function Logo({ size = "md", tone = "light", wordmarkOnly = false, className }: LogoProps) {
  const s = SIZES[size];
  const dark = tone === "dark";

  return (
    <span className={cx("flex items-center", s.gap, className)}>
      {wordmarkOnly ? null : (
        <NiceMatinMark className={s.mark} tone={dark ? "white" : "navy"} />
      )}
      <span className="flex flex-col justify-center gap-1">
        <NiceMatinWordmark className={cx(s.word, "w-auto", dark ? "text-white" : "text-ink")} />
        <span
          className={cx(
            "font-semibold uppercase leading-none tracking-[0.3em]",
            s.sub,
            dark ? "text-brand-sky" : "text-brand-accent",
          )}
        >
          Academy
        </span>
      </span>
    </span>
  );
}
