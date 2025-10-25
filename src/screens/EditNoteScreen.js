// EditNoteScreen.js - Màn hình chỉnh sửa ghi chú
// TODO: Person B - Similar to AddNoteScreen but with existing data

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';

const EditNoteScreen = ({ route, navigation }) => {
  // TODO: Get note from route.params
  // TODO: Pre-fill form with existing note data
  // TODO: Call updateNoteAsync on save

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa ghi chú</Text>
      <Text style={styles.subtitle}>TODO: Implement edit note form</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
});

export default EditNoteScreen;
