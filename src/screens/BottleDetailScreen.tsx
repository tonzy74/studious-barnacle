import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  Button,
  FlavorBars,
  FlavorRadar,
  RarityBadge,
  TypeBadge,
} from '../components';
import { FLAVOR_AXES, FLAVOR_LABELS } from '../data/whiskeyDatabase';
import { cocktailsForBottle, CocktailSuggestion } from '../lib/claude';
import { fetchRetailerOffers, PricingResult } from '../lib/offers';
import { fairPrice, formatUsd } from '../lib/pricing';
import { RARITY_COLORS, RARITY_LABELS, RARITY_ORDER } from '../lib/rarity';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing } from '../theme';
import { FlavorSource } from '../types';

type Route = RouteProp<RootStackParamList, 'BottleDetail'>;

const SOURCE_LABELS: Record<FlavorSource, string> = {
  db: 'Profile from the reference database (aggregated professional reviews).',
  ai: 'Profile estimated by AI from professional-review knowledge.',
  default: 'Style-typical estimate — this bottle isn\'t in the reference database.',
  user: 'Profile customized by you.',
};

export default function BottleDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const bottle = useStore((s) => s.bottles.find((b) => b.id === params.id));
  const updateBottle = useStore((s) => s.updateBottle);
  const removeBottle = useStore((s) => s.removeBottle);
  const apiKey = useStore((s) => s.apiKey);
  const aiModel = useStore((s) => s.model);
  const [editing, setEditing] = useState(false);
  const [offers, setOffers] = useState<PricingResult | undefined>();
  const [cocktails, setCocktails] = useState<CocktailSuggestion[] | undefined>();
  const [cocktailBusy, setCocktailBusy] = useState(false);

  const bottleName = bottle?.name;
  const bottleBarcode = bottle?.barcode;
  useEffect(() => {
    let active = true;
    if (!bottleName) return;
    fetchRetailerOffers({ name: bottleName, upc: bottleBarcode }).then((r) => {
      if (active) setOffers(r);
    });
    return () => {
      active = false;
    };
  }, [bottleName, bottleBarcode]);

  if (!bottle) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textDim }}>Bottle not found.</Text>
      </View>
    );
  }

  const fair = fairPrice(bottle.msrp, bottle.secondary, bottle.rarity);
  const gainLoss =
    fair !== undefined && bottle.pricePaid !== undefined ? fair - bottle.pricePaid : undefined;

  const variantLine = [
    bottle.batch ? `Batch ${bottle.batch}` : '',
    bottle.barrelNo ? `Barrel #${bottle.barrelNo}` : '',
    bottle.pickName ? `${bottle.pickName} pick` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const nudge = (axis: (typeof FLAVOR_AXES)[number], delta: number) => {
    const next = Math.round(Math.min(10, Math.max(0, bottle.flavor[axis] + delta)) * 10) / 10;
    updateBottle(bottle.id, {
      flavor: { ...bottle.flavor, [axis]: next },
      flavorSource: 'user',
    });
  };

  const displayImage = bottle.imageUrl ?? offers?.imageUrl;

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]?.uri) {
      updateBottle(bottle.id, { imageUrl: result.assets[0].uri });
    }
  };

  const setFill = (level: number) =>
    updateBottle(bottle.id, { fillLevel: level, opened: level < 100 ? true : bottle.opened });

  const loadCocktails = async () => {
    if (!apiKey || cocktailBusy) return;
    setCocktailBusy(true);
    try {
      setCocktails(
        await cocktailsForBottle(apiKey, { name: bottle.name, type: bottle.type, proof: bottle.proof }, aiModel)
      );
    } catch {
      setCocktails([]);
    } finally {
      setCocktailBusy(false);
    }
  };

  const costPerPour = (() => {
    if (bottle.pricePaid === undefined) return undefined;
    // ~17 pours (1.5oz) in a 750ml bottle.
    const poursPerBottle = 17;
    return bottle.pricePaid / poursPerBottle;
  })();

  const FILL_STEPS = [
    { label: 'Full', v: 100 },
    { label: '¾', v: 75 },
    { label: '½', v: 50 },
    { label: '¼', v: 25 },
    { label: 'Empty', v: 0 },
  ];

  const confirmDelete = () => {
    Alert.alert('Remove bottle', `Remove ${bottle.name} from your bar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeBottle(bottle.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <View style={styles.heroTopRow}>
          {displayImage ? (
            <TouchableOpacity onPress={addPhoto} activeOpacity={0.85}>
              <Image source={{ uri: displayImage }} style={styles.heroImage} resizeMode="contain" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={addPhoto} activeOpacity={0.8} style={styles.addPhoto}>
              <Ionicons name="camera-outline" size={22} color={colors.amber} />
              <Text style={styles.addPhotoText}>Add photo</Text>
            </TouchableOpacity>
          )}
          <View style={styles.heroBadges}>
            <TypeBadge type={bottle.type} />
            <RarityBadge rarity={bottle.rarity} size={30} />
          </View>
        </View>
        <Text style={styles.name}>{bottle.name}</Text>
        <Text style={styles.sub}>
          {bottle.distillery} · {bottle.proof} proof
          {bottle.barcode ? ` · UPC ${bottle.barcode}` : ''}
        </Text>
        {!!variantLine && <Text style={styles.variant}>{variantLine}</Text>}
      </LinearGradient>
      <View style={{ paddingHorizontal: spacing.lg }}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rarity tier</Text>
        <View style={styles.rarityRow}>
          {RARITY_ORDER.map((tier) => (
            <TouchableOpacity
              key={tier}
              style={[
                styles.rarityChip,
                { borderColor: RARITY_COLORS[tier] },
                bottle.rarity === tier && { backgroundColor: RARITY_COLORS[tier] },
              ]}
              onPress={() => updateBottle(bottle.id, { rarity: tier })}
            >
              <Text
                style={[
                  styles.rarityChipText,
                  { color: bottle.rarity === tier ? '#1a120b' : RARITY_COLORS[tier] },
                ]}
              >
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.estimate}>
          {bottle.rarity ? RARITY_LABELS[bottle.rarity] : 'Tap a tier to set rarity.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Value (estimates — tap to edit)</Text>
        <View style={styles.valueRow}>
          <View style={styles.valueCol}>
            <Text style={styles.valueLabel}>Retail</Text>
            <TextInput
              style={styles.valueInput}
              defaultValue={bottle.msrp !== undefined ? String(bottle.msrp) : ''}
              placeholder="—"
              placeholderTextColor={colors.textDim}
              keyboardType="decimal-pad"
              onEndEditing={(e) => {
                const v = parseFloat(e.nativeEvent.text);
                updateBottle(bottle.id, { msrp: isNaN(v) ? undefined : v });
              }}
            />
          </View>
          <View style={styles.valueCol}>
            <Text style={styles.valueLabel}>Secondary</Text>
            <TextInput
              style={styles.valueInput}
              defaultValue={bottle.secondary !== undefined ? String(bottle.secondary) : ''}
              placeholder="—"
              placeholderTextColor={colors.textDim}
              keyboardType="decimal-pad"
              onEndEditing={(e) => {
                const v = parseFloat(e.nativeEvent.text);
                updateBottle(bottle.id, { secondary: isNaN(v) ? undefined : v });
              }}
            />
          </View>
          <View style={styles.valueCol}>
            <Text style={styles.valueLabel}>Fair price</Text>
            <Text style={styles.fairPrice}>
              {formatUsd(fairPrice(bottle.msrp, bottle.secondary, bottle.rarity))}
            </Text>
          </View>
        </View>
        <View style={[styles.valueRow, { marginTop: 10 }]}>
          <View style={styles.valueCol}>
            <Text style={styles.valueLabel}>You paid</Text>
            <TextInput
              style={styles.valueInput}
              defaultValue={bottle.pricePaid !== undefined ? String(bottle.pricePaid) : ''}
              placeholder="—"
              placeholderTextColor={colors.textDim}
              keyboardType="decimal-pad"
              onEndEditing={(e) => {
                const v = parseFloat(e.nativeEvent.text);
                updateBottle(bottle.id, { pricePaid: isNaN(v) ? undefined : v });
              }}
            />
          </View>
          <View style={[styles.valueCol, { flex: 2 }]}>
            <Text style={styles.valueLabel}>Gain / loss vs fair price</Text>
            <Text
              style={[
                styles.fairPrice,
                {
                  color:
                    gainLoss === undefined
                      ? colors.textDim
                      : gainLoss >= 0
                        ? colors.success
                        : colors.danger,
                },
              ]}
            >
              {gainLoss === undefined
                ? '—'
                : `${gainLoss >= 0 ? '+' : '−'}${formatUsd(Math.abs(gainLoss))}`}
            </Text>
          </View>
        </View>
        <Text style={styles.estimate}>
          Fair price blends retail and secondary based on rarity — what a reasonable buyer pays
          without getting fleeced. Prices are estimates and vary by market.
        </Text>
      </View>

      {offers && offers.offers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where to buy</Text>
          {offers.offers.map((o) => (
            <TouchableOpacity
              key={`${o.retailer}-${o.url}`}
              style={styles.offerRow}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(o.url)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.offerRetailer}>{o.retailer}</Text>
                {o.inStock === false && <Text style={styles.offerOos}>Out of stock</Text>}
              </View>
              <Text style={styles.offerPrice}>{formatUsd(o.price)}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textDim} />
            </TouchableOpacity>
          ))}
          {offers.offers[0] && (
            <Button
              title={`Use lowest (${formatUsd(offers.offers[0].price)}) as retail`}
              icon="pricetag"
              variant="secondary"
              onPress={() => updateBottle(bottle.id, { msrp: offers.offers[0].price })}
              style={{ marginTop: spacing.md }}
            />
          )}
          <Text style={styles.estimate}>
            Prices from partner retailers via affiliate links — Whiskey Vault may earn a commission.
            Availability and price vary by location. Must be 21+ to purchase.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasting notes</Text>
        <Text style={styles.notes}>{bottle.notes || 'No notes yet.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pour & fill</Text>
        <View style={styles.fillTrack}>
          <View style={[styles.fillFill, { width: `${bottle.fillLevel ?? 100}%` }]} />
        </View>
        <View style={styles.fillRow}>
          {FILL_STEPS.map((s) => (
            <TouchableOpacity
              key={s.v}
              style={[styles.fillChip, (bottle.fillLevel ?? 100) === s.v && styles.fillChipActive]}
              onPress={() => setFill(s.v)}
            >
              <Text
                style={[
                  styles.fillChipText,
                  (bottle.fillLevel ?? 100) === s.v && styles.fillChipTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {costPerPour !== undefined && (
          <Text style={styles.estimate}>≈ {formatUsd(costPerPour)} per 1.5 oz pour (cost basis)</Text>
        )}
        <Button
          title="Log a pour"
          icon="book"
          variant="secondary"
          onPress={() =>
            navigation.navigate('LogPour', {
              bottleId: bottle.id,
              name: bottle.name,
              distillery: bottle.distillery,
              type: bottle.type,
            })
          }
          style={{ marginTop: spacing.md }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cocktails for this bottle</Text>
        {cocktails === undefined ? (
          apiKey ? (
            <Button
              title={cocktailBusy ? 'Thinking…' : '✨ Suggest cocktails'}
              variant="secondary"
              onPress={loadCocktails}
              disabled={cocktailBusy}
              style={{ marginTop: spacing.sm }}
            />
          ) : (
            <Text style={styles.estimate}>Add an API key in Settings to get cocktail ideas.</Text>
          )
        ) : cocktails.length === 0 ? (
          <Text style={styles.estimate}>No suggestions came back — try again.</Text>
        ) : (
          cocktails.map((c) => (
            <View key={c.name} style={styles.cocktail}>
              <Text style={styles.cocktailName}>{c.name}</Text>
              <Text style={styles.cocktailRecipe}>{c.recipe}</Text>
              {!!c.note && <Text style={styles.cocktailNote}>{c.note}</Text>}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flavor profile</Text>
          <TouchableOpacity onPress={() => setEditing((e) => !e)}>
            <Text style={styles.editToggle}>{editing ? 'Done' : 'Adjust'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View>
            {FLAVOR_AXES.map((axis) => (
              <View key={axis} style={styles.editRow}>
                <Text style={styles.editLabel}>{FLAVOR_LABELS[axis]}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => nudge(axis, -0.5)}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.editValue}>{bottle.flavor[axis].toFixed(1)}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => nudge(axis, 0.5)}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.estimate}>
              Adjust to how this bottle actually tastes to you — picks and batches vary. Matching
              uses your adjusted values.
            </Text>
          </View>
        ) : (
          <>
            <FlavorRadar profile={bottle.flavor} size={260} />
            <View style={{ marginTop: spacing.md }}>
              <FlavorBars profile={bottle.flavor} />
            </View>
            <Text style={styles.estimate}>{SOURCE_LABELS[bottle.flavorSource ?? (bottle.refId ? 'db' : 'default')]}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.row}>
          <Button
            title={bottle.opened ? 'Mark sealed' : 'Mark opened'}
            variant="secondary"
            onPress={() => updateBottle(bottle.id, { opened: !bottle.opened })}
            style={{ flex: 1 }}
          />
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Button
            title="−"
            variant="secondary"
            onPress={() => updateBottle(bottle.id, { quantity: Math.max(0, bottle.quantity - 1) })}
            style={{ flex: 1 }}
          />
          <Text style={styles.qty}>{bottle.quantity} in stock</Text>
          <Button
            title="+"
            variant="secondary"
            onPress={() => updateBottle(bottle.id, { quantity: bottle.quantity + 1 })}
            style={{ flex: 1 }}
          />
        </View>
      </View>

        <Button
          title="Remove from bar"
          icon="trash"
          variant="danger"
          onPress={confirmDelete}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroImage: {
    width: 64,
    height: 84,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addPhoto: {
    width: 64,
    height: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.bgElevated,
  },
  addPhotoText: { color: colors.amber, fontSize: 10, fontWeight: '600' },
  name: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: 0.2 },
  sub: { color: colors.amberBright, marginTop: 6, fontSize: 13.5 },
  variant: { color: colors.amber, marginTop: 4, fontWeight: '700', fontSize: 13 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  editToggle: { color: colors.amber, fontWeight: '700' },
  notes: { color: colors.textDim, lineHeight: 20 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  offerRetailer: { color: colors.text, fontSize: 14, fontWeight: '600' },
  offerOos: { color: colors.danger, fontSize: 11, marginTop: 2 },
  offerPrice: { color: colors.amberBright, fontSize: 15, fontWeight: '800' },
  fillTrack: {
    height: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  fillFill: { height: 10, backgroundColor: colors.amber },
  fillRow: { flexDirection: 'row', gap: 6 },
  fillChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fillChipActive: { backgroundColor: colors.amber, borderColor: colors.amberBright },
  fillChipText: { color: colors.textDim, fontSize: 13, fontWeight: '700' },
  fillChipTextActive: { color: colors.ink },
  cocktail: { marginTop: spacing.md },
  cocktailName: { color: colors.amberBright, fontSize: 14, fontWeight: '700' },
  cocktailRecipe: { color: colors.text, fontSize: 13, marginTop: 3, lineHeight: 18 },
  cocktailNote: { color: colors.textDim, fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  estimate: { color: colors.textDim, fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  editRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  editLabel: { color: colors.textDim, flex: 1, fontSize: 14 },
  stepBtn: {
    backgroundColor: colors.cardAlt,
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: { color: colors.amber, fontSize: 18, fontWeight: '800' },
  editValue: { color: colors.text, width: 44, textAlign: 'center', fontWeight: '700' },
  rarityRow: { flexDirection: 'row', gap: 8 },
  rarityChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityChipText: { fontWeight: '900', fontSize: 16 },
  valueRow: { flexDirection: 'row', gap: 10 },
  valueCol: { flex: 1 },
  valueLabel: { color: colors.textDim, fontSize: 12, marginBottom: 4 },
  valueInput: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: '700',
  },
  fairPrice: {
    color: colors.amberBright,
    fontWeight: '800',
    fontSize: 16,
    paddingVertical: 9,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qty: { color: colors.text, fontWeight: '700', paddingHorizontal: 8 },
});
