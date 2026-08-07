/**
 * Types de l'intégration Tavus. Le corps de requête suit exactement le
 * contrat défini pour cette phase ; `TAVUS_API_KEY` ne transite jamais par
 * ces types côté client, seule la route serveur y a accès.
 */

export type TavusPolicy = "eu";

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
