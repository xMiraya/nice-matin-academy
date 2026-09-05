import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { methodologySheets } from "@/src/data/methodology/sheets";
import { allQuestionsIndexed } from "@/src/data/qcm/all-questions";
import { Badge } from "@/src/components/StatusBadge";

export const metadata: Metadata = {
  title: "Contenu pédagogique",
  description: "Modifier les fiches méthodologiques et les questions de QCM.",
};

export default function ManagerContentHubPage() {
  const questionCount = allQuestionsIndexed().length;

  const sections = [
    {
      href: "/manager/contenu/fiches",
      icon: BookOpen,
      title: "Fiches méthodologiques",
      description:
        "Objectif, enjeux, bons réflexes, formulations et conseil du formateur, modifiables fiche par fiche.",
      count: `${methodologySheets.length} fiches`,
    },
    {
      href: "/manager/contenu/qcm",
      icon: GraduationCap,
      title: "Questions de QCM",
      description:
        "Énoncé, explication, conseil terrain et propositions de réponse. Les questions de réordonnancement restent en lecture seule dans cette version.",
      count: `${questionCount} questions`,
    },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Contenu pédagogique"
        description="Ce que vous modifiez ici reste privé tant que ce n'est pas publié : les commerciaux ne voient que la dernière version publiée, jamais un brouillon."
      />

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <li key={section.href} className="flex">
              <Link
                href={section.href}
                className="nm-card-link group flex w-full flex-col p-5 sm:p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="mt-4 text-base font-semibold tracking-tight text-ink group-hover:text-brand">
                  {section.title}
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-graphite">
                  {section.description}
                </span>
                <span className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <Badge>{section.count}</Badge>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    Ouvrir
                    <ArrowRight
                      size={14}
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
