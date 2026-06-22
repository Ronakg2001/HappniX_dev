import { useState, useEffect, useCallback } from 'react';

// Replace with actual API utility
const fetchFeed = async (cursor?: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `/api/home/feed${cursor ? `?cursor=${cursor}` : ''}`;
  
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
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // New posts polling state
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const loadFeed = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      else setIsFetchingNext(true);

      const data = await fetchFeed(isInitial ? undefined : (nextCursor || undefined));
      
      if (data.success) {
        if (isInitial) {
          setFeedItems(data.feed_items || []);
          setLiveNow(data.live_now || []);
          setHasNewPosts(false);
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
  }, [nextCursor]);

  useEffect(() => {
    loadFeed(true);
  }, []);

  // Simple polling for new posts (V1)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Don't poll if we are actively loading
      if (isLoading || isFetchingNext) return;
      
      try {
        // Fetch the very latest without a cursor
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`/api/home/feed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.feed_items?.length > 0 && feedItems.length > 0) {
          // Compare the top item
          const topNewId = data.feed_items[0].postID || data.feed_items[0].eventID;
          const topCurrentId = feedItems[0].postID || feedItems[0].eventID;
          
          if (topNewId !== topCurrentId) {
            setHasNewPosts(true);
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(pollInterval);
  }, [feedItems, isLoading, isFetchingNext]);

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
