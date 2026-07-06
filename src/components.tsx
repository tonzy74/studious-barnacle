import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import {
  colors,
  glow,
  gradients,
  radius,
  rarityColors,
  shadow,
  spacing,
  type as typo,
  typeColors,
  typeIcons,
} from './theme';
import { FLAVOR_AXES, FLAVOR_LABELS } from './data/whiskeyDatabase';
import { FlavorProfile, Rarity } from './types';

/** Elevated, gradient-filled surface — the base for cards across the app. */
export function Card({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}) {
  return (
    <LinearGradient
      colors={gradients.card}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.card, glow ? shadow.gold : shadow.card, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const content = (
    <View style={styles.buttonInner}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={variant === 'primary' ? colors.ink : colors.text}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={[styles.buttonText, { color: variant === 'primary' ? colors.ink : colors.text }]}
      >
        {title}
      </Text>
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[{ opacity: disabled ? 0.5 : 1 }, shadow.gold, style]}
      >
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: variant === 'danger' ? colors.danger : colors.cardAlt,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.borderBright,
        },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

/** Circular type glyph tinted by whiskey category. */
export function TypeIcon({ type, size = 34 }: { type: string; size?: number }) {
  const tint = typeColors[type] ?? typeColors.other;
  const glyph = (typeIcons[type] ?? 'wine') as keyof typeof Ionicons.glyphMap;
  return (
    <View
      style={[
        styles.typeIcon,
        { width: size, height: size, borderRadius: size / 2, borderColor: tint },
      ]}
    >
      <Ionicons name={glyph} size={size * 0.5} color={tint} />
    </View>
  );
}

/**
 * A clean bottle silhouette tinted by whiskey type — the free, always-there
 * placeholder shown when an entry has no photo, so nothing looks empty.
 */
export function BottleSilhouette({ type, size = 72 }: { type: string; size?: number }) {
  const tint = typeColors[type] ?? typeColors.other;
  const w = size;
  const h = size * 1.5;
  return (
    <Svg width={w} height={h} viewBox="0 0 40 60">
      {/* cap */}
      <Rect x="16.5" y="1.5" width="7" height="4.5" rx="1" fill={tint} opacity={0.9} />
      {/* neck */}
      <Rect x="17.5" y="6" width="5" height="9" fill={tint} opacity={0.5} />
      {/* body with sloped shoulders */}
      <Path
        d="M17.5 14 C17.5 17 11 18 11 25 L11 52 a4 4 0 0 0 4 4 L25 56 a4 4 0 0 0 4 -4 L29 25 C29 18 22.5 17 22.5 14 Z"
        fill={tint}
        fillOpacity={0.16}
        stroke={tint}
        strokeWidth={1.2}
      />
      {/* label */}
      <Rect x="13.5" y="34" width="13" height="14" rx="1.5" fill={tint} opacity={0.22} />
    </Svg>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const tint = typeColors[type] ?? typeColors.other;
  const glyph = (typeIcons[type] ?? 'wine') as keyof typeof Ionicons.glyphMap;
  return (
    <View style={[styles.badge, { borderColor: tint }]}>
      <Ionicons name={glyph} size={11} color={tint} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: tint }]}>{type.toUpperCase()}</Text>
    </View>
  );
}

/** Gem-like rarity tier medallion. */
export function RarityBadge({ rarity, size = 28 }: { rarity?: Rarity; size?: number }) {
  if (!rarity) return null;
  const tint = rarityColors[rarity] ?? rarityColors.D;
  return (
    <LinearGradient
      colors={[tint, colors.cardAlt]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        styles.rarityBadge,
        { width: size, height: size, borderRadius: size / 2, borderColor: tint },
      ]}
    >
      <Text style={[styles.rarityText, { fontSize: size * 0.46 }]}>{rarity}</Text>
    </LinearGradient>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTick} />
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

/** Compact stat tile (count / value / abv etc.) for dashboards and headers. */
export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Card style={styles.statTile}>
      {icon && <Ionicons name={icon} size={18} color={colors.amberBright} />}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

/** Full-screen background: base gradient + a warm radial glow for depth. */
export function ScreenGradient({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient colors={gradients.screen} style={[{ flex: 1 }, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="screenGlow" cx="50%" cy="6%" r="75%">
            <Stop offset="0" stopColor={glow.color} stopOpacity={glow.topOpacity} />
            <Stop offset="1" stopColor={glow.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#screenGlow)" />
      </Svg>
      {/* Bottom vignette — the room dims toward the floor, like low lounge light. */}
      <LinearGradient
        colors={['transparent', '#0e080366', '#0b060299']}
        locations={[0.55, 0.85, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  );
}

/** Brass vault emblem — a ringed monogram, the app's signature mark. */
export function Emblem({ size = 40 }: { size?: number }) {
  return (
    <LinearGradient
      colors={gradients.gold}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[
        styles.emblem,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View style={[styles.emblemInner, { borderRadius: size / 2 - 3 }]}>
        <Text style={[styles.emblemText, { fontSize: size * 0.36 }]}>WV</Text>
      </View>
    </LinearGradient>
  );
}

/** Ornamental section divider — a hairline with a small brass diamond. */
export function OrnDivider() {
  return (
    <View style={styles.ornRow}>
      <View style={styles.ornLine} />
      <View style={styles.ornDiamond} />
      <View style={styles.ornLine} />
    </View>
  );
}

/** Standard screen title block with a gold eyebrow, optional back + action. */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {(onBack || right) && (
        <View style={styles.headerNav}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={colors.amberBright} />
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {right ?? <View />}
        </View>
      )}
      {eyebrow && <Text style={styles.headerEyebrow}>{eyebrow}</Text>}
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  );
}

/** Locked-feature panel shown in place of gated content. */
export function ProLock({
  title,
  benefits,
  onUpgrade,
}: {
  title: string;
  benefits: string[];
  onUpgrade: () => void;
}) {
  return (
    <View style={styles.lockWrap}>
      <LinearGradient colors={gradients.gold} style={styles.lockCrown}>
        <Ionicons name="lock-closed" size={26} color={colors.ink} />
      </LinearGradient>
      <Text style={styles.lockTitle}>{title}</Text>
      <View style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
        {benefits.map((b) => (
          <View key={b} style={styles.lockRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.amberBright} />
            <Text style={styles.lockBenefit}>{b}</Text>
          </View>
        ))}
      </View>
      <Button title="Unlock with Pro" icon="sparkles" onPress={onUpgrade} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
    </View>
  );
}

/** Small Pro badge/upsell chip. */
export function ProChip({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proChip}>
        <Ionicons name="star" size={11} color={colors.ink} />
        <Text style={styles.proChipText}>PRO</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/** Pill filter/selection chip. */
export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={active ? colors.ink : colors.textDim}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Horizontal gradient flavor bars with values. */
export function FlavorBars({ profile }: { profile: FlavorProfile }) {
  return (
    <View>
      {FLAVOR_AXES.map((axis) => (
        <View key={axis} style={styles.barRow}>
          <Text style={styles.barLabel}>{FLAVOR_LABELS[axis]}</Text>
          <View style={styles.barTrack}>
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.barFill, { width: `${Math.max(4, profile[axis] * 10)}%` }]}
            />
          </View>
          <Text style={styles.barValue}>{Math.round(profile[axis])}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Radar / spider chart of the 10 flavor axes — the signature visualization
 * of a bottle's character. Gold filled polygon over a brass web.
 */
export function FlavorRadar({ profile, size = 260 }: { profile: FlavorProfile; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34; // leave room for labels
  const n = FLAVOR_AXES.length;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pointAt = (i: number, radiusFrac: number) => {
    const a = angleFor(i);
    return {
      x: cx + r * radiusFrac * Math.cos(a),
      y: cy + r * radiusFrac * Math.sin(a),
    };
  };

  const polygon = FLAVOR_AXES.map((axis, i) => {
    const p = pointAt(i, Math.max(0.04, profile[axis] / 10));
    return `${p.x},${p.y}`;
  }).join(' ');

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {rings.map((frac) => (
          <Polygon
            key={frac}
            points={FLAVOR_AXES.map((_, i) => {
              const p = pointAt(i, frac);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {FLAVOR_AXES.map((_, i) => {
          const p = pointAt(i, 1);
          return (
            <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />
          );
        })}
        <Polygon
          points={polygon}
          fill={colors.amber}
          fillOpacity={0.35}
          stroke={colors.amberBright}
          strokeWidth={2}
        />
        {FLAVOR_AXES.map((axis, i) => {
          const p = pointAt(i, Math.max(0.04, profile[axis] / 10));
          return <Circle key={axis} cx={p.x} cy={p.y} r={2.5} fill={colors.gold} />;
        })}
      </Svg>
      {FLAVOR_AXES.map((axis, i) => {
        const p = pointAt(i, 1.16);
        return (
          <Text
            key={axis}
            style={[styles.radarLabel, { left: p.x - 34, top: p.y - 8 }]}
            numberOfLines={1}
          >
            {FLAVOR_LABELS[axis]}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    // A lighter top edge catches the room light; the deep shadow drops it off
    // the background for a raised, three-dimensional feel.
    borderTopColor: colors.borderBright,
    padding: spacing.lg,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  typeIcon: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  rarityBadge: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.gold,
  },
  rarityText: { color: colors.ink, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTick: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.amber,
    marginRight: spacing.sm,
  },
  sectionText: { ...typo.overline, color: colors.amberBright },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, gap: 2 },
  statValue: { ...typo.title, color: colors.text, marginTop: 2 },
  statLabel: { ...typo.caption, color: colors.textDim },
  lockWrap: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  lockCrown: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.gold,
  },
  lockTitle: { ...typo.title, color: colors.text, textAlign: 'center' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  lockBenefit: { color: colors.textDim, fontSize: 14, flex: 1 },
  proChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  proChipText: { color: colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  emblem: { alignItems: 'center', justifyContent: 'center', ...shadow.gold },
  emblemInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderWidth: 1,
    borderColor: '#00000033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemText: {
    color: colors.ink,
    fontWeight: '800',
    fontFamily: typo.display.fontFamily,
    letterSpacing: 0.5,
  },
  ornRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  ornLine: { flex: 1, height: 1, backgroundColor: colors.border },
  ornDiamond: {
    width: 7,
    height: 7,
    backgroundColor: colors.brass,
    transform: [{ rotate: '45deg' }],
  },
  headerEyebrow: { ...typo.overline, color: colors.amberDeep },
  headerTitle: { ...typo.display, color: colors.text, marginTop: 2 },
  headerSubtitle: { color: colors.textDim, marginTop: 4, fontSize: 14, lineHeight: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.amber, borderColor: colors.amberBright },
  chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.ink, fontWeight: '800' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  barLabel: { color: colors.textDim, width: 82, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 9,
    backgroundColor: colors.bgElevated,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: { height: 9, borderRadius: 5 },
  barValue: {
    color: colors.amberBright,
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
  },
  radarLabel: {
    position: 'absolute',
    width: 68,
    textAlign: 'center',
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
});
