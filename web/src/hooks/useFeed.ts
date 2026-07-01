import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';

const fetchFeed = async (cursor?: string, location?: {lat?: number; lng?: number}) => {
  const params: any = {};
  if (cursor) params.cursor = cursor;
  if (location && location.lat !== undefined && location.lng !== undefined) {
    params.lat = location.lat;
    params.lng = location.lng;
  }
  
  const res = await apiClient.get('api/home/feed', { params });
  const payload: any = res;
  return payload.data || payload;
};

const getLocalFeedEvents = () => {
  try {
    const raw = localStorage.getItem("happnix_created_events_v4");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((e: any) => ({
      entityType: "EVENT_CARD",
      source: "OWN_CONTENT",
      eventID: String(e.id || e.eventID),
      id: String(e.id || e.eventID),
      title: e.title || "Untitled Event",
      eventCategory: e.category || "General",
      coverImageUrl: e.coverImageUrl || e.image || "https://images.unsplash.com/photo-1540039155732-684735035727?w=800",
      startAt: e.startAt || new Date(Date.now() + 86400000).toISOString(),
      endAt: e.endAt,
      ticketType: e.ticketType || "Free",
      basePrice: e.basePrice || 0,
      currency: "₹",
      locationName: e.locationName || e.venue || "TBA",
      hostUserName: e.hostName || e.host_username || "You",
      hostFullName: e.hostName || "You",
      hostAvatar: e.hostAvatar || "",
      engagementScore: 100,
      status: e.status || "Published",
    }));
  } catch {
    return [];
  }
};

export function useFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [liveNow, setLiveNow] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat?: number; lng?: number}>({});

  const lastFetchedAt = useRef<string>(new Date().toISOString());

  // Try to grab geolocation if available
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied or unavailable", err),
        { timeout: 5000 }
      );
    }
  }, []);

  const loadFeed = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      else setIsFetchingNext(true);

      const localEvs = getLocalFeedEvents();
      let data: any = null;
      try {
        data = await fetchFeed(
          isInitial ? undefined : (nextCursor || undefined),
          userLocation
        );
      } catch (e) {
        if (isInitial && localEvs.length > 0) {
          data = { success: true, feed_items: [], live_now: [] };
        } else {
          throw e;
        }
      }
      
      if (data && data.success) {
        const apiFeed = data.feed_items || [];
        const apiLive = data.live_now || [];

        const seenIds = new Set();
        const seenTitles = new Set();
        const mergedFeed: any[] = [];
        [...localEvs, ...apiFeed].forEach((item: any) => {
          const id = item.eventID || item.postID || item.id;
          const t = (item.title || "").toLowerCase().trim();
          if (id && seenIds.has(id)) return;
          if (item.entityType === "EVENT_CARD" && t && seenTitles.has(t)) return;
          if (id) seenIds.add(id);
          if (item.entityType === "EVENT_CARD" && t) seenTitles.add(t);
          mergedFeed.push(item);
        });

        const seenLiveIds = new Set();
        const seenLiveTitles = new Set();
        const mergedLive: any[] = [];
        [...localEvs, ...apiLive].forEach((item: any) => {
          const id = item.eventID || item.id;
          const t = (item.title || "").toLowerCase().trim();
          if (id && seenLiveIds.has(id)) return;
          if (t && seenLiveTitles.has(t)) return;
          if (id) seenLiveIds.add(id);
          if (t) seenLiveTitles.add(t);
          mergedLive.push(item);
        });

        if (isInitial) {
          setFeedItems(mergedFeed);
          setLiveNow(mergedLive);
          setHasNewPosts(false);
          lastFetchedAt.current = new Date().toISOString();
          try {
            const evs = [...mergedLive, ...mergedFeed].filter((x: any) => x.entityType === "EVENT_CARD" || x.eventID);
            localStorage.setItem("happnix_cached_feed_events", JSON.stringify(evs));
          } catch {}
        } else {
          setFeedItems(prev => {
            const seen = new Set(prev.map((x: any) => x.eventID || x.postID || x.id));
            const seenT = new Set(prev.filter((x: any) => x.entityType === "EVENT_CARD").map((x: any) => (x.title || "").toLowerCase().trim()));
            const added: any[] = [];
            mergedFeed.forEach((item: any) => {
              const id = item.eventID || item.postID || item.id;
              const t = (item.title || "").toLowerCase().trim();
              if (!id || seen.has(id)) return;
              if (item.entityType === "EVENT_CARD" && t && seenT.has(t)) return;
              added.push(item);
              seen.add(id);
              if (t) seenT.add(t);
            });
            const finalMerged = [...prev, ...added];
            try {
              const evs = [...mergedLive, ...finalMerged].filter((x: any) => x.entityType === "EVENT_CARD" || x.eventID);
              localStorage.setItem("happnix_cached_feed_events", JSON.stringify(evs));
            } catch {}
            return finalMerged;
          });
        }
        setNextCursor(data.next_cursor || null);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
      setIsFetchingNext(false);
    }
  }, [nextCursor, userLocation]);

  useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  // Lightweight polling
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isLoading || isFetchingNext) return;
      
      try {
        const since = lastFetchedAt.current;
        const res = await apiClient.get('api/home/feed/check', { params: { since } });
        const payload: any = res;
        const d = payload.data || payload;
        if (d && d.success && d.has_new) {
          setHasNewPosts(true);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [isLoading, isFetchingNext]);

  const refresh = () => loadFeed(true);
  const loadMore = () => {
    if (nextCursor && !isFetchingNext) {
      loadFeed(false);
    }
  };

  return {
    feedItems,
    liveNow,
    isLoading,
    isFetchingNext,
    error,
    hasMore: !!nextCursor,
    loadMore,
    refresh,
    hasNewPosts,
  };
}
