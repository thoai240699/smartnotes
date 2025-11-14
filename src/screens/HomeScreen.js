// HomeScreen.js - Màn hình chính hiển thị danh sách ghi chú
import React, { useEffect, useCallback, useState, useRef } from 'react';
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
  RefreshControl,
  AppState,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  loadNotesAsync,
  syncNotesAsync,
  setSearchQuery,
  setFilterCategory,
  resetSyncError,
} from '../redux/noteSlice';
import NoteCard from '../components/NoteCard';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import { CATEGORY_VALUES, getCategoryLabel } from '../utils/categoryHelper';
import { updateGuestNotesToLoggedInUser } from '../db/database';

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
  const syncingRef = useRef(syncing);
  const isLoggedInRef = useRef(isLoggedIn);
  const userIdRef = useRef(userId);

  useEffect(() => {
    syncingRef.current = syncing;
    isLoggedInRef.current = isLoggedIn;
    userIdRef.current = userId;
  }, [syncing, isLoggedIn, userId]);

  const prevUserId = useRef();
  const appState = useRef(AppState.currentState);
  const dataToDisplay = filterCategory === 'all' ? notes : filteredNotes;

  useEffect(() => {
    const currentState = AppState.currentState;
    if (currentState === 'active') {
      console.log('App vừa mở, chờ 10 giây để đồng bộ...');

      const timer = setTimeout(() => {
        if (isLoggedInRef.current && !syncingRef.current) {
          console.log('Timeout 10s: Kích hoạt đồng bộ...');
          const userIdentifier = userIdRef.current || null;
          if (userIdentifier) { 
            dispatch(syncNotesAsync(userIdentifier));
          }
        } else {
          console.log('Timeout 10s: Bỏ qua (đang sync hoặc chưa đăng nhập).');
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [dispatch]);

  useEffect(() => {

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('Trạng thái app thay đổi:', appState.current, '→', nextAppState);
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App đã quay lại, kích hoạt đồng bộ tự động...');

        if (isLoggedIn && !syncing) {
          const userIdentifier = userId || null;
          dispatch(syncNotesAsync(userIdentifier));
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch, isLoggedIn, userId, syncing]);

  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen được focus');
      const userIdentifier = userId || null;
      const hasUserChanged = prevUserId.current !== userIdentifier;
      const loadAndMigrateData = async () => {
        try {
          let didMigrate = false;
          console.log(hasUserChanged, prevUserId.current, userIdentifier);
          if (hasUserChanged && !prevUserId.current && userIdentifier) {
            console.log('Phát hiện Đăng nhập: Đang di chuyển Guest Notes...');
            prevUserId.current = userIdentifier; //
            await updateGuestNotesToLoggedInUser(userIdentifier);
            console.log('Di chuyển hoàn tất.');
            didMigrate = true;
          }
          if (!isNotesLoaded || hasUserChanged) {
            console.log(`Bắt đầu tải notes cho user: ${userIdentifier} (Lý do: ${hasUserChanged ? 'User changed' : 'Initial load'})`);
            if (!didMigrate) {
                prevUserId.current = userIdentifier;
            }
            await dispatch(loadNotesAsync(userIdentifier)).unwrap();
          }
          if (didMigrate && userIdentifier) {
            console.log('Kích hoạt sync ngay sau khi nhận nuôi notes...');
            dispatch(syncNotesAsync(userIdentifier));
          }
          prevUserId.current = userIdentifier;
        } catch (error) {
          console.error("Lỗi trong useFocusEffect (load/migrate):", error);
        }
      };
      console.log('trạng thái loading: ', loading);
      if (!loading) {
        loadAndMigrateData();
      }
    }, [dispatch, userId, isNotesLoaded, loading])
  );

  const handleRefresh = useCallback(async () => {
    const userIdentifier = userId || null;
    console.log('--- Kích hoạt Manual-Sync (Pull-to-Refresh) ---');

    if (syncHasError) {
      dispatch(resetSyncError());
    }

    await dispatch(loadNotesAsync(userIdentifier)).unwrap();;
    if (isLoggedIn) {
      dispatch(syncNotesAsync(userIdentifier));
    }
  }, [dispatch, userId, isLoggedIn, syncHasError]);


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

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
        {filterCategory === 'all' ? 'Chưa có ghi chú nào' : `Không có ghi chú trong "${getCategoryLabel(filterCategory)}"`}
      </Text>
      {filterCategory === 'all' &&
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Bấm "+" để tạo ghi chú đầu tiên.</Text>}
    </View>
  );


  if (loading && !isNotesLoaded) {
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
      <FlatList
        data={dataToDisplay}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => handleNotePress(item)}
            isDark={isDarkMode}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={getItemLayout}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddNote}
        disabled={loading}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Sync Indicator */}
      {(loading || syncing) && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.syncText}>
            {syncing ? 'Đang đồng bộ...' : 'Đang tải...'}
          </Text>
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
    marginTop: Spacing.sm,
    fontSize: FontSizes.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
    paddingTop: Spacing.xxl * 6,
  },
  emptyText: {
    fontSize: FontSizes.xl,
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
