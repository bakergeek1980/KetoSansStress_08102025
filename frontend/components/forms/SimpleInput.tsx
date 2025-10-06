import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SimpleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isPassword?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  keyboardType = 'default',
  error,
  leftIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChangeText = (text: string) => {
    console.log(`🎯 SimpleInput [${label}]: Input reçu: "${text}"`);
    console.log(`🎯 SimpleInput [${label}]: Valeur actuelle avant: "${value}"`);
    onChangeText(text);
    console.log(`🎯 SimpleInput [${label}]: Appel onChangeText terminé`);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={leftIcon} 
              size={20} 
              color={error ? '#dc3545' : isFocused ? '#007AFF' : '#8E8E93'} 
            />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCorrect={false}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          editable={true}
          selectTextOnFocus={true}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color="#8E8E93" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  labelError: {
    color: '#dc3545',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#dc3545',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  inputWithIcon: {
    marginLeft: 8,
  },
  iconContainer: {
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
});

export default SimpleInput;