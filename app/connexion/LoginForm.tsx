"use client";

import { useState } from "react";

const FIELD =
  "w-full rounded-sm border border-line bg-mist/60 px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-brand-accent focus:bg-white";

/** Formulaire de connexion : la session est ouverte côté serveur (cookie httpOnly). */
export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string; redirect?: string };
      if (!response.ok || !json.redirect) {
        setError(json.error ?? "Connexion impossible.");
        setPending(false);
        return;
      }
      // Navigation complète : le serveur relit la session pour rendre l'espace.
      window.location.href = json.redirect;
    } catch {
      setError("Le serveur est injoignable. Vérifiez votre connexion puis réessayez.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Adresse électronique
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="prenom.nom@nicematin.fr"
          className={FIELD}
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
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={FIELD}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-accent disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
