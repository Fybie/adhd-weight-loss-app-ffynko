
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';
import { supabase } from './integrations/supabase/client';

export default function EmailConfirmedScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      // Get the current session to check if user is now confirmed
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setStatus('error');
        setMessage('Fehler beim Überprüfen der E-Mail-Bestätigung.');
        return;
      }

      if (session?.user?.email_confirmed_at) {
        setStatus('success');
        setMessage('Ihre E-Mail-Adresse wurde erfolgreich bestätigt! Sie können sich jetzt anmelden.');
      } else {
        setStatus('error');
        setMessage('E-Mail-Bestätigung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      setStatus('error');
      setMessage('Ein unerwarteter Fehler ist aufgetreten.');
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={[commonStyles.container, commonStyles.center]}>
        <View style={[commonStyles.card, { alignItems: 'center' }]}>
          {status === 'loading' && (
            <>
              <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 16 }]}>
                ⏳ Überprüfung...
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center' }]}>
                Ihre E-Mail-Bestätigung wird überprüft...
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 16, color: colors.success }]}>
                ✅ Bestätigt!
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 24 }]}>
                {message}
              </Text>
              <TouchableOpacity 
                style={[buttonStyles.primary, { width: '100%' }]}
                onPress={() => router.replace('/auth')}
              >
                <Text style={commonStyles.buttonText}>Zur Anmeldung</Text>
              </TouchableOpacity>
            </>
          )}

          {status === 'error' && (
            <>
              <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 16, color: colors.danger }]}>
                ❌ Fehler
              </Text>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 24 }]}>
                {message}
              </Text>
              <TouchableOpacity 
                style={[buttonStyles.primary, { width: '100%', marginBottom: 12 }]}
                onPress={() => router.replace('/auth')}
              >
                <Text style={commonStyles.buttonText}>Zur Anmeldung</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[buttonStyles.outline, { width: '100%' }]}
                onPress={handleEmailConfirmation}
              >
                <Text style={[commonStyles.buttonText, { color: colors.primary }]}>
                  Erneut versuchen
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
