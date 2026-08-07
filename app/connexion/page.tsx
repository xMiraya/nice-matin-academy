import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, MessageSquare, Video } from "lucide-react";
import { Logo } from "@/src/components/Logo";
import { ButtonLink } from "@/src/components/Button";
import { DemoBadge } from "@/src/components/StatusBadge";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Accès à la plateforme d'entraînement commercial Nice-Matin Academy. Deux espaces : commercial et manager.",
};

const HIGHLIGHTS = [
  {
    icon: Video,
    title: "S'entraîner en conditions réelles",
    detail: "Une visioconférence avec Julie Dupont, cliente virtuelle qui réagit comme une vraie personne.",
  },
  {
    icon: MessageSquare,
    title: "Comprendre ce qui s'est joué",
    detail: "Le Coach IA relit le transcript, repère les moments clés et explique chaque écart.",
  },
  {
    icon: BarChart3,
    title: "Progresser sur huit compétences",
    detail: "Du premier contact à la conclusion, avec une priorité claire avant chaque session.",
  },
];

export default function ConnexionPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Colonne éditoriale */}
      <section className="flex flex-col justify-between bg-ink px-6 py-10 text-white sm:px-10 lg:w-[46%] lg:px-14 lg:py-14">
        <Logo size="lg" tone="dark" />

        <div className="my-12 lg:my-0">
          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]">
            S&apos;entraîner.
            <br />
            Comprendre.
            <br />
            <span className="text-brand">Progresser.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
            La plateforme d&apos;entraînement des équipes commerciales Nice-Matin. Chaque simulation
            se termine par une analyse détaillée : compétences, moments clés, priorités.
          </p>

          <ul className="mt-10 space-y-6 border-t border-white/15 pt-8">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-white/10 text-brand">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/60">
                      {item.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-white/45">
          Prototype interne — données de démonstration. Aucun service externe n&apos;est connecté à
          ce stade.
        </p>
      </section>

      {/* Colonne formulaire */}
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <DemoBadge>Maquette — sans authentification</DemoBadge>

          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
            Accéder à votre espace
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-graphite">
            Utilisez les accès de démonstration ci-dessous pour parcourir la plateforme.
          </p>

          <form className="mt-8 space-y-4" aria-describedby="form-notice">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Adresse électronique
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="prenom.nom@nicematin.fr"
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-zinc-400"
              />
            </div>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-sm bg-mist px-4 py-2.5 text-sm font-semibold text-graphite"
            >
              Se connecter
            </button>
            <p id="form-notice" className="text-xs leading-relaxed text-graphite">
              Le formulaire est présenté à titre visuel. L&apos;authentification réelle sera mise en
              place à une étape ultérieure.
            </p>
          </form>

          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" aria-hidden />
            <span className="nm-label">Accès de démonstration</span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>

          <div className="space-y-3">
            <ButtonLink href="/commercial" className="w-full justify-between px-4">
              Entrer comme commercial
              <ArrowRight size={17} aria-hidden />
            </ButtonLink>
            <ButtonLink href="/manager" variant="secondary" className="w-full justify-between px-4">
              Entrer comme manager
              <ArrowRight size={17} aria-hidden />
            </ButtonLink>
          </div>

          <p className="mt-8 text-center text-xs text-graphite">
            Besoin d&apos;aide ?{" "}
            <Link href="/connexion" className="font-medium text-brand hover:text-brand-dark">
              Contacter l&apos;équipe formation
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
