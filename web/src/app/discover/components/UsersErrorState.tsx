import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsersErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function UsersErrorState({ error, onRetry }: UsersErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center min-h-[35vh]"
      role="alert"
    >
      <AlertCircle className="h-10 w-10 text-red-400/60 mb-3" />
      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
        Search failed
      </h3>
      <p className="text-[11px] text-white/40 max-w-xs leading-relaxed mb-4">
        {error}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 border-white/15 text-white/70 hover:text-white hover:bg-white/[0.08] text-xs"
        aria-label="Retry search"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}
