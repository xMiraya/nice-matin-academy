/**
 * Correspondance entre un nom affiché et la photographie du profil.
 *
 * Certains écrans ne manipulent qu'un nom, sans le profil complet : une ligne
 * d'historique, un commentaire signé. Cette table leur donne accès à la même
 * photographie que partout ailleurs, sans les forcer à charger l'objet entier.
 */
const PHOTOS_BY_NAME: Record<string, string> = {
  "alexandre jego": "/images/equipe/alexandre-jego.jpg",
  "sofia benali": "/images/equipe/sofia-benali.jpg",
  "thomas rivière": "/images/equipe/thomas-riviere.jpg",
  "claire fabre": "/images/equipe/claire-fabre.jpg",
  "karim oualid": "/images/equipe/karim-oualid.jpg",
  "élodie marchand": "/images/equipe/elodie-marchand.jpg",
};

/** Photographie associée à un nom complet, si elle existe. */
export function photoForName(name: string): string | undefined {
  return PHOTOS_BY_NAME[name.trim().toLowerCase()];
}
