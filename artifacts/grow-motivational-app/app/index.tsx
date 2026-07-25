import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Root redirect — handles three cases:
 * 1. Still loading local state / auth → show blank splash
 * 2. Authenticated + has server data but not yet onboarded locally
 *    (e.g. fresh reinstall) → restore from server then go to tabs
 * 3. Not onboarded → go to onboarding
 * 4. Onboarded → go to tabs
 */
export default function IndexRedirect() {
  const { hasOnboarded, isLoading, restoreFromServer } = useApp();
  const { token, authLoading, fetchServerState } = useAuth();
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // If we have a token but no local onboarding state, attempt to pull from server
    if (!isLoading && !authLoading && token && !hasOnboarded && !restoring && !restored) {
      setRestoring(true);
      fetchServerState()
        .then((data) => {
          if (data) {
            restoreFromServer(data);
          }
        })
        .finally(() => {
          setRestoring(false);
          setRestored(true);
        });
    }
  }, [isLoading, authLoading, token, hasOnboarded, restoring, restored, fetchServerState, restoreFromServer]);

  if (isLoading || authLoading || restoring) {
    return <View style={styles.fill} />;
  }

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
