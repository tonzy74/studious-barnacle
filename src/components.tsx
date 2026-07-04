import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

import {
  colors,
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
  style?: ViewStyle;
  glow?: boolean;
}) {
  return (
    <LinearGradient
      colors={gradients.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
