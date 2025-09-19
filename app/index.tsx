
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PointsDisplay from '../components/PointsDisplay';
import StreakCounter from '../components/StreakCounter';
import DailyGoals from '../components/DailyGoals';
import WeightChart from '../components/WeightChart';
import ConfettiCannon from 'react-native-confetti-cannon';

interface UserData {
  currentWeight: number;
  targetWeight: number;
  dailyPoints: number;
  totalPoints: number;
  streak: number;
  level: number;
  weighedToday: boolean;
  exercisedToday: boolean;
  healthyMealToday: boolean;
  waterToday: boolean;
  mood: 'good' | 'okay' | 'bad' | null;
  emergencyMode: boolean;
  lastActiveDate: string;
}

const defaultUserData: UserData = {
  currentWeight: 72,
  targetWeight: 60,
  dailyPoints: 0,
  totalPoints: 0,
  streak: 0,
  level: 1,
  weighedToday: false,
  exercisedToday: false,
  healthyMealToday: false,
  waterToday: false,
  mood: null,
  emergencyMode: false,
  lastActiveDate: new Date().toDateString(),
};

export default function HomeScreen() {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const parsedData = JSON.parse(stored);
        // Check if it's a new day
        const today = new Date().toDateString();
        if (parsedData.lastActiveDate !== today) {
          // Reset daily goals for new day
          const newData = {
            ...parsedData,
            dailyPoints: 0,
            weighedToday: false,
            exercisedToday: false,
            healthyMealToday: false,
            waterToday: false,
            mood: null,
            lastActiveDate: today,
          };
          setUserData(newData);
          await AsyncStorage.setItem('userData', JSON.stringify(newData));
        } else {
          setUserData(parsedData);
        }
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async (newData: UserData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(newData));
      setUserData(newData);
    } catch (error) {
      console.log('Error saving user data:', error);
    }
  };

  const addPoints = (points: number, action: string) => {
    const newTotalPoints = userData.totalPoints + points;
    const newDailyPoints = userData.dailyPoints + points;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    
    const leveledUp = newLevel > userData.level;
    
    const newData = {
      ...userData,
      dailyPoints: newDailyPoints,
      totalPoints: newTotalPoints,
      level: newLevel,
    };

    saveUserData(newData);

    if (leveledUp || newDailyPoints >= 5) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    Alert.alert(
      '🎉 Punkte erhalten!',
      `+${points} Punkte für ${action}!\n${leveledUp ? `🎊 Level ${newLevel} erreicht!` : ''}`,
      [{ text: 'Weiter so!', style: 'default' }]
    );
  };

  const toggleEmergencyMode = () => {
    const newData = { ...userData, emergencyMode: !userData.emergencyMode };
    saveUserData(newData);
    Alert.alert(
      userData.emergencyMode ? 'Normaler Modus' : 'Notfall-Modus',
      userData.emergencyMode 
        ? 'Zurück zu normalen Zielen!' 
        : 'Reduzierte Ziele für heute. Du schaffst das! 💪',
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={[commonStyles.container, commonStyles.center]}>
          <Text style={commonStyles.title}>Lade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={commonStyles.title}>Deine Abnehm-Reise</Text>
          <Text style={commonStyles.textSecondary}>
            {userData.currentWeight}kg → {userData.targetWeight}kg
          </Text>
        </View>

        {/* Points and Level */}
        <PointsDisplay 
          dailyPoints={userData.dailyPoints}
          totalPoints={userData.totalPoints}
          level={userData.level}
        />

        {/* Streak Counter */}
        <StreakCounter streak={userData.streak} />

        {/* Weight Chart */}
        <WeightChart currentWeight={userData.currentWeight} targetWeight={userData.targetWeight} />

        {/* Daily Goals */}
        <DailyGoals 
          userData={userData}
          onPointsEarned={addPoints}
          onDataUpdate={saveUserData}
        />

        {/* Quick Actions */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Schnellaktionen</Text>
          
          <TouchableOpacity 
            style={[buttonStyles.secondary, { marginBottom: 12 }]}
            onPress={() => router.push('/weight')}
          >
            <Text style={commonStyles.buttonText}>⚖️ Gewicht eingeben</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.outline, { marginBottom: 12 }]}
            onPress={() => router.push('/mood')}
          >
            <Text style={[commonStyles.buttonText, { color: colors.success }]}>
              😊 Stimmung tracken
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              userData.emergencyMode ? buttonStyles.primary : buttonStyles.danger,
              { marginBottom: 12 }
            ]}
            onPress={toggleEmergencyMode}
          >
            <Text style={commonStyles.buttonText}>
              {userData.emergencyMode ? '✨ Normaler Modus' : '🆘 Notfall-Modus'}
            </Text>
          </TouchableOpacity>

          {/* Debug Button */}
          <TouchableOpacity 
            style={[buttonStyles.outline, { marginBottom: 12, borderColor: colors.warning }]}
            onPress={() => router.push('/debug')}
          >
            <Text style={[commonStyles.buttonText, { color: colors.warning }]}>
              🔧 Supabase Debug
            </Text>
          </TouchableOpacity>
        </View>

        {/* Motivational Message */}
        <View style={[commonStyles.card, { backgroundColor: colors.accent, marginBottom: 100 }]}>
          <Text style={[commonStyles.text, { textAlign: 'center', fontWeight: '600' }]}>
            {userData.emergencyMode 
              ? "Heute ist ein schwerer Tag, aber du bist stärker! 💪"
              : userData.dailyPoints >= 5 
                ? "Fantastisch! Du rockst heute! 🌟"
                : "Jeder kleine Schritt zählt! Du schaffst das! 🎯"
            }
          </Text>
        </View>
      </ScrollView>

      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{x: -10, y: 0}}
          autoStart={true}
          fadeOut={true}
        />
      )}
    </SafeAreaView>
  );
}
