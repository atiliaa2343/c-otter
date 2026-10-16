import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface ListItemCardProps {
  /** Primary line — usually `name` or `title`. */
  title: string;
  /** Optional secondary line. */
  subtitle?: string | null;
  /** Optional extra detail lines (email, phone, color, etc). */
  details?: string[];
  imageUrl?: string | null;
  /** Renders a color swatch instead of an image when present. */
  swatchColor?: string | null;
  isFirst: boolean;
  isLast: boolean;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ListItemCard({
  title,
  subtitle,
  details,
  imageUrl,
  swatchColor,
  isFirst,
  isLast,
  busy,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ListItemCardProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const visibleDetails = (details ?? []).filter(Boolean);

  const confirmDelete = () => {
    Alert.alert(
      'Delete item',
      `Delete "${title}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.topRow}>
        {swatchColor ? (
          <View style={[styles.swatch, { backgroundColor: swatchColor }]} />
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumb}
            resizeMode="cover"
            accessibilityLabel={`${title} image`}
          />
        ) : null}

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: textSecondary }]}>{subtitle}</Text>
          ) : null}
          {visibleDetails.map((line) => (
            <Text key={line} style={[styles.detail, { color: textSecondary }]}>
              {line}
            </Text>
          ))}
        </View>

        {busy ? <ActivityIndicator size="small" color={primaryColor} /> : null}
      </View>

      <View style={[styles.actionsRow, { borderTopColor: cardBorder }]}>
        <View style={styles.reorderGroup}>
          <TouchableOpacity
            onPress={onMoveUp}
            disabled={isFirst || busy}
            style={[styles.iconButton, { opacity: isFirst || busy ? 0.35 : 1 }]}
            accessibilityLabel={`Move ${title} up`}
          >
            <Ionicons name="arrow-up" size={18} color={primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveDown}
            disabled={isLast || busy}
            style={[styles.iconButton, { opacity: isLast || busy ? 0.35 : 1 }]}
            accessibilityLabel={`Move ${title} down`}
          >
            <Ionicons name="arrow-down" size={18} color={primaryColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            onPress={onEdit}
            disabled={busy}
            style={[styles.actionButton, { borderColor: cardBorder }]}
            accessibilityLabel={`Edit ${title}`}
          >
            <Ionicons name="create-outline" size={16} color={primaryColor} />
            <Text style={[styles.actionText, { color: primaryColor }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmDelete}
            disabled={busy}
            style={[styles.actionButton, { borderColor: '#fecaca' }]}
            accessibilityLabel={`Delete ${title}`}
          >
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
            <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  detail: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  reorderGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
