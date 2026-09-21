"use client";

import { useState } from "react";
import { KeyRound, UserPlus, UserX, UserCheck } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { PageLoading } from "@/src/components/PageLoading";
import { Button } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { TeamMemberList } from "@/src/components/TeamMemberList";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";
import { useManagerDashboard, useTeamAccounts } from "@/src/lib/team/use-manager-dashboard";
import { createCommercial, updateCommercial } from "@/src/lib/team/team-repository";
import type { NewCommercial } from "@/src/lib/team/team-repository";

const FIELD =
  "w-full rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-accent";

const LEVELS: { value: NonNullable<NewCommercial["level"]>; label: string }[] = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "confirme", label: "Confirmé" },
];

function AddCommercialForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const level = String(data.get("level") ?? "");
    setPending(true);
    setError(null);
    setDone(null);
    try {
      await createCommercial({
        firstName: String(data.get("firstName") ?? ""),
        lastName: String(data.get("lastName") ?? ""),
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
        jobTitle: String(data.get("jobTitle") ?? "") || "Commercial terrain",
        team: String(data.get("team") ?? "") || "Nice-Matin",
        level: (level || null) as NewCommercial["level"],
      });
      setDone(`Compte créé pour ${String(data.get("firstName"))} ${String(data.get("lastName"))}.`);
      form.reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "La création a échoué.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input name="firstName" required placeholder="Prénom" aria-label="Prénom" className={FIELD} />
      <input name="lastName" required placeholder="Nom" aria-label="Nom" className={FIELD} />
      <input
        name="email"
        type="email"
        required
        placeholder="Adresse électronique"
        aria-label="Adresse électronique"
        className={FIELD}
      />
      <input
        name="password"
        type="text"
        required
        minLength={8}
        autoComplete="off"
        placeholder="Mot de passe initial (8 caractères min.)"
        aria-label="Mot de passe initial"
        className={FIELD}
      />
      <input name="jobTitle" placeholder="Poste (ex. Commercial terrain)" aria-label="Poste" className={FIELD} />
      <input name="team" placeholder="Équipe (ex. Équipe Nice)" aria-label="Équipe" className={FIELD} />
      <select name="level" defaultValue="" aria-label="Niveau" className={FIELD}>
        <option value="">Niveau non précisé</option>
        {LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          <UserPlus size={15} aria-hidden />
          {pending ? "Création…" : "Créer le compte"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
          {error}
        </p>
      ) : null}
      {done ? <p className="text-sm font-medium text-positive sm:col-span-2">{done}</p> : null}
    </form>
  );
}

function AccessList() {
  const accounts = useTeamAccounts();
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<void>, success: string) {
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "L'opération a échoué.");
    }
  }

  function resetPassword(id: string, name: string) {
    const password = window.prompt(`Nouveau mot de passe pour ${name} (8 caractères minimum) :`);
    if (!password) return;
    void run(
      () => updateCommercial(id, { password }),
      `Mot de passe de ${name} modifié. Sa session en cours a été fermée.`,
    );
  }

  if (accounts.length === 0) {
    return <p className="text-sm text-graphite">Aucun compte commercial pour le moment.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {accounts.map(({ profile, email, active }) => {
          const name = `${profile.firstName} ${profile.lastName}`;
          return (
            <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                <span className="block truncate text-xs text-graphite">
                  {email} · {profile.role} · {profile.team}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone={active ? "positif" : "neutre"} dot>
                  {active ? "Actif" : "Désactivé"}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => resetPassword(profile.id, name)}>
                  <KeyRound size={14} aria-hidden />
                  Mot de passe
                </Button>
                <Button
                  size="sm"
                  variant={active ? "ghost" : "secondary"}
                  onClick={() =>
                    run(
                      () => updateCommercial(profile.id, { active: !active }),
                      active ? `${name} n'a plus accès à la plateforme.` : `${name} a de nouveau accès.`,
                    )
                  }
                >
                  {active ? <UserX size={14} aria-hidden /> : <UserCheck size={14} aria-hidden />}
                  {active ? "Désactiver" : "Réactiver"}
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      {message ? (
        <p role="status" className="mt-3 text-sm font-medium text-graphite">
          {message}
        </p>
      ) : null}
    </>
  );
}

export function CommerciauxScreen() {
  const { dashboard: data } = useManagerDashboard();
  if (!data) return <PageLoading />;

  const withData = data.members.filter((member) => member.sessionsCount > 0);

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Commerciaux"
        description="Niveau, régularité et priorité pédagogique de chaque commercial. Ouvrez une fiche pour le détail individuel."
      />

      <div className="space-y-5">
        {withData.length > 0 ? (
          <Panel
            title="Vue par compétence"
            description="Carte thermique commerciaux × compétences : recherchez, triez une colonne."
          >
            <SkillsHeatmap members={withData} />
          </Panel>
        ) : null}

        <Panel title="Équipe" description={`${data.repsCount} commerciaux suivis.`}>
          {data.members.length === 0 ? (
            <p className="text-sm text-graphite">
              Aucun commercial actif. Créez un premier compte ci-dessous.
            </p>
          ) : (
            <TeamMemberList members={data.members} />
          )}
        </Panel>

        <Panel
          title="Ajouter un commercial"
          description="Le compte est utilisable immédiatement avec l'adresse et le mot de passe saisis."
        >
          <AddCommercialForm />
        </Panel>

        <Panel
          title="Accès à la plateforme"
          description="Changez un mot de passe ou retirez l'accès d'un commercial. Son historique est conservé."
        >
          <AccessList />
        </Panel>
      </div>
    </>
  );
}
