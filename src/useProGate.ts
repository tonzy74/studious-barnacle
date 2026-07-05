import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { isLocked, ProFeature } from './lib/monetization';
import { RootStackParamList } from './navigation';
import { useStore } from './store/useStore';

/**
 * Pro gating helper. `locked` is true when the feature is Pro-only and the
 * user isn't Pro; `goPro` opens the paywall; `requirePro` returns true and
 * opens the paywall when locked (use to guard an action).
 */
export function useProGate(feature: ProFeature) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isPro = useStore((s) => s.isPro);
  const locked = isLocked(feature, isPro);
  const goPro = () => navigation.navigate('Paywall');
  const requirePro = () => {
    if (locked) {
      goPro();
      return true;
    }
    return false;
  };
  return { locked, isPro, goPro, requirePro };
}
