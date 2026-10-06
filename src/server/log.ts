import "server-only";

/**
 * Journal d'intégration : une ligne JSON par événement, avec une liste fermée de
 * champs. Jamais de corps de réponse, de message d'erreur brut, de clé ni de
 * contenu de conversation : un message d'erreur fournisseur peut contenir un
 * fragment de clé ou de prompt.
 */
export interface IntegrationLog {
  /** Étape concernée, par exemple « tavus.create » ou « openai.analyze ». */
  step: string;
  /** Ce qui s'est passé, en une expression courte. */
  event: string;
  httpStatus?: number | null;
  code?: string | null;
  errorName?: string | null;
  userId?: string | null;
  conversationId?: string | null;
}

export function logIntegration(entry: IntegrationLog): void {
  const line = JSON.stringify({ at: new Date().toISOString(), ...entry });
  if (entry.httpStatus && entry.httpStatus < 400) console.info(`[intégration] ${line}`);
  else console.error(`[intégration] ${line}`);
}

/** Extrait uniquement des champs sûrs d'une erreur quelconque (SDK OpenAI, fetch…). */
export function safeErrorFields(error: unknown): {
  httpStatus: number | null;
  code: string | null;
  errorName: string | null;
} {
  const e = (error ?? {}) as { status?: unknown; code?: unknown; type?: unknown; name?: unknown };
  return {
    httpStatus: typeof e.status === "number" ? e.status : null,
    code: typeof e.code === "string" ? e.code : typeof e.type === "string" ? e.type : null,
    errorName: typeof e.name === "string" ? e.name : null,
  };
}
