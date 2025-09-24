
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from './integrations/supabase/client';

export default function TestAuthScreen() {
  const [authState, setAuthState] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setAuthState({ event, session });
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    setLoading(true);
    try {
      const { session, error } = await SupabaseService.getCurrentUser();
      setAuthState({ session, error });
      
      if (session?.user) {
        const { data: profile, error: profileError } = await SupabaseService.getUser(session.user.id);
        setUserProfile({ profile, profileError });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    try {
      const { success, error, message } = await SupabaseService.signIn('fybie@gmx.de', 'test123');
      Alert.alert(
        success ? 'Erfolg' : 'Fehler',
        message || error || 'Unbekannter Status'
      );
      if (success) {
        await checkAuthState();
      }
    } catch (error) {
      console.error('Test sign in error:', error);
      Alert.alert('Fehler', 'Test-Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    setLoading(true);
    try {
      const { success, error } = await SupabaseService.signOut();
      Alert.alert(
        success ? 'Erfolg' : 'Fehler',
        success ? 'Erfolgreich abgemeldet' : (error || 'Abmeldung fehlgeschlagen')
      );
      if (success) {
        await checkAuthState();
      }
    } catch (error) {
      console.error('Test sign out error:', error);
      Alert.alert('Fehler', 'Test-Abmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { success, error } = await SupabaseService.testConnection();
      Alert.alert(
        success ? 'Verbindung OK' : 'Verbindungsfehler',
        success ? 'Supabase-Verbindung funktioniert' : (error || 'Unbekannter Fehler')
      );
    } catch (error) {
      console.error('Test connection error:', error);
      Alert.alert('Fehler', 'Verbindungstest fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 32 }}>
          <Text style={commonStyles.title}>🔧 Auth Test</Text>
          <Text style={commonStyles.textSecondary}>
            Teste die Authentifizierung
          </Text>
        </View>

        {/* Auth State */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Authentifizierungsstatus</Text>
          
          <Text style={[commonStyles.text, { fontFamily: 'monospace', fontSize: 12 }]}>
            {JSON.stringify(authState, null, 2)}
          </Text>
        </View>

        {/* User Profile */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Benutzerprofil</Text>
          
          <Text style={[commonStyles.text, { fontFamily: 'monospace', fontSize: 12 }]}>
            {JSON.stringify(userProfile, null, 2)}
          </Text>
        </View>

        {/* Test Buttons */}
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Tests</Text>
          
          <TouchableOpacity 
            style={[buttonStyles.primary, { marginBottom: 12, opacity: loading ? 0.6 : 1 }]}
            onPress={testConnection}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? 'Teste...' : '🔗 Verbindung testen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.secondary, { marginBottom: 12, opacity: loading ? 0.6 : 1 }]}
            onPress={testSignIn}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? 'Teste...' : '🔑 Test-Anmeldung'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.outline, { marginBottom: 12, opacity: loading ? 0.6 : 1 }]}
            onPress={testSignOut}
            disabled={loading}
          >
            <Text style={[commonStyles.buttonText, { color: colors.danger }]}>
              {loading ? 'Teste...' : '🚪 Test-Abmeldung'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.outline, { marginBottom: 12, opacity: loading ? 0.6 : 1 }]}
            onPress={checkAuthState}
            disabled={loading}
          >
            <Text style={[commonStyles.buttonText, { color: colors.primary }]}>
              {loading ? 'Lädt...' : '🔄 Status aktualisieren'}
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
