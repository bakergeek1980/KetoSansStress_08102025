import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  border: '#E0E0E0',
};

interface DateInputProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Sélectionner votre date de naissance',
  maximumDate = new Date(),
  minimumDate = new Date(1900, 0, 1),
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date(1990, 0, 1));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS - update temporary date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleIOSCancel = () => {
    setTempDate(value || new Date(1990, 0, 1));
    setShowPicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const openDatePicker = () => {
    if (Platform.OS === 'ios') {
      setTempDate(value || new Date(1990, 0, 1));
    }
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          showPicker && styles.inputContainerFocused,
        ]}
        onPress={openDatePicker}
        activeOpacity={0.7}
      >
        <Calendar 
          size={20} 
          color={error ? COLORS.error : showPicker ? COLORS.primary : COLORS.textLight} 
          style={styles.icon} 
        />
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.inputText,
            !value && styles.placeholderText
          ]}>
            {value ? formatShortDate(value) : placeholder}
          </Text>
          
          {value && (
            <Text style={styles.fullDateText}>
              {formatDate(value)}
            </Text>
          )}
        </View>
        
        {value && (
          <View style={styles.ageContainer}>
            <Text style={styles.ageText}>
              {calculateAge(value)} ans
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleIOSCancel} style={styles.cancelButton}>
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Sélectionner votre date de naissance</Text>
                <TouchableOpacity onPress={handleIOSConfirm} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                locale="fr-FR"
                style={styles.iosPicker}
              />
              
              <View style={styles.agePreview}>
                <Text style={styles.agePreviewText}>
                  Âge: {calculateAge(tempDate)} ans
                </Text>
              </View>
            </View>
          </View>
        </Modal>
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
    color: COLORS.text,
    marginBottom: 8,
  },
  labelError: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  ageContainer: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ageText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default DateInput;