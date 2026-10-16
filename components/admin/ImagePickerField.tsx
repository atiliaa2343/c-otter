import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/db/supabase';

export const CONTENT_IMAGE_BUCKET = 'content-images';

export interface ImagePickerFieldProps {
  /** Currently stored public URL, or null/empty when nothing is set. */
  value: string | null;
  /** Receives the new public URL once the upload succeeds. */
  onUploaded: (url: string) => void;
  /** Shown when nothing is stored yet. */
  placeholder?: string;
}

export function ImagePickerField({
  value,
  onUploaded,
  placeholder = 'No image set',
}: ImagePickerFieldProps) {
  const [uploading, setUploading] = useState(false);

  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const handlePick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Allow photo library access to pick an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) return;

      setUploading(true);

      const extension = asset.uri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const path = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${extension}`;

      // React Native gives a file:// URI; fetch() turns it into a Blob.
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(CONTENT_IMAGE_BUCKET)
        .upload(path, blob, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(CONTENT_IMAGE_BUCKET)
        .getPublicUrl(path);

      onUploaded(urlData.publicUrl);
      Alert.alert('Uploaded', 'Image uploaded. Remember to save the row.');
    } catch (err: any) {
      Alert.alert(
        'Upload failed',
        err?.message ??
          "Could not upload. Check that the public storage bucket named 'content-images' exists."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {value ? (
        <Image
          source={{ uri: value }}
          style={styles.preview}
          resizeMode="cover"
          accessibilityLabel="Current image preview"
        />
      ) : (
        <View style={[styles.preview, styles.previewEmpty, { borderColor: cardBorder }]}>
          <Ionicons name="image-outline" size={28} color={textSecondary} />
          <Text style={[styles.placeholder, { color: textSecondary }]}>{placeholder}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: primaryColor, opacity: uploading ? 0.7 : 1 },
        ]}
        onPress={handlePick}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
            <Text style={styles.buttonText}>
              {value ? 'Change image' : 'Choose image'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {value ? (
        <Text style={[styles.urlHint, { color: textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
  previewEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholder: {
    fontSize: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  urlHint: {
    fontSize: 10,
  },
});
