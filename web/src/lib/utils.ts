import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;

  const baseUrl = process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUBID || "https://pub-09453339054e4d8894deb9f536888434.r2.dev";
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Handle case where baseUrl is strictly "undefined" as a string
  if (baseUrl === "undefined") {
    return `https://pub-09453339054e4d8894deb9f536888434.r2.dev/${cleanPath}`;
  }
  return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
}

const staticPubId = process.env.NEXT_PUBLIC_R2_STATIC_MEDIA_BUCKET_PUBID || "https://pub-4c14689c2e3349dd83f26b79045c7c84.r2.dev";
export const STATIC_MEDIA_URL = staticPubId === "undefined" ? "https://pub-4c14689c2e3349dd83f26b79045c7c84.r2.dev" : staticPubId;
