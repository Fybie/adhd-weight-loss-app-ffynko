
import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SupabaseService } from '../services/supabaseService';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeightHistory();
  }, [currentWeight]);

  const loadWeightHistory = async () => {
    try {
      const { session } = await SupabaseService.getCurrentUser();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Get recent daily entries with weight data
      const { data: entries, error } = await SupabaseService.getDailyEntries(session.user.id, 30);
      
      if (error) {
        console.error('Error loading weight history:', error);
        setLoading(false);
        return;
      }

      // Filter entries that have weight data and convert to WeightEntry format
      const weightEntries: WeightEntry[] = (entries || [])
        .filter(entry => entry.weight !== null)
        .map(entry => ({
          weight: entry.weight!,
          date: entry.date
        }))
        .reverse(); // Show oldest first

      setWeightHistory(weightEntries);
    } catch (error) {
      console.error('Error loading weight history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleChart = () => {
    if (loading) {
      return (
        <Text style={[commonStyles.text, { textAlign: 'center', color: colors.textSecondary }]}>
          Lade Gewichtsverlauf...
        </Text>
      );
    }

    if (weightHistory.length === 0) {
      return (
        <Text style={[commonStyles.text, { textAlign: 'center', color: colors.textSecondary }]}>
          Noch keine Gewichtsdaten vorhanden.
          {'\n'}Trage dein erstes Gewicht ein!
        </Text>
      );
    }

    const screenWidth = Dimensions.get('window').width - 80; // Account for padding
    const chartHeight = 120;
    
    // Calculate weight range for scaling
    const weights = weightHistory.map(entry => entry.weight);
    const minWeight = Math.min(...weights, targetWeight) - 2;
    const maxWeight = Math.max(...weights) + 2;
    const weightRange = maxWeight - minWeight;

    // Calculate progress
    const startWeight = weightHistory[0]?.weight || currentWeight;
    const totalWeightToLose = startWeight - targetWeight;
    const weightLost = startWeight - currentWeight;
    const progressPercentage = totalWeightToLose > 0 ? (weightLost / totalWeightToLose) * 100 : 0;

    return (
      <View>
        {/* Progress Summary */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          marginBottom: 16,
          paddingHorizontal: 8
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>Start</Text>
            <Text style={[commonStyles.text, { fontWeight: '600' }]}>
              {startWeight.toFixed(1)}kg
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>Aktuell</Text>
            <Text style={[commonStyles.text, { fontWeight: '600', color: colors.primary }]}>
              {currentWeight.toFixed(1)}kg
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>Ziel</Text>
            <Text style={[commonStyles.text, { fontWeight: '600', color: colors.success }]}>
              {targetWeight.toFixed(1)}kg
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{
          height: 12,
          backgroundColor: colors.border,
          borderRadius: 6,
          marginBottom: 16,
          overflow: 'hidden'
        }}>
          <View style={{
            height: '100%',
            width: `${Math.max(0, Math.min(progressPercentage, 100))}%`,
            backgroundColor: colors.success,
            borderRadius: 6
          }} />
        </View>

        {/* Progress Text */}
        <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 16 }]}>
          {weightLost > 0 
            ? `🎉 ${weightLost.toFixed(1)}kg abgenommen! (${progressPercentage.toFixed(0)}%)`
            : 'Deine Abnehm-Reise beginnt hier! 💪'
          }
        </Text>

        {/* Simple Chart Visualization */}
        <View style={{
          height: chartHeight,
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          position: 'relative'
        }}>
          {/* Chart Title */}
          <Text style={[commonStyles.textSecondary, { 
            fontSize: 12, 
            textAlign: 'center', 
            marginBottom: 8 
          }]}>
            Gewichtsverlauf ({weightHistory.length} Einträge)
          </Text>

          {/* Simple Line Representation */}
          <View style={{ 
            flex: 1, 
            flexDirection: 'row', 
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}>
            {weightHistory.slice(-7).map((entry, index) => {
              const height = ((entry.weight - minWeight) / weightRange) * (chartHeight - 40);
              const isLatest = index === weightHistory.slice(-7).length - 1;
              
              return (
                <View key={entry.date} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 8,
                    height: Math.max(height, 4),
                    backgroundColor: isLatest ? colors.primary : colors.success,
                    borderRadius: 4,
                    marginBottom: 4
                  }} />
                  <Text style={[commonStyles.textSecondary, { 
                    fontSize: 10,
                    transform: [{ rotate: '-45deg' }],
                    width: 30,
                    textAlign: 'center'
                  }]}>
                    {new Date(entry.date).getDate()}.{new Date(entry.date).getMonth() + 1}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Target Line */}
          <View style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 32 + ((targetWeight - minWeight) / weightRange) * (chartHeight - 40),
            height: 1,
            backgroundColor: colors.danger,
            opacity: 0.7
          }} />
          <Text style={{
            position: 'absolute',
            right: 16,
            bottom: 28 + ((targetWeight - minWeight) / weightRange) * (chartHeight - 40),
            fontSize: 10,
            color: colors.danger,
            backgroundColor: colors.surface,
            paddingHorizontal: 4
          }}>
            Ziel
          </Text>
        </View>

        {/* Recent Entries */}
        {weightHistory.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
              Letzte Einträge:
            </Text>
            {weightHistory.slice(-3).reverse().map((entry, index) => (
              <View key={entry.date} style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                paddingVertical: 4
              }}>
                <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                  {new Date(entry.date).toLocaleDateString('de-DE')}
                </Text>
                <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600' }]}>
                  {entry.weight.toFixed(1)}kg
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={commonStyles.card}>
      <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
        Gewichtsverlauf
      </Text>
      {renderSimpleChart()}
    </View>
  );
}
