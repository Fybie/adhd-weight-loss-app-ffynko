
import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WeightEntry {
  weight: number;
  date: string;
}

interface WeightChartProps {
  currentWeight: number;
  targetWeight: number;
}

export default function WeightChart({ currentWeight, targetWeight }: WeightChartProps) {
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Account for padding

  useEffect(() => {
    loadWeightHistory();
  }, [currentWeight]);

  const loadWeightHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('weightHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setWeightHistory(history.slice(-30)); // Last 30 entries
      }
    } catch (error) {
      console.log('Error loading weight history:', error);
    }
  };

  const weightLoss = currentWeight - targetWeight;
  const progressPercentage = Math.max(0, Math.min(100, 
    ((72 - currentWeight) / (72 - targetWeight)) * 100
  ));

  const renderSimpleChart = () => {
    if (weightHistory.length < 2) {
      return (
        <View style={{
          height: 120,
          backgroundColor: colors.background,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={[commonStyles.textSecondary, { textAlign: 'center' }]}>
            📊 Dein Gewichtsverlauf wird hier angezeigt{'\n'}
            sobald du mehr Einträge hast
          </Text>
        </View>
      );
    }

    const maxWeight = Math.max(...weightHistory.map(w => w.weight));
    const minWeight = Math.min(...weightHistory.map(w => w.weight));
    const range = maxWeight - minWeight || 1;

    return (
      <View style={{
        height: 120,
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 16,
        justifyContent: 'flex-end',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: 80,
        }}>
          {weightHistory.map((entry, index) => {
            const height = ((maxWeight - entry.weight) / range) * 60 + 20;
            return (
              <View
                key={index}
                style={{
                  width: Math.max(2, (chartWidth - 32) / weightHistory.length - 2),
                  height: height,
                  backgroundColor: colors.success,
                  marginRight: 2,
                  borderRadius: 1,
                }}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={commonStyles.textMuted}>{minWeight.toFixed(1)}kg</Text>
          <Text style={commonStyles.textMuted}>{maxWeight.toFixed(1)}kg</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={commonStyles.card}>
      <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
        Gewichtsverlauf
      </Text>

      {/* Current Stats */}
      <View style={[commonStyles.row, { marginBottom: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
            Aktuell
          </Text>
          <Text style={[commonStyles.text, { fontSize: 20, fontWeight: '600' }]}>
            {currentWeight}kg
          </Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
            Noch zu verlieren
          </Text>
          <Text style={[commonStyles.text, { 
            fontSize: 20, 
            fontWeight: '600',
            color: weightLoss > 0 ? colors.warning : colors.success
          }]}>
            {weightLoss > 0 ? `${weightLoss.toFixed(1)}kg` : 'Ziel erreicht! 🎉'}
          </Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[commonStyles.textSecondary, { marginBottom: 4 }]}>
            Ziel
          </Text>
          <Text style={[commonStyles.text, { fontSize: 20, fontWeight: '600' }]}>
            {targetWeight}kg
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
          Fortschritt: {progressPercentage.toFixed(1)}%
        </Text>
        <View style={{
          backgroundColor: colors.background,
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <View style={{
            backgroundColor: colors.success,
            height: '100%',
            width: `${progressPercentage}%`,
            borderRadius: 4,
          }} />
        </View>
      </View>

      {/* Simple Chart */}
      {renderSimpleChart()}
    </View>
  );
}
