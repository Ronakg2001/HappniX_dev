import React from 'react';
import Image from 'next/image';
import { fixAvatarUrl } from '@/lib/api';

interface LiveEvent {
  eventID: string;
  title: string;
  coverImageUrl: string;
  hostUserID: string;
}

interface LiveNowCarouselProps {
  events: LiveEvent[];
  onEventClick: (eventId: string) => void;
}

export function LiveNowCarousel({ events, onEventClick }: LiveNowCarouselProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="w-full mb-6 py-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <h3 className="text-sm font-bold text-white tracking-wide">LIVE NOW</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
        {events.map((event) => (
          <div 
            key={event.eventID}
            onClick={() => onEventClick(event.eventID)}
            className="flex-none w-32 h-44 sm:w-40 sm:h-56 rounded-xl relative overflow-hidden cursor-pointer snap-start group border border-white/10 transition-all hover:border-brand-primary"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src={fixAvatarUrl(event.coverImageUrl) || '/default-event.png'} 
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            </div>
            
            {/* Live Badge */}
            <div className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
              Live
            </div>
            
            {/* Content */}
            <div className="absolute bottom-2 left-2 right-2">
              <h4 className="text-white text-xs sm:text-sm font-bold line-clamp-2 leading-tight drop-shadow-md">
                {event.title}
              </h4>
            </div>
            
            {/* Glow border effect */}
            <div className="absolute inset-0 border-2 border-brand-primary/0 rounded-xl transition-all duration-300 group-hover:border-brand-primary/50 pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
