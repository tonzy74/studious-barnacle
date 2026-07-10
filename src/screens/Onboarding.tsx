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
import { seedFromTastes, TASTE_PROFILES } from '../lib/taste';
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
  const setTasteSeed = useStore((s) => s.setTasteSeed);
  const track = useStore((s) => s.track);
  const [index, setIndex] = useState(0);
  const [tastes, setTastes] = useState<Set<string>>(new Set());
  const scroller = useRef<ScrollView>(null);

  const complete = () => {
    const seed = seedFromTastes([...tastes]);
    if (seed) setTasteSeed(seed);
    track('onboarding_completed');
    completeOnboarding();
  };

  // Only for brand-new users: don't interrupt anyone who already has a vault
  // (e.g. an upgrade), and wait until persisted state has loaded.
  if (!hasHydrated || onboardedAt !== undefined || bottleCount > 0) return null;

  // Pages = the value slides + one taste-picker page at the end.
  const pageCount = SLIDES.length + 1;
  const onTastePage = index >= SLIDES.length;
  const last = onTastePage;
  const toggleTaste = (id: string) =>
    setTastes((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

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

        {/* Taste picker — seeds recommendations before the first bottle */}
        <View style={[styles.tastePage, { width }]}>
          <Text style={styles.title}>What do you love?</Text>
          <Text style={styles.body}>Pick a couple. We'll tailor recommendations from day one.</Text>
          <View style={styles.tasteList}>
            {TASTE_PROFILES.map((t) => {
              const on = tastes.has(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.85}
                  onPress={() => toggleTaste(t.id)}
                  style={[styles.tasteCard, on && styles.tasteCardOn]}
                >
                  <Ionicons name={t.icon} size={22} color={on ? colors.ink : colors.amberBright} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tasteLabel, on && { color: colors.ink }]}>{t.label}</Text>
                    <Text style={[styles.tasteBlurb, on && { color: colors.ink }]} numberOfLines={1}>
                      {t.blurb}
                    </Text>
                  </View>
                  <Ionicons
                    name={on ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={on ? colors.ink : colors.textFaint}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {Array.from({ length: pageCount }).map((_, i) => (
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
  tastePage: { justifyContent: 'center', paddingHorizontal: spacing.lg },
  tasteList: { marginTop: spacing.xl, gap: spacing.sm, alignSelf: 'stretch' },
  tasteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tasteCardOn: { backgroundColor: colors.amberBright, borderColor: colors.amberBright },
  tasteLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  tasteBlurb: { color: colors.textDim, fontSize: 11.5, marginTop: 1 },
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
