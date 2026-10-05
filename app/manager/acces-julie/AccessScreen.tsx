"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { PageLoading } from "@/src/components/PageLoading";
import { Button } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { useTeamAccounts } from "@/src/lib/team/use-manager-dashboard";
import { sendJson } from "@/src/lib/remote-store";

interface Requirement {
  kind: "QUIZ" | "ASSESSMENT";
  targetId: string;
  title: string;
  requiredScore: number | null;
  active: boolean;
}
interface OverrideRow {
  id: string;
  userName: string;
  reason: string;
  grantedByName: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}
interface EventRow {
  id: string;
  type: string;
  details: Record<string, unknown>;
  createdAt: string;
  userName: string | null;
  actorName: string | null;
}
interface Data {
  threshold: number;
  requirements: Requirement[];
  overrides: OverrideRow[];
  events: EventRow[];
  catalog: { kind: "QUIZ" | "ASSESSMENT"; targetId: string; title: string }[];
}

const FIELD =
  "w-full rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-accent";

const EVENT_LABELS: Record<string, string> = {
  UNLOCKED: "Julie débloquée (scores)",
  FIRST_ACCESS: "Premier accès à Julie",
  ACCESS_DENIED: "Accès refusé",
  OVERRIDE_GRANTED: "Dérogation accordée",
  OVERRIDE_REVOKED: "Dérogation annulée",
  THRESHOLD_CHANGED: "Seuil modifié",
  REQUIREMENTS_CHANGED: "Prérequis modifiés",
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

function describe(event: EventRow): string {
  const d = event.details;
  if (event.type === "THRESHOLD_CHANGED") return `${String(d.from)} → ${String(d.to)}`;
  if (event.type === "OVERRIDE_GRANTED") return `Motif : ${String(d.reason ?? "")}`;
  if (event.type === "ACCESS_DENIED") {
    const missing = (d.missing as { title: string }[] | undefined) ?? [];
    return missing.length > 0 ? `Manquant : ${missing.map((m) => m.title).join(", ")}` : "";
  }
  if (event.type === "REQUIREMENTS_CHANGED") {
    return `${((d.after as string[] | undefined) ?? []).length} prérequis`;
  }
  return "";
}

export function AccessScreen() {
  const accounts = useTeamAccounts();
  const [data, setData] = useState<Data | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [thresholdInput, setThresholdInput] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/access", { cache: "no-store" });
    if (!response.ok) return;
    const json = (await response.json()) as Data;
    setData(json);
    setLoadedAt(Date.now());
    setThresholdInput(String(json.threshold));
    setRequirements(json.requirements);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await load();
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "L'opération a échoué.");
    }
  }

  if (!data) return <PageLoading />;

  const used = new Set(requirements.map((r) => `${r.kind}:${r.targetId}`));
  const available = data.catalog.filter((item) => !used.has(`${item.kind}:${item.targetId}`));

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Accès à Julie"
        description="Définissez à quelles conditions un commercial peut s'entraîner avec Julie, et accordez une dérogation si nécessaire."
      />

      <div className="space-y-5">
        {message ? (
          <p role="status" className="rounded-md bg-brand-soft px-4 py-3 text-sm font-medium text-ink">
            {message}
          </p>
        ) : null}

        <Panel
          title="Seuil de réussite"
          description={`Seuil actuel : ${data.threshold}/100. Chaque prérequis doit l'atteindre individuellement.`}
        >
          <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => sendJson("/api/admin/access", "PUT", { threshold: Number(thresholdInput) }),
                "Seuil enregistré.",
              );
            }}
          >
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              required
              value={thresholdInput}
              onChange={(event) => setThresholdInput(event.target.value)}
              aria-label="Seuil de réussite sur 100"
              className={`${FIELD} max-w-28`}
            />
            <Button type="submit">Enregistrer le seuil</Button>
          </form>
        </Panel>

        <Panel
          title="Prérequis de la simulation avec Julie"
          description="QCM et évaluations à réussir. Laissez le seuil vide pour appliquer le seuil global."
        >
          {requirements.length === 0 ? (
            <p className="mb-4 rounded-md bg-warning-soft px-4 py-3 text-sm text-ink">
              Aucun prérequis n&apos;est configuré : Julie est actuellement accessible à tous les commerciaux.
            </p>
          ) : (
            <ul className="mb-4 divide-y divide-line">
              {requirements.map((requirement, index) => (
                <li key={`${requirement.kind}:${requirement.targetId}`} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{requirement.title}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder={`Global (${data.threshold})`}
                    aria-label={`Seuil propre à ${requirement.title}`}
                    value={requirement.requiredScore ?? ""}
                    onChange={(event) =>
                      setRequirements((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, requiredScore: event.target.value === "" ? null : Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                    className={`${FIELD} max-w-36`}
                  />
                  <label className="flex items-center gap-1.5 text-sm text-graphite">
                    <input
                      type="checkbox"
                      checked={requirement.active}
                      onChange={(event) =>
                        setRequirements((current) =>
                          current.map((item, i) => (i === index ? { ...item, active: event.target.checked } : item)),
                        )
                      }
                    />
                    Actif
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRequirements((current) => current.filter((_, i) => i !== index))}
                  >
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Ajouter un prérequis"
              value=""
              onChange={(event) => {
                const item = available.find((entry) => `${entry.kind}:${entry.targetId}` === event.target.value);
                if (item) setRequirements((current) => [...current, { ...item, requiredScore: null, active: true }]);
              }}
              className={`${FIELD} max-w-sm`}
            >
              <option value="">Ajouter un QCM ou une évaluation…</option>
              {available.map((item) => (
                <option key={`${item.kind}:${item.targetId}`} value={`${item.kind}:${item.targetId}`}>
                  {item.title}
                </option>
              ))}
            </select>
            <Button
              onClick={() =>
                void run(
                  () =>
                    sendJson("/api/admin/access", "PUT", {
                      requirements: requirements.map(({ kind, targetId, requiredScore, active }) => ({
                        kind,
                        targetId,
                        requiredScore,
                        active,
                      })),
                    }),
                  "Prérequis enregistrés.",
                )
              }
            >
              Enregistrer les prérequis
            </Button>
          </div>
        </Panel>

        <Panel
          title="Dérogation exceptionnelle"
          description="Déverrouille Julie pour un commercial sans qu'il ait validé les prérequis. Un motif est obligatoire."
        >
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const values = new FormData(form);
              const expires = String(values.get("expiresAt") ?? "");
              void run(async () => {
                await sendJson("/api/admin/access/overrides", "POST", {
                  userId: String(values.get("userId") ?? ""),
                  reason: String(values.get("reason") ?? ""),
                  expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
                });
                form.reset();
              }, "Dérogation accordée.");
            }}
          >
            <select name="userId" required defaultValue="" aria-label="Commercial" className={FIELD}>
              <option value="" disabled>
                Choisir un commercial…
              </option>
              {accounts
                .filter((account) => account.active)
                .map((account) => (
                  <option key={account.profile.id} value={account.profile.id}>
                    {account.profile.firstName} {account.profile.lastName}
                  </option>
                ))}
            </select>
            <input name="expiresAt" type="date" aria-label="Date d'expiration (facultative)" className={FIELD} />
            <input
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="Motif (obligatoire)"
              aria-label="Motif"
              className={`${FIELD} sm:col-span-2`}
            />
            <div className="sm:col-span-2">
              <Button type="submit">
                <ShieldCheck size={15} aria-hidden />
                Accorder la dérogation
              </Button>
            </div>
          </form>

          {data.overrides.length > 0 ? (
            <ul className="mt-5 divide-y divide-line">
              {data.overrides.map((override) => {
                const expired = override.expiresAt !== null && Date.parse(override.expiresAt) <= loadedAt;
                const state = override.revokedAt ? "Annulée" : expired ? "Expirée" : "Active";
                return (
                  <li key={override.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="min-w-0 text-sm">
                      <span className="font-semibold text-ink">{override.userName}</span>
                      <span className="block text-xs text-graphite">
                        {override.reason} · par {override.grantedByName} le {fmt(override.grantedAt)}
                        {override.expiresAt ? ` · expire le ${fmt(override.expiresAt)}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={state === "Active" ? "positif" : "neutre"}>{state}</Badge>
                      {state === "Active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void run(
                              () => sendJson(`/api/admin/access/overrides/${override.id}`, "DELETE"),
                              "Dérogation annulée.",
                            )
                          }
                        >
                          <Ban size={14} aria-hidden />
                          Annuler
                        </Button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Panel>

        <Panel title="Historique" description="Événements importants uniquement : refus, déverrouillages, dérogations, réglages.">
          {data.events.length === 0 ? (
            <p className="text-sm text-graphite">Aucun événement pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.events.map((event) => (
                <li key={event.id} className="py-3 text-sm">
                  <span className="font-semibold text-ink">{EVENT_LABELS[event.type] ?? event.type}</span>
                  <span className="text-graphite">
                    {event.userName ? ` · ${event.userName}` : ""}
                    {event.actorName ? ` · par ${event.actorName}` : ""} · {fmt(event.createdAt)}
                  </span>
                  {describe(event) ? <span className="block text-xs text-graphite">{describe(event)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
