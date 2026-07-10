import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ScreenGradient, ScreenHeader } from '../components';
import {
  makeReferralCode,
  parseReferralCode,
  REFERRAL_REWARD,
  referralLink,
  referralShareText,
} from '../lib/referral';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing, type as typo } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ReferralScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const anonId = useStore((s) => s.anonId);
  const referredBy = useStore((s) => s.referredBy);
  const applyReferral = useStore((s) => s.applyReferral);
  const code = makeReferralCode(anonId);
  const [entry, setEntry] = useState('');
  const [applied, setApplied] = useState(false);

  const share = () => {
    Share.share({ message: referralShareText(code) }).catch(() => {});
  };

  const redeem = () => {
    const parsed = parseReferralCode(entry);
    if (parsed) {
      applyReferral(parsed);
      setApplied(true);
    }
  };

  const alreadyRedeemed = !!referredBy;

  return (
    <ScreenGradient>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, flex: 1 }}>
        <ScreenHeader
          eyebrow="INVITE & EARN"
          title="Give a month, get a month"
          subtitle={`Share your code. When a friend joins with it, you both get ${REFERRAL_REWARD}.`}
          onBack={() => navigation.goBack()}
        />

        {/* Your code */}
        <Card style={styles.codeCard} glow>
          <Text style={styles.codeLabel}>YOUR CODE</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.link}>{referralLink(code)}</Text>
          <Button title="Share invite" icon="share-social" onPress={share} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
        </Card>

        {/* Redeem a friend's code */}
        <Card style={{ marginTop: spacing.lg }}>
          {alreadyRedeemed || applied ? (
            <View style={styles.appliedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.appliedText}>
                Referral applied — {REFERRAL_REWARD} lands when you start Pro.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.redeemLabel}>Have a friend's code?</Text>
              <View style={styles.redeemRow}>
                <TextInput
                  style={styles.input}
                  value={entry}
                  onChangeText={setEntry}
                  placeholder="Enter code or link"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.redeemBtn, !parseReferralCode(entry) && styles.redeemBtnOff]}
                  onPress={redeem}
                  disabled={!parseReferralCode(entry)}
                >
                  <Text style={styles.redeemBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        <Text style={styles.fine}>
          Rewards are granted as promotional Pro access once billing is live. One referral per new
          account; self-referrals don't count.
        </Text>
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  codeCard: { marginTop: spacing.lg, alignItems: 'center', padding: spacing.lg },
  codeLabel: { ...typo.overline, color: colors.amberDeep },
  code: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 6,
    marginTop: spacing.sm,
  },
  link: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  redeemLabel: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: spacing.sm },
  redeemRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    letterSpacing: 1,
  },
  redeemBtn: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.amber,
  },
  redeemBtnOff: { backgroundColor: colors.cardAlt },
  redeemBtnText: { color: colors.ink, fontWeight: '800' },
  appliedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appliedText: { color: colors.text, fontSize: 13, flex: 1 },
  fine: { color: colors.textFaint, fontSize: 11, lineHeight: 16, marginTop: spacing.lg },
});
