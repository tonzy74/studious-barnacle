import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Button, Card, ScreenGradient, ScreenHeader, StatTile } from '../components';
import { hasReferral, REFERRALS } from '../lib/monetization';
import { fairPrice, formatUsd } from '../lib/pricing';
import { useProGate } from '../useProGate';
import { useStore } from '../store/useStore';
import { colors, spacing, type as typo } from '../theme';
import { Linking } from 'react-native';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const valueHistory = useStore((s) => s.valueHistory);
  const snapshotValue = useStore((s) => s.snapshotValue);
  const exportGate = useProGate('portfolio-export');

  const totals = useMemo(() => {
    let value = 0;
    let cost = 0;
    for (const b of bottles) {
      const q = Math.max(1, b.quantity);
      value += (fairPrice(b.msrp, b.secondary, b.rarity) ?? 0) * q;
      cost += (b.pricePaid ?? 0) * q;
    }
    const units = bottles.reduce((n, b) => n + Math.max(1, b.quantity), 0);
    return { value: Math.round(value), cost: Math.round(cost), units };
  }, [bottles]);

  // Record today's snapshot so the trend builds over time.
  useEffect(() => {
    if (bottles.length > 0) snapshotValue(totals.value, totals.units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.value, totals.units]);

  const gain = totals.cost > 0 ? totals.value - totals.cost : undefined;

  const exportCsv = () => {
    if (exportGate.requirePro()) return;
    const header = 'Name,Distillery,Type,Proof,Rarity,MSRP,Secondary,FairPrice,PricePaid,Qty,Opened';
    const rows = bottles.map((b) =>
      [
        b.name,
        b.distillery,
        b.type,
        b.proof,
        b.rarity ?? '',
        b.msrp ?? '',
        b.secondary ?? '',
        fairPrice(b.msrp, b.secondary, b.rarity) ?? '',
        b.pricePaid ?? '',
        b.quantity,
        b.opened ? 'yes' : 'no',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    Share.share({
      title: 'Whiskey Vault collection',
      message: [header, ...rows].join('\n'),
    });
  };

  const chart = useMemo(() => {
    const pts = valueHistory.slice(-60);
    if (pts.length < 2) return undefined;
    const w = 300;
    const h = 120;
    const vals = pts.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const coords = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p.value - min) / span) * (h - 8) - 4;
      return { x, y };
    });
    return { w, h, coords, points: coords.map((c) => `${c.x},${c.y}`).join(' ') };
  }, [valueHistory]);

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="YOUR CELLAR" title="Portfolio" />

        <View style={styles.stats}>
          <StatTile label="Value" value={formatUsd(totals.value)} icon="pricetag" />
          <StatTile label="Bottles" value={String(totals.units)} icon="wine" />
          <StatTile
            label="Gain/Loss"
            value={
              gain === undefined ? '—' : `${gain >= 0 ? '+' : '−'}${formatUsd(Math.abs(gain))}`
            }
            icon="trending-up"
          />
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>Value over time</Text>
          {chart ? (
            <Svg width="100%" height={chart.h} viewBox={`0 0 ${chart.w} ${chart.h}`}>
              <Polyline
                points={chart.points}
                fill="none"
                stroke={colors.amberBright}
                strokeWidth={2}
              />
              {chart.coords.map((c, i) => (
                <Circle key={i} cx={c.x} cy={c.y} r={2} fill={colors.gold} />
              ))}
            </Svg>
          ) : (
            <Text style={styles.hint}>
              Your value trend builds one point per day as prices and your collection change. Check
              back tomorrow to see the line grow.
            </Text>
          )}
        </Card>

        {totals.cost > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.cardTitle}>Cost basis</Text>
            <Text style={styles.row}>
              Invested: <Text style={styles.val}>{formatUsd(totals.cost)}</Text>
            </Text>
            <Text style={styles.row}>
              Current value: <Text style={styles.val}>{formatUsd(totals.value)}</Text>
            </Text>
          </Card>
        )}

        {hasReferral(REFERRALS.insurance.url) && totals.value > 0 && (
          <Card style={{ marginTop: spacing.md }} glow>
            <Text style={styles.cardTitle}>{REFERRALS.insurance.title}</Text>
            <Text style={styles.hint}>{REFERRALS.insurance.subtitle}</Text>
            <Button
              title={REFERRALS.insurance.cta}
              icon="shield-checkmark"
              variant="secondary"
              onPress={() => Linking.openURL(REFERRALS.insurance.url)}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}

        <Button
          title={exportGate.locked ? 'Export collection (CSV) — Pro' : 'Export collection (CSV)'}
          icon="download"
          variant="secondary"
          onPress={exportCsv}
          disabled={bottles.length === 0}
          style={{ marginTop: spacing.lg }}
        />
        <Text style={styles.disclaimer}>
          Values are estimates for personal record-keeping and insurance reference, not appraisals.
        </Text>
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm },
  cardTitle: { ...typo.heading, color: colors.text, marginBottom: spacing.sm },
  hint: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  row: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  val: { color: colors.amberBright, fontWeight: '800' },
  disclaimer: { color: colors.textFaint, fontSize: 11, marginTop: spacing.md, fontStyle: 'italic', lineHeight: 16 },
});
