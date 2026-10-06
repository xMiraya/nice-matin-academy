import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CoachNextMissionCard, CoachProgressionPanel } from "@/src/components/coach/CoachShared";
import type { CoachReport } from "@/src/types/coach";

const base = {} as CoachReport;

describe("affichage de la mémoire pédagogique", () => {
  it("n'affiche rien pour un ancien rapport", () => {
    expect(renderToStaticMarkup(<CoachProgressionPanel report={base} />)).toBe("");
    expect(renderToStaticMarkup(<CoachNextMissionCard report={base} />)).toBe("");
  });

  it("indique le point de départ sans historique", () => {
    const report = {
      progressionAnalysis: { hasHistory: false, summary: "", previousPriorityApplied: "not_evaluable", previousPriorityComment: "", progressPoints: [] },
    } as unknown as CoachReport;
    const html = renderToStaticMarkup(<CoachProgressionPanel report={report} />);
    expect(html).toContain("Ma progression");
    expect(html).toContain("point de départ");
  });

  it("affiche progression, priorité précédente et mission", () => {
    const report = {
      progressionAnalysis: {
        hasHistory: true,
        summary: "Vous avez progressé.",
        previousPriorityApplied: "partially",
        previousPriorityComment: "Deux questions ouvertes.",
        progressPoints: [{ competencyId: "decouverte-besoins", direction: "improved", explanation: "Plus de questions." }],
      },
      nextMission: {
        title: "Approfondir la découverte",
        instruction: "Explore avant de présenter.",
        competencyId: "decouverte-besoins",
        successCriteria: "Deux besoins identifiés.",
      },
    } as unknown as CoachReport;
    const progression = renderToStaticMarkup(<CoachProgressionPanel report={report} />);
    expect(progression).toContain("Vous avez progressé.");
    expect(progression).toContain("partiellement appliquée");
    expect(progression).toContain("Découverte des besoins");
    const mission = renderToStaticMarkup(<CoachNextMissionCard report={report} />);
    expect(mission).toContain("Ma prochaine mission");
    expect(mission).toContain("Approfondir la découverte");
    expect(mission).toContain("Deux besoins identifiés.");
  });
});
