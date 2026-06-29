import React from 'react';
import { SocialPostCard, EventCard } from '@/components/feed/FeedCards';
import { fixAvatarUrl } from '@/lib/api';

interface FeedItemProps {
  item: any;
  onProfileClick: (username: string) => void;
  onEventClick: (eventId: string) => void;
  onBookNow: (title: string, price: string, e?: React.MouseEvent) => void;
}

/**
 * Safely parse a JSON string or return the value as-is if it's already parsed.
 */
function safeParseMedia(raw: any): string[] {
  if (!raw) return [];
  let parsedList: any[] = [];
  if (Array.isArray(raw)) {
    parsedList = raw;
  } else {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsedList = parsed;
    } catch {
      return [];
    }
  }
  return parsedList.map(img => fixAvatarUrl(img) || '').filter(Boolean);
}

/**
 * Format a createdAt timestamp into a human-readable relative time string.
 */
function formatTimeAgo(createdAt: string | undefined): string {
  if (!createdAt) return 'Just now';
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString();
  } catch {
    return 'Just now';
  }
}

export function FeedItem({ item, onProfileClick, onEventClick, onBookNow }: FeedItemProps) {
  // Determine if it's a post or an event
  const isPost = item.entityType === 'FEED_POST';
  
  if (isPost) {
    // Map backend post format to frontend SocialPostCard format
    // Now uses real author data from the users JOIN
    const postData = {
      id: item.postID,
      user: {
        username: item.userName || item.authorUserID || 'user',
        name: item.fullName || 'User',
        avatar: fixAvatarUrl(item.profilePictureUrl || item.avatar) || '/default-avatar.png',
        verified: item.verified || false,
      },
      timestamp: formatTimeAgo(item.createdAt),
      privacy: (item.visibility === 'Private' ? 'friends' : 'public') as 'public' | 'friends',
      content: item.caption || '',
      hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
      mentions: Array.isArray(item.mentions) ? item.mentions : [],
      images: safeParseMedia(item.mediaItems),
      likes: item.likesCount || 0,
      comments: item.commentsCount || 0,
      liked: false,
      saved: false,
    };
    
    return (
      <div onClick={() => onProfileClick(postData.user.username)} className="cursor-pointer mb-6">
        <SocialPostCard post={postData} />
      </div>
    );
  } else {
    // It's an event — now uses real host data from the users JOIN
    const eventData = {
      id: item.eventID,
      organizer: item.hostName || item.hostUserName || 'Host',
      verifiedOrganizer: item.hostVerified || false,
      banner: fixAvatarUrl(item.coverImageUrl || item.image || item.bannerUrl) || '/default-event.png',
      title: item.title,
      category: item.eventCategory || 'General',
      musicGenre: item.musicGenre || 'Any',
      ageRestricted: item.ageRestricted || false,
      date: item.startAt ? new Date(item.startAt).toLocaleDateString() : 'TBD',
      time: item.startAt ? new Date(item.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD',
      venue: item.locationName || 'Online',
      distance: 'Nearby', // TODO: compute from lat/lng via Haversine when live location is available
      ticketsLeft: item.maxAttendees || 100,
      trending: (item.engagementScore || 0) > 50,
      price: item.ticketType === 'Free' ? 'Free' : `₹${item.basePrice || 0}`,
    };
    
    return (
      <div onClick={() => onEventClick(eventData.id)} className="cursor-pointer mb-6">
        <EventCard 
          event={eventData} 
          onBookNow={(e) => onBookNow(eventData.title, eventData.price, e)} 
        />
      </div>
    );
  }
}
