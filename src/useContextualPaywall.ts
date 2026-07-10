import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { canShowContextualPaywall, PaywallTrigger } from './lib/paywallEngine';
import { RootStackParamList } from './navigation';
import { useStore } from './store/useStore';

/**
 * Surface the paywall at a moment of peak intent — but only when global
 * etiquette allows (not Pro, cooldown elapsed, lifetime cap not hit). Returns a
 * `maybePrompt` you call when a valuable moment happens; it decides whether to
 * actually show, records the prompt, and returns whether it opened.
 */
export function useContextualPaywall() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const maybePrompt = (_trigger: PaywallTrigger): boolean => {
    const s = useStore.getState();
    const ok = canShowContextualPaywall({
      isPro: s.isPro,
      lastShownAt: s.paywallPrompts.lastShownAt,
      promptCount: s.paywallPrompts.count,
      now: Date.now(),
    });
    if (!ok) return false;
    s.markPaywallShown();
    navigation.navigate('Paywall');
    return true;
  };

  return { maybePrompt };
}
