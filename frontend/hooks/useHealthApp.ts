import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from './useAuth';
import { useApi } from './useApi';

interface HealthData {
  weight?: number;
  steps?: number;
  activeEnergyBurned?: number;
  heartRate?: number;
  sleepHours?: number;
  waterIntake?: number;
}

interface HealthAppPermissions {
  weight: boolean;
  steps: boolean;
  activeEnergyBurned: boolean;
  heartRate: boolean;
  sleepHours: boolean;
  waterIntake: boolean;
}

export const useHealthApp = () => {
  const { user } = useAuth();
  const { makeRequest } = useApi();
  
  const [isConnected, setIsConnected] = useState(false);
  const [permissions, setPermissions] = useState<HealthAppPermissions>({
    weight: false,
    steps: false,
    activeEnergyBurned: false,
    heartRate: false,
    sleepHours: false,
    waterIntake: false,
  });
  const [loading, setLoading] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

  // Vérifier les permissions HealthApp
  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Non supporté', 'HealthApp est uniquement disponible sur iOS');
      return false;
    }

    try {
      // En l'absence d'expo-health ou react-native-health, nous simulons
      // Dans une vraie app, vous utiliseriez:
      // import { AppleHealthKit } from 'react-native-health';
      
      // Simuler la vérification des permissions
      const mockPermissions = {
        weight: true,
        steps: true,
        activeEnergyBurned: true,
        heartRate: false, // Non autorisé par l'utilisateur
        sleepHours: false,
        waterIntake: true,
      };

      setPermissions(mockPermissions);
      setIsConnected(Object.values(mockPermissions).some(p => p));
      
      return Object.values(mockPermissions).some(p => p);
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions HealthApp:', error);
      Alert.alert('Erreur', 'Impossible de vérifier les permissions HealthApp');
      return false;
    }
  }, []);

  // Demander les permissions HealthApp
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Non supporté', 'HealthApp est uniquement disponible sur iOS');
      return false;
    }

    setLoading(true);

    try {
      // Dans une vraie app avec react-native-health:
      /*
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Water,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.Water,
          ],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('Erreur HealthKit:', error);
          Alert.alert('Erreur', 'Impossible de se connecter à HealthApp');
          return;
        }
        
        checkPermissions();
      });
      */

      // Simulation pour cette démo
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Permissions HealthApp',
        'Voulez-vous autoriser KetoSansStress à accéder à vos données HealthApp ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              setIsConnected(false);
              setLoading(false);
            },
          },
          {
            text: 'Autoriser',
            onPress: async () => {
              // Simuler l'autorisation
              const newPermissions = {
                weight: true,
                steps: true,
                activeEnergyBurned: true,
                heartRate: true,
                sleepHours: true,
                waterIntake: true,
              };
              
              setPermissions(newPermissions);
              setIsConnected(true);
              
              // Sauvegarder la configuration sur le backend
              await saveHealthAppSettings(newPermissions);
              
              Alert.alert('Succès', 'Connexion à HealthApp établie !');
              setLoading(false);
            },
          },
        ]
      );

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      Alert.alert('Erreur', 'Impossible de demander les permissions HealthApp');
      setLoading(false);
      return false;
    }
  }, []);

  // Synchroniser les données depuis HealthApp
  const syncHealthData = useCallback(async (): Promise<HealthData | null> => {
    if (!isConnected || Platform.OS !== 'ios') {
      return null;
    }

    setLoading(true);

    try {
      // Dans une vraie app:
      /*
      const today = new Date();
      const startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // 24h ago

      const options = {
        startDate: startDate.toISOString(),
        endDate: today.toISOString(),
      };

      const [weightData, stepsData, caloriesData] = await Promise.all([
        permissions.weight ? AppleHealthKit.getLatestWeight(options) : Promise.resolve(null),
        permissions.steps ? AppleHealthKit.getDailyStepCountSamples(options) : Promise.resolve(null),
        permissions.activeEnergyBurned ? AppleHealthKit.getActiveEnergyBurned(options) : Promise.resolve(null),
      ]);
      */

      // Simulation de données HealthApp
      await new Promise(resolve => setTimeout(resolve, 1500));

      const healthData: HealthData = {
        weight: permissions.weight ? 68.5 : undefined,
        steps: permissions.steps ? 8743 : undefined,
        activeEnergyBurned: permissions.activeEnergyBurned ? 542 : undefined,
        heartRate: permissions.heartRate ? 72 : undefined,
        sleepHours: permissions.sleepHours ? 7.5 : undefined,
        waterIntake: permissions.waterIntake ? 1800 : undefined,
      };

      // Envoyer les données au backend
      if (user?.email) {
        await syncToBackend(healthData);
      }

      setLastSyncDate(new Date());
      setLoading(false);

      return healthData;
    } catch (error) {
      console.error('Erreur lors de la synchronisation HealthApp:', error);
      Alert.alert('Erreur', 'Impossible de synchroniser avec HealthApp');
      setLoading(false);
      return null;
    }
  }, [isConnected, permissions, user]);

  // Synchroniser avec le backend
  const syncToBackend = useCallback(async (healthData: HealthData) => {
    try {
      // Enregistrer le poids
      if (healthData.weight) {
        await makeRequest('/api/weight-entries/', {
          method: 'POST',
          body: JSON.stringify({
            weight: healthData.weight,
            entry_date: new Date().toISOString().split('T')[0],
            notes: 'Synchronisé depuis HealthApp',
          }),
        });
      }

      // Mettre à jour le résumé quotidien avec les données d'activité
      if (healthData.steps || healthData.activeEnergyBurned || healthData.waterIntake) {
        await makeRequest(`/api/daily-summaries/update`, {
          method: 'PATCH',
          body: JSON.stringify({
            steps_count: healthData.steps,
            exercise_minutes: healthData.activeEnergyBurned ? Math.round(healthData.activeEnergyBurned / 10) : undefined,
            water_intake_ml: healthData.waterIntake,
            summary_date: new Date().toISOString().split('T')[0],
          }),
        });
      }

    } catch (error) {
      console.error('Erreur lors de la synchronisation backend:', error);
      throw error;
    }
  }, [makeRequest]);

  // Sauvegarder les paramètres HealthApp
  const saveHealthAppSettings = useCallback(async (settings: HealthAppPermissions) => {
    try {
      await makeRequest('/api/health-app/settings', {
        method: 'POST',
        body: JSON.stringify({
          enabled: true,
          permissions: settings,
          last_sync: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres HealthApp:', error);
    }
  }, [makeRequest]);

  // Déconnecter HealthApp
  const disconnectHealthApp = useCallback(async () => {
    Alert.alert(
      'Déconnecter HealthApp',
      'Êtes-vous sûr de vouloir déconnecter HealthApp ? Vous perdrez la synchronisation automatique de vos données.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            setIsConnected(false);
            setPermissions({
              weight: false,
              steps: false,
              activeEnergyBurned: false,
              heartRate: false,
              sleepHours: false,
              waterIntake: false,
            });
            setLastSyncDate(null);

            // Supprimer les paramètres du backend
            try {
              await makeRequest('/api/health-app/settings', {
                method: 'DELETE',
              });
            } catch (error) {
              console.error('Erreur lors de la suppression des paramètres:', error);
            }

            Alert.alert('Succès', 'HealthApp déconnecté');
          },
        },
      ]
    );
  }, [makeRequest]);

  // Vérifier l'état au chargement
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    isConnected,
    permissions,
    loading,
    lastSyncDate,
    checkPermissions,
    requestPermissions,
    syncHealthData,
    disconnectHealthApp,
    isSupported: Platform.OS === 'ios',
  };
};