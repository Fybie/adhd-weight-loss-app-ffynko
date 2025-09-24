
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SupabaseService } from '../services/supabaseService';

export default function WeightScreen() {
  const [weight, setWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = async () => {
    try {
      const { session } = await SupabaseService.getCurrentUser();
      if (!session?.user) {
        Alert.alert('Fehler', 'Nicht angemeldet', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setCurrentUserId(session.user.id);

      // Get user profile for current and target weight
      const { data: userProfile } = await SupabaseService.getUser(session.user.id);
      if (userProfile) {
        setCurrentWeight(userProfile.start_weight || 0);
        setTargetWeight(userProfile.target_weight || 0);
      }

      // Get latest weight from daily entries
      const { data: entries } = await SupabaseService.getDailyEntries(session.user.id, 1);
      if (entries && entries.length > 0 && entries[0].weight) {
        setCurrentWeight(entries[0].weight);
      }

    } catch (error) {
      console.error('Error loading weight data:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const saveWeight = async () => {
    if (!weight || !currentUserId) {
      Alert.alert('Fehler', 'Bitte Gewicht eingeben.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Fehler', 'Bitte gültiges Gewicht eingeben.');
      return;
    }

    try {
      // Get or create today's entry
      const today = new Date().toISOString().split('T')[0];
      let { data: entries } = await SupabaseService.getDailyEntries(currentUserId, 1);
      
      let todayEntry = null;
      if (entries && entries.length > 0 && entries[0].date === today) {
        todayEntry = entries[0];
      }

      if (todayEntry) {
        // Update existing entry
        const { error } = await SupabaseService.updateDailyEntry(todayEntry.id, {
          weight: weightNum
        });
        if (error) {
          Alert.alert('Fehler', 'Gewicht konnte nicht gespeichert werden.');
          return;
        }
      } else {
        // Create new entry
        const { error } = await SupabaseService.createDailyEntry({
          user_id: currentUserId,
          date: today,
          weight: weightNum,
          total_points: 0
        });
        if (error) {
          Alert.alert('Fehler', 'Gewicht konnte nicht gespeichert werden.');
          return;
        }
      }

      const weightDiff = currentWeight - weightNum;
      const isProgress = weightDiff > 0;

      if (isProgress) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      Alert.alert(
        isProgress ? '🎉 Fortschritt!' : '📊 Gewicht gespeichert',
        isProgress 
          ? `Du hast ${weightDiff.toFixed(1)}kg abgenommen! Weiter so! 💪`
          : `Gewicht ${weightNum}kg gespeichert.`,
        [
          { 
            text: 'Zurück zur Übersicht', 
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error saving weight:', error);
      Alert.alert('Fehler', 'Gewicht konnte nicht gespeichert werden.');
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

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.content}>
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text style={commonStyles.title}>Gewicht eingeben</Text>
          <Text style={commonStyles.textSecondary}>
            Aktuell: {currentWeight}kg → Ziel: {targetWeight}kg
          </Text>
        </View>

        {/* Weight Input */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
            Heutiges Gewicht
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <TextInput
              style={[
                commonStyles.input,
                { 
                  flex: 1, 
                  fontSize: 24, 
                  textAlign: 'center',
                  marginRight: 12
                }
              ]}
              value={weight}
              onChangeText={setWeight}
              placeholder={currentWeight.toString()}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={[commonStyles.text, { fontSize: 20, fontWeight: '600' }]}>
              kg
            </Text>
          </View>

          <TouchableOpacity 
            style={buttonStyles.primary}
            onPress={saveWeight}
          >
            <Text style={commonStyles.buttonText}>
              ⚖️ Gewicht speichern (+1 Punkt)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Info */}
        <View style={[commonStyles.card, { backgroundColor: colors.accent }]}>
          <Text style={[commonStyles.text, { textAlign: 'center', fontWeight: '600' }]}>
            💡 Tipp: Wiege dich jeden Tag zur gleichen Zeit für die besten Ergebnisse!
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity 
          style={[buttonStyles.outline, { marginTop: 16 }]}
          onPress={() => router.back()}
        >
          <Text style={[commonStyles.buttonText, { color: colors.text }]}>
            Zurück
          </Text>
        </TouchableOpacity>
      </View>

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
