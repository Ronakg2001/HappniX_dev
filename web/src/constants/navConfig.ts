import { 
  Home, 
  Compass, 
  Calendar, 
  MessageSquare, 
  User,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: any;
  badgeKey?: string;
  section: "primary" | "secondary";
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    path: "/home",
    icon: Home,
    section: "primary"
  },
  {
    label: "Discover",
    path: "/discover",
    icon: Compass,
    section: "primary"
  },
  {
    label: "My Events",
    path: "/my-events",
    icon: Calendar,
    section: "primary"
  },
  {
    label: "Messages",
    path: "/messages",
    icon: MessageSquare,
    badgeKey: "messagesCount",
    section: "primary"
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
    section: "primary"
  },
];
