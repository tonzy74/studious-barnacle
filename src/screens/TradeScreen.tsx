import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, RarityBadge, ScreenGradient, ScreenHeader } from '../components';
import { findWhiskeyByName } from '../lib/flavor';
import { formatUsd } from '../lib/pricing';
import { bottleTradeValue, evaluateTrade, TradeVerdict } from '../lib/trade';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

interface TheirItem {
  name: string;
  value: number;
  matched: boolean;
}

const VERDICT_STYLE: Record<TradeVerdict, { color: string; label: string }> = {
  fair: { color: colors.success, label: 'FAIR TRADE' },
  'you-win': { color: colors.amber, label: 'YOU COME OUT AHEAD' },
  'they-win': { color: colors.danger, label: 'THEY COME OUT AHEAD' },
};

export default function TradeScreen() {
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const learned = useStore((s) => s.learned);
  const track = useStore((s) => s.track);

  const [mySelected, setMySelected] = useState<Set<string>>(new Set());
  const [theirItems, setTheirItems] = useState<TheirItem[]>([]);
  const [theirInput, setTheirInput] = useState('');
  const [myCash, setMyCash] = useState('');
  const [theirCash, setTheirCash] = useState('');
  const [showVerdict, setShowVerdict] = useState(false);

  const toggleMine = (id: string) => {
    setShowVerdict(false);
    setMySelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addTheirs = () => {
    const name = theirInput.trim();
    if (!name) return;
    const record = findWhiskeyByName(name, learned);
    const valuation = record ? bottleTradeValue(record) : undefined;
    setTheirItems((prev) => [
      ...prev,
      {
        name: record?.name ?? name,
        value: valuation?.value ?? 0,
        matched: !!record && !!valuation,
      },
    ]);
    setTheirInput('');
    setShowVerdict(false);
  };

  const setTheirValue = (index: number, text: string) => {
    const v = parseFloat(text);
    setTheirItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, value: Number.isFinite(v) ? Math.max(0, v) : 0 } : it))
    );
    setShowVerdict(false);
  };

  const removeTheirs = (index: number) => {
    setTheirItems((prev) => prev.filter((_, i) => i !== index));
    setShowVerdict(false);
  };

  const myItems = useMemo(
    () =>
      bottles.map((b) => ({
        bottle: b,
        valuation: bottleTradeValue(b),
      })),
    [bottles]
  );

  const evaluation = useMemo(() => {
    const myValues = myItems
      .filter((i) => mySelected.has(i.bottle.id) && i.valuation)
      .map((i) => i.valuation!.value);
    return evaluateTrade({
      myBottleValues: myValues,
      theirBottleValues: theirItems.map((i) => i.value),
      myCash: parseFloat(myCash) || 0,
      theirCash: parseFloat(theirCash) || 0,
    });
  }, [myItems, mySelected, theirItems, myCash, theirCash]);

  const evaluate = () => {
    setShowVerdict(true);
    track('trade_evaluated', {
      count: mySelected.size + theirItems.length,
      verdict: evaluation.verdict,
    });
  };

  const hasTrade = mySelected.size + theirItems.length > 0;
  const verdictStyle = VERDICT_STYLE[evaluation.verdict];

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="DYNASTY TRADE DESK"
          title="Trade Analyzer"
          subtitle="Values blend market price and rarity; opened bottles are discounted. What you paid never inflates a value — the market doesn't care."
        />

      <Text style={styles.section}>Your side · {formatUsd(evaluation.myTotal)}</Text>
      {bottles.length === 0 && (
        <Text style={styles.hint}>Add bottles to your bar first — then trade them here.</Text>
      )}
      {myItems.map(({ bottle, valuation }) => (
        <TouchableOpacity
          key={bottle.id}
          style={[styles.row, mySelected.has(bottle.id) && styles.rowSelected, !valuation && styles.rowDisabled]}
          disabled={!valuation}
          onPress={() => toggleMine(bottle.id)}
        >
          <Ionicons
            name={mySelected.has(bottle.id) ? 'checkbox' : 'square-outline'}
            size={22}
            color={mySelected.has(bottle.id) ? colors.amberBright : colors.textFaint}
          />
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.name} numberOfLines={1}>
              {bottle.name}
            </Text>
            <Text style={styles.sub}>
              {bottle.opened ? 'Opened — discounted' : 'Sealed'}
              {bottle.pricePaid !== undefined ? ` · you paid ${formatUsd(bottle.pricePaid)}` : ''}
            </Text>
          </View>
          <RarityBadge rarity={bottle.rarity} />
          <Text style={styles.value}>
            {valuation ? formatUsd(valuation.value) : 'set pricing'}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.cashRow}>
        <Text style={styles.cashLabel}>+ Cash you add</Text>
        <TextInput
          style={styles.cashInput}
          value={myCash}
          onChangeText={(v) => {
            setMyCash(v);
            setShowVerdict(false);
          }}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textDim}
        />
      </View>

      <Text style={styles.section}>Their side · {formatUsd(evaluation.theirTotal)}</Text>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={theirInput}
          onChangeText={setTheirInput}
          placeholder="e.g. Blanton's, ECBP C923, Weller 12…"
          placeholderTextColor={colors.textDim}
          onSubmitEditing={addTheirs}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, !theirInput.trim() && { opacity: 0.5 }]}
          onPress={addTheirs}
          disabled={!theirInput.trim()}
        >
          <Ionicons name="add" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>
      {theirItems.map((item, index) => (
        <View key={`${item.name}-${index}`} style={styles.row}>
          <TouchableOpacity onPress={() => removeTheirs(index)}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.sub}>
              {item.matched ? '✓ market value found (assumes sealed)' : 'not in database — enter a value'}
            </Text>
          </View>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            style={styles.valueInput}
            defaultValue={item.value ? String(item.value) : ''}
            onEndEditing={(e) => setTheirValue(index, e.nativeEvent.text)}
            keyboardType="decimal-pad"
            placeholder="?"
            placeholderTextColor={colors.textDim}
          />
        </View>
      ))}
      <View style={styles.cashRow}>
        <Text style={styles.cashLabel}>+ Cash they add</Text>
        <TextInput
          style={styles.cashInput}
          value={theirCash}
          onChangeText={(v) => {
            setTheirCash(v);
            setShowVerdict(false);
          }}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textDim}
        />
      </View>

      <Button
        title="Evaluate fairness"
        icon="git-compare"
        onPress={evaluate}
        disabled={!hasTrade}
        style={{ marginTop: spacing.lg }}
      />

      {showVerdict && hasTrade && (
        <View style={[styles.verdictCard, { borderColor: verdictStyle.color }]}>
          <Text style={[styles.verdictLabel, { color: verdictStyle.color }]}>
            {verdictStyle.label}
          </Text>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                {
                  backgroundColor: verdictStyle.color,
                  width: `${Math.round(
                    (evaluation.myTotal / Math.max(evaluation.myTotal + evaluation.theirTotal, 1)) * 100
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.meterCaption}>
            Your side {formatUsd(evaluation.myTotal)} · their side {formatUsd(evaluation.theirTotal)}
          </Text>
          <Text style={styles.suggestion}>{evaluation.suggestion}</Text>
          <Text style={styles.confidence}>
            Values are market anchors (fair price × condition). In-app trade comps will sharpen
            these once trading goes live.
          </Text>
        </View>
      )}

        <Text style={styles.legal}>
          Whiskey Vault is a valuation and record-keeping tool. It doesn't process payments or
          shipping for bottles — any exchange and cash settlement happens between you, off-app, in
          compliance with your local alcohol laws. 21+.
        </Text>
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.textDim, marginTop: 4, lineHeight: 19, fontSize: 13 },
  section: { color: colors.amberBright, fontWeight: '800', fontSize: 15, marginTop: 22, marginBottom: 8 },
  hint: { color: colors.textDim, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  rowSelected: { borderColor: colors.amber },
  rowDisabled: { opacity: 0.45 },
  check: { color: colors.amber, fontSize: 18 },
  remove: { color: colors.danger, fontSize: 16, fontWeight: '800', paddingHorizontal: 2 },
  name: { color: colors.text, fontWeight: '700', fontSize: 14 },
  sub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  value: { color: colors.amberBright, fontWeight: '800', marginLeft: 8 },
  dollar: { color: colors.textDim, marginRight: 2 },
  valueInput: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 72,
    textAlign: 'right',
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.amber,
    width: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#1a120b', fontSize: 22, fontWeight: '800' },
  cashRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  cashLabel: { color: colors.text, fontWeight: '600', flex: 1 },
  cashInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: 10,
    width: 110,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: '700',
  },
  verdictCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    marginTop: 16,
  },
  verdictLabel: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  meterTrack: {
    height: 10,
    backgroundColor: colors.cardAlt,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 12,
  },
  meterFill: { height: 10 },
  meterCaption: { color: colors.textDim, fontSize: 12, marginTop: 6 },
  suggestion: { color: colors.text, marginTop: 12, lineHeight: 20 },
  confidence: { color: colors.textDim, fontSize: 11, marginTop: 10, fontStyle: 'italic' },
  legal: { color: colors.textDim, fontSize: 11, lineHeight: 16, marginTop: 24, fontStyle: 'italic' },
});
