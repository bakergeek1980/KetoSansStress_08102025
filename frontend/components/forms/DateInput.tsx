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
  maximumDate = new Date(),
  minimumDate = new Date(1900, 0, 1),
}) => {
  // États pour les champs individuels
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [focusedField, setFocusedField] = useState<'day' | 'month' | 'year' | null>(null);

  // Références pour navigation automatique
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  // Initialiser les champs depuis la valeur
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setDay(date.getDate().toString().padStart(2, '0'));
      setMonth((date.getMonth() + 1).toString().padStart(2, '0'));
      setYear(date.getFullYear().toString());
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Calculer l'âge
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Valider et créer la date
  const validateAndCreateDate = (d: string, m: string, y: string) => {
    if (!d || !m || !y || d.length < 1 || m.length < 1 || y.length < 4) return null;

    const dayNum = parseInt(d);
    const monthNum = parseInt(m);
    const yearNum = parseInt(y);

    // Validation de base
    if (dayNum < 1 || dayNum > 31) return null;
    if (monthNum < 1 || monthNum > 12) return null;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return null;

    // Vérifier si la date est valide
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
      return null; // Date invalide (ex: 31 février)
    }

    // Vérifier les limites
    if (date > maximumDate || date < minimumDate) return null;

    return date;
  };

  // Déclencher onChange quand une date valide est formée
  useEffect(() => {
    const date = validateAndCreateDate(day, month, year);
    if (date) {
      onChange(date);
    }
  }, [day, month, year]);

  // Formater la date en français
  const formatDateInFrench = (): string => {
    const date = validateAndCreateDate(day, month, year);
    if (!date) return '';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Gestion des changements avec navigation automatique
  const handleDayChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 2);
    setDay(numericText);

    if (numericText.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 2);
    setMonth(numericText);

    if (numericText.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setYear(numericText);
  };

  // Gestion du retour arrière intelligent
  const handleDayKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Backspace' && day === '') {
      // Ne rien faire, on est déjà au début
    }
  };

  const handleMonthKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Backspace' && month === '') {
      dayRef.current?.focus();
    }
  };

  const handleYearKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Backspace' && year === '') {
      monthRef.current?.focus();
    }
  };

  const currentDate = validateAndCreateDate(day, month, year);
  const isValidDate = currentDate !== null;
  const age = isValidDate ? calculateAge(currentDate) : null;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
      ]}>
        <Calendar 
          size={20} 
          color={error ? COLORS.error : COLORS.textLight} 
          style={styles.icon} 
        />
        
        <View style={styles.dateFieldsContainer}>
          {/* Jour */}
          <TextInput
            ref={dayRef}
            style={[
              styles.dateField,
              focusedField === 'day' && styles.dateFieldFocused
            ]}
            value={day}
            onChangeText={handleDayChange}
            onKeyPress={handleDayKeyPress}
            onFocus={() => setFocusedField('day')}
            onBlur={() => setFocusedField(null)}
            placeholder="JJ"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            maxLength={2}
          />
          
          <Text style={styles.separator}>/</Text>
          
          {/* Mois */}
          <TextInput
            ref={monthRef}
            style={[
              styles.dateField,
              focusedField === 'month' && styles.dateFieldFocused
            ]}
            value={month}
            onChangeText={handleMonthChange}
            onKeyPress={handleMonthKeyPress}
            onFocus={() => setFocusedField('month')}
            onBlur={() => setFocusedField(null)}
            placeholder="MM"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            maxLength={2}
          />
          
          <Text style={styles.separator}>/</Text>
          
          {/* Année */}
          <TextInput
            ref={yearRef}
            style={[
              styles.dateField,
              styles.yearField,
              focusedField === 'year' && styles.dateFieldFocused
            ]}
            value={year}
            onChangeText={handleYearChange}
            onKeyPress={handleYearKeyPress}
            onFocus={() => setFocusedField('year')}
            onBlur={() => setFocusedField(null)}
            placeholder="AAAA"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        
        {/* Badge âge */}
        {age !== null && (
          <View style={styles.ageBadge}>
            <UserCheck size={16} color={COLORS.success} />
            <Text style={styles.ageBadgeText}>
              {age} ans
            </Text>
          </View>
        )}
      </View>
      
      {/* Date formatée en français */}
      {isValidDate && (
        <Text style={styles.formattedDate}>
          {formatDateInFrench()}
        </Text>
      )}
      
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
    minHeight: 56,
    paddingVertical: 8,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: 12,
  },
  dateFieldsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateField: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 40,
    backgroundColor: COLORS.background,
  },
  dateFieldFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  yearField: {
    minWidth: 60,
  },
  separator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    marginLeft: 8,
  },
  ageBadgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  formattedDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
    marginLeft: 32, // Aligné avec les champs de date
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default DateInput;