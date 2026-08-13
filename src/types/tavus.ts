/**
 * Types de l'intégration Tavus. Le corps de requête suit exactement le
 * contrat défini pour cette phase ; `TAVUS_API_KEY` ne transite jamais par
 * ces types côté client, seule la route serveur y a accès.
 */

export type TavusPolicy = "eu";

/**
 * Propriétés de conversation Tavus.
 *
 * `language` est volontairement figé à `"french"` : `"multilingual"` laisserait
 * Julie basculer en anglais au moindre mot ambigu. Ce réglage garantit la
 * langue, pas le timbre ni l'accent de la voix (voir `src/lib/tavus/voice.ts`).
 */
export interface TavusConversationProperties {
  language: "french";
  /** Durée maximale de l'appel, en secondes. Coupe la facturation Tavus. */
  max_call_duration: number;
  /** Délai avant clôture après le départ du commercial, en secondes. */
  participant_left_timeout: number;
  /** Délai avant clôture si personne ne rejoint jamais, en secondes. */
  participant_absent_timeout: number;
}

/** Corps envoyé côté serveur à `POST https://tavusapi.com/v2/conversations`. */
export interface TavusConversationRequestBody {
  face_id: string;
  pal_id: string;
  conversation_name: string;
  custom_greeting: string;
  /** Cadre de la simulation, transmis à Julie. Ne contient aucune donnée privée. */
  conversational_context: string;
  policy: TavusPolicy;
  require_auth: boolean;
  max_participants: number;
  properties: TavusConversationProperties;
}

/** Réponse brute attendue de l'API Tavus lors de la création d'une conversation. */
export interface TavusConversationApiResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Ce que notre route renvoie au navigateur : uniquement les trois champs
 * nécessaires à l'affichage, jamais la clé Tavus ni la réponse brute.
 */
export interface TavusConversationClientResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

/**
 * Codes applicatifs permettant au frontend de distinguer certaines erreurs
 * sans jamais recevoir le détail brut renvoyé par Tavus.
 */
export type TavusErrorCode =
  | "TAVUS_CREDITS_EXHAUSTED"
  | "TAVUS_UNAUTHORIZED"
  | "TAVUS_CONFIGURATION_ERROR"
  | "TAVUS_CONVERSATION_CREATION_FAILED";

/** Réponse d'erreur générique renvoyée par nos routes serveur. */
export interface TavusApiErrorResponse {
  error: string;
  /** Absent pour les erreurs génériques : seuls certains cas identifiés en ont un. */
  code?: TavusErrorCode;
}
