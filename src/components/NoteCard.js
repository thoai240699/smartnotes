// NoteCard.js - Component hiển thị mỗi ghi chú
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
} from '../styles/globalStyles';
import { formatRelativeTime, isOverdue } from '../utils/dateHelper';

// Màu sắc cho các Category
const CATEGORY_COLORS = {
  work: '#FF7043',     // Orange
  personal: '#42A5F5', // Blue
  shopping: '#8BC34A',  // Light Green
  health: '#FFCA28',    // Yellow
  other: '#BDBDBD',     // Gray
  tatca: '#7E57C2',    // Deep Purple
};


/**
 * NoteCard Component - Hiển thị tóm tắt ghi chú.
 * @param {object} props.note - Dữ liệu ghi chú.
 * @param {function} props.onPress - Xử lý khi nhấn vào card.
 */
const NoteCard = ({ note, onPress, isDark = false }) => {
  const themeColors = isDark ? Colors.dark : Colors.light;

  const categoryColor = CATEGORY_COLORS[note.category] || CATEGORY_COLORS.other;
  const isNoteDue = note.dueDate && isOverdue(note.dueDate);

  const isPendingSync = note.syncStatus === 'pending';
  const isCompleted = note.isCompleted;

  const titleStyle = [
    styles.title,
    { color: themeColors.text },
    isCompleted && styles.completedTitle,
  ];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
          borderLeftColor: categoryColor, // Viền Category
        },
        Shadows.medium,
      ]}
      onPress={onPress}
      activeOpacity={isCompleted ? 0.6 : 0.8}
    >
      {/* Category Indicator */}
      <View style={styles.content}>
        {/* Title & Completed Status */}
        <View style={styles.header}>
          <Text style={titleStyle} numberOfLines={1}>
            {(note.title)}
          </Text>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color={Colors.success}/>
          ): null}
        </View>

        {/* Content Preview */}
        {note.content && (
          <Text
            style={[styles.contentText, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {note.content}
          </Text>
        )}

        {/* Image Preview */}
        {note.image && (
          <Image
            source={{ uri: note.image }}
            style={styles.imagePreview}
            resizeMode="cover" // Thêm resizeMode
          />
        )}

        <View style={styles.footer}>
          {/* Category Badge */}
          <View
            style={[styles.badge, { backgroundColor: categoryColor + '20' }]}
          >
            <Text style={[styles.badgeText, { color: categoryColor }]}>
              {(note.category || 'other').toString()}
            </Text>
          </View>

          {/* Due Date & Overdue */}
          {note.dueDate && (
            <View style={styles.infoPill}>
              <Ionicons
                name={isNoteDue ? "warning" : "alarm-outline"}
                size={14}
                color={isNoteDue ? Colors.error : themeColors.textSecondary}
                style={styles.infoIcon}
              />
              <Text
                style={[
                  styles.dueDate,
                  { color: isNoteDue ? Colors.error : themeColors.textSecondary },
                ]}
              >
                {formatRelativeTime(note.dueDate) || 'N/A'}
              </Text>
            </View>
          )}

          {/* Completed Status */}
          {note.isCompleted ? (
            <View
              style={[
                styles.completedBadge,
                { backgroundColor: Colors.success + '20' },
              ]}
            >
              <Text style={[styles.completedText, { color: Colors.success }]}>
                ✓ Hoàn thành
              </Text>
            </View>
          ): null}

          {/* SYNC STATUS BADGE */}
          {isPendingSync && (
            <View style={styles.syncBadge}>
              <Ionicons name="cloud-upload" size={12} color="#FFFFFF" style={styles.infoIcon} />
              <Text style={styles.syncText}>{' '}Pending Sync</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    borderLeftWidth: 5,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    flex: 1,
    marginBottom: Spacing.xs,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  contentText: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDate: {
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  infoIcon: {
    // Không cần margin nếu đã có trong infoPill
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  syncText: {
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  completedText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(NoteCard, (prevProps, nextProps) => {
  const prev = prevProps.note;
  const next = nextProps.note;
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.isCompleted === next.isCompleted &&
    prev.syncStatus === next.syncStatus
  );
});
