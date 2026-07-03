import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { colors, typeColors } from './theme';
import { FLAVOR_AXES, FLAVOR_LABELS } from './data/whiskeyDatabase';
import { FlavorProfile } from './types';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary' ? colors.amber : variant === 'danger' ? colors.danger : colors.cardAlt;
  const fg = variant === 'secondary' ? colors.text : '#1a120b';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: variant === 'danger' ? colors.text : fg }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: typeColors[type] ?? typeColors.other }]}>
      <Text style={styles.badgeText}>{type.toUpperCase()}</Text>
    </View>
  );
}

export function FlavorBars({ profile }: { profile: FlavorProfile }) {
  return (
    <View>
      {FLAVOR_AXES.map((axis) => (
        <View key={axis} style={styles.barRow}>
          <Text style={styles.barLabel}>{FLAVOR_LABELS[axis]}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${profile[axis] * 10}%` }]} />
          </View>
          <Text style={styles.barValue}>{Math.round(profile[axis])}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { fontWeight: '700', fontSize: 16 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: { color: '#1a120b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  barLabel: { color: colors.textDim, width: 82, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: colors.amber, borderRadius: 4 },
  barValue: { color: colors.textDim, width: 24, textAlign: 'right', fontSize: 12 },
});
