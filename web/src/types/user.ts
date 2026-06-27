export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string;
  verified: boolean;
  followers: number;
  following?: number;
  mutuals: number;
  isFollowing: boolean;
  tags: string[];
}