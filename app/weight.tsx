
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function WeightScreen() {
  const [weight, setWeight] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(72);

  useEffect(() => {
    loadCurrentWeight();
  }, []);

  const loadCurrentWeight = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const userData = JSON.parse(stored);
        setCurrentWeight(userData.currentWeight);
      }
    } catch (error) {
      console.log('Error loading weight:', error);
    }
  };

  const saveWeight = async () => {
    if (!weight || isNaN(parseFloat(weight))) {
      Alert.alert('Fehler', 'Bitte gib ein gültiges Gewicht ein.');
      return;
    }

    const newWeight = parseFloat(weight);
    
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const userData = JSON.parse(stored);
        
        // Save weight history
        const weightHistory = await AsyncStorage.getItem('weightHistory');
        const history = weightHistory ? JSON.parse(weightHistory) : [];
        history.push({
          weight: newWeight,
          date: new Date().toISOString(),
        });
        await AsyncStorage.setItem('weightHistory', JSON.stringify(history));

        // Update user data
        const updatedData = {
          ...userData,
          currentWeight: newWeight,
          weighedToday: true,
          dailyPoints: userData.weighedToday ? userData.dailyPoints : userData.dailyPoints + 1,
          totalPoints: userData.weighedToday ? userData.totalPoints : userData.totalPoints + 1,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));

        if (!userData.weighedToday) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          
          Alert.alert(
            '🎉 Gewicht gespeichert!',
            `+1 Punkt fürs Wiegen!\nNeues Gewicht: ${newWeight}kg`,
            [
              { 
                text: 'Weiter so!', 
                onPress: () => router.back(),
                style: 'default' 
              }
            ]
          );
        } else {
          Alert.alert(
            '✅ Gewicht aktualisiert',
            `Gewicht auf ${newWeight}kg aktualisiert`,
            [
              { 
                text: 'OK', 
                onPress: () => router.back(),
                style: 'default' 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.log('Error saving weight:', error);
      Alert.alert('Fehler', 'Gewicht konnte nicht gespeichert werden.');
    }
  };

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
          
          <Text style={commonStyles.title}>Gewicht eingeben</Text>
          <Text style={commonStyles.textSecondary}>
            Aktuelles Gewicht: {currentWeight}kg
          </Text>
        </View>

        {/* Weight Input */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Neues Gewicht</Text>
          
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 24,
          }}>
            <TextInput
              style={[commonStyles.text, { fontSize: 24, textAlign: 'center' }]}
              value={weight}
              onChangeText={setWeight}
              placeholder="z.B. 71.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <Text style={[commonStyles.textMuted, { textAlign: 'center', marginBottom: 24 }]}>
            Gib dein Gewicht in Kilogramm ein
          </Text>

          <TouchableOpacity 
            style={buttonStyles.primary}
            onPress={saveWeight}
          >
            <Text style={commonStyles.buttonText}>💾 Gewicht speichern</Text>
          </TouchableOpacity>
        </View>

        {/* Motivation */}
        <View style={[commonStyles.card, { backgroundColor: colors.success, marginTop: 24 }]}>
          <Text style={[commonStyles.text, { textAlign: 'center', fontWeight: '600' }]}>
            🎯 Jede Messung bringt dich deinem Ziel näher!
          </Text>
        </View>
      </View>

      {showConfetti && (
        <ConfettiCannon
          count={150}
          origin={{x: -10, y: 0}}
          autoStart={true}
          fadeOut={true}
        />
      )}
    </SafeAreaView>
  );
}
