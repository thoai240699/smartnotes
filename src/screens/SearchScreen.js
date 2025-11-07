import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import NoteCard from '../components/NoteCard';
import { useTheme } from '../contexts/ThemeContext';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: 'apps-outline' },
  { id: 'work', name: 'Công việc', icon: 'briefcase-outline' },
  { id: 'personal', name: 'Cá nhân', icon: 'person-outline' },
  { id: 'shopping', name: 'Mua sắm', icon: 'cart-outline' },
  { id: 'other', name: 'Khác', icon: 'ellipsis-horizontal-outline' },
];

const SearchScreen = ({ navigation }) => {
  const notes = useSelector((state) => state.note.notes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { isDarkMode } = useTheme();

  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Filter logic
  const filteredNotes = useMemo(() => {
    let results = notes;

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter((note) => note.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Sort by newest first
    return results.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }, [notes, searchQuery, selectedCategory]);

  const handleClearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    Keyboard.dismiss();
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory !== 'all';

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="search-outline"
          size={64}
          color={themeColors.textSecondary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        {searchQuery.trim() ? 'Không tìm thấy kết quả' : 'Tìm kiếm ghi chú'}
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}
      >
        {searchQuery.trim()
          ? `Không có ghi chú nào khớp với "${searchQuery}"`
          : 'Nhập từ khóa hoặc chọn danh mục để tìm kiếm'}
      </Text>
      {searchQuery.trim() && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
          onPress={handleClearSearch}
        >
          <Text style={styles.emptyButtonText}>Xóa tìm kiếm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />

      {/* Fixed Header */}
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={themeColors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Tìm kiếm ghi chú..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                style={styles.clearIconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryListContent}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                    },
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : themeColors.text}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: themeColors.text },
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <View style={styles.contentContainer}>
        {/* Results Header - Only show when has results */}
        {filteredNotes.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsCount, { color: themeColors.text }]}>
              {filteredNotes.length} kết quả
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={handleClearFilters}
                style={styles.clearFiltersButton}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results List */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredNotes.length === 0 && styles.listContentEmpty,
          ]}
          renderItem={({ item }) => (
            <View style={styles.noteCardWrapper}>
              <NoteCard
                note={item}
                onPress={() =>
                  navigation.navigate('NoteDetail', { note: item })
                }
              />
            </View>
          )}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Container (Fixed)
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  // Search Bar
  searchBarContainer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    padding: 0,
    fontWeight: '400',
  },
  clearIconButton: {
    marginLeft: 8,
    padding: 4,
  },

  // Category Filter
  categoryContainer: {
    paddingBottom: 12,
  },
  categoryListContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },

  // Content Container (Scrollable)
  contentContainer: {
    flex: 1,
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },

  // List Content
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  noteCardWrapper: {
    marginVertical: 6,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SearchScreen;
