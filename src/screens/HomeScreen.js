// HomeScreen.js - Màn hình chính hiển thị danh sách ghi chú
import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  loadNotesAsync,
  syncNotesAsync,
  setSearchQuery,
  setFilterCategory,
} from '../redux/noteSlice';
import NoteCard from '../components/NoteCard';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import { CATEGORY_VALUES, getCategoryLabel } from '../utils/categoryHelper';

const NOTE_CARD_HEIGHT = 180;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isDarkMode, theme } = useTheme();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const {
    notes,
    filteredNotes,
    loading,
    syncing,
    isNotesLoaded,
    filterCategory,
    syncHasError,
  } = useSelector((state) => state.note);

  const { isLoggedIn, userId } = useSelector((state) => state.user);
  const dataToDisplay = filterCategory === 'all' ? notes : filteredNotes;

   const [lastSyncTriggered, setLastSyncTriggered] = useState(0);

   const checkAndSync = useCallback(() => {
    const userIdentifier = userId || null;
    const hasPendingNotes = notes.some(
      note => note.syncStatus === 'pending' || note.syncStatus === 'deleted-pending'
    );
    const now = Date.now();

    // Kiểm tra điều kiện và thời gian giữa các lần gọi (ví dụ, tối thiểu 1 giây)
    if (isLoggedIn && isNotesLoaded && !syncing && hasPendingNotes && !syncHasError && (now - lastSyncTriggered) > 1000) {
        console.log('--- HOME SCREEN SYNC TRIGGERED (checkAndSync) ---');
        console.log('ACTION: Dispatching syncNotesAsync...');
        dispatch(syncNotesAsync(userIdentifier));
        setLastSyncTriggered(now); // Cập nhật thời gian cuối cùng gọi sync
    } else {
        if (!isLoggedIn || !isNotesLoaded || syncing || !hasPendingNotes || syncHasError) {
            console.log('SYNC CHECK (checkAndSync): Bỏ qua - Điều kiện không đủ.');
            console.log(`  - isLoggedIn: ${isLoggedIn}`);
            console.log(`  - isNotesLoaded: ${isNotesLoaded}`);
            console.log(`  - syncing: ${syncing}`);
            console.log(`  - hasPendingNotes: ${hasPendingNotes}`);
            console.log(`  - syncHasError: ${syncHasError}`);
        } else if ((now - lastSyncTriggered) <= 1000) {
            console.log('SYNC CHECK (checkAndSync): Bỏ qua - Gọi quá nhanh.');
        }
    }
  }, [isLoggedIn, isNotesLoaded, syncing, syncHasError, notes, userId, dispatch, lastSyncTriggered]);


  useEffect(() => {
    const userIdentifier = userId || null;
    const hasPendingNotes = notes.some(
      note => note.syncStatus === 'pending'
    );

    if (isLoggedIn && isNotesLoaded && !syncing && hasPendingNotes && !syncHasError) {
      console.log('--- HOME SCREEN SYNC TRIGGERED (useEffect) ---');
      console.log('ACTION: Dispatching syncNotesAsync...');
      dispatch(syncNotesAsync(userIdentifier));
    } else if (isLoggedIn && isNotesLoaded && hasPendingNotes && syncHasError) {
      console.log('SYNC CHECK: Có lỗi trước đó hoặc không có pending notes, bỏ qua.');
      console.log(`  - Syncing: ${syncing}`);
      console.log(`  - Sync Error: ${syncHasError}`);
      console.log(`  - Has Pending Notes: ${hasPendingNotes}`);
    }
  }, [isLoggedIn, isNotesLoaded, syncing, syncHasError, notes, userId, dispatch]);


  useFocusEffect(
    useCallback(() => {
      const userIdentifier = userId || null;

      if (!isNotesLoaded && !loading) {
        console.log('--- HOMESCREEN FOCUS (INIT) ---');
        console.log('STATUS: [INIT] Notes chưa được tải lần đầu.');
        console.log('ACTION: Dispatching loadNotesAsync...');
        dispatch(loadNotesAsync(userIdentifier));
      } else {
        console.log('--- HOMESCREEN FOCUS (REFRESH UI) ---');
        console.log('STATUS: Notes đã được tải, có thể làm mới giao diện.');
      }
    }, [dispatch, userId, isNotesLoaded, loading]));

  const handleNotePress = (note) => {
    navigation.navigate('NoteDetail', { noteId: note.id });
  };

  const handleAddNote = () => {
    navigation.navigate('AddNote');
  };

  const getItemLayout = (data, index) => ({
    length: NOTE_CARD_HEIGHT,
    offset: NOTE_CARD_HEIGHT * index,
    index,
  });

  if (loading) { 
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Đang tải ghi chú...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, {
        backgroundColor: themeColors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
      }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      {/* Category Filter */}
      <View style={[styles.categoryBarContainer, { backgroundColor: themeColors.backgroundSecondary, borderBottomColor: themeColors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBar}>
          {CATEGORY_VALUES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                filterCategory === cat
                  ? { backgroundColor: Colors.primary, borderColor: Colors.primary }
                  : { backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border },
              ]}
              onPress={() => dispatch(setFilterCategory(cat))}
            >
              <Text
                style={[
                  styles.categoryText,
                  filterCategory === cat ? { color: '#FFFFFF' } : { color: themeColors.text },
                ]}
              >
                {getCategoryLabel(cat) || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notes List */}
      {dataToDisplay.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            {filterCategory === 'all' ? 'Chưa có ghi chú nào' : `Không có ghi chú trong "${getCategoryLabel(filterCategory)}"`}
          </Text>
          {filterCategory === 'all' &&
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Bấm "+" để tạo ghi chú đầu tiên.</Text>}
        </View>
      ) : (
        <FlatList
          data={dataToDisplay}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={getItemLayout}
        />
      )
      }

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddNote}
        disabled={loading}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Sync Indicator */}
      {syncing && ( // Hiển thị indicator nếu đang sync
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.syncText}>Đang đồng bộ...</Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryBarContainer: {
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : 5,
  },
  categoryBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginRight: Spacing.sm,
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
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  listContent: {
    padding: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  syncIndicator: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary, // Dùng màu primary để nổi bật
    paddingVertical: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? useSafeAreaInsets().bottom : Spacing.xs,
  },
  syncText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  }
});

export default HomeScreen;
