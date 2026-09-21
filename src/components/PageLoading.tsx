/** Message d'attente pendant la première lecture des données du serveur. */
export function PageLoading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div role="status" className="py-16 text-center text-sm text-graphite">
      {label}
    </div>
  );
}
