import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Check, X, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface QrSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  qrValue: string;
}

export default function QrSuccessModal({ visible, onClose, qrValue }: QrSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#9ca3af" size={20} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Check color="#4ade80" size={24} />
          </View>

          <Text style={styles.title}>Event Published!</Text>
          <Text style={styles.desc}>Here is your custom invite code. Share it so people can join.</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue || 'https://happnix.com'}
              size={180}
              color="#0f172a"
              backgroundColor="#f8fafc"
            />
          </View>

          <TouchableOpacity style={styles.downloadBtn} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient colors={['#0891b2', '#c026d3']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.btnGradient}>
              <Download color="#fff" size={16} />
              <Text style={styles.downloadText}>Download Ticket QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  desc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 24,
  },
  downloadBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  downloadText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
