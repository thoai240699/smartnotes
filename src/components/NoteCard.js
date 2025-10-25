// NoteCard.js - Component hiển thị mỗi ghi chú
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
} from '../styles/globalStyles';
import { formatRelativeTime, isOverdue } from '../utils/dateHelper';

const NoteCard = ({ note, onPress, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const categoryColor = Colors.category[note.category] || Colors.category.other;
  const isNoteDue = note.dueDate && isOverdue(note.dueDate);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: themeColors.card, borderColor: themeColors.border },
        Shadows.medium,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category Indicator */}
      <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />

      <View style={styles.content}>
        {/* Title */}
        <Text
          style={[styles.title, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {note.title}
        </Text>

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
          <Image source={{ uri: note.image }} style={styles.imagePreview} />
        )}

        <View style={styles.footer}>
          {/* Category Badge */}
          <View
            style={[styles.badge, { backgroundColor: categoryColor + '20' }]}
          >
            <Text style={[styles.badgeText, { color: categoryColor }]}>
              {note.category || 'other'}
            </Text>
          </View>

          {/* Due Date */}
          {note.dueDate && (
            <Text
              style={[
                styles.dueDate,
                { color: isNoteDue ? Colors.error : themeColors.textSecondary },
              ]}
            >
              {formatRelativeTime(note.dueDate)}
            </Text>
          )}

          {/* Completed Status */}
          {note.isCompleted && (
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
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
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
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDate: {
    fontSize: FontSizes.xs,
  },
  completedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  completedText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(NoteCard, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.title === nextProps.note.title &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.category === nextProps.note.category &&
    prevProps.note.dueDate === nextProps.note.dueDate &&
    prevProps.note.image === nextProps.note.image &&
    prevProps.note.isCompleted === nextProps.note.isCompleted &&
    prevProps.theme === nextProps.theme
  );
});
