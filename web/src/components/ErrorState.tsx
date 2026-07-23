interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Affiché quand la requête échoue : message + action de reprise. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-rose-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
      >
        Réessayer
      </button>
    </div>
  );
}
