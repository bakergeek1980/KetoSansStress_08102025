import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Scan } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useAuth } from '../../hooks/useAuth';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#000000',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  overlay: 'rgba(0,0,0,0.7)',
};

interface Food {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  calories_per_100g: number;
  proteins_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  image_url?: string;
  barcode?: string;
  source: string;
}

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onFoodFound: (food: Food) => void;
}

const { width, height } = Dimensions.get('window');

export default function BarcodeScannerModal({
  visible,
  onClose,
  onFoodFound,
}: BarcodeScannerModalProps) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration de l'API
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (visible) {
      requestCameraPermissions();
    }
  }, [visible]);

  const requestCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'accès à la caméra est nécessaire pour scanner les codes-barres.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!isScanning || isProcessing) return;

    setIsScanning(false);
    setIsProcessing(true);

    try {
      console.log(`Code-barres scanné: ${data} (Type: ${type})`);
      
      // Appeler l'API backend pour chercher le produit
      await searchProductByBarcode(data);
      
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      Alert.alert(
        'Erreur de scan',
        'Impossible de traiter le code-barres. Veuillez réessayer.',
        [
          {
            text: 'Réessayer',
            onPress: () => {
              setIsScanning(true);
              setIsProcessing(false);
            }
          },
          { text: 'Fermer', onPress: onClose }
        ]
      );
    }
  };

  const searchProductByBarcode = async (barcode: string) => {
    if (!user || !API_BASE_URL) {
      Alert.alert('Erreur', 'Impossible de se connecter au service');
      onClose();
      return;
    }

    try {
      const { token } = user;
      // ✅ Correction: utiliser POST avec barcode dans le body comme attendu par le backend
      const response = await fetch(`${API_BASE_URL}/api/foods/scan-barcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barcode })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.found && result.food_data) {
          Alert.alert(
            'Produit trouvé !',
            `${result.food_data.name}${result.food_data.brand ? ` - ${result.food_data.brand}` : ''}`,
            [
              {
                text: 'Ajouter',
                onPress: () => {
                  onFoodFound(result.food_data);
                  onClose();
                }
              },
              {
                text: 'Continuer le scan',
                onPress: () => {
                  setIsScanning(true);
                  setIsProcessing(false);
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Produit non trouvé',
            `Le code-barres ${barcode} n'a pas été trouvé dans notre base de données.`,
            [
              {
                text: 'Réessayer',
                onPress: () => {
                  setIsScanning(true);
                  setIsProcessing(false);
                }
              },
              { text: 'Fermer', onPress: onClose }
            ]
          );
        }
      } else {
        throw new Error('Réponse du serveur invalide');
      }
    } catch (error) {
      console.error('Erreur API:', error);
      Alert.alert(
        'Erreur de connexion',
        'Impossible de rechercher le produit. Vérifiez votre connexion.',
        [
          {
            text: 'Réessayer',
            onPress: () => {
              setIsScanning(true);
              setIsProcessing(false);
            }
          },
          { text: 'Fermer', onPress: onClose }
        ]
      );
    }
  };

  const resetScanner = () => {
    setIsScanning(true);
    setIsProcessing(false);
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Demande d'accès à la caméra...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Accès à la caméra refusé</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X color={COLORS.surface} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner un code-barres</Text>
          <TouchableOpacity onPress={resetScanner} style={styles.headerButton}>
            <Scan color={COLORS.surface} size={24} />
          </TouchableOpacity>
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
            style={StyleSheet.absoluteFillObject}
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.ean13,
              BarCodeScanner.Constants.BarCodeType.ean8,
              BarCodeScanner.Constants.BarCodeType.upc_a,
              BarCodeScanner.Constants.BarCodeType.upc_e,
              BarCodeScanner.Constants.BarCodeType.code128,
              BarCodeScanner.Constants.BarCodeType.code39,
            ]}
          />
          
          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlayLeft} />
              <View style={styles.scanArea}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
              <View style={styles.overlayRight} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            {isProcessing ? 'Traitement...' : 'Centrez le code-barres dans le cadre'}
          </Text>
          <Text style={styles.instructionsText}>
            {isProcessing 
              ? 'Recherche du produit en cours...' 
              : 'Le scan se déclenchera automatiquement'
            }
          </Text>
          
          {isProcessing && (
            <View style={styles.processingIndicator}>
              <Text style={styles.processingText}>🔍 Recherche en cours...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.overlay,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 200,
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  scanArea: {
    width: width * 0.7,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayRight: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  scanFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    backgroundColor: COLORS.overlay,
    padding: 20,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  processingIndicator: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.surface,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});