import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Calendar, UserCheck } from 'lucide-react-native';

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

  // Handle HTML5 date input change (web)
  const handleWebDateChange = (dateString: string) => {
    console.log('🌐 Web date changed:', dateString);
    if (dateString) {
      const selectedDate = new Date(dateString + 'T00:00:00');
      console.log('🌐 Parsed date:', selectedDate);
      onChange(selectedDate);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('📱 Native date changed:', selectedDate);
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

  // Check if we're on web
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      
      {isWeb ? (
        // Web: Use HTML5 date input
        <View style={[
          styles.inputContainer,
          error && styles.inputContainerError,
        ]}>
          <Calendar 
            size={20} 
            color={error ? COLORS.error : COLORS.textLight} 
            style={styles.icon} 
          />
          
          <input
            type="date"
            value={value ? value.toISOString().split('T')[0] : ''}
            onChange={(e) => handleWebDateChange(e.target.value)}
            min={minimumDate.toISOString().split('T')[0]}
            max={maximumDate.toISOString().split('T')[0]}
            placeholder={placeholder}
            style={{
              flex: 1,
              fontSize: 16,
              padding: 12,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: COLORS.text,
              fontFamily: 'inherit',
            }}
          />
          
          {value && (
            <View style={styles.ageContainer}>
              <Text style={styles.ageText}>
                {calculateAge(value)} ans
              </Text>
            </View>
          )}
        </View>
      ) : (
        // Mobile: Use TouchableOpacity with DateTimePicker
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
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Android Date Picker */}
      {!isWeb && Platform.OS === 'android' && showPicker && (
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
      {!isWeb && Platform.OS === 'ios' && (
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
    minHeight: 64,
    paddingVertical: 8,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  placeholderText: {
    color: COLORS.textLight,
    fontWeight: '400',
  },
  fullDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  ageContainer: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  ageText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  // iOS Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  agePreview: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  agePreviewText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default DateInput;