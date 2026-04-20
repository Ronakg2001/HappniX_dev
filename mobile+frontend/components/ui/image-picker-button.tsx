import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Plus } from 'lucide-react-native';

interface ImagePickerButtonProps {
  /** Callback with selected image URIs */
  onImagesSelected: (uris: string[]) => void;
  /** Allow multiple image selection */
  multiple?: boolean;
  /** Max number of images (only for multiple) */
  maxCount?: number;
  /** Aspect ratio [width, height] for cropping */
  aspectRatio?: [number, number];
  /** Compact mode — single small circle (for avatars) */
  compact?: boolean;
  /** Label text */
  label?: string;
  /** Currently selected images (controlled) */
  selectedImages?: string[];
}

export default function ImagePickerButton({
  onImagesSelected,
  multiple = false,
  maxCount = 10,
  aspectRatio,
  compact = false,
  label = 'Upload Images',
  selectedImages = [],
}: ImagePickerButtonProps) {
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload images.',
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (multiple && selectedImages.length >= maxCount) {
      Alert.alert('Limit Reached', `You can upload a maximum of ${maxCount} images.`);
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: multiple,
        selectionLimit: multiple ? maxCount - selectedImages.length : 1,
        quality: 0.8,
        aspect: aspectRatio,
        allowsEditing: !multiple,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);

        if (multiple) {
          const combined = [...selectedImages, ...newUris].slice(0, maxCount);
          onImagesSelected(combined);
        } else {
          onImagesSelected(newUris);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: aspectRatio,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        if (multiple) {
          const combined = [...selectedImages, newUri].slice(0, maxCount);
          onImagesSelected(combined);
        } else {
          onImagesSelected([newUri]);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = selectedImages.filter((_, i) => i !== index);
    onImagesSelected(updated);
  };

  const showOptions = () => {
    Alert.alert('Upload Image', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImages },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ─── Compact Mode (Avatar) ───────────────────────────
  if (compact) {
    return (
      <TouchableOpacity onPress={showOptions} activeOpacity={0.7} style={styles.compactWrap}>
        {selectedImages.length > 0 ? (
          <View style={styles.compactImageWrap}>
            <Image source={{ uri: selectedImages[0] }} style={styles.compactImage} />
            <View style={styles.compactEditBadge}>
              <Camera color="#fff" size={12} />
            </View>
          </View>
        ) : (
          <View style={styles.compactPlaceholder}>
            {loading ? (
              <ActivityIndicator color="#d946ef" size="small" />
            ) : (
              <>
                <Camera color="#94a3b8" size={28} />
                <Text style={styles.compactText}>Add Photo</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ─── Full Mode (Multi-image Carousel) ────────────────────
  const { width } = Dimensions.get('window');
  const CAROUSEL_ITEM_WIDTH = width - 40; // Assuming 20px padding on left/right

  return (
    <View style={styles.container}>
      {/* Selected Images Carousel Preview */}
      {selectedImages.length > 0 && (
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CAROUSEL_ITEM_WIDTH}
            decelerationRate="fast"
            snapToAlignment="center"
          >
            {selectedImages.map((uri, index) => (
              <View key={`${uri}-${index}`} style={[styles.carouselItem, { width: CAROUSEL_ITEM_WIDTH }]}>
                <Image source={{ uri }} style={styles.carouselImage} resizeMode="cover" />
                
                <TouchableOpacity
                  style={styles.carouselRemoveBtn}
                  onPress={() => removeImage(index)}
                  activeOpacity={0.7}
                >
                  <X color="#fff" size={16} />
                </TouchableOpacity>

                {index === 0 ? (
                  <View style={styles.carouselBadge}>
                    <Text style={styles.carouselBadgeText}>COVER</Text>
                  </View>
                ) : (
                  <View style={styles.carouselCounterBadge}>
                    <Text style={styles.carouselBadgeText}>{index + 1} / {selectedImages.length}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Add More Slide */}
            {multiple && selectedImages.length < maxCount && (
              <View style={[styles.carouselItem, { width: CAROUSEL_ITEM_WIDTH }]}>
                <TouchableOpacity
                  style={styles.carouselAddSlide}
                  onPress={showOptions}
                  activeOpacity={0.7}
                >
                  <Plus color="#d946ef" size={48} />
                  <Text style={styles.carouselAddText}>Add More</Text>
                  <Text style={styles.uploadHint}>{maxCount - selectedImages.length} slots left</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Upload Area (when no images selected or single mode) */}
      {selectedImages.length === 0 && (
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={showOptions}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#d946ef" size="large" />
          ) : (
            <>
              <View style={styles.uploadIconWrap}>
                <Camera color="#d946ef" size={28} />
              </View>
              <Text style={styles.uploadLabel}>{label}</Text>
              <Text style={styles.uploadHint}>
                {multiple ? `Tap to select up to ${maxCount} images` : 'Tap to select an image'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Count Indicator */}
      {multiple && selectedImages.length > 0 && (
        <Text style={styles.countText}>
          {selectedImages.length}/{maxCount} images
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },

  // ─── Full Mode Styles ─────────────────────────────
  uploadArea: {
    height: 180,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.2)',
  },
  uploadLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#cbd5e1',
  },
  uploadHint: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#64748b',
  },

  // Carousel row
  carouselWrap: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
  },
  carouselItem: {
    height: '100%',
    paddingRight: 10, // gap between items
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  carouselRemoveBtn: {
    position: 'absolute', top: 12, right: 22,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(4px)',
  },
  carouselBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.85)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  carouselCounterBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  carouselBadgeText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
  },
  carouselAddSlide: {
    width: '100%', height: '100%', borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    gap: 8,
  },
  carouselAddText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#cbd5e1',
  },
  countText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },

  // ─── Compact Mode Styles ──────────────────────────
  compactWrap: { alignItems: 'center' },
  compactPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center', alignItems: 'center',
    gap: 6,
  },
  compactText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#94a3b8',
  },
  compactImageWrap: { position: 'relative' },
  compactImage: {
    width: 120, height: 120, borderRadius: 60,
  },
  compactEditBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#d946ef',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0f172a',
  },
});
