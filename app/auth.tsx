
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import { SupabaseService } from '../services/supabaseService';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [age, setAge] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting sign in for:', email);
      const { success, error, message } = await SupabaseService.signIn(email, password);
      
      if (success) {
        Alert.alert('Erfolg', message || 'Erfolgreich angemeldet!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        console.error('Sign in failed:', error);
        
        // Show specific error message and offer to resend confirmation if needed
        if (error?.includes('E-Mail-Adresse')) {
          Alert.alert(
            'E-Mail nicht bestätigt', 
            error,
            [
              { text: 'Abbrechen', style: 'cancel' },
              { 
                text: 'E-Mail erneut senden', 
                onPress: async () => {
                  const { success: resendSuccess, message: resendMessage, error: resendError } = 
                    await SupabaseService.resendConfirmation(email);
                  
                  if (resendSuccess) {
                    Alert.alert('E-Mail gesendet', resendMessage || 'Bestätigungs-E-Mail wurde erneut gesendet.');
                  } else {
                    Alert.alert('Fehler', resendError || 'E-Mail konnte nicht gesendet werden.');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Anmeldung fehlgeschlagen', error || 'Unbekannter Fehler');
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Fehler', 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name || !height || !startWeight || !targetWeight || !age) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    const heightNum = parseInt(height);
    const startWeightNum = parseFloat(startWeight);
    const targetWeightNum = parseFloat(targetWeight);
    const ageNum = parseInt(age);

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige Größe zwischen 100 und 250 cm ein.');
      return;
    }

    if (isNaN(startWeightNum) || startWeightNum < 30 || startWeightNum > 300) {
      Alert.alert('Fehler', 'Bitte geben Sie ein gültiges Startgewicht zwischen 30 und 300 kg ein.');
      return;
    }

    if (isNaN(targetWeightNum) || targetWeightNum < 30 || targetWeightNum > 300) {
      Alert.alert('Fehler', 'Bitte geben Sie ein gültiges Zielgewicht zwischen 30 und 300 kg ein.');
      return;
    }

    if (isNaN(ageNum) || ageNum < 16 || ageNum > 120) {
      Alert.alert('Fehler', 'Bitte geben Sie ein gültiges Alter zwischen 16 und 120 Jahren ein.');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting sign up for:', email);
      const { success, error, message } = await SupabaseService.signUp(email, password);
      
      if (success) {
        // Store user data temporarily for after email confirmation
        // We'll create the profile when they first sign in successfully
        const userData = {
          name,
          height: heightNum,
          start_weight: startWeightNum,
          target_weight: targetWeightNum,
          age: ageNum
        };
        
        // Store in local storage temporarily
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(`pending_user_data_${email}`, JSON.stringify(userData));
        } catch (storageError) {
          console.log('Could not store user data temporarily:', storageError);
        }

        Alert.alert(
          'Registrierung erfolgreich!', 
          message || 'Bitte überprüfen Sie Ihre E-Mail zur Bestätigung. Sie können sich danach anmelden.',
          [{ text: 'OK', onPress: () => setIsSignUp(false) }]
        );
        
        // Clear form
        setEmail('');
        setPassword('');
        setName('');
        setHeight('');
        setStartWeight('');
        setTargetWeight('');
        setAge('');
      } else {
        console.error('Sign up failed:', error);
        Alert.alert('Registrierung fehlgeschlagen', error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Fehler', 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 32 }}>
          <Text style={commonStyles.title}>
            {isSignUp ? 'Registrieren' : 'Anmelden'}
          </Text>
          <Text style={commonStyles.textSecondary}>
            {isSignUp 
              ? 'Erstelle dein Konto für deine Abnehm-Reise'
              : 'Melde dich an, um fortzufahren'
            }
          </Text>
        </View>

        <View style={commonStyles.card}>
          {isSignUp && (
            <>
              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Name</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={name}
                onChangeText={setName}
                placeholder="Dein Name"
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Größe (cm)</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={height}
                onChangeText={setHeight}
                placeholder="z.B. 160"
                keyboardType="numeric"
                editable={!loading}
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Startgewicht (kg)</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={startWeight}
                onChangeText={setStartWeight}
                placeholder="z.B. 72"
                keyboardType="numeric"
                editable={!loading}
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Zielgewicht (kg)</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="z.B. 60"
                keyboardType="numeric"
                editable={!loading}
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Alter</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={age}
                onChangeText={setAge}
                placeholder="z.B. 46"
                keyboardType="numeric"
                editable={!loading}
              />
            </>
          )}

          <Text style={[commonStyles.text, { marginBottom: 8 }]}>E-Mail</Text>
          <TextInput
            style={[commonStyles.input, { marginBottom: 16 }]}
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.de"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={[commonStyles.text, { marginBottom: 8 }]}>Passwort</Text>
          <TextInput
            style={[commonStyles.input, { marginBottom: 24 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 6 Zeichen"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[buttonStyles.primary, { marginBottom: 16, opacity: loading ? 0.6 : 1 }]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? 'Lädt...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.outline, { opacity: loading ? 0.6 : 1 }]}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            <Text style={[commonStyles.buttonText, { color: colors.primary }]}>
              {isSignUp 
                ? 'Bereits ein Konto? Anmelden' 
                : 'Noch kein Konto? Registrieren'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={[commonStyles.card, { backgroundColor: colors.accent, marginTop: 16 }]}>
          <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
            💡 Hilfe
          </Text>
          <Text style={[commonStyles.textSecondary, { fontSize: 14 }]}>
            {isSignUp 
              ? 'Nach der Registrierung erhalten Sie eine E-Mail zur Bestätigung. Bitte klicken Sie auf den Link in der E-Mail, bevor Sie sich anmelden.'
              : 'Probleme beim Anmelden? Stellen Sie sicher, dass Sie Ihre E-Mail-Adresse bestätigt haben.'
            }
          </Text>
        </View>

        <TouchableOpacity 
          style={[buttonStyles.outline, { marginTop: 16, opacity: loading ? 0.6 : 1 }]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={[commonStyles.buttonText, { color: colors.text }]}>
            Zurück
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
