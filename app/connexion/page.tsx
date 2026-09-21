import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { BarChart3, MessageSquare, Video } from "lucide-react";
import { Logo, NiceMatinMark } from "@/src/components/Logo";
import { LoginForm } from "@/app/connexion/LoginForm";
import { getCurrentUser, homeFor } from "@/src/server/auth";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Accès à la plateforme d'entraînement commercial Nice-Matin Academy. Deux espaces : commercial et manager.",
};

const HIGHLIGHTS = [
  {
    icon: Video,
    title: "S'entraîner en conditions réelles",
    detail:
      "Une visioconférence avec Julie Dupont, cliente virtuelle qui réagit comme une vraie personne.",
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

export default async function ConnexionPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* Colonne éditoriale */}
      <section className="nm-navy relative flex flex-col justify-between overflow-hidden px-6 py-10 sm:px-10 lg:w-[48%] lg:px-14 lg:py-14">
        {/*
          Salle de rédaction en fond, très assombrie : elle donne une matière
          et un lieu à la colonne éditoriale sans jamais disputer la lisibilité
          au texte blanc posé dessus.
        */}
        <Image
          src="/images/hero/connexion.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="pointer-events-none select-none object-cover"
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-brand-dark/88" />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-brand-sky/12 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-accent/25 blur-3xl"
        />

        <div className="relative">
          <Logo size="lg" tone="dark" />
        </div>

        <div className="relative my-12 lg:my-0">
          <h1 className="nm-display text-4xl leading-[1.1] text-white sm:text-5xl lg:text-[3.25rem]">
            S&apos;entraîner.
            <br />
            Comprendre.
            <br />
            <span className="text-brand-sky">Progresser.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/65">
            La plateforme d&apos;entraînement des équipes commerciales Nice-Matin. Chaque simulation
            se termine par une analyse détaillée : compétences, moments clés, priorités.
          </p>

          <ul className="mt-10 space-y-5 border-t border-white/12 pt-8">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/12 bg-white/10 text-brand-sky">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/55">
                      {item.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs leading-relaxed text-white/60">
          Plateforme interne Nice-Matin Academy. Accès réservé aux équipes commerciales et à leur
          encadrement.
        </p>
      </section>

      {/* Colonne formulaire */}
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="nm-card w-full max-w-md p-7 sm:p-9">
          <NiceMatinMark className="h-11 w-11" />

          <h2 className="nm-display mt-6 text-2xl text-ink">Accéder à votre espace</h2>
          <p className="mt-2 text-sm leading-relaxed text-graphite">
            Connectez-vous avec l&apos;adresse et le mot de passe communiqués par votre responsable.
          </p>

          <LoginForm />

          <p className="mt-7 text-center text-xs text-graphite">
            Besoin d&apos;aide ?{" "}
            <Link href="/connexion" className="font-semibold text-brand hover:text-brand-accent">
              Contacter l&apos;équipe formation
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
