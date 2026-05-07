import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { MapPin, Image as ImageIcon, Sparkles, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface EventPreviewProps {
  title: string;
  bio: string;
  highlights: string;
  age: string;
  location: string;
  date: string;
  time: string;
  endTime: string;
  eventCategory: string;
  ticketType: string;
  price: string;
  maxAttendees: string;
  eventCoverImages: string[];
  services: string[];
  tags: string[];
  dressCode: string;
  promoCode: string;
  collaborators: string;
}

export default function EventPreviewCard(props: EventPreviewProps) {
  return (
    <View style={styles.container}>
      {/* Header Image Area */}
      <View style={styles.imageContainer}>
        {props.eventCoverImages.length > 0 ? (
          <Image source={{ uri: props.eventCoverImages[0] }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['rgba(112, 26, 117, 0.4)', 'rgba(22, 78, 99, 0.4)']} style={styles.imagePlaceholder}>
            <ImageIcon color="rgba(255,255,255,0.2)" size={48} />
          </LinearGradient>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{props.eventCategory || 'Category'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Title & Timing Row */}
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.title}>{props.title || 'Event Title Here'}</Text>
            <View style={styles.venueRow}>
              <MapPin color="#9ca3af" size={12} />
              <Text style={styles.venueText} numberOfLines={1}>{props.location || 'Venue Name'}</Text>
            </View>
          </View>

          <View style={styles.timeBlock}>
            <Text style={styles.dateText}>{props.date || 'Oct 24'}</Text>
            <Text style={styles.timeText}>{props.time || '10:00 PM'}</Text>
          </View>
        </View>

        {/* Highlights */}
        {!!props.highlights && (
          <View style={styles.highlightsWrap}>
            <View style={styles.highlightsHeader}>
              <Sparkles color="#d946ef" size={12} />
              <Text style={styles.highlightsTitle}>Event Highlights</Text>
            </View>
            <Text style={styles.highlightsText}>{props.highlights}</Text>
          </View>
        )}

        {/* Bio */}
        <Text style={styles.bioText} numberOfLines={3}>
          {props.bio || 'This is where the event bio will appear. It tells people what the vibe is all about.'}
        </Text>

        {/* Tags & Services wrapper */}
        <View style={styles.pillsWrap}>
          {props.tags.map((t, i) => (
            <View key={`tag-${i}`} style={styles.tagPill}>
              <Text style={styles.tagPillText}>#{t}</Text>
            </View>
          ))}
          {props.services.map((s, i) => (
            <View key={`svc-${i}`} style={styles.servicePill}>
              <Check color="#22d3ee" size={10} style={{ marginRight: 2 }} />
              <Text style={styles.servicePillText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.badgeCyan]}>
            <Text style={styles.badgeCyanText}>
              {props.ticketType === 'Free' ? 'Free Event' : `Paid: ₹${props.price || 0}`}
            </Text>
          </View>
          <View style={[styles.badge, styles.badgeFuchsia]}>
            <Text style={styles.badgeFuchsiaText}>{props.age || 'All Ages'}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {!!props.dressCode && (
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>DRESS CODE</Text>
              <Text style={styles.infoValue}>{props.dressCode}</Text>
            </View>
          )}
          {!!props.maxAttendees && props.maxAttendees !== '0' && (
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CAPACITY</Text>
              <Text style={styles.infoValue}>{props.maxAttendees}</Text>
            </View>
          )}
          {!!props.collaborators && (
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>COLLABS</Text>
              <Text style={styles.infoValue}>{props.collaborators}</Text>
            </View>
          )}
          {!!props.promoCode && (
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PROMO</Text>
              <Text style={styles.promoValue}>{props.promoCode}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  imageContainer: {
    height: 192,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryBadgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#22d3ee',
    textTransform: 'uppercase',
  },
  content: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 22,
    color: '#fff',
    lineHeight: 28,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  venueText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
  timeBlock: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#d946ef',
  },
  timeText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    color: '#9ca3af',
  },
  highlightsWrap: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.2)',
    borderRadius: 12,
  },
  highlightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  highlightsTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    color: '#d946ef',
    textTransform: 'uppercase',
  },
  highlightsText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#e2e8f0',
  },
  bioText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 12,
    lineHeight: 18,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagPill: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagPillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#22d3ee',
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  servicePillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#e2e8f0',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeCyan: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  badgeCyanText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#22d3ee',
  },
  badgeFuchsia: {
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderColor: 'rgba(217, 70, 239, 0.2)',
  },
  badgeFuchsiaText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#d946ef',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoCol: {
    minWidth: '45%',
  },
  infoLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  promoValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: '#d946ef',
    textTransform: 'uppercase',
  },
});
