
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
  rlsPoliciesCount: number;
  currentUserId?: string;
}

interface TestResults {
  connection: boolean;
  database: boolean;
  auth: boolean;
  rls: boolean;
}

const SupabaseDebugger: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    projectUrl: '',
    authStatus: 'Unknown',
    lastChecked: '',
    tablesCount: 0,
    rlsPoliciesCount: 0
  });
  const [testResults, setTestResults] = useState<TestResults>({
    connection: false,
    database: false,
    auth: false,
    rls: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingPhase, setTestingPhase] = useState<string>('');

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
        const endpoint = url.replace('https://fvzhybddmulufmfjuvwl.supabase.co', '');
        
        addApiCall({
          method: method,
          endpoint: endpoint,
          status: 'pending'
        });

        try {
          const response = await originalFetch(...args);
          const duration = Date.now() - startTime;
          
          addApiCall({
            method: method,
            endpoint: endpoint,
            status: response.ok ? 'success' : 'error',
            duration,
            data: `${response.status} ${response.statusText}`
          });

          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          addApiCall({
            method: method,
            endpoint: endpoint,
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
    setTestingPhase('Verbindung testen...');
    console.log('=== Starting Comprehensive Supabase Connection Test ===');
    
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

      // Count RLS policies
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('count_rls_policies');

      let policiesCount = 0;
      if (!policiesError && policiesData) {
        policiesCount = policiesData;
      } else {
        // Fallback: try to count manually
        try {
          const { data: manualPolicies } = await supabase
            .from('pg_policies')
            .select('policyname')
            .eq('schemaname', 'public');
          policiesCount = manualPolicies?.length || 0;
        } catch (e) {
          console.log('Could not count policies manually');
        }
      }

      addApiCall({
        method: 'SELECT',
        endpoint: 'information_schema.tables',
        status: tablesError ? 'error' : 'success',
        data: tablesData ? `${tablesData.length} tables found` : 'No data',
        error: tablesError?.message
      });

      const newConnectionStatus: ConnectionStatus = {
        isConnected: connectionResult.success,
        projectUrl: supabase.supabaseUrl,
        authStatus: session ? `✅ Authenticated (${session.user.email})` : '❌ Not authenticated',
        lastChecked: new Date().toLocaleTimeString(),
        tablesCount: tablesData?.length || 0,
        rlsPoliciesCount: policiesCount,
        currentUserId: session?.user?.id
      };

      setConnectionStatus(newConnectionStatus);
      setTestResults(prev => ({ ...prev, connection: connectionResult.success }));

      console.log('=== Connection Test Results ===');
      console.log('Connected:', connectionResult.success);
      console.log('Auth Status:', session ? 'Authenticated' : 'Not authenticated');
      console.log('Tables Count:', tablesData?.length || 0);
      console.log('RLS Policies Count:', policiesCount);
      
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
      setTestResults(prev => ({ ...prev, connection: false }));
    } finally {
      setIsLoading(false);
      setTestingPhase('');
    }
  };

  const testDatabaseOperations = async () => {
    setTestingPhase('Datenbank testen...');
    console.log('=== Testing Database Operations with SupabaseService ===');
    
    try {
      let hasErrors = false;

      // Test 1: Create a test user (will fail due to RLS if not authenticated)
      console.log('Testing user creation...');
      const testUserData = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test User',
        height: 170,
        start_weight: 70,
        target_weight: 60,
        age: 30
      };

      const createUserResult = await SupabaseService.createUser(testUserData);
      if (createUserResult.error) {
        console.log('User creation failed (expected due to RLS):', createUserResult.error);
        hasErrors = true;
      }

      // Test 2: Try to get user data
      console.log('Testing user retrieval...');
      const getUserResult = await SupabaseService.getUser('00000000-0000-0000-0000-000000000000');
      if (getUserResult.error) {
        console.log('User retrieval failed (expected due to RLS):', getUserResult.error);
        hasErrors = true;
      }

      // Test 3: Create a daily entry
      console.log('Testing daily entry creation...');
      const testEntry = {
        user_id: connectionStatus.currentUserId || '00000000-0000-0000-0000-000000000000',
        date: new Date().toISOString().split('T')[0],
        total_points: 5,
        mood: 'gut' as const,
        notes: 'Test entry from debugger'
      };

      const createEntryResult = await SupabaseService.createDailyEntry(testEntry);
      if (createEntryResult.error) {
        console.log('Daily entry creation failed:', createEntryResult.error);
        hasErrors = true;
      } else {
        console.log('Daily entry created successfully:', createEntryResult.data);
      }

      // Test 4: Get daily entries
      console.log('Testing daily entries retrieval...');
      const getEntriesResult = await SupabaseService.getDailyEntries(
        connectionStatus.currentUserId || '00000000-0000-0000-0000-000000000000', 
        5
      );
      if (getEntriesResult.error) {
        console.log('Daily entries retrieval failed:', getEntriesResult.error);
        hasErrors = true;
      } else {
        console.log('Daily entries retrieved:', getEntriesResult.data?.length || 0, 'entries');
      }

      // Test 5: Calculate streak
      console.log('Testing streak calculation...');
      const streakResult = await SupabaseService.calculateStreak(
        connectionStatus.currentUserId || '00000000-0000-0000-0000-000000000000'
      );
      if (streakResult.error) {
        console.log('Streak calculation failed:', streakResult.error);
        hasErrors = true;
      } else {
        console.log('Streak calculated:', streakResult.streak);
      }

      // Test 6: Test table access directly
      const tables = ['users', 'daily_entries', 'activities', 'progress_photos'];
      for (const table of tables) {
        console.log(`Testing direct access to ${table}...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        addApiCall({
          method: 'SELECT',
          endpoint: `${table} (direct access)`,
          status: error ? 'error' : 'success',
          data: data ? `${data.length} rows` : 'No data',
          error: error?.message
        });

        if (error) {
          hasErrors = true;
        }
      }

      setTestResults(prev => ({ ...prev, database: !hasErrors }));

      Alert.alert(
        'Database Test Results',
        `Database operations test completed.\n\n` +
        `Status: ${!hasErrors ? '✅ Success' : '⚠️ Some operations failed (likely due to RLS)'}\n\n` +
        `This is expected behavior when not authenticated, as RLS policies protect the data.`,
        [{ text: 'OK' }]
      );

      console.log('=== Database Operations Test Completed ===');
      
    } catch (err) {
      console.error('=== Database Operations Test Failed ===', err);
      addApiCall({
        method: 'DATABASE_TEST',
        endpoint: 'operations',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      setTestResults(prev => ({ ...prev, database: false }));
    } finally {
      setTestingPhase('');
    }
  };

  const testAuthOperations = async () => {
    setTestingPhase('Auth testen...');
    console.log('=== Testing Auth Operations with SupabaseService ===');
    
    try {
      let authSuccess = true;

      // Test 1: Get current session
      console.log('Testing current session...');
      const { session, error: sessionError } = await SupabaseService.getCurrentUser();
      if (sessionError) {
        console.log('Session error:', sessionError);
        authSuccess = false;
      }

      // Test 2: Try sign up with test email (will likely fail - user exists or email not valid)
      console.log('Testing sign up...');
      const signUpResult = await SupabaseService.signUp(
        `test-${Date.now()}@example.com`, 
        'testpassword123'
      );

      if (!signUpResult.success) {
        console.log('Sign up failed (expected):', signUpResult.error);
      } else {
        console.log('Sign up successful:', signUpResult.message);
      }

      // Test 3: Try sign in with invalid credentials (should fail)
      console.log('Testing sign in with invalid credentials...');
      const signInResult = await SupabaseService.signIn(
        'invalid@example.com',
        'wrongpassword'
      );

      if (!signInResult.success) {
        console.log('Sign in failed (expected):', signInResult.error);
      }

      // Test 4: Test sign out (should work regardless of auth state)
      console.log('Testing sign out...');
      const signOutResult = await SupabaseService.signOut();
      if (!signOutResult.success) {
        console.log('Sign out failed:', signOutResult.error);
        authSuccess = false;
      }

      setTestResults(prev => ({ ...prev, auth: authSuccess }));

      Alert.alert(
        'Auth Test Results',
        `Authentication test completed.\n\n` +
        `Current Session: ${session ? '✅ Authenticated' : '❌ Not authenticated'}\n` +
        `Sign Up Test: ${signUpResult.success ? '✅ Success' : '⚠️ Failed (expected)'}\n` +
        `Sign In Test: ${signInResult.success ? '✅ Success' : '⚠️ Failed (expected)'}\n` +
        `Sign Out Test: ${signOutResult.success ? '✅ Success' : '❌ Failed'}\n\n` +
        `Note: Sign up/in failures are expected with test credentials.`,
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
      setTestResults(prev => ({ ...prev, auth: false }));
    } finally {
      setTestingPhase('');
    }
  };

  const testRLSPolicies = async () => {
    setTestingPhase('RLS Policies testen...');
    console.log('=== Testing RLS Policies ===');
    
    try {
      let rlsWorking = true;

      // Test accessing tables without authentication (should fail due to RLS)
      const tables = ['users', 'daily_entries', 'activities', 'progress_photos'];
      const testResults: { [key: string]: { success: boolean; error?: string } } = {};
      
      for (const table of tables) {
        console.log(`Testing RLS on ${table}...`);
        
        // Test SELECT
        const { data: selectData, error: selectError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        // Test INSERT (should fail)
        let insertError: any = null;
        try {
          const { error } = await supabase
            .from(table)
            .insert({});
          insertError = error;
        } catch (e) {
          insertError = e;
        }

        testResults[table] = {
          success: !!selectError && !!insertError, // RLS working if both operations fail
          error: selectError?.message || insertError?.message
        };

        addApiCall({
          method: 'RLS_TEST',
          endpoint: `${table} (RLS check)`,
          status: testResults[table].success ? 'success' : 'error',
          data: selectData ? `${selectData.length} rows (RLS bypassed!)` : 'Access denied (RLS working)',
          error: testResults[table].error
        });

        if (!testResults[table].success) {
          rlsWorking = false;
        }
      }

      // Test specific RLS policies
      console.log('Testing specific RLS policy enforcement...');
      
      // Try to access another user's data (should fail)
      const { data: otherUserData, error: otherUserError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', '11111111-1111-1111-1111-111111111111')
        .limit(1);

      addApiCall({
        method: 'RLS_POLICY_TEST',
        endpoint: 'daily_entries (other user)',
        status: otherUserError ? 'success' : 'error',
        data: otherUserData ? `${otherUserData.length} rows (RLS bypassed!)` : 'Access denied (RLS working)',
        error: otherUserError?.message
      });

      setTestResults(prev => ({ ...prev, rls: rlsWorking }));

      let resultMessage = 'RLS Policies Test Results:\n\n';
      for (const [table, result] of Object.entries(testResults)) {
        resultMessage += `${table}: ${result.success ? '✅ Protected' : '❌ Vulnerable'}\n`;
      }
      resultMessage += `\nOverall RLS Status: ${rlsWorking ? '✅ Working' : '❌ Issues detected'}`;

      Alert.alert('RLS Test Results', resultMessage, [{ text: 'OK' }]);

      console.log('=== RLS Policies Test Completed ===');
      
    } catch (err) {
      console.error('=== RLS Policies Test Failed ===', err);
      addApiCall({
        method: 'RLS_TEST',
        endpoint: 'policies',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      setTestResults(prev => ({ ...prev, rls: false }));
    } finally {
      setTestingPhase('');
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    console.log('=== Running All Comprehensive Tests ===');
    
    await testConnection();
    await testDatabaseOperations();
    await testAuthOperations();
    await testRLSPolicies();
    
    setIsLoading(false);
    
    const overallResults = Object.values(testResults);
    const successCount = overallResults.filter(Boolean).length;
    
    Alert.alert(
      'All Tests Completed',
      `Test Results Summary:\n\n` +
      `✅ Connection: ${testResults.connection ? 'Pass' : 'Fail'}\n` +
      `🗄️ Database: ${testResults.database ? 'Pass' : 'Fail'}\n` +
      `🔐 Auth: ${testResults.auth ? 'Pass' : 'Fail'}\n` +
      `🛡️ RLS: ${testResults.rls ? 'Pass' : 'Fail'}\n\n` +
      `Overall: ${successCount}/4 tests passed`,
      [{ text: 'OK' }]
    );
  };

  const clearApiCalls = () => {
    setApiCalls([]);
    console.log('API calls cleared');
  };

  const exportDebugInfo = () => {
    const debugInfo = {
      connectionStatus,
      testResults,
      apiCalls: apiCalls.slice(0, 20), // Last 20 calls
      timestamp: new Date().toISOString(),
      projectId: 'fvzhybddmulufmfjuvwl',
      supabaseUrl: supabase.supabaseUrl,
      environment: __DEV__ ? 'development' : 'production'
    };
    
    console.log('=== COMPREHENSIVE DEBUG INFO EXPORT ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    Alert.alert(
      'Debug Info Exported',
      'Comprehensive debug information has been logged to console. Check the developer console for detailed information including:\n\n' +
      '• Connection status\n' +
      '• Test results\n' +
      '• API call history\n' +
      '• Project configuration',
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

  const getTestStatusIcon = (passed: boolean) => {
    return passed ? '✅' : '❌';
  };

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={[commonStyles.title, { color: colors.text, marginBottom: 20 }]}>
          🔧 Supabase Debugger
        </Text>

        {/* Loading indicator */}
        {isLoading && (
          <View style={[styles.section, { backgroundColor: colors.warning, marginBottom: 10 }]}>
            <Text style={[styles.loadingText, { color: colors.background }]}>
              ⏳ {testingPhase || 'Testing...'}
            </Text>
          </View>
        )}

        {/* Test Results Summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📊 Test Results Summary
          </Text>
          <View style={styles.testResultsGrid}>
            <View style={styles.testResultItem}>
              <Text style={[styles.testResultLabel, { color: colors.text }]}>
                {getTestStatusIcon(testResults.connection)} Connection
              </Text>
            </View>
            <View style={styles.testResultItem}>
              <Text style={[styles.testResultLabel, { color: colors.text }]}>
                {getTestStatusIcon(testResults.database)} Database
              </Text>
            </View>
            <View style={styles.testResultItem}>
              <Text style={[styles.testResultLabel, { color: colors.text }]}>
                {getTestStatusIcon(testResults.auth)} Auth
              </Text>
            </View>
            <View style={styles.testResultItem}>
              <Text style={[styles.testResultLabel, { color: colors.text }]}>
                {getTestStatusIcon(testResults.rls)} RLS
              </Text>
            </View>
          </View>
        </View>

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
            <Text style={[styles.statusLabel, { color: colors.text }]}>RLS Policies:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {connectionStatus.rlsPoliciesCount}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Letzter Check:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {connectionStatus.lastChecked}
            </Text>
          </View>
          {connectionStatus.currentUserId && (
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>User ID:</Text>
              <Text style={[styles.statusValue, { color: colors.text }]} numberOfLines={1}>
                {connectionStatus.currentUserId.substring(0, 8)}...
              </Text>
            </View>
          )}
        </View>

        {/* Test Buttons */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🧪 Tests
          </Text>
          
          <TouchableOpacity
            style={[buttonStyles.primary, { marginBottom: 10 }]}
            onPress={runAllTests}
            disabled={isLoading}
          >
            <Text style={[buttonStyles.primaryText, { color: colors.background }]}>
              {isLoading ? '⏳ Teste...' : '🚀 Alle Tests ausführen'}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[buttonStyles.secondary, styles.halfButton]}
              onPress={testConnection}
              disabled={isLoading}
            >
              <Text style={[buttonStyles.secondaryText, { color: colors.background }]}>
                🔄 Verbindung
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[buttonStyles.secondary, styles.halfButton]}
              onPress={testDatabaseOperations}
              disabled={isLoading}
            >
              <Text style={[buttonStyles.secondaryText, { color: colors.background }]}>
                🗄️ Datenbank
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[buttonStyles.outline, styles.halfButton, { borderColor: colors.warning }]}
              onPress={testAuthOperations}
              disabled={isLoading}
            >
              <Text style={[buttonStyles.secondaryText, { color: colors.warning }]}>
                🔐 Auth
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.halfButton, { borderColor: colors.purple }]}
              onPress={testRLSPolicies}
              disabled={isLoading}
            >
              <Text style={[buttonStyles.secondaryText, { color: colors.purple }]}>
                🛡️ RLS
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.outline, { marginTop: 10, borderColor: colors.blue }]}
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
  loadingText: {
    textAlign: 'center' as const,
    fontSize: 16,
    fontWeight: '600' as const,
    padding: 10,
  },
  testResultsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  testResultItem: {
    width: '48%',
    marginBottom: 8,
  },
  testResultLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
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
  buttonRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  halfButton: {
    width: '48%',
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
