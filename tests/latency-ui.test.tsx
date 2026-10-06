import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LatencyDebugPanel } from "@/src/components/diagnostics/LatencyDebugPanel";

describe("panneau de diagnostic de latence", () => {
  it("n'affiche rien par défaut (rendu serveur, mode test non activé)", () => {
    expect(renderToStaticMarkup(<LatencyDebugPanel />)).toBe("");
  });
});
