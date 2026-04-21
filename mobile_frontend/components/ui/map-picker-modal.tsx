import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { X, MapPin, Check, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPickerModal({ visible, onClose, onSelectLocation, initialLat = 28.6139, initialLng = 77.2090 }: MapPickerModalProps) {
  const [markerCoords, setMarkerCoords] = useState({ latitude: initialLat, longitude: initialLng });
  const [addressLoading, setAddressLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Fetching address...');

  useEffect(() => {
    if (visible) {
      reverseGeocode(markerCoords.latitude, markerCoords.longitude);
    }
  }, [visible, markerCoords]);

  const requestCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const newCoords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setMarkerCoords(newCoords);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const place = result[0];
        const addr = [place.name, place.street, place.city, place.region].filter(Boolean).join(', ');
        setCurrentAddress(addr || 'Unknown Location');
      } else {
        setCurrentAddress('Coordinates: ' + lat.toFixed(4) + ', ' + lng.toFixed(4));
      }
    } catch (e) {
      setCurrentAddress('Could not fetch address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation(markerCoords.latitude, markerCoords.longitude, currentAddress);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop a Pin</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
            <Check color="#22d3ee" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          {/* Mock Map Image Background for Expo Go */ }
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80' }} 
            style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]} 
            blurRadius={2}
          />
          <LinearGradient colors={['rgba(7, 11, 23, 0.2)', '#070b17']} style={StyleSheet.absoluteFillObject} />
          
          <TouchableOpacity 
            style={styles.mockMapArea}
            activeOpacity={1}
            onPress={(e) => {
               // Simulate picking a random nearby coordinate on tap
               setMarkerCoords({
                 latitude: markerCoords.latitude + (Math.random() - 0.5) * 0.01,
                 longitude: markerCoords.longitude + (Math.random() - 0.5) * 0.01,
               });
            }}
          >
            <View style={styles.markerPin}>
              <MapPin color="#d946ef" size={48} />
              <View style={styles.markerShadow} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.myLocationBtn} onPress={requestCurrentLocation}>
            <Navigation color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.bottomLabel}>SELECTED LOCATION</Text>
          {addressLoading ? (
            <ActivityIndicator color="#d946ef" size="small" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
          ) : (
            <Text style={styles.addressText}>{currentAddress}</Text>
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={handleConfirm} activeOpacity={0.8}>
            <LinearGradient colors={['#d946ef', '#22d3ee']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.actionBtnInner}>
              <Text style={styles.actionBtnText}>Confirm Location</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b17',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#070b17',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  headerTitle: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 18,
    color: '#fff',
  },
  confirmBtn: {
    padding: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 20,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mockMapArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPin: {
    alignItems: 'center',
    transform: [{ translateY: -24 }],
  },
  markerShadow: {
    width: 16, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 4, transform: [{ scaleX: 2 }]
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomCard: {
    backgroundColor: '#070b17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  bottomLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  addressText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    lineHeight: 24,
  },
  actionBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtnInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
