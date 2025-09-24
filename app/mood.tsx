
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import { SupabaseService } from '../services/supabaseService';

type MoodType = 'gut' | 'okay' | 'schlecht' | null;

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodType>(null);
  const [currentMood, setCurrentMood] = useState<MoodType>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentMood();
  }, []);

  const loadCurrentMood = async () => {
    try {
      const { session } = await SupabaseService.getCurrentUser();
      if (!session?.user) {
        Alert.alert('Fehler', 'Nicht angemeldet', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setCurrentUserId(session.user.id);

      // Get today's entry to check current mood
      const today = new Date().toISOString().split('T')[0];
      const { data: entries } = await SupabaseService.getDailyEntries(session.user.id, 1);
      
      if (entries && entries.length > 0 && entries[0].date === today) {
        const todayMood = entries[0].mood as MoodType;
        setCurrentMood(todayMood);
        setSelectedMood(todayMood);
      }

    } catch (error) {
      console.error('Error loading mood:', error);
      Alert.alert('Fehler', 'Stimmung konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const saveMood = async (mood: MoodType) => {
    if (!currentUserId) return;

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
          mood: mood
        });
        if (error) {
          Alert.alert('Fehler', 'Stimmung konnte nicht gespeichert werden.');
          return;
        }
      } else {
        // Create new entry
        const { error } = await SupabaseService.createDailyEntry({
          user_id: currentUserId,
          date: today,
          mood: mood,
          total_points: 0
        });
        if (error) {
          Alert.alert('Fehler', 'Stimmung konnte nicht gespeichert werden.');
          return;
        }
      }

      setCurrentMood(mood);
      setSelectedMood(mood);

      const moodMessages = {
        gut: 'Fantastisch! Du strahlst heute! ✨',
        okay: 'Das ist völlig in Ordnung. Jeder Tag ist anders. 💙',
        schlecht: 'Schwere Tage gehören dazu. Du bist stark! 💪'
      };

      Alert.alert(
        'Stimmung gespeichert',
        mood ? moodMessages[mood] : 'Stimmung wurde entfernt.',
        [{ text: 'Zurück', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Fehler', 'Stimmung konnte nicht gespeichert werden.');
    }
  };

  const getMoodEmoji = (mood: MoodType) => {
    switch (mood) {
      case 'gut': return '😊';
      case 'okay': return '😐';
      case 'schlecht': return '😔';
      default: return '❓';
    }
  };

  const getMoodColor = (mood: MoodType) => {
    switch (mood) {
      case 'gut': return colors.success;
      case 'okay': return colors.warning;
      case 'schlecht': return colors.danger;
      default: return colors.text;
    }
  };

  const getMoodStyle = (mood: MoodType) => [
    buttonStyles.outline,
    {
      marginBottom: 16,
      borderColor: selectedMood === mood ? getMoodColor(mood) : colors.border,
      backgroundColor: selectedMood === mood ? getMoodColor(mood) + '20' : 'transparent'
    }
  ];

  const getMoodTextStyle = (mood: MoodType) => [
    commonStyles.buttonText,
    {
      color: selectedMood === mood ? getMoodColor(mood) : colors.text,
      fontWeight: selectedMood === mood ? '600' : '400'
    }
  ];

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
          <Text style={commonStyles.title}>Wie fühlst du dich?</Text>
          <Text style={commonStyles.textSecondary}>
            {currentMood 
              ? `Aktuelle Stimmung: ${getMoodEmoji(currentMood)} ${currentMood}`
              : 'Noch keine Stimmung heute erfasst'
            }
          </Text>
        </View>

        {/* Mood Options */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 24 }]}>
            Wähle deine heutige Stimmung
          </Text>

          <TouchableOpacity 
            style={getMoodStyle('gut')}
            onPress={() => setSelectedMood('gut')}
          >
            <Text style={getMoodTextStyle('gut')}>
              😊 Gut - Ich fühle mich großartig!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={getMoodStyle('okay')}
            onPress={() => setSelectedMood('okay')}
          >
            <Text style={getMoodTextStyle('okay')}>
              😐 Okay - Geht so, normaler Tag
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={getMoodStyle('schlecht')}
            onPress={() => setSelectedMood('schlecht')}
          >
            <Text style={getMoodTextStyle('schlecht')}>
              😔 Schlecht - Heute ist schwer
            </Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity 
            style={[
              buttonStyles.primary,
              { 
                marginTop: 24,
                opacity: selectedMood ? 1 : 0.5
              }
            ]}
            onPress={() => saveMood(selectedMood)}
            disabled={!selectedMood}
          >
            <Text style={commonStyles.buttonText}>
              💾 Stimmung speichern
            </Text>
          </TouchableOpacity>

          {/* Clear Button */}
          {currentMood && (
            <TouchableOpacity 
              style={[buttonStyles.outline, { marginTop: 12 }]}
              onPress={() => saveMood(null)}
            >
              <Text style={[commonStyles.buttonText, { color: colors.text }]}>
                🗑️ Stimmung entfernen
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Card */}
        <View style={[commonStyles.card, { backgroundColor: colors.accent }]}>
          <Text style={[commonStyles.text, { textAlign: 'center', fontWeight: '600' }]}>
            💡 Das Tracken deiner Stimmung hilft dir, Muster zu erkennen und besser auf dich zu achten.
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
    </SafeAreaView>
  );
}
