import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  loadingText?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  size = 'medium',
  leftIcon,
  rightIcon,
  fullWidth = true,
  loadingText,
  disabled,
  style,
  ...touchableOpacityProps
}) => {
  const isDisabled = disabled || loading;
  const displayText = loading && loadingText ? loadingText : title;

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${variant}`], styles[`button_${size}`]];
    
    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }
    
    if (isDisabled) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${variant}`], styles[`text_${size}`]];
    
    if (isDisabled) {
      baseStyle.push(styles.textDisabled);
    }
    
    return baseStyle;
  };

  const getIconColor = () => {
    if (isDisabled) return '#C7C7CC';
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return '#007AFF';
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...touchableOpacityProps}
    >
      <View style={styles.content}>
        {/* Left Icon */}
        {leftIcon && !loading && (
          <Ionicons
            name={leftIcon}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={getIconColor()}
            style={styles.leftIcon}
          />
        )}

        {/* Loading Indicator */}
        {loading && (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={getIconColor()}
            style={styles.loader}
          />
        )}

        {/* Button Text */}
        <Text style={getTextStyle()}>{displayText}</Text>

        {/* Right Icon */}
        {rightIcon && !loading && (
          <Ionicons
            name={rightIcon}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={getIconColor()}
            style={styles.rightIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  button_primary: {
    backgroundColor: '#007AFF',
  },
  button_secondary: {
    backgroundColor: '#34C759',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  button_danger: {
    backgroundColor: '#dc3545',
  },
  
  // Sizes
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textDisabled: {
    color: '#C7C7CC',
  },
  
  // Text variants
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: '#007AFF',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  
  // Text sizes
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  
  // Icons
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  loader: {
    marginRight: 8,
  },
});

export default LoadingButton;