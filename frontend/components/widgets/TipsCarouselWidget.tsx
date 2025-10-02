import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  blue: '#3B82F6',
};

interface TipArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  readTime: string;
  color: string;
  gradient: string[];
  icon: string;
}

const ketoTips: TipArticle[] = [
  {
    id: '1',
    title: 'Guide des Légumes Keto',
    category: 'Nutrition',
    description: 'Découvrez les meilleurs légumes faibles en glucides pour votre régime cétogène.',
    readTime: '3 min',
    color: COLORS.success,
    gradient: ['#34D399', '#10B981'],
    icon: '🥬',
  },
  {
    id: '2',
    title: 'Bienfaits des Abats',
    category: 'Superaliments',
    description: 'Pourquoi les abats sont des super-aliments parfaits pour le régime keto.',
    readTime: '5 min',
    color: COLORS.accent,
    gradient: ['#FF8A65', '#FF7043'],
    icon: '🥩',
  },
  {
    id: '3',
    title: 'Jeûne Intermittent & Keto',
    category: 'Stratégie',
    description: 'Comment combiner efficacement jeûne intermittent et alimentation cétogène.',
    readTime: '4 min',
    color: COLORS.purple,
    gradient: ['#A78BFA', '#8B5CF6'],
    icon: '⏰',
  },
  {
    id: '4',
    title: 'Électrolytes Essentiels',
    category: 'Santé',
    description: 'Maintenir l\'équilibre électrolytique pendant la cétose.',
    readTime: '6 min',
    color: COLORS.blue,
    gradient: ['#60A5FA', '#3B82F6'],
    icon: '⚡',
  },
  {
    id: '5',
    title: 'Graisses Saines',
    category: 'Nutrition',
    description: 'Les meilleures sources de graisses pour optimiser votre cétose.',
    readTime: '4 min',
    color: COLORS.warning,
    gradient: ['#FCD34D', '#F59E0B'],
    icon: '🥑',
  },
];

const TipCard = ({ tip, onPress }: { tip: TipArticle; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.tipCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[tip.gradient[0] + '15', tip.gradient[1] + '25']}
        style={styles.tipCardGradient}
      >
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Text style={styles.tipIcon}>{tip.icon}</Text>
          </View>
          <View style={styles.tipBadge}>
            <Text style={[styles.tipCategory, { color: tip.color }]}>{tip.category}</Text>
          </View>
        </View>
        
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipDescription}>{tip.description}</Text>
        
        <View style={styles.tipFooter}>
          <Text style={styles.readTime}>{tip.readTime} de lecture</Text>
          <ChevronRight color={tip.color} size={16} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function TipsCarouselWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const cardWidth = width - 80; // Accounting for margins and padding
    const index = Math.round(contentOffset.x / cardWidth);
    setCurrentIndex(index);
  };

  const handleTipPress = (tip: TipArticle) => {
    console.log('Opening tip:', tip.title);
    // Navigate to tip detail screen
  };

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFEFE']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <BookOpen color={COLORS.purple} size={20} />
            <Text style={styles.widgetTitle}>Conseils Keto</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carousel}
          style={styles.carouselScrollView}
        >
          {ketoTips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              onPress={() => handleTipPress(tip)}
            />
          ))}
        </ScrollView>

        {/* Page indicators */}
        <View style={styles.indicators}>
          {ketoTips.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentIndex ? COLORS.purple : COLORS.textLight,
                  width: index === currentIndex ? 20 : 6,
                }
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  widgetGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  carouselScrollView: {
    marginBottom: 16,
  },
  carousel: {
    paddingLeft: 20,
  },
  tipCard: {
    width: width - 80,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
    borderRadius: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  tipCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  tipDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  tipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTime: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
});