
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
  onPointsEarned: (points: number, action: string, activityType: string) => void;
  onDataUpdate: (data: any) => void;
}

export default function DailyGoals({ userData, onPointsEarned, onDataUpdate }: DailyGoalsProps) {
  const handleGoalPress = (goal: string) => {
    const goalConfig = {
      weigh: {
        points: 1,
        action: 'Wiegen',
        activityType: 'wiegen',
        completed: userData.weighedToday,
        emoji: '⚖️'
      },
      exercise: {
        points: userData.emergencyMode ? 1 : 2,
        action: 'Sport (5+ Min)',
        activityType: 'sport',
        completed: userData.exercisedToday,
        emoji: '🏃‍♀️'
      },
      meal: {
        points: 1,
        action: 'Gesunde Mahlzeit',
        activityType: 'gesunde_mahlzeit',
        completed: userData.healthyMealToday,
        emoji: '🥗'
      },
      water: {
        points: 1,
        action: '2L Wasser',
        activityType: 'wasser',
        completed: userData.waterToday,
        emoji: '💧'
      }
    };

    const config = goalConfig[goal as keyof typeof goalConfig];
    
    if (!config) return;

    if (config.completed) {
      Alert.alert(
        'Bereits erledigt! 🎉',
        `Du hast heute schon ${config.action} gemacht!`,
        [{ text: 'Super!', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      `${config.emoji} ${config.action}`,
      `Hast du ${config.action} gemacht?`,
      [
        { text: 'Nein', style: 'cancel' },
        { 
          text: `Ja! (+${config.points}P)`, 
          style: 'default',
          onPress: () => onPointsEarned(config.points, config.action, config.activityType)
        }
      ]
    );
  };

  const getGoalStyle = (completed: boolean) => [
    buttonStyles.outline,
    { 
      marginBottom: 12,
      borderColor: completed ? colors.success : colors.border,
      backgroundColor: completed ? colors.success + '20' : 'transparent'
    }
  ];

  const getGoalTextStyle = (completed: boolean) => [
    commonStyles.buttonText,
    { 
      color: completed ? colors.success : colors.text,
      fontWeight: completed ? '600' : '400'
    }
  ];

  const totalPossiblePoints = userData.emergencyMode ? 4 : 5;
  const progressPercentage = (userData.dailyPoints / totalPossiblePoints) * 100;

  return (
    <View style={commonStyles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={commonStyles.subtitle}>
          Tagesziele {userData.emergencyMode ? '(Notfall-Modus)' : ''}
        </Text>
        <Text style={[commonStyles.text, { color: colors.primary, fontWeight: '600' }]}>
          {userData.dailyPoints}/{totalPossiblePoints}P
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={{
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        marginBottom: 20,
        overflow: 'hidden'
      }}>
        <View style={{
          height: '100%',
          width: `${Math.min(progressPercentage, 100)}%`,
          backgroundColor: colors.success,
          borderRadius: 4
        }} />
      </View>

      {/* Goals */}
      <TouchableOpacity 
        style={getGoalStyle(userData.weighedToday)}
        onPress={() => handleGoalPress('weigh')}
      >
        <Text style={getGoalTextStyle(userData.weighedToday)}>
          ⚖️ Wiegen (+1P) {userData.weighedToday ? '✓' : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={getGoalStyle(userData.exercisedToday)}
        onPress={() => handleGoalPress('exercise')}
      >
        <Text style={getGoalTextStyle(userData.exercisedToday)}>
          🏃‍♀️ Sport 5+ Min (+{userData.emergencyMode ? 1 : 2}P) {userData.exercisedToday ? '✓' : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={getGoalStyle(userData.healthyMealToday)}
        onPress={() => handleGoalPress('meal')}
      >
        <Text style={getGoalTextStyle(userData.healthyMealToday)}>
          🥗 Gesunde Mahlzeit (+1P) {userData.healthyMealToday ? '✓' : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={getGoalStyle(userData.waterToday)}
        onPress={() => handleGoalPress('water')}
      >
        <Text style={getGoalTextStyle(userData.waterToday)}>
          💧 2L Wasser (+1P) {userData.waterToday ? '✓' : ''}
        </Text>
      </TouchableOpacity>

      {/* Motivational message */}
      {userData.dailyPoints >= totalPossiblePoints && (
        <View style={{
          backgroundColor: colors.success + '20',
          padding: 16,
          borderRadius: 12,
          marginTop: 16,
          borderWidth: 1,
          borderColor: colors.success
        }}>
          <Text style={[commonStyles.text, { 
            textAlign: 'center', 
            color: colors.success, 
            fontWeight: '600' 
          }]}>
            🎉 Alle Tagesziele erreicht! Du bist fantastisch! 🌟
          </Text>
        </View>
      )}
    </View>
  );
}
