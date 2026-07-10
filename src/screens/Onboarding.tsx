import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Emblem } from '../components';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing, type as typo } from '../theme';

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

// Value-first framing: lead with the payoff (what the app does for them), so
// the "aha" is understood before we ask for the first action. Activation in the
// first session is the strongest predictor of retention.
const SLIDES: Slide[] = [
  {
    icon: 'scan',
    title: 'Snap your shelf',
    body: 'Point your camera at a bottle or your whole bar. The AI reads every label and identifies each pour in seconds.',
  },
  {
    icon: 'diamond',
    title: 'Know what it’s worth',
    body: 'Every bottle gets a value, rarity tier, and real tasting notes — see your collection’s worth the moment you add it.',
  },
  {
    icon: 'sparkles',
    title: 'Your personal sommelier',
    body: 'Ask what to pour tonight, get pairings and cocktails, and track the allocated releases worth chasing.',
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hasHydrated = useStore((s) => s.hasHydrated);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const bottleCount = useStore((s) => s.bottles.length);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const track = useStore((s) => s.track);
  const complete = () => {
    track('onboarding_completed');
    completeOnboarding();
  };
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  // Only for brand-new users: don't interrupt anyone who already has a vault
  // (e.g. an upgrade), and wait until persisted state has loaded.
  if (!hasHydrated || onboardedAt !== undefined || bottleCount > 0) return null;

  const last = index >= SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (last) complete();
    else scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />

      <View style={[styles.skipRow, { paddingTop: insets.top + spacing.sm }]}>
        <Emblem size={34} />
        <TouchableOpacity onPress={complete} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <LinearGradient colors={gradients.gold} style={styles.iconWrap}>
              <Ionicons name={s.icon} size={44} color={colors.ink} />
            </LinearGradient>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button
          title={last ? 'Start my vault' : 'Next'}
          icon={last ? 'wine' : 'arrow-forward'}
          onPress={next}
          style={{ alignSelf: 'stretch' }}
        />
        <Text style={styles.reassure}>Free to start · no account needed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100 },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  skip: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { ...typo.display, color: colors.text, textAlign: 'center' },
  body: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: spacing.xs },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.amber, width: 20 },
  reassure: { color: colors.textFaint, fontSize: 12, textAlign: 'center' },
});
