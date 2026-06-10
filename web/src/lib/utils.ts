import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;

  const baseUrl = process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUBID || "";
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (!baseUrl || baseUrl === "undefined") {
    return `/${cleanPath}`;
  }
  return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
}

const staticPubId = process.env.NEXT_PUBLIC_R2_STATIC_MEDIA_BUCKET_PUBID || "";
export const STATIC_MEDIA_URL = (!staticPubId || staticPubId === "undefined") ? "" : staticPubId;
