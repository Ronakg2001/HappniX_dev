import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, XCircle, Archive, Wallet, Users } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { ticketApi } from '../../services/api';

const { width } = Dimensions.get('window');

export default function TicketDetailScreen() {
  const params = useLocalSearchParams();
  const [actionLoading, setActionLoading] = useState('');
  
  const ticket = {
    id: params.id as string || 'TKT-0000',
    title: params.title as string || 'Event',
    passType: params.passType as string || 'General',
    quantity: params.quantity as string || '1',
    date: params.date as string || '',
    imageUrl: params.imageUrl as string || '',
    location: params.location as string || 'Location TBD',
    host: params.host as string || 'Host',
    status: params.status as string || 'booked',
  };

  const formattedDate = ticket.date
    ? new Date(ticket.date).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Date TBD';

  const handleCancel = () => {
    Alert.alert('Cancel Ticket', 'Are you sure you want to cancel this ticket?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Ticket', style: 'destructive',
        onPress: async () => {
          setActionLoading('cancel');
          try {
            await ticketApi.cancel(ticket.id);
            Alert.alert('Cancelled', 'Ticket has been cancelled.');
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to cancel ticket.');
          } finally {
            setActionLoading('');
          }
        },
      },
    ]);
  };

  const handleArchive = async () => {
    setActionLoading('archive');
    try {
      await ticketApi.archive(ticket.id);
      Alert.alert('Archived', 'Ticket has been archived.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to archive ticket.');
    } finally {
      setActionLoading('');
    }
  };

  const handlePay = async () => {
    setActionLoading('pay');
    try {
      await ticketApi.pay(ticket.id, 'upi');
      Alert.alert('Payment', 'Payment processed successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Payment failed.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.orb, styles.orbViolet]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Pass</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Ticket Card */}
          <View style={styles.ticketWrapper}>
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(30, 41, 59, 0.8)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ticketCard}
            >
              {/* Event Image */}
              <View style={styles.imageContainer}>
                {ticket.imageUrl ? (
                  <Image source={{ uri: ticket.imageUrl }} style={styles.eventImage} />
                ) : (
                  <LinearGradient colors={['#7c3aed', '#c026d3']} style={styles.imagePlaceholder} />
                )}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{ticket.passType} ACCESS</Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                <Text style={styles.hostText}>Hosted by {ticket.host}</Text>
                <Text style={styles.titleText}>{ticket.title}</Text>

                <View style={styles.infoRow}>
                  <Calendar color="#d946ef" size={16} />
                  <Text style={styles.infoText}>{formattedDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin color="#47e8ff" size={16} />
                  <Text style={styles.infoText}>{ticket.location}</Text>
                </View>
              </View>

              {/* Separator / Dash line */}
              <View style={styles.separatorContainer}>
                <View style={styles.notchLeft} />
                <View style={styles.dashLine} />
                <View style={styles.notchRight} />
              </View>

              {/* QR Section */}
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <QRCode value={`https://happnix.com/ticket/${ticket.id}/`} size={140} color="#000" backgroundColor="#fff" />
                </View>
                <Text style={styles.ticketIdText}>ID: {ticket.id}</Text>
                <Text style={styles.scanHint}>Present this at the entrance</Text>
              </View>
            </LinearGradient>
          </View>
          
          {/* Payment Status */}
          <View style={styles.paymentCard}>
             <CreditCard color="#4ade80" size={20} />
             <View style={{ marginLeft: 12 }}>
                <Text style={styles.paymentTitle}>Payment Successful</Text>
                <Text style={styles.paymentDesc}>Quantity: {ticket.quantity} • Paid via UPI</Text>
             </View>
          </View>

          {/* #21: Ticket Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePay} disabled={!!actionLoading}>
              {actionLoading === 'pay' ? <ActivityIndicator color="#4ade80" size="small" /> : (
                <>
                  <Wallet color="#4ade80" size={18} />
                  <Text style={[styles.actionBtnText, { color: '#4ade80' }]}>Pay</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleArchive} disabled={!!actionLoading}>
              {actionLoading === 'archive' ? <ActivityIndicator color="#94a3b8" size="small" /> : (
                <>
                  <Archive color="#94a3b8" size={18} />
                  <Text style={[styles.actionBtnText, { color: '#94a3b8' }]}>Archive</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleCancel} disabled={!!actionLoading}>
              {actionLoading === 'cancel' ? <ActivityIndicator color="#f87171" size="small" /> : (
                <>
                  <XCircle color="#f87171" size={18} />
                  <Text style={[styles.actionBtnText, { color: '#f87171' }]}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* #20: Group Management */}
          <TouchableOpacity
            style={styles.groupBtn}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/ticket/group' as any, params: { ticketId: ticket.id, title: ticket.title } })}
          >
            <Users color="#47e8ff" size={18} />
            <Text style={styles.groupBtnText}>Manage Group Pass</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  orbViolet: { top: -100, right: '-30%', backgroundColor: '#ff4fd8' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, zIndex: 10,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 80, paddingTop: 20 },

  ticketWrapper: {
    shadowColor: '#d946ef', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  ticketCard: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  imageContainer: { width: '100%', height: 180, position: 'relative' },
  eventImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: '#d946ef',
  },
  badgeText: { fontFamily: 'Outfit_800ExtraBold', color: '#d946ef', fontSize: 10, letterSpacing: 1 },

  detailsContainer: { padding: 20 },
  hostText: { fontFamily: 'Sora_600SemiBold', color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  titleText: { fontFamily: 'Syne_800ExtraBold', color: '#f8f9ff', fontSize: 24, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontFamily: 'Sora_400Regular', color: '#cbd5e1', fontSize: 14 },

  separatorContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 40, position: 'relative' },
  notchLeft: { width: 20, height: 40, borderRadius: 20, backgroundColor: '#070b17', position: 'absolute', left: -10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  notchRight: { width: 20, height: 40, borderRadius: 20, backgroundColor: '#070b17', position: 'absolute', right: -10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dashLine: { flex: 1, height: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', marginHorizontal: 20 },

  qrContainer: { padding: 24, alignItems: 'center' },
  qrBox: { width: 160, height: 160, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, padding: 10 },
  mockQr: { width: '100%', height: '100%', position: 'relative', borderWidth: 2, borderColor: '#000', padding: 8 },
  qrCorner: { width: 30, height: 30, backgroundColor: '#000', position: 'absolute', margin: 4 },
  qrCenter: { flex: 1, backgroundColor: '#000', opacity: 0.5, margin: 38 },
  
  ticketIdText: { fontFamily: 'Outfit_800ExtraBold', color: '#64748b', fontSize: 14, letterSpacing: 2, marginBottom: 4 },
  scanHint: { fontFamily: 'Sora_400Regular', color: '#94a3b8', fontSize: 12 },

  paymentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)',
    marginTop: 20,
  },
  paymentTitle: { fontFamily: 'Sora_700Bold', color: '#4ade80', fontSize: 14 },
  paymentDesc: { fontFamily: 'Sora_400Regular', color: '#94a3b8', fontSize: 12, marginTop: 4 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtnDanger: { borderColor: 'rgba(248, 113, 113, 0.2)', backgroundColor: 'rgba(248, 113, 113, 0.05)' },
  actionBtnText: { fontFamily: 'Sora_700Bold', fontSize: 12 },

  groupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(71, 232, 255, 0.08)',
    borderRadius: 14, paddingVertical: 14, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(71, 232, 255, 0.15)',
  },
  groupBtnText: { fontFamily: 'Sora_700Bold', fontSize: 13, color: '#47e8ff' },
});
