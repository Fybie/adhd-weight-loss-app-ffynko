
import React from 'react';
import { View, Text } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';

interface PointsDisplayProps {
  dailyPoints: number;
  totalPoints: number;
  level: number;
}

export default function PointsDisplay({ dailyPoints, totalPoints, level }: PointsDisplayProps) {
  const pointsToNextLevel = (level * 100) - totalPoints;
  const progressPercentage = ((totalPoints % 100) / 100) * 100;

  return (
    <View style={commonStyles.card}>
      <View style={commonStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
            Heute
          </Text>
          <Text style={[commonStyles.title, { color: colors.success, fontSize: 24 }]}>
            {dailyPoints} Punkte
          </Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
            Level
          </Text>
          <Text style={[commonStyles.title, { color: colors.gold, fontSize: 24 }]}>
            {level}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ marginTop: 16 }}>
        <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
          Fortschritt zum nächsten Level
        </Text>
        <View style={{
          backgroundColor: colors.background,
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <View style={{
            backgroundColor: colors.gold,
            height: '100%',
            width: `${progressPercentage}%`,
            borderRadius: 4,
          }} />
        </View>
        <Text style={[commonStyles.textMuted, { marginTop: 4 }]}>
          {pointsToNextLevel} Punkte bis Level {level + 1}
        </Text>
      </View>

      {/* Total Points */}
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
          Gesamt
        </Text>
        <Text style={[commonStyles.text, { fontSize: 18, fontWeight: '600' }]}>
          {totalPoints} Punkte
        </Text>
      </View>
    </View>
  );
}
