import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';

const fetchFeed = async (cursor?: string, location?: {lat: number, lng: number}) => {
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

export function useFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [liveNow, setLiveNow] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // New posts polling state
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const lastFetchedAt = useRef<string>(new Date().toISOString());

  // Determine user location from localStorage (locationStore) or GPS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let foundLocation = false;
    try {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setUserLocation({ lat: parsed.latitude, lng: parsed.longitude });
          foundLocation = true;
        }
      }
    } catch {
      // ignore parse error
    }

    if (!foundLocation && navigator.geolocation) {
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

      const data = await fetchFeed(
        isInitial ? undefined : (nextCursor || undefined),
        userLocation
      );
      
      if (data && data.success) {
        if (isInitial) {
          setFeedItems(data.feed_items || []);
          setLiveNow(data.live_now || []);
          setHasNewPosts(false);
          lastFetchedAt.current = new Date().toISOString();
        } else {
          setFeedItems(prev => [...prev, ...(data.feed_items || [])]);
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
