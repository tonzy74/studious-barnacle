import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ScreenGradient, ScreenHeader } from '../components';
import { resolveTrial } from '../lib/experiments';
import { hasReferral, REFERRALS } from '../lib/monetization';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type HubRoute =
  | 'Journal'
  | 'Recommend'
  | 'Wishlist'
  | 'Portfolio'
  | 'Achievements'
  | 'Releases'
  | 'ScanLabel'
  | 'Trade'
  | 'Pour'
  | 'Match';

const TILES: {
  screen: HubRoute;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { screen: 'ScanLabel', title: 'Scan a Label', desc: 'Identify & value in-store', icon: 'scan-circle' },
  { screen: 'Recommend', title: 'For You', desc: 'Bottles matched to your palate', icon: 'sparkles' },
  { screen: 'Trade', title: 'Trade Analyzer', desc: 'Is that trade fair?', icon: 'swap-horizontal' },
  { screen: 'Journal', title: 'Tasting Journal', desc: 'Log & rate every pour', icon: 'book' },
  { screen: 'Wishlist', title: 'Hunt List', desc: 'Bottles you want & are chasing', icon: 'heart' },
  { screen: 'Portfolio', title: 'Portfolio', desc: 'Value over time & export', icon: 'trending-up' },
  { screen: 'Releases', title: 'Releases to Watch', desc: 'Upcoming allocated drops', icon: 'calendar' },
  { screen: 'Pour', title: 'Random Pour', desc: "Can't decide? Let fate choose", icon: 'shuffle' },
  { screen: 'Match', title: 'Guest Match', desc: "Find a bottle for a guest's taste", icon: 'people' },
  { screen: 'Achievements', title: 'Achievements', desc: 'Badges & milestones', icon: 'trophy' },
];

export default function ExploreScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const isPro = useStore((s) => s.isPro);
  const anonId = useStore((s) => s.anonId);
  // Teaser must name the same trial length the paywall will show this install.
  const trialDays = resolveTrial(anonId).days;
  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="EVERYTHING ELSE" title="Explore" />

        {!isPro && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Paywall')}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proBanner}>
              <Ionicons name="sparkles" size={24} color={colors.ink} />
              <View style={{ flex: 1 }}>
                <Text style={styles.proTitle}>Go Pro</Text>
                <Text style={styles.proSub}>Unlock the full AI suite — {trialDays}-day free trial</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.ink} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {TILES.map((t) => (
          <TouchableOpacity key={t.screen} activeOpacity={0.85} onPress={() => navigation.navigate(t.screen)}>
            <Card style={styles.tile}>
              <View style={styles.iconWrap}>
                <Ionicons name={t.icon} size={22} color={colors.amberBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.desc}>{t.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </Card>
          </TouchableOpacity>
        ))}

        {hasReferral(REFERRALS.flaviar.url) && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => Linking.openURL(REFERRALS.flaviar.url)}>
            <Card style={styles.tile}>
              <View style={styles.iconWrap}>
                <Ionicons name="gift" size={22} color={colors.amberBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{REFERRALS.flaviar.title}</Text>
                <Text style={styles.desc}>{REFERRALS.flaviar.subtitle}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.textFaint} />
            </Card>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  desc: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  proTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  proSub: { color: colors.ink, fontSize: 12, marginTop: 1, opacity: 0.8 },
});
