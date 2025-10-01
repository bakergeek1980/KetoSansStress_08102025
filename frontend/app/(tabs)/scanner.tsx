import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ArrowLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
};

export default function ScannerIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.purple]}
        style={styles.gradientContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color={COLORS.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Camera color={COLORS.white} size={60} />
          </View>
          
          <Text style={styles.title}>Scanner un repas</Text>
          <Text style={styles.subtitle}>Votre œil intelligent pour le keto</Text>
          <Text style={styles.description}>
            Prenez une photo de votre repas et obtenez instantanément les informations nutritionnelles avec notre IA avancée.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/scanner/camera')}
          >
            <Text style={styles.startButtonText}>Commencer le scan</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});