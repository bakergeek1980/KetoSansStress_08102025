import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, ArrowLeft, Zap } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
};

export default function CameraScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].base64 || null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={COLORS.dark} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
              style={styles.image}
            />
            <TouchableOpacity style={styles.analyzeButton}>
              <Text style={styles.analyzeButtonText}>Analyser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Camera color={COLORS.white} size={24} />
              <Text style={styles.buttonText}>Prendre une photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <ImageIcon color={COLORS.white} size={24} />
              <Text style={styles.buttonText}>Choisir une image</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  buttonsContainer: {
    gap: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginTop: 8,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});