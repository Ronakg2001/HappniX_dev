import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Check, Clock, Heart, MapPin, MessageCircle, Music2, Ticket } from 'lucide-react-native';
import { colors, fonts, gradient, LOGO_URL } from '@/constants/brand';

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.screen, style]}>
      <LinearGradient colors={['#1a1633', '#050508']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.glow, styles.glowPink]} />
      <View style={[styles.glow, styles.glowBlue]} />
      {children}
    </View>
  );
}

export function Glass({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

export function BrandHeader({
  title,
  subtitle,
  right,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" accessibilityLabel="Happnix logo" />
        <View style={{ flex: 1 }}>
          {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function GradientButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} disabled={disabled || loading} style={style}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primaryBtn, disabled && styles.disabled]}>
        {loading ? <ActivityIndicator color="#fff" /> : icon}
        {!loading ? <Text style={styles.primaryBtnText}>{label}</Text> : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({ label, onPress, icon }: { label: string; onPress?: () => void; icon?: ReactNode }) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.ghostBtn}>
      {icon}
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Avatar({ name, uri, size = 44 }: { name: string; uri?: string; size?: number }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[dimension, styles.avatarImage]} />;
  return (
    <LinearGradient colors={[colors.pink, colors.violet, colors.blue]} style={[dimension, styles.avatar]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  );
}

export function EventArt({ uri, title, height = 150 }: { uri?: string; title: string; height?: number }) {
  if (uri) return <Image source={{ uri }} style={[styles.eventArt, { height }]} resizeMode="cover" />;
  return (
    <LinearGradient colors={['rgba(255,79,216,0.45)', 'rgba(114,183,255,0.30)', 'rgba(255,179,71,0.28)']} style={[styles.eventArt, { height }]}>
      <Text style={styles.eventArtLetter}>{title.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  );
}

function formatPrice(event: any) {
  const amount = Number(event.price ?? 0);
  if (!amount) return 'Free';
  return `${event.currency || 'INR'} ${amount}`;
}

export function EventCard({ event, onPress, onBook }: { event: any; onPress?: () => void; onBook?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress}>
      <Glass style={styles.eventCard}>
        <View>
          <EventArt uri={event.imageUrl} title={event.title || 'Event'} />
          <View style={styles.floatingBadges}>
            {event.trending ? <Badge label="Trending" tone="pink" /> : null}
            <Badge label={event.category || event.eventCategory || 'Event'} />
          </View>
        </View>

        <View style={styles.eventBody}>
          <Text style={styles.eventOrganizer} numberOfLines={1}>
            By {event.organizer || event.hostUsername || 'Happnix host'} <Check size={12} color={colors.blue} />
          </Text>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title || 'Untitled event'}</Text>
          <Text style={styles.eventGenre} numberOfLines={1}>{event.musicGenre || event.eventCategory || 'Live experience'}</Text>

          <View style={styles.metaGrid}>
            <Meta icon={<Calendar size={15} color={colors.pink} />} label={event.date || event.startLabel || dateLabel(event.startAt)} />
            <Meta icon={<Clock size={15} color={colors.blue} />} label={event.time || 'Time TBA'} />
            <Meta icon={<MapPin size={15} color={colors.violet} />} label={`${event.locationName || 'Venue TBA'}${event.distance ? ` - ${event.distance}` : ''}`} wide />
          </View>

          <View style={styles.ticketStrip}>
            <Text style={styles.ticketLeft}><Ticket size={13} color={colors.danger} /> {event.ticketsLeft ?? event.maxAttendees ?? 'Limited'} spots</Text>
            {event.friendsAttending ? <Text style={styles.friendText}>{event.friendsAttending} friends attending</Text> : null}
          </View>

          <View style={styles.eventActions}>
            <GradientButton label={`Book - ${formatPrice(event)}`} onPress={onBook} style={{ flex: 1 }} />
            <GhostButton label="Interested" />
          </View>
        </View>
      </Glass>
    </TouchableOpacity>
  );
}

export function SponsoredEventCard({ event, onPress, onBook }: { event: any; onPress?: () => void; onBook?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
      <LinearGradient colors={[colors.gold, '#FCF6BA', colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sponsoredBorder}>
        <View style={styles.sponsoredInner}>
          <Badge label="Promoted" tone="gold" style={styles.promotedBadge} />
          <EventArt uri={event.imageUrl} title={event.title} height={178} />
          <View style={styles.sponsoredBody}>
            <Text style={styles.eventOrganizer}>Host: {event.organizer}</Text>
            <Text style={styles.sponsoredTitle}>{event.title}</Text>
            <Meta icon={<MapPin size={15} color={colors.gold} />} label={event.locationName} />
            <View style={styles.eventActions}>
              <View>
                <Text style={styles.smallMuted}>Tickets start at</Text>
                <Text style={styles.goldPrice}>{formatPrice(event)}</Text>
              </View>
              <GradientButton label="Get Tickets" onPress={onBook} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function PostCard({ post }: { post: any }) {
  return (
    <Glass style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar name={post.user.name} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postName}>{post.user.name} {post.user.verified ? '✓' : ''}</Text>
          <Text style={styles.postMeta}>@{post.user.username} - {post.timestamp}</Text>
        </View>
      </View>
      <Text style={styles.postText}>{post.content}</Text>
      <View style={styles.hashRow}>
        {post.hashtags?.map((tag: string) => <Text key={tag} style={styles.hash}>#{tag}</Text>)}
      </View>
      <View style={styles.tagRow}>
        <Badge label={post.musicTag} icon={<Music2 size={12} color={colors.pink} />} />
        <Badge label={post.moodTag} />
      </View>
      {post.location ? <Meta icon={<MapPin size={14} color={colors.pink} />} label={post.location} /> : null}
      <View style={styles.postActions}>
        <Text style={styles.actionText}><Heart size={15} color={colors.pink} /> {post.likes}</Text>
        <Text style={styles.actionText}><MessageCircle size={15} color={colors.blue} /> {post.comments}</Text>
      </View>
    </Glass>
  );
}

export function PersonCard({ person, actionLabel = 'Follow' }: { person: any; actionLabel?: string }) {
  return (
    <Glass style={styles.personCard}>
      <Avatar name={person.name || person.username || 'User'} uri={person.profile_picture_url} />
      <View style={{ flex: 1 }}>
        <Text style={styles.postName} numberOfLines={1}>{person.name || person.full_name || person.username}</Text>
        <Text style={styles.postMeta} numberOfLines={1}>@{person.username} - {person.mutuals ?? 0} mutuals</Text>
      </View>
      <GhostButton label={actionLabel} />
    </Glass>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <Glass style={styles.empty}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </Glass>
  );
}

function Meta({ icon, label, wide }: { icon: ReactNode; label?: string; wide?: boolean }) {
  return (
    <View style={[styles.metaItem, wide && styles.metaWide]}>
      {icon}
      <Text style={styles.metaText} numberOfLines={1}>{label || 'TBA'}</Text>
    </View>
  );
}

function Badge({ label, icon, tone, style }: { label?: string; icon?: ReactNode; tone?: 'pink' | 'gold'; style?: StyleProp<ViewStyle> }) {
  if (!label) return null;
  return (
    <View style={[styles.badge, tone === 'pink' && styles.badgePink, tone === 'gold' && styles.badgeGold, style]}>
      {icon}
      <Text style={[styles.badgeText, tone === 'gold' && styles.badgeGoldText]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function dateLabel(value?: string) {
  if (!value) return 'Date TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, opacity: 0.17 },
  glowPink: { top: -90, left: -90, backgroundColor: colors.pink },
  glowBlue: { bottom: 80, right: -130, backgroundColor: colors.blue },
  glass: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 96, height: 34 },
  headerTitle: { fontFamily: fonts.black, fontSize: 23, color: colors.text },
  headerSubtitle: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginTop: 2 },
  primaryBtn: { minHeight: 46, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  disabled: { opacity: 0.45 },
  primaryBtnText: { fontFamily: fonts.black, fontSize: 13, color: '#fff' },
  ghostBtn: {
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  ghostBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.text },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: 'rgba(255,79,216,0.18)', borderColor: colors.pink },
  chipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted },
  chipTextActive: { color: colors.text },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarImage: { backgroundColor: colors.panelStrong },
  avatarText: { fontFamily: fonts.black, color: '#fff' },
  eventCard: { marginBottom: 16 },
  eventArt: { width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelStrong },
  eventArtLetter: { fontFamily: fonts.black, color: 'rgba(255,255,255,0.36)', fontSize: 56 },
  floatingBadges: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  badgePink: { backgroundColor: colors.pink },
  badgeGold: { backgroundColor: colors.gold, borderColor: '#FCF6BA' },
  badgeText: { fontFamily: fonts.black, fontSize: 10, color: colors.text, textTransform: 'uppercase' },
  badgeGoldText: { color: '#111' },
  eventBody: { padding: 15 },
  eventOrganizer: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginBottom: 5 },
  eventTitle: { fontFamily: fonts.black, fontSize: 20, color: colors.text, lineHeight: 24 },
  eventGenre: { fontFamily: fonts.bold, fontSize: 12, color: colors.blue, marginTop: 5 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  metaItem: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaWide: { width: '100%' },
  metaText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.74)' },
  ticketStrip: { marginTop: 14, padding: 12, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)' },
  ticketLeft: { fontFamily: fonts.black, color: colors.danger, fontSize: 12 },
  friendText: { fontFamily: fonts.bold, color: colors.muted, fontSize: 12 },
  eventActions: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sponsoredBorder: { borderRadius: 20, padding: 2, marginBottom: 16 },
  sponsoredInner: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#050508' },
  promotedBadge: { position: 'absolute', top: 12, right: 12, zIndex: 2 },
  sponsoredBody: { padding: 16 },
  sponsoredTitle: { fontFamily: fonts.black, fontSize: 22, color: colors.text, marginBottom: 12 },
  smallMuted: { fontFamily: fonts.bold, color: colors.faint, fontSize: 10, textTransform: 'uppercase' },
  goldPrice: { fontFamily: fonts.black, color: colors.gold, fontSize: 18 },
  postCard: { padding: 15, marginBottom: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  postName: { fontFamily: fonts.black, color: colors.text, fontSize: 14 },
  postMeta: { fontFamily: fonts.semibold, color: colors.faint, fontSize: 12, marginTop: 2 },
  postText: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 21 },
  hashRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  hash: { fontFamily: fonts.bold, color: colors.violet, fontSize: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  postActions: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)', marginTop: 13, paddingTop: 13, flexDirection: 'row', gap: 22 },
  actionText: { fontFamily: fonts.black, color: colors.muted, fontSize: 13 },
  personCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 26, gap: 8 },
  emptyTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 18, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.regular, color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
