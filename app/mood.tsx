
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MoodType = 'good' | 'okay' | 'bad';

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);

  useEffect(() => {
    loadCurrentMood();
  }, []);

  const loadCurrentMood = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const userData = JSON.parse(stored);
        setCurrentMood(userData.mood);
        setSelectedMood(userData.mood);
      }
    } catch (error) {
      console.log('Error loading mood:', error);
    }
  };

  const saveMood = async (mood: MoodType) => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const userData = JSON.parse(stored);
        
        const updatedData = {
          ...userData,
          mood: mood,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));

        const moodMessages = {
          good: 'Fantastisch! Du strahlst heute! ✨',
          okay: 'Das ist völlig okay. Morgen wird besser! 💪',
          bad: 'Schwere Tage gehören dazu. Du bist stark! 🤗'
        };

        Alert.alert(
          '💝 Stimmung gespeichert',
          moodMessages[mood],
          [
            { 
              text: 'Danke', 
              onPress: () => router.back(),
              style: 'default' 
            }
          ]
        );
      }
    } catch (error) {
      console.log('Error saving mood:', error);
      Alert.alert('Fehler', 'Stimmung konnte nicht gespeichert werden.');
    }
  };

  const moodOptions = [
    { 
      type: 'good' as MoodType, 
      emoji: '😊', 
      label: 'Gut', 
      color: colors.success,
      description: 'Ich fühle mich großartig!'
    },
    { 
      type: 'okay' as MoodType, 
      emoji: '😐', 
      label: 'Okay', 
      color: colors.warning,
      description: 'Geht so, könnte besser sein'
    },
    { 
      type: 'bad' as MoodType, 
      emoji: '😔', 
      label: 'Schlecht', 
      color: colors.error,
      description: 'Heute ist ein schwerer Tag'
    },
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.content}>
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ marginBottom: 16 }}
          >
            <Text style={[commonStyles.text, { color: colors.blue }]}>← Zurück</Text>
          </TouchableOpacity>
          
          <Text style={commonStyles.title}>Wie fühlst du dich?</Text>
          <Text style={commonStyles.textSecondary}>
            Deine Stimmung zu tracken hilft dir dabei, Muster zu erkennen
          </Text>
        </View>

        {/* Current Mood */}
        {currentMood && (
          <View style={[commonStyles.card, { marginBottom: 24 }]}>
            <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
              Aktuelle Stimmung:
            </Text>
            <Text style={[commonStyles.text, { fontSize: 18 }]}>
              {moodOptions.find(m => m.type === currentMood)?.emoji} {' '}
              {moodOptions.find(m => m.type === currentMood)?.label}
            </Text>
          </View>
        )}

        {/* Mood Selection */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 24 }]}>
            Wähle deine heutige Stimmung
          </Text>
          
          {moodOptions.map((mood) => (
            <TouchableOpacity
              key={mood.type}
              style={[
                {
                  backgroundColor: selectedMood === mood.type ? mood.color : colors.background,
                  borderWidth: 2,
                  borderColor: mood.color,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                  alignItems: 'center',
                },
              ]}
              onPress={() => {
                setSelectedMood(mood.type);
                saveMood(mood.type);
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{mood.emoji}</Text>
              <Text style={[
                commonStyles.text, 
                { 
                  fontWeight: '600', 
                  marginBottom: 4,
                  color: selectedMood === mood.type ? colors.text : mood.color
                }
              ]}>
                {mood.label}
              </Text>
              <Text style={[
                commonStyles.textSecondary, 
                { 
                  textAlign: 'center',
                  color: selectedMood === mood.type ? colors.text : colors.textSecondary
                }
              ]}>
                {mood.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Motivation */}
        <View style={[commonStyles.card, { backgroundColor: colors.accent, marginTop: 24 }]}>
          <Text style={[commonStyles.text, { textAlign: 'center', fontWeight: '600' }]}>
            🧠 Deine Gefühle sind wichtig und gültig. 
            Jeder Tag ist ein neuer Anfang! 💙
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
