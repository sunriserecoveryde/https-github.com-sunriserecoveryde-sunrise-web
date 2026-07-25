import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

/**
 * Returns the design tokens for the current color scheme.
 *
 * Both `light` and `dark` keys use the Grow Motivational brand palette
 * (dark navy + orange) so the app is always dark regardless of system setting.
 *
 * The `radius` value is scheme-independent and comes from constants/colors.ts.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
