
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import PointsDisplay from '../components/PointsDisplay';
import StreakCounter from '../components/StreakCounter';
import DailyGoals from '../components/DailyGoals';
import WeightChart from '../components/WeightChart';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../app/integrations/supabase/client';

interface UserData {
  id?: string;
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
  mood: 'gut' | 'okay' | 'schlecht' | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [todayEntry, setTodayEntry] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadData();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUserId(session.user.id);
        loadUserData(session.user.id);
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setUserData(defaultUserData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      console.log('Checking authentication status...');
      const { session } = await SupabaseService.getCurrentUser();
      
      if (session?.user) {
        console.log('User is authenticated:', session.user.id);
        setIsAuthenticated(true);
        setCurrentUserId(session.user.id);
        await loadUserData(session.user.id);
      } else {
        console.log('User is not authenticated');
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);
      setLoading(true);

      // Get user profile
      const { data: userProfile, error: userError } = await SupabaseService.getUser(userId);
      if (userError) {
        console.log('User profile not found, might be first time user');
      }

      // Get today's entry
      const today = new Date().toISOString().split('T')[0];
      const { data: entries, error: entriesError } = await SupabaseService.getDailyEntries(userId, 1);
      
      let todaysEntry = null;
      if (entries && entries.length > 0 && entries[0].date === today) {
        todaysEntry = entries[0];
        setTodayEntry(todaysEntry);
      }

      // Get activities for today if entry exists
      let todaysActivities: any[] = [];
      if (todaysEntry) {
        const { data: activities } = await SupabaseService.getActivities(todaysEntry.id);
        todaysActivities = activities || [];
      }

      // Calculate streak
      const { streak } = await SupabaseService.calculateStreak(userId);

      // Build user data from database
      const newUserData: UserData = {
        id: userId,
        currentWeight: userProfile?.start_weight || 72,
        targetWeight: userProfile?.target_weight || 60,
        dailyPoints: todaysEntry?.total_points || 0,
        totalPoints: 0, // We'll calculate this from all entries
        streak: streak,
        level: Math.floor((todaysEntry?.total_points || 0) / 100) + 1,
        weighedToday: todaysActivities.some(a => a.activity_type === 'wiegen'),
        exercisedToday: todaysActivities.some(a => a.activity_type === 'sport'),
        healthyMealToday: todaysActivities.some(a => a.activity_type === 'gesunde_mahlzeit'),
        waterToday: todaysActivities.some(a => a.activity_type === 'wasser'),
        mood: todaysEntry?.mood || null,
        emergencyMode: false, // We can add this to the database later
        lastActiveDate: today,
      };

      console.log('User data loaded:', newUserData);
      setUserData(newUserData);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const ensureTodayEntry = async () => {
    if (!currentUserId) return null;

    if (todayEntry) return todayEntry;

    // Create today's entry
    const today = new Date().toISOString().split('T')[0];
    const { data: newEntry, error } = await SupabaseService.createDailyEntry({
      user_id: currentUserId,
      date: today,
      total_points: 0,
      mood: null
    });

    if (error) {
      console.error('Error creating daily entry:', error);
      return null;
    }

    setTodayEntry(newEntry);
    return newEntry;
  };

  const addPoints = async (points: number, action: string, activityType: string) => {
    if (!currentUserId) return;

    try {
      // Ensure we have today's entry
      const entry = await ensureTodayEntry();
      if (!entry) {
        Alert.alert('Fehler', 'Konnte heutigen Eintrag nicht erstellen.');
        return;
      }

      // Add the activity
      const { error: activityError } = await SupabaseService.addActivity({
        daily_entry_id: entry.id,
        activity_type: activityType,
        points_earned: points
      });

      if (activityError) {
        console.error('Error adding activity:', activityError);
        Alert.alert('Fehler', 'Aktivität konnte nicht gespeichert werden.');
        return;
      }

      // Update daily entry points
      const newTotalPoints = (entry.total_points || 0) + points;
      const { error: updateError } = await SupabaseService.updateDailyEntry(entry.id, {
        total_points: newTotalPoints
      });

      if (updateError) {
        console.error('Error updating daily entry:', updateError);
        Alert.alert('Fehler', 'Punkte konnten nicht aktualisiert werden.');
        return;
      }

      // Update local state
      const newDailyPoints = userData.dailyPoints + points;
      const newLevel = Math.floor(newDailyPoints / 100) + 1;
      const leveledUp = newLevel > userData.level;

      const newData = {
        ...userData,
        dailyPoints: newDailyPoints,
        level: newLevel,
        [getActivityFlag(activityType)]: true
      };

      setUserData(newData);

      // Update today's entry
      setTodayEntry({ ...entry, total_points: newTotalPoints });

      if (leveledUp || newDailyPoints >= 5) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      Alert.alert(
        '🎉 Punkte erhalten!',
        `+${points} Punkte für ${action}!\n${leveledUp ? `🎊 Level ${newLevel} erreicht!` : ''}`,
        [{ text: 'Weiter so!', style: 'default' }]
      );

    } catch (error) {
      console.error('Error adding points:', error);
      Alert.alert('Fehler', 'Punkte konnten nicht hinzugefügt werden.');
    }
  };

  const getActivityFlag = (activityType: string): keyof UserData => {
    switch (activityType) {
      case 'wiegen': return 'weighedToday';
      case 'sport': return 'exercisedToday';
      case 'gesunde_mahlzeit': return 'healthyMealToday';
      case 'wasser': return 'waterToday';
      default: return 'weighedToday';
    }
  };

  const toggleEmergencyMode = () => {
    const newData = { ...userData, emergencyMode: !userData.emergencyMode };
    setUserData(newData);
    Alert.alert(
      userData.emergencyMode ? 'Normaler Modus' : 'Notfall-Modus',
      userData.emergencyMode 
        ? 'Zurück zu normalen Zielen!' 
        : 'Reduzierte Ziele für heute. Du schaffst das! 💪',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleSignOut = async () => {
    try {
      const { success, error } = await SupabaseService.signOut();
      if (success) {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setUserData(defaultUserData);
        Alert.alert('Erfolg', 'Erfolgreich abgemeldet!');
      } else {
        Alert.alert('Fehler', error || 'Abmeldung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Fehler', 'Abmeldung fehlgeschlagen');
    }
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={[commonStyles.container, commonStyles.center]}>
          <Text style={commonStyles.title}>ADHS Abnehm-Tracker</Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 32 }]}>
            Melde dich an, um deine Abnehm-Reise zu starten!
          </Text>
          
          <TouchableOpacity 
            style={[buttonStyles.primary, { marginBottom: 16, width: '80%' }]}
            onPress={() => router.push('/auth')}
          >
            <Text style={commonStyles.buttonText}>Anmelden / Registrieren</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.outline, { width: '80%' }]}
            onPress={() => router.push('/debug')}
          >
            <Text style={[commonStyles.buttonText, { color: colors.primary }]}>
              🔧 Debug-Modus
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={commonStyles.title}>Deine Abnehm-Reise</Text>
            <Text style={commonStyles.textSecondary}>
              {userData.currentWeight}kg → {userData.targetWeight}kg
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={[commonStyles.text, { color: colors.danger }]}>Abmelden</Text>
          </TouchableOpacity>
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
          onDataUpdate={setUserData}
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
