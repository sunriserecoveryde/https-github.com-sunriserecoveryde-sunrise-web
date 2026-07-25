import { Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function IndexRedirect() {
  const { hasOnboarded, isLoading } = useApp();

  if (isLoading) {
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
