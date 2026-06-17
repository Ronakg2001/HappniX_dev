import { Users } from "lucide-react";

interface UsersEmptyStateProps {
  query: string;
}

export function UsersEmptyState({ query }: UsersEmptyStateProps) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[35vh]"
      role="status"
      aria-live="polite"
    >
      <Users className="h-10 w-10 text-white/20 mb-3" />
      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
        No users found
      </h3>
      <p className="text-[11px] text-white/40 max-w-xs leading-relaxed">
        We couldn&apos;t find anyone matching &ldquo;{query}&rdquo;. Try a
        different name, username, or keyword.
      </p>
    </div>
  );
}
