
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import { router } from 'expo-router';

export default function TestScreen() {
  const handleTest = () => {
    Alert.alert('Success', 'App is working correctly!');
  };

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <View style={commonStyles.content}>
        <Text style={[commonStyles.title, { color: colors.text }]}>
          App Test Screen
        </Text>
        
        <Text style={[commonStyles.subtitle, { color: colors.textSecondary, marginBottom: 30 }]}>
          This screen verifies that your app is working correctly
        </Text>

        <TouchableOpacity 
          style={[buttonStyles.primary, { marginBottom: 20 }]}
          onPress={handleTest}
        >
          <Text style={buttonStyles.primaryText}>Test Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[buttonStyles.secondary, { marginBottom: 20 }]}
          onPress={() => router.push('/')}
        >
          <Text style={buttonStyles.secondaryText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ 
          backgroundColor: colors.cardBackground, 
          padding: 20, 
          borderRadius: 12,
          marginTop: 20 
        }}>
          <Text style={[commonStyles.bodyText, { color: colors.text }]}>
            ✅ React Native components working
          </Text>
          <Text style={[commonStyles.bodyText, { color: colors.text }]}>
            ✅ Expo Router navigation working
          </Text>
          <Text style={[commonStyles.bodyText, { color: colors.text }]}>
            ✅ Styling system working
          </Text>
          <Text style={[commonStyles.bodyText, { color: colors.text }]}>
            ✅ SafeAreaView working
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
