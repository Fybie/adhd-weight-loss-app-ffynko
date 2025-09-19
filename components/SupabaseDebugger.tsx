
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../app/integrations/supabase/client';
import { SupabaseService } from '../services/supabaseService';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';

interface ApiCall {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  duration?: number;
  data?: any;
  error?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  projectUrl: string;
  authStatus: string;
  lastChecked: string;
  tablesCount: number;
}

const SupabaseDebugger: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    projectUrl: '',
    authStatus: 'Unknown',
    lastChecked: '',
    tablesCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    testConnection();
    setupApiCallLogging();
  }, []);

  const addApiCall = (call: Omit<ApiCall, 'id' | 'timestamp'>) => {
    const newCall: ApiCall = {
      ...call,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString()
    };
    setApiCalls(prev => [newCall, ...prev.slice(0, 49)]); // Keep last 50 calls
    console.log('API Call logged:', newCall);
  };

  const setupApiCallLogging = () => {
    // Override the original fetch to log all API calls
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] as string;
      
      if (url.includes('supabase.co')) {
        const method = args[1]?.method || 'GET';
        addApiCall({
          method: method,
          endpoint: url.replace('https://fvzhybddmulufmfjuvwl.supabase.co', ''),
          status: 'pending'
        });

        try {
          const response = await originalFetch(...args);
          const duration = Date.now() - startTime;
          
          addApiCall({
            method: method,
            endpoint: url.replace('https://fvzhybddmulufmfjuvwl.supabase.co', ''),
            status: response.ok ? 'success' : 'error',
            duration,
            data: `${response.status} ${response.statusText}`
          });

          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          addApiCall({
            method: method,
            endpoint: url.replace('https://fvzhybddmulufmfjuvwl.supabase.co', ''),
            status: 'error',
            duration,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      }
      
      return originalFetch(...args);
    };
  };

  const testConnection = async () => {
    setIsLoading(true);
    console.log('=== Starting Supabase Connection Test ===');
    
    try {
      // Test basic connection using service
      const connectionResult = await SupabaseService.testConnection();
      
      // Get auth status
      const { session, error: authError } = await SupabaseService.getCurrentUser();
      
      // Count tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      addApiCall({
        method: 'SELECT',
        endpoint: 'information_schema.tables',
        status: tablesError ? 'error' : 'success',
        data: tablesData ? `${tablesData.length} tables found` : 'No data',
        error: tablesError?.message
      });

      setConnectionStatus({
        isConnected: connectionResult.success,
        projectUrl: supabase.supabaseUrl,
        authStatus: session ? `Authenticated (${session.user.email})` : 'Not authenticated',
        lastChecked: new Date().toLocaleTimeString(),
        tablesCount: tablesData?.length || 0
      });

      console.log('=== Connection Test Results ===');
      console.log('Connected:', connectionResult.success);
      console.log('Auth Status:', session ? 'Authenticated' : 'Not authenticated');
      console.log('Tables Count:', tablesData?.length || 0);
      
    } catch (err) {
      console.error('=== Connection Test Failed ===', err);
      addApiCall({
        method: 'CONNECTION',
        endpoint: 'test',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        lastChecked: new Date().toLocaleTimeString()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseOperations = async () => {
    console.log('=== Testing Database Operations ===');
    
    try {
      // Test creating a daily entry (will fail due to RLS but we can see the API call)
      const testEntry = {
        user_id: '00000000-0000-0000-0000-000000000000',
        date: new Date().toISOString().split('T')[0],
        total_points: 5,
        mood: 'gut' as const,
        notes: 'Test entry from debugger'
      };

      const createResult = await SupabaseService.createDailyEntry(testEntry);
      
      // Test selecting daily entries
      const selectResult = await SupabaseService.getDailyEntries('00000000-0000-0000-0000-000000000000', 5);

      // Test selecting from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      addApiCall({
        method: 'SELECT',
        endpoint: 'users (sample)',
        status: usersError ? 'error' : 'success',
        data: usersData ? `${usersData.length} users` : 'No data',
        error: usersError?.message
      });

      console.log('=== Database Operations Test Completed ===');
      
    } catch (err) {
      console.error('=== Database Operations Test Failed ===', err);
      addApiCall({
        method: 'DATABASE_TEST',
        endpoint: 'operations',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const testAuthOperations = async () => {
    console.log('=== Testing Auth Operations ===');
    
    try {
      // Test sign up (will likely fail but we can see the API call)
      const signUpResult = await SupabaseService.signUp(
        'test@example.com', 
        'testpassword123'
      );

      // Test getting current session again
      const { session } = await SupabaseService.getCurrentUser();

      Alert.alert(
        'Auth Test Results',
        `Sign Up: ${signUpResult.success ? 'Success' : 'Failed'}\n` +
        `Current Session: ${session ? 'Authenticated' : 'Not authenticated'}\n` +
        `${signUpResult.error || signUpResult.message || ''}`,
        [{ text: 'OK' }]
      );

      console.log('=== Auth Operations Test Completed ===');
      
    } catch (err) {
      console.error('=== Auth Operations Test Failed ===', err);
      addApiCall({
        method: 'AUTH_TEST',
        endpoint: 'auth',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const testRLSPolicies = async () => {
    console.log('=== Testing RLS Policies ===');
    
    try {
      // Test accessing tables without authentication (should fail due to RLS)
      const tables = ['users', 'daily_entries', 'activities', 'progress_photos'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        addApiCall({
          method: 'RLS_TEST',
          endpoint: `${table} (RLS check)`,
          status: error ? 'error' : 'success',
          data: data ? `${data.length} rows` : 'No data',
          error: error?.message
        });
      }

      console.log('=== RLS Policies Test Completed ===');
      
    } catch (err) {
      console.error('=== RLS Policies Test Failed ===', err);
      addApiCall({
        method: 'RLS_TEST',
        endpoint: 'policies',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const clearApiCalls = () => {
    setApiCalls([]);
    console.log('API calls cleared');
  };

  const exportDebugInfo = () => {
    const debugInfo = {
      connectionStatus,
      apiCalls: apiCalls.slice(0, 20), // Last 20 calls
      timestamp: new Date().toISOString(),
      projectId: 'fvzhybddmulufmfjuvwl'
    };
    
    console.log('=== DEBUG INFO EXPORT ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    Alert.alert(
      'Debug Info Exported',
      'Debug information has been logged to console. Check the developer console for details.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'pending': return colors.warning;
      default: return colors.text;
    }
  };

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={[commonStyles.title, { color: colors.text, marginBottom: 20 }]}>
          🔧 Supabase Debugger
        </Text>

        {/* Connection Status */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📡 Verbindungsstatus
          </Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Status:</Text>
            <Text style={[styles.statusValue, { 
              color: connectionStatus.isConnected ? colors.success : colors.error 
            }]}>
              {connectionStatus.isConnected ? '✅ Verbunden' : '❌ Nicht verbunden'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Projekt:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]} numberOfLines={1}>
              fvzhybddmulufmfjuvwl
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Auth:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]} numberOfLines={1}>
              {connectionStatus.authStatus}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Tabellen:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {connectionStatus.tablesCount}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Letzter Check:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {connectionStatus.lastChecked}
            </Text>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🧪 Tests
          </Text>
          <TouchableOpacity
            style={[buttonStyles.primary, { marginBottom: 10 }]}
            onPress={testConnection}
            disabled={isLoading}
          >
            <Text style={[buttonStyles.primaryText, { color: colors.background }]}>
              {isLoading ? '⏳ Teste...' : '🔄 Verbindung testen'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[buttonStyles.secondary, { marginBottom: 10 }]}
            onPress={testDatabaseOperations}
          >
            <Text style={[buttonStyles.secondaryText, { color: colors.background }]}>
              🗄️ Datenbank testen
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[buttonStyles.outline, { marginBottom: 10, borderColor: colors.warning }]}
            onPress={testAuthOperations}
          >
            <Text style={[buttonStyles.secondaryText, { color: colors.warning }]}>
              🔐 Auth testen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.outline, { marginBottom: 10, borderColor: colors.purple }]}
            onPress={testRLSPolicies}
          >
            <Text style={[buttonStyles.secondaryText, { color: colors.purple }]}>
              🛡️ RLS Policies testen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.outline, { marginBottom: 10, borderColor: colors.blue }]}
            onPress={exportDebugInfo}
          >
            <Text style={[buttonStyles.secondaryText, { color: colors.blue }]}>
              📤 Debug Info exportieren
            </Text>
          </TouchableOpacity>
        </View>

        {/* API Calls Log */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📋 API Calls ({apiCalls.length})
            </Text>
            <TouchableOpacity onPress={clearApiCalls}>
              <Text style={[styles.clearButton, { color: colors.error }]}>
                🗑️ Löschen
              </Text>
            </TouchableOpacity>
          </View>
          
          {apiCalls.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Keine API Calls aufgezeichnet
            </Text>
          ) : (
            apiCalls.map((call) => (
              <View key={call.id} style={[styles.apiCall, { 
                borderLeftColor: getStatusColor(call.status),
                backgroundColor: colors.backgroundAlt 
              }]}>
                <View style={styles.apiCallHeader}>
                  <Text style={[styles.apiCallMethod, { color: getStatusColor(call.status) }]}>
                    {call.method}
                  </Text>
                  <Text style={[styles.apiCallTime, { color: colors.textSecondary }]}>
                    {call.timestamp}
                  </Text>
                </View>
                <Text style={[styles.apiCallEndpoint, { color: colors.text }]} numberOfLines={2}>
                  {call.endpoint}
                </Text>
                <View style={styles.apiCallFooter}>
                  <Text style={[styles.apiCallStatus, { color: getStatusColor(call.status) }]}>
                    {call.status.toUpperCase()}
                  </Text>
                  {call.duration && (
                    <Text style={[styles.apiCallDuration, { color: colors.textSecondary }]}>
                      {call.duration}ms
                    </Text>
                  )}
                </View>
                {call.error && (
                  <Text style={[styles.apiCallError, { color: colors.error }]} numberOfLines={3}>
                    ❌ {call.error}
                  </Text>
                )}
                {call.data && (
                  <Text style={[styles.apiCallData, { color: colors.textSecondary }]} numberOfLines={2}>
                    📄 {typeof call.data === 'object' ? JSON.stringify(call.data) : call.data}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  section: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right' as const,
  },
  emptyText: {
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    marginTop: 20,
  },
  apiCall: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 6,
  },
  apiCallHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  apiCallMethod: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
  },
  apiCallTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  apiCallEndpoint: {
    fontSize: 13,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  apiCallFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  apiCallStatus: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  apiCallDuration: {
    fontSize: 11,
    opacity: 0.7,
  },
  apiCallError: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  apiCallData: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8,
    fontFamily: 'monospace',
  },
};

export default SupabaseDebugger;
