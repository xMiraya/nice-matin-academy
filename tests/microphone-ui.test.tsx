import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MicrophoneCheckPanel } from "@/src/components/media/MicrophoneCheckPanel";
import type { MicrophoneCheck } from "@/src/lib/media/use-microphone-check";

const check = (overrides: Partial<MicrophoneCheck> = {}): MicrophoneCheck => ({
  status: "ready",
  failure: null,
  devices: [{ deviceId: "mic-1", label: "Realtek Audio" }],
  deviceId: "mic-1",
  level: 0.4,
  camera: "ok",
  cameraFailure: null,
  run: vi.fn(async () => undefined),
  select: vi.fn(),
  release: vi.fn(),
  reportFailure: vi.fn(),
  ...overrides,
});

describe("panneau de contrôle du microphone", () => {
  it("micro détecté : état, jauge qui reflète le niveau et consigne", () => {
    const html = renderToStaticMarkup(<MicrophoneCheckPanel check={check({ level: 0.4 })} />);
    expect(html).toContain("Détecté");
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain("width:40%");
    expect(html).toContain("Parlez quelques secondes pour tester votre microphone");
    expect(html).not.toContain("Choisir un microphone");
  });

  it("plusieurs microphones : sélecteur proposé", () => {
    const html = renderToStaticMarkup(
      <MicrophoneCheckPanel
        check={check({
          devices: [
            { deviceId: "mic-1", label: "Realtek Audio" },
            { deviceId: "mic-2", label: "Casque USB" },
          ],
        })}
      />,
    );
    expect(html).toContain("Choisir un microphone");
    expect(html).toContain("Casque USB");
  });

  it("micro absent : message clair et nouvel essai", () => {
    const html = renderToStaticMarkup(
      <MicrophoneCheckPanel check={check({ status: "failed", failure: "absent", devices: [], level: 0 })} />,
    );
    expect(html).toContain("Votre microphone n&#x27;est pas détecté.");
    expect(html).toContain("Réessayer");
    expect(html).not.toContain("Détecté");
  });

  it("permission refusée : explication de l'autorisation", () => {
    const html = renderToStaticMarkup(
      <MicrophoneCheckPanel check={check({ status: "failed", failure: "denied", devices: [] })} />,
    );
    expect(html).toContain("accès au microphone est refusé");
  });

  it("avant le test : invite à tester, aucune mesure", () => {
    const html = renderToStaticMarkup(<MicrophoneCheckPanel check={check({ status: "idle", camera: "idle" })} />);
    expect(html).toContain("Tester mon matériel");
    expect(html).not.toContain("role=\"meter\"");
  });
});
