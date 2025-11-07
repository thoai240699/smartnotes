// SearchScreen.js - Màn hình tìm kiếm
// TODO: Person C - Implement search functionality

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

const SearchScreen = ({ navigation }) => {
  // TODO: Search input
  // TODO: Filter by keyword, category, location
  // TODO: Display search results using NoteCard
  // TODO: Integrate with Redux search

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tìm kiếm ghi chú</Text>
      <Text style={styles.subtitle}>TODO: Implement search functionality</Text>
    </SafeAreaView>
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

export default SearchScreen;
