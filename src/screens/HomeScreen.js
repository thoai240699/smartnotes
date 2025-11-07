// HomeScreen.js - Màn hình chính hiển thị danh sách ghi chú
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotesAsync,
  setSearchQuery,
  setFilterCategory,
} from '../redux/noteSlice';
import NoteCard from '../components/NoteCard';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { filteredNotes, loading, filterCategory } = useSelector(
    (state) => state.note
  );
  const { currentUser, isAuthenticated } = useSelector((state) => state.user);
  const [theme, setTheme] = useState('light');

  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    // Load notes from local SQLite (works without login)
    // If user is logged in, also fetch from server
    if (isAuthenticated && currentUser) {
      dispatch(fetchNotesAsync(currentUser.id));
    } else {
      // TODO: Load from local SQLite only
      // dispatch(loadLocalNotesAsync());
    }
  }, [currentUser, isAuthenticated]);

  const handleNotePress = (note) => {
    navigation.navigate('NoteDetail', { note });
  };

  const handleAddNote = () => {
    navigation.navigate('AddNote');
  };

  const categories = ['all', 'work', 'personal', 'shopping', 'health', 'other'];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    filterCategory === item
                      ? Colors.primary
                      : themeColors.backgroundSecondary,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => dispatch(setFilterCategory(item))}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      filterCategory === item ? '#FFFFFF' : themeColors.text,
                  },
                ]}
              >
                {item === 'all' ? 'Tất cả' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Notes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item)}
              theme={theme}
            />
          )}
          // Performance optimizations
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          // getItemLayout for fixed height items (NoteCard ~180px)
          getItemLayout={(data, index) => ({
            length: 180,
            offset: 180 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text
                style={[styles.emptyText, { color: themeColors.textSecondary }]}
              >
                Chưa có ghi chú nào
              </Text>
            </View>
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: FontSizes.lg,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

export default HomeScreen;
