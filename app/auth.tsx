
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
      const { success, error, message } = await SupabaseService.signIn(email, password);
      
      if (success) {
        Alert.alert('Erfolg', message || 'Erfolgreich angemeldet!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        Alert.alert('Anmeldung fehlgeschlagen', error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Fehler', 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name || !height || !startWeight || !targetWeight || !age) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.');
      return;
    }

    setLoading(true);
    try {
      const { success, error, message } = await SupabaseService.signUp(email, password);
      
      if (success) {
        // Create user profile after successful signup
        const { session } = await SupabaseService.getCurrentUser();
        if (session?.user) {
          await SupabaseService.createUser({
            id: session.user.id,
            name,
            height: parseInt(height),
            start_weight: parseFloat(startWeight),
            target_weight: parseFloat(targetWeight),
            age: parseInt(age)
          });
        }

        Alert.alert(
          'Registrierung erfolgreich!', 
          'Bitte überprüfen Sie Ihre E-Mail zur Bestätigung. Sie können sich danach anmelden.',
          [{ text: 'OK', onPress: () => setIsSignUp(false) }]
        );
      } else {
        Alert.alert('Registrierung fehlgeschlagen', error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Fehler', 'Registrierung fehlgeschlagen');
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
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Größe (cm)</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={height}
                onChangeText={setHeight}
                placeholder="z.B. 160"
                keyboardType="numeric"
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Startgewicht (kg)</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={startWeight}
                onChangeText={setStartWeight}
                placeholder="z.B. 72"
                keyboardType="numeric"
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Zielgewicht (kg)</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="z.B. 60"
                keyboardType="numeric"
              />

              <Text style={[commonStyles.text, { marginBottom: 8 }]}>Alter</Text>
              <TextInput
                style={[commonStyles.input, { marginBottom: 16 }]}
                value={age}
                onChangeText={setAge}
                placeholder="z.B. 46"
                keyboardType="numeric"
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
          />

          <TouchableOpacity 
            style={[buttonStyles.primary, { marginBottom: 16 }]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? 'Lädt...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={buttonStyles.outline}
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

        <TouchableOpacity 
          style={[buttonStyles.outline, { marginTop: 16 }]}
          onPress={() => router.back()}
        >
          <Text style={[commonStyles.buttonText, { color: colors.text }]}>
            Zurück
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
