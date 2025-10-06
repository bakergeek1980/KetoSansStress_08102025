import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ValidatedInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  required?: boolean;
  showError?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  helperText?: string;
  containerStyle?: object;
  inputStyle?: object;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  required = false,
  showError = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  helperText,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = useCallback(() => {
    console.log('🎯 ValidatedInput Focus reçu:', label);
    setIsFocused(true);
  }, [label]);

  const handleBlur = useCallback(() => {
    console.log('🎯 ValidatedInput Blur reçu:', label);
    setIsFocused(false);
  }, [label]);

  const handleChangeText = useCallback((text: string) => {
    console.log('🎯 ValidatedInput Text changé:', label, text);
    onChangeText(text);
  }, [label, onChangeText]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const hasError = Boolean(error);
  const hasValue = Boolean(value);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={[
        styles.label,
        hasError && styles.labelError,
        isFocused && styles.labelFocused,
      ]}>
        {label}
        {required && <Text style={styles.required}>*</Text>}
      </Text>

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        hasError && styles.inputContainerError,
        hasValue && styles.inputContainerHasValue,
      ]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons 
              name={leftIcon} 
              size={20} 
              color={hasError ? '#dc3545' : isFocused ? '#007AFF' : '#8E8E93'} 
            />
          </View>
        )}

        {/* Text Input - Version Web vs Mobile */}
        {Platform.OS === 'web' ? (
          // Version WEB avec input HTML natif
          <input
            style={{
              flex: 1,
              fontSize: 16,
              color: '#1C1C1E',
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: leftIcon ? 4 : 12,
              paddingRight: (rightIcon || isPassword) ? 4 : 12,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontFamily: 'System',
            }}
            type={isPassword && !isPasswordVisible ? 'password' : (textInputProps.keyboardType === 'email-address' ? 'email' : 'text')}
            value={value || ''}
            onChange={(e) => onChangeText(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={textInputProps.placeholder}
            disabled={false}
            readOnly={false}
            autoComplete="off"
          />
        ) : (
          // Version MOBILE avec TextInput React Native
          <TextInput
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              (rightIcon || isPassword) && styles.inputWithRightIcon,
              inputStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !isPasswordVisible}
            placeholderTextColor="#C7C7CC"
            editable={true}
            selectTextOnFocus={true}
            autoComplete="off"
            {...textInputProps}
          />
        )}

        {/* Right Icon */}
        {(rightIcon || isPassword) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={isPassword ? togglePasswordVisibility : onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                isPassword 
                  ? (isPasswordVisible ? 'eye-off' : 'eye')
                  : rightIcon!
              }
              size={20}
              color={hasError ? '#dc3545' : isFocused ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text */}
      {helperText && !hasError && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

      {/* Error Message */}
      {hasError && showError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  labelFocused: {
    color: '#007AFF',
  },
  labelError: {
    color: '#dc3545',
  },
  required: {
    color: '#dc3545',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    // Assurer que les événements passent au TextInput
    pointerEvents: 'auto',
    // Forcer la position et visibilité
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
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
  inputContainerHasValue: {
    borderColor: '#34C759',
  },
  leftIconContainer: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightIconContainer: {
    paddingLeft: 8,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 12,
    // Styles spécifiques pour React Native Web
    outline: 'none', // Supprime l'outline par défaut du navigateur
    border: 'none', // Supprime la bordure par défaut du navigateur
    backgroundColor: 'transparent', // Fond transparent
    pointerEvents: 'auto', // Force l'interactivité
    // FORCER L'INTERACTIVITÉ - Solution overlay invisible
    position: 'relative',
    zIndex: 99999,
    opacity: 1,
    visibility: 'visible',
    userSelect: 'text',
    // Forcer le focus
    cursor: 'text',
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    paddingLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginLeft: 4,
    flex: 1,
  },
});

export default ValidatedInput;