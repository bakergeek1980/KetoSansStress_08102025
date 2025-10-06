import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleInput from '../components/forms/SimpleInput';

export default function DebugInputScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testValue, setTestValue] = useState('');

  const handleEmailChange = (text: string) => {
    console.log('🐛 DEBUG: handleEmailChange appelé avec:', text);
    setEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    console.log('🐛 DEBUG: handlePasswordChange appelé avec:', text);
    setPassword(text);
  };

  const handleTestChange = (text: string) => {
    console.log('🐛 DEBUG: handleTestChange appelé avec:', text);
    setTestValue(text);
  };

  const showCurrentValues = () => {
    Alert.alert(
      'Valeurs actuelles',
      `Email: "${email}"\nPassword: "${password}"\nTest: "${testValue}"`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🐛 Debug Input Test</Text>
          <Text style={styles.subtitle}>Test sans React Hook Form</Text>
        </View>

        <Text style={styles.sectionTitle}>Test SimpleInput (Direct State)</Text>
        
        <SimpleInput
          label="Email (Direct)"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          leftIcon="mail"
          placeholder="test@example.com"
        />

        <SimpleInput
          label="Mot de passe (Direct)"
          value={password}
          onChangeText={handlePasswordChange}
          isPassword
          leftIcon="lock-closed"
          placeholder="••••••••"
        />

        <SimpleInput
          label="Test Simple"
          value={testValue}
          onChangeText={handleTestChange}
          placeholder="Tapez quelque chose..."
        />

        <View style={styles.valuesContainer}>
          <Text style={styles.valuesTitle}>Valeurs en temps réel:</Text>
          <Text style={styles.valueText}>Email: "{email}"</Text>
          <Text style={styles.valueText}>Password: "{password}"</Text>
          <Text style={styles.valueText}>Test: "{testValue}"</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.button} onPress={showCurrentValues}>
            Afficher les valeurs
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions de test:</Text>
          <Text style={styles.instructionItem}>1. Ouvrez la console du navigateur (F12)</Text>
          <Text style={styles.instructionItem}>2. Tapez dans les champs ci-dessus</Text>
          <Text style={styles.instructionItem}>3. Regardez les logs qui apparaissent</Text>
          <Text style={styles.instructionItem}>4. Vérifiez que le texte reste visible</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 20,
    marginTop: 10,
  },
  valuesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  valuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 4,
  },
});