import React from 'react';
import { SocialPostCard, EventCard } from '@/components/feed/FeedCards';

interface FeedItemProps {
  item: any;
  onProfileClick: (username: string) => void;
  onEventClick: (eventId: string) => void;
  onBookNow: (title: string, price: string, e?: React.MouseEvent) => void;
}

export function FeedItem({ item, onProfileClick, onEventClick, onBookNow }: FeedItemProps) {
  // Determine if it's a post or an event
  const isPost = item.entityType === 'FEED_POST';
  
  if (isPost) {
    // Map backend post format to frontend SocialPostCard format
    // Adjust mapping as needed based on actual backend data
    const postMock = {
      id: item.postID,
      user: {
        username: item.authorUserID || 'user',
        name: 'User',
        avatar: '/default-avatar.png',
        verified: false,
      },
      timestamp: 'Just now', // Could parse from createdAt
      privacy: 'public' as 'public' | 'friends',
      content: item.caption || '',
      hashtags: [],
      mentions: [],
      images: item.mediaItems ? JSON.parse(item.mediaItems) : [],
      likes: item.likesCount || 0,
      comments: item.commentsCount || 0,
      liked: false,
      saved: false,
    };
    
    return (
      <div onClick={() => onProfileClick(postMock.user.username)} className="cursor-pointer mb-6">
        <SocialPostCard post={postMock} />
      </div>
    );
  } else {
    // It's an event
    const eventMock = {
      id: item.eventID,
      organizer: 'Host',
      verifiedOrganizer: false,
      banner: item.coverImageUrl || '/default-event.png',
      title: item.title,
      category: item.eventCategory || 'General',
      musicGenre: 'Any',
      ageRestricted: false,
      date: item.startAt ? new Date(item.startAt).toLocaleDateString() : 'TBD',
      time: item.startAt ? new Date(item.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD',
      venue: item.locationName || 'Online',
      distance: 'Nearby',
      ticketsLeft: item.maxAttendees || 100,
      trending: false,
      price: item.ticketType === 'Free' ? 'Free' : `₹${item.basePrice}`,
    };
    
    return (
      <div onClick={() => onEventClick(eventMock.id)} className="cursor-pointer mb-6">
        <EventCard 
          event={eventMock} 
          onBookNow={(e) => onBookNow(eventMock.title, eventMock.price, e)} 
        />
        {item.source === 'RECOMMENDATION' && (
          <div className="text-xs text-brand-secondary px-4 mt-1">
            ✨ Recommended for you
          </div>
        )}
      </div>
    );
  }
}
