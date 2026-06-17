import { ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import { type User } from "@/types/user";
import { Button } from "@/components/ui/button";

interface UserCardProps {
  user: Pick<User, "id" | "name" | "username" | "avatar" | "bio" | "verified" | "followers" | "mutuals">;
  isFollowing: boolean;
  onFollow: (id: string) => void;
  onNavigate: (username: string) => void;
}

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

export function UserCard({ user, isFollowing, onFollow, onNavigate }: UserCardProps) {
  return (
    <div
      role="article"
      aria-label={`${user.name} profile`}
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 group cursor-pointer"
      onClick={() => onNavigate(user.username)}
    >
      <div className="h-11 w-11 rounded-full bg-brand-gradient flex items-center justify-center font-black text-sm text-white shrink-0 border border-white/10 shadow-glow overflow-hidden">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          user.name[0].toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <h3 className="text-xs font-black text-white group-hover:text-[var(--brand-3)] transition-colors truncate">
            {user.name}
          </h3>
          {user.verified && (
            <ShieldCheck className="h-3 w-3 text-cyan-400 shrink-0" aria-label="Verified" />
          )}
        </div>
        <p className="text-[10px] text-white/40 mb-1 truncate">
          @{user.username}
          {user.mutuals > 0 && (
            <span className="text-[var(--brand-2)]"> · {user.mutuals} mutuals</span>
          )}
        </p>
        {user.bio && (
          <p className="text-[10px] text-white/55 line-clamp-1 leading-snug">{user.bio}</p>
        )}
        <p className="text-[9px] font-bold text-white/30 mt-1 uppercase tracking-wider">
          {formatFollowers(user.followers)} followers
        </p>
      </div>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          onFollow(user.id);
        }}
        aria-label={isFollowing ? `Unfollow ${user.name}` : `Follow ${user.name}`}
        aria-pressed={isFollowing}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-2)] ${
          isFollowing
            ? "bg-white/[0.06] border border-white/10 text-white/70 hover:bg-white/[0.10]"
            : "bg-brand-gradient text-white shadow-glow hover:scale-[1.04] active:scale-[0.97]"
        }`}
      >
        {isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
