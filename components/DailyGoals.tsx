
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';

interface UserData {
  weighedToday: boolean;
  exercisedToday: boolean;
  healthyMealToday: boolean;
  waterToday: boolean;
  emergencyMode: boolean;
  dailyPoints: number;
}

interface DailyGoalsProps {
  userData: UserData;
  onPointsEarned: (points: number, action: string) => void;
  onDataUpdate: (data: any) => void;
}

export default function DailyGoals({ userData, onPointsEarned, onDataUpdate }: DailyGoalsProps) {
  const goals = [
    {
      id: 'weighed',
      title: 'Wiegen',
      emoji: '⚖️',
      points: 1,
      completed: userData.weighedToday,
      description: 'Tägliches Wiegen',
    },
    {
      id: 'exercise',
      title: userData.emergencyMode ? '2+ Min Sport' : '5+ Min Sport',
      emoji: '🏃‍♀️',
      points: userData.emergencyMode ? 1 : 2,
      completed: userData.exercisedToday,
      description: userData.emergencyMode ? 'Kurze Bewegung' : 'Mindestens 5 Minuten',
    },
    {
      id: 'meal',
      title: 'Gesunde Mahlzeit',
      emoji: '🥗',
      points: 1,
      completed: userData.healthyMealToday,
      description: 'Eine gesunde Mahlzeit',
    },
    {
      id: 'water',
      title: userData.emergencyMode ? '1L Wasser' : '2L Wasser',
      emoji: '💧',
      points: 1,
      completed: userData.waterToday,
      description: userData.emergencyMode ? 'Mindestens 1 Liter' : 'Mindestens 2 Liter',
    },
  ];

  const handleGoalPress = (goal: any) => {
    if (goal.completed) {
      Alert.alert(
        '✅ Bereits erledigt!',
        `Du hast heute schon "${goal.title}" abgehakt.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      `${goal.emoji} ${goal.title}`,
      `Hast du heute "${goal.description}" gemacht?`,
      [
        { text: 'Nein', style: 'cancel' },
        {
          text: 'Ja!',
          style: 'default',
          onPress: () => {
            const updatedData = { ...userData };
            
            switch (goal.id) {
              case 'weighed':
                updatedData.weighedToday = true;
                break;
              case 'exercise':
                updatedData.exercisedToday = true;
                break;
              case 'meal':
                updatedData.healthyMealToday = true;
                break;
              case 'water':
                updatedData.waterToday = true;
                break;
            }

            updatedData.dailyPoints += goal.points;
            updatedData.totalPoints = (updatedData.totalPoints || 0) + goal.points;

            onDataUpdate(updatedData);
            onPointsEarned(goal.points, goal.title);
          }
        }
      ]
    );
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const progressPercentage = (completedGoals / totalGoals) * 100;

  return (
    <View style={commonStyles.card}>
      <View style={[commonStyles.row, { marginBottom: 16 }]}>
        <Text style={commonStyles.subtitle}>
          {userData.emergencyMode ? 'Notfall-Ziele' : 'Tagesziele'}
        </Text>
        <Text style={[commonStyles.text, { color: colors.success }]}>
          {completedGoals}/{totalGoals}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={{ marginBottom: 20 }}>
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
        <Text style={[commonStyles.textMuted, { marginTop: 4 }]}>
          {progressPercentage.toFixed(0)}% der Tagesziele erreicht
        </Text>
      </View>

      {/* Goals List */}
      {goals.map((goal) => (
        <TouchableOpacity
          key={goal.id}
          style={[
            {
              backgroundColor: goal.completed ? colors.success : colors.background,
              borderWidth: 2,
              borderColor: goal.completed ? colors.success : colors.border,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }
          ]}
          onPress={() => handleGoalPress(goal)}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>
            {goal.completed ? '✅' : goal.emoji}
          </Text>
          
          <View style={{ flex: 1 }}>
            <Text style={[
              commonStyles.text,
              { 
                fontWeight: '600',
                textDecorationLine: goal.completed ? 'line-through' : 'none'
              }
            ]}>
              {goal.title}
            </Text>
            <Text style={[
              commonStyles.textSecondary,
              { fontSize: 12 }
            ]}>
              {goal.description} • {goal.points} Punkt{goal.points > 1 ? 'e' : ''}
            </Text>
          </View>

          {goal.completed && (
            <Text style={[commonStyles.text, { color: colors.success, fontWeight: '600' }]}>
              +{goal.points}
            </Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Encouragement */}
      {userData.emergencyMode && (
        <View style={{
          backgroundColor: colors.warning,
          padding: 12,
          borderRadius: 8,
          marginTop: 8,
        }}>
          <Text style={[commonStyles.text, { textAlign: 'center', fontSize: 14 }]}>
            💙 Notfall-Modus: Reduzierte Ziele für heute. Du schaffst das!
          </Text>
        </View>
      )}
    </View>
  );
}
