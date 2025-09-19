
import React from 'react';
import { View, Text } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';

interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '💪';
    return '🌱';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return 'Unglaublich! Du bist ein Champion!';
    if (streak >= 14) return 'Fantastisch! Du bist auf Feuer!';
    if (streak >= 7) return 'Eine ganze Woche! Super!';
    if (streak >= 3) return 'Großartig! Du baust Momentum auf!';
    if (streak >= 1) return 'Gut gemacht! Weiter so!';
    return 'Starte deine Streak heute!';
  };

  return (
    <View style={[commonStyles.card, { backgroundColor: colors.purple }]}>
      <View style={[commonStyles.row, { alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.textSecondary, { marginBottom: 4, color: colors.text }]}>
            Streak
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginRight: 8 }}>
              {getStreakEmoji(streak)}
            </Text>
            <Text style={[commonStyles.title, { color: colors.text, fontSize: 28 }]}>
              {streak}
            </Text>
          </View>
        </View>
        
        <View style={{ flex: 2, alignItems: 'flex-end' }}>
          <Text style={[commonStyles.text, { 
            color: colors.text, 
            textAlign: 'right',
            fontWeight: '600'
          }]}>
            {streak === 1 ? 'Tag' : 'Tage'}
          </Text>
        </View>
      </View>

      <Text style={[commonStyles.textSecondary, { 
        marginTop: 12, 
        textAlign: 'center',
        color: colors.text,
        fontStyle: 'italic'
      }]}>
        {getStreakMessage(streak)}
      </Text>
    </View>
  );
}
