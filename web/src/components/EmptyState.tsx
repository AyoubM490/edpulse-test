interface EmptyStateProps {
  onReset: () => void;
}

/** Affiché quand aucun produit ne correspond aux filtres actifs. */
export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">
        Aucun produit ne correspond à ces filtres.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
