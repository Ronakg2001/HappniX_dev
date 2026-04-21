import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions, Linking, Alert, Modal, TextInput,
  ActivityIndicator, Share, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Ticket,
  Share2, Heart, BadgeCheck, ChevronLeft, ChevronRight,
} from 'lucide-react-native';
import { ticketApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const params = useLocalSearchParams();

  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [passType, setPassType] = useState('General');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const event = {
    id: params.id as string,
    title: params.title as string || 'Event',
    description: params.description as string || '',
    hostUsername: params.hostUsername as string || 'Host',
    locationName: params.locationName as string || 'Location TBD',
    latitude: params.latitude as string || '0',
    longitude: params.longitude as string || '0',
    startAt: params.startAt as string || '',
    endAt: params.endAt as string || '',
    startLabel: params.startLabel as string || '',
    price: params.price as string || '0',
    currency: params.currency as string || 'INR',
    imageUrl: params.imageUrl as string || '',
    eventCategory: params.eventCategory as string || 'Event',
    maxAttendees: params.maxAttendees as string || '0',
    ticketsSold: params.ticketsSold as string || '0',
    canBook: params.canBook === 'true',
    mapUrl: params.mapUrl as string || '',
    ticketType: params.ticketType as string || 'Free',
    ticketTiers: params.ticketTiers ? JSON.parse(params.ticketTiers as string) : [],
    mediaUrls: params.mediaUrls ? JSON.parse(params.mediaUrls as string) : [],
  };

  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    if (!event.startAt) return;
    const targetDate = new Date(event.startAt).getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null); // Event started or past
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [event.startAt]);

  // Build media list: combine mediaUrls + imageUrl fallback
  const mediaList: string[] = event.mediaUrls.length > 0
    ? event.mediaUrls
    : event.imageUrl ? [event.imageUrl] : [];

  const isFree = parseFloat(event.price) === 0;
  const formattedDate = event.startAt
    ? new Date(event.startAt).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : event.startLabel || 'Date TBD';
  const formattedTime = event.startAt
    ? new Date(event.startAt).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  const openMap = () => {
    const url = event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
    Linking.openURL(url);
  };

  // #22: Native share
  const handleShare = async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Check out "${event.title}" on Happnix!\n📍 ${event.locationName}\n📅 ${formattedDate}\n💰 ${isFree ? 'Free' : `${event.currency} ${event.price}`}`,
      });
    } catch (e) {}
  };

  // #19: Tiered ticket selection
  const hasTicketTiers = event.ticketTiers && event.ticketTiers.length > 0;

  const handleBookTicket = async () => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return Alert.alert('Invalid Quantity', 'Please enter a valid ticket quantity.');
    }
    setBookingLoading(true);
    try {
      await ticketApi.book(event.id, passType, qty);
      Alert.alert('Success', 'Ticket booked successfully!');
      setBookModalVisible(false);
    } catch (error: any) {
      Alert.alert('Booking Error', error.response?.data?.error || 'Failed to book ticket.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.orb, styles.orbViolet]} />
          <View style={[styles.orb, styles.orbCyan]} />
        </View>

        {/* Floating Header */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setLiked(!liked)}>
              <Heart color={liked ? '#ff4fd8' : '#fff'} fill={liked ? '#ff4fd8' : 'none'} size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
              <Share2 color="#fff" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* #23: Media Gallery */}
          <View style={styles.coverContainer}>
            {mediaList.length > 0 ? (
              <>
                <Image source={{ uri: mediaList[currentMediaIndex] }} style={styles.coverImage} />
                {mediaList.length > 1 && (
                  <View style={styles.mediaNav}>
                    <TouchableOpacity
                      style={styles.mediaNavBtn}
                      onPress={() => setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))}
                      disabled={currentMediaIndex === 0}
                    >
                      <ChevronLeft color="#fff" size={20} />
                    </TouchableOpacity>
                    <Text style={styles.mediaCounter}>{currentMediaIndex + 1}/{mediaList.length}</Text>
                    <TouchableOpacity
                      style={styles.mediaNavBtn}
                      onPress={() => setCurrentMediaIndex(Math.min(mediaList.length - 1, currentMediaIndex + 1))}
                      disabled={currentMediaIndex === mediaList.length - 1}
                    >
                      <ChevronRight color="#fff" size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <LinearGradient colors={['#7c3aed', '#c026d3', '#22d3ee']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coverPlaceholder}>
                <Text style={styles.coverPlaceholderText}>{event.title.charAt(0)}</Text>
              </LinearGradient>
            )}
            <LinearGradient colors={['transparent', 'rgba(7, 11, 23, 0.95)']} style={styles.coverGradient} />
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>{event.eventCategory.toUpperCase()}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {timeLeft && (
              <View style={styles.countdownWrapper}>
                <View style={styles.countdownBox}><Text style={styles.cdNum}>{timeLeft.d}</Text><Text style={styles.cdLabel}>DAYS</Text></View>
                <Text style={styles.cdSeparator}>:</Text>
                <View style={styles.countdownBox}><Text style={styles.cdNum}>{timeLeft.h}</Text><Text style={styles.cdLabel}>HRS</Text></View>
                <Text style={styles.cdSeparator}>:</Text>
                <View style={styles.countdownBox}><Text style={styles.cdNum}>{timeLeft.m}</Text><Text style={styles.cdLabel}>MINS</Text></View>
                <Text style={styles.cdSeparator}>:</Text>
                <View style={styles.countdownBox}><Text style={styles.cdNum}>{timeLeft.s}</Text><Text style={styles.cdLabel}>SECS</Text></View>
              </View>
            )}

            <Text style={styles.eventTitle}>{event.title}</Text>

            {/* Host */}
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>{event.hostUsername.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName}>{event.hostUsername}</Text>
                  <BadgeCheck color="#47e8ff" size={16} />
                </View>
                <Text style={styles.hostLabel}>Event Host</Text>
              </View>
            </View>

            {/* Info Cards */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Calendar color="#d946ef" size={20} />
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{formattedDate}</Text>
              </View>
              {formattedTime ? (
                <View style={styles.infoCard}>
                  <Clock color="#22d3ee" size={20} />
                  <Text style={styles.infoLabel}>TIME</Text>
                  <Text style={styles.infoValue}>{formattedTime}</Text>
                </View>
              ) : null}
              <View style={styles.infoCard}>
                <Ticket color="#d946ef" size={20} />
                <Text style={styles.infoLabel}>PRICE</Text>
                <Text style={styles.infoValue}>{isFree ? 'Free' : `${event.currency} ${event.price}`}</Text>
              </View>
              {parseInt(event.maxAttendees) > 0 && (
                <View style={styles.infoCard}>
                  <Users color="#22d3ee" size={20} />
                  <Text style={styles.infoLabel}>CAPACITY</Text>
                  <Text style={styles.infoValue}>{event.ticketsSold}/{event.maxAttendees}</Text>
                </View>
              )}
            </View>

            {/* Location */}
            <TouchableOpacity onPress={openMap} activeOpacity={0.7} style={styles.locationCard}>
              <MapPin color="#d946ef" size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationName}>{event.locationName}</Text>
                <Text style={styles.locationHint}>Tap to open in Maps →</Text>
              </View>
            </TouchableOpacity>

            {/* Description */}
            {event.description ? (
              <View style={styles.descSection}>
                <Text style={styles.sectionTitle}>ABOUT</Text>
                <Text style={styles.descText}>{event.description}</Text>
              </View>
            ) : null}

            {/* #19: Ticket Tiers */}
            {hasTicketTiers && (
              <View style={styles.tiersSection}>
                <Text style={styles.sectionTitle}>TICKET TIERS</Text>
                {event.ticketTiers.map((tier: any, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.tierCard, passType === (tier.name || tier.tierName) && styles.tierCardActive]}
                    activeOpacity={0.7}
                    onPress={() => setPassType(tier.name || tier.tierName || 'General')}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tierName}>{tier.name || tier.tierName || `Tier ${idx + 1}`}</Text>
                      {tier.services && <Text style={styles.tierServices}>{tier.services}</Text>}
                    </View>
                    <Text style={styles.tierPrice}>
                      {parseFloat(tier.price || 0) > 0 ? `${event.currency} ${tier.price}` : 'Free'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Book Button */}
            {event.canBook && (
              <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 20 }} onPress={() => setBookModalVisible(true)}>
                <LinearGradient
                  colors={['#ec4899', '#9333ea', '#22d3ee']}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  style={styles.bookBtn}
                >
                  <Text style={styles.bookBtnText}>
                    {isFree ? 'RSVP — Free Entry' : `Book — ${event.currency} ${event.price}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Booking Modal */}
        <Modal visible={bookModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Tickets</Text>
                <TouchableOpacity onPress={() => setBookModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* Pass Type Selection — use tiers if available */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Pass Type</Text>
                <View style={styles.passTypeContainer}>
                  {hasTicketTiers ? (
                    event.ticketTiers.map((tier: any, idx: number) => {
                      const name = tier.name || tier.tierName || `Tier ${idx + 1}`;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.passTypeBtn, passType === name && styles.passTypeActiveBtn]}
                          onPress={() => setPassType(name)}
                        >
                          <Text style={[styles.passTypeText, passType === name && styles.passTypeActiveText]}>{name}</Text>
                          {parseFloat(tier.price || 0) > 0 && (
                            <Text style={styles.passPriceText}>{event.currency} {tier.price}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    ['General', 'VIP', 'Backstage'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.passTypeBtn, passType === type && styles.passTypeActiveBtn]}
                        onPress={() => setPassType(type)}
                      >
                        <Text style={[styles.passTypeText, passType === type && styles.passTypeActiveText]}>{type}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Quantity</Text>
                <TextInput
                  style={styles.modalInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity onPress={handleBookTicket} disabled={bookingLoading} activeOpacity={0.8}>
                <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                  {bookingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Confirm Booking</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  orbViolet: { top: 200, right: '-30%', backgroundColor: '#ff4fd8' },
  orbCyan: { bottom: -100, left: '-30%', backgroundColor: '#47e8ff' },

  floatingHeader: {
    position: 'absolute', top: 48, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, zIndex: 20,
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: { paddingBottom: 80 },

  coverContainer: { width: '100%', height: width * 0.8, position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  coverPlaceholderText: { fontFamily: 'Syne_800ExtraBold', fontSize: 80, color: 'rgba(255,255,255,0.2)' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  coverBadge: {
    position: 'absolute', bottom: 16, left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1, borderColor: '#d946ef',
  },
  coverBadgeText: { fontFamily: 'Outfit_800ExtraBold', color: '#d946ef', fontSize: 10, letterSpacing: 1 },

  // Media gallery nav
  mediaNav: {
    position: 'absolute', bottom: 50, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  mediaNavBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  mediaCounter: { fontFamily: 'Sora_700Bold', fontSize: 12, color: '#fff' },

  content: { paddingHorizontal: 20, paddingTop: 4 },
  
  // Countdown Timer
  countdownWrapper: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(71, 232, 255, 0.3)',
  },
  countdownBox: { alignItems: 'center', width: 50 },
  cdNum: { fontFamily: 'Outfit_900Black', fontSize: 24, color: '#47e8ff' },
  cdLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 9, color: '#94a3b8', marginTop: 4, letterSpacing: 1 },
  cdSeparator: { fontFamily: 'Outfit_900Black', fontSize: 20, color: '#d946ef', marginHorizontal: 8, marginTop: -14 },

  eventTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 28, color: '#f8f9ff', lineHeight: 36, marginBottom: 16 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  hostAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center',
  },
  hostAvatarText: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },
  hostNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hostName: { fontFamily: 'Sora_700Bold', fontSize: 15, color: '#f8f9ff' },
  hostLabel: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#94a3b8', marginTop: 2 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  infoCard: {
    flex: 1, minWidth: (width - 50) / 2,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  infoLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, color: '#64748b', letterSpacing: 1.5 },
  infoValue: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#f8f9ff' },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  locationName: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#f8f9ff' },
  locationHint: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#94a3b8', marginTop: 4 },

  descSection: { marginBottom: 10 },
  sectionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, color: '#9ca3af', letterSpacing: 2, marginBottom: 10 },
  descText: { fontFamily: 'Sora_400Regular', fontSize: 15, color: '#cbd5e1', lineHeight: 24 },

  // Ticket Tiers
  tiersSection: { marginBottom: 10 },
  tierCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tierCardActive: { borderColor: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.1)' },
  tierName: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#f8f9ff' },
  tierServices: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#94a3b8', marginTop: 4 },
  tierPrice: { fontFamily: 'Sora_800ExtraBold', fontSize: 14, color: '#d946ef' },

  bookBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  bookBtnText: { fontFamily: 'Sora_800ExtraBold', color: '#fff', fontSize: 15, letterSpacing: 0.5 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: '#f8f9ff' },
  modalCloseText: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: '#fca5a5' },
  modalField: { marginBottom: 16 },
  modalLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#f8f9ff', marginBottom: 10 },
  passTypeContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  passTypeBtn: {
    flex: 1, minWidth: 80, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
  },
  passTypeActiveBtn: { backgroundColor: 'rgba(124, 58, 237, 0.2)', borderColor: '#7c3aed' },
  passTypeText: { fontFamily: 'Sora_600SemiBold', color: '#94a3b8', fontSize: 12 },
  passTypeActiveText: { color: '#d946ef' },
  passPriceText: { fontFamily: 'Sora_400Regular', fontSize: 10, color: '#64748b', marginTop: 2 },
  modalInput: {
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc', fontFamily: 'Sora_400Regular',
  },
  modalBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  modalBtnText: { fontFamily: 'Sora_700Bold', color: '#fff', fontSize: 16 },
});
