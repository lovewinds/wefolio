interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-800">
      <div className="text-center">
        <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        {description && (
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">{description}</p>
        )}
      </div>
    </div>
  );
}
