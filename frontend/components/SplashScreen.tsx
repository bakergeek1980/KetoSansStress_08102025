import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const dotOpacity1 = new Animated.Value(0.3);
  const dotOpacity2 = new Animated.Value(0.3);
  const dotOpacity3 = new Animated.Value(0.3);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation des points de chargement
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dotOpacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    };

    // Démarrer l'animation des points après un délai
    setTimeout(animateDots, 1000);

    // Fermer le splash screen après 3 secondes
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Image de fond avec l'avocat zen */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Titre "Keto Sans Stress" */}
        <Text style={styles.title}>
          <Text style={styles.ketoText}>Keto</Text>{' '}
          <Text style={styles.sansStressText}>Sans Stress</Text>
        </Text>

        {/* Avocat zen avec dumbbell et cerveau */}
        <View style={styles.avocadoContainer}>
          {/* Nous utilisons l'image téléchargée */}
          <Image
            source={{ uri: 'file:///app/frontend/assets/images/splash-screen.png' }}
            style={styles.avocadoImage}
            resizeMode="contain"
          />
        </View>

        {/* Points de chargement animés */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
        </View>

        {/* Slogan */}
        <Text style={styles.slogan}>Votre compagnon cétogène au quotidien</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A22', // Vert sombre comme dans votre design
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 40,
  },
  ketoText: {
    color: '#8BC34A', // Vert clair pour "Keto"
    fontFamily: 'System',
  },
  sansStressText: {
    color: '#4CAF50', // Vert moyen pour "Sans Stress"
    fontFamily: 'System',
  },
  avocadoContainer: {
    width: width * 0.6,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  avocadoImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  slogan: {
    fontSize: 16,
    color: '#A5D6A7',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});