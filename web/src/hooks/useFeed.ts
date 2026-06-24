import { useState, useEffect, useCallback, useRef } from 'react';

// Replace with actual API utility
const fetchFeed = async (cursor?: string, location?: {lat: number, lng: number}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  let url = `/api/home/feed?`;
  if (cursor) url += `cursor=${encodeURIComponent(cursor)}&`;
  if (location) url += `lat=${location.lat}&lng=${location.lng}&`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch feed');
  }
  
  return res.json();
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
  // Track when we last loaded the feed for lightweight polling
  const lastFetchedAt = useRef<string>(new Date().toISOString());

  const loadFeed = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      else setIsFetchingNext(true);

      const data = await fetchFeed(
        isInitial ? undefined : (nextCursor || undefined),
        userLocation
      );
      
      if (data.success) {
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
    // Try to get user location once
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied or unavailable", err),
        { timeout: 5000 }
      );
    }
    loadFeed(true);
  }, []);

  // Lightweight polling — uses /feed/check instead of rebuilding the full feed
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Don't poll if we are actively loading
      if (isLoading || isFetchingNext) return;
      
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const since = encodeURIComponent(lastFetchedAt.current);
        const res = await fetch(`/api/home/feed/check?since=${since}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.has_new) {
          setHasNewPosts(true);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 30000); // Check every 30 seconds
    
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
