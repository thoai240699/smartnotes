// OfflineSyncScreen.js - Màn hình đồng bộ offline với conflict resolution
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { loadNotesFromSQLite, syncWithSQLite } from '../db/database';
import * as NoteAPI from '../api/NoteAPI';

const OfflineSyncScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state) => state.user);
  const { notes } = useSelector((state) => state.note);
  const { isDarkMode } = useTheme();

  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentConflict, setCurrentConflict] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    checkSyncStatus();
    loadLastSyncTime();
  }, []);

  useEffect(() => {
    if (notes) {
      checkUnsyncedNotes();
    }
  }, [notes]);

  const loadLastSyncTime = async () => {
    try {
      // Load from AsyncStorage or calculate from notes
      const lastSync = new Date().toISOString();
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const checkSyncStatus = async () => {
    try {
      // Check if there are unsynced notes in SQLite
      const localNotes = await loadNotesFromSQLite(user?.id || 'guest');
      if (localNotes.success && localNotes.data) {
        const unsynced = localNotes.data.filter(
          (note) => note.needsSync === true
        );
        setUnsyncedCount(unsynced.length);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const checkUnsyncedNotes = () => {
    // Count notes that might need syncing
    const unsynced = notes.filter((note) => note.needsSync === true);
    setUnsyncedCount(unsynced.length);
  };

  const handleManualSync = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Đăng nhập required',
        'Bạn cần đăng nhập để đồng bộ dữ liệu lên cloud.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // 1. Load local notes from SQLite
      const localResult = await loadNotesFromSQLite(user.id);
      if (!localResult.success) {
        throw new Error('Failed to load local notes');
      }

      const localNotes = localResult.data || [];

      // 2. Fetch remote notes from API
      let remoteNotes = [];
      try {
        remoteNotes = await NoteAPI.getNotes(user.id);
      } catch (error) {
        // If offline, continue with local sync only
        console.log('Cannot fetch remote notes, offline mode');
      }

      // 3. Detect conflicts
      const detectedConflicts = detectConflicts(localNotes, remoteNotes);

      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setCurrentConflict(detectedConflicts[0]);
        setShowConflictModal(true);
        setSyncStatus('conflict');
        return;
      }

      // 4. Perform sync if no conflicts
      await performSync(localNotes, remoteNotes);

      setSyncStatus('success');
      setLastSyncTime(new Date().toISOString());
      setUnsyncedCount(0);

      Alert.alert('Thành công', 'Đồng bộ dữ liệu hoàn tất!');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message);
      setSyncStatus('error');
      Alert.alert('Lỗi', `Không thể đồng bộ: ${error.message}`);
    }
  };

  const detectConflicts = (localNotes, remoteNotes) => {
    const conflictsList = [];

    localNotes.forEach((localNote) => {
      const remoteNote = remoteNotes.find((r) => r.id === localNote.id);

      if (remoteNote) {
        // Check if both versions were modified
        const localModified = new Date(
          localNote.updatedAt || localNote.createdAt
        );
        const remoteModified = new Date(
          remoteNote.updatedAt || remoteNote.createdAt
        );

        // If different and both modified, it's a conflict
        if (
          localNote.title !== remoteNote.title ||
          localNote.content !== remoteNote.content
        ) {
          if (Math.abs(localModified - remoteModified) > 1000) {
            // More than 1 second difference
            conflictsList.push({
              id: localNote.id,
              local: localNote,
              remote: remoteNote,
              localModified: localModified.toISOString(),
              remoteModified: remoteModified.toISOString(),
            });
          }
        }
      }
    });

    return conflictsList;
  };

  const performSync = async (localNotes, remoteNotes) => {
    // Sync local notes to remote
    for (const localNote of localNotes) {
      const remoteNote = remoteNotes.find((r) => r.id === localNote.id);

      if (!remoteNote) {
        // New note, upload to remote
        try {
          await NoteAPI.createNote(localNote);
        } catch (error) {
          console.error('Error uploading note:', error);
        }
      } else {
        // Check if local is newer
        const localModified = new Date(
          localNote.updatedAt || localNote.createdAt
        );
        const remoteModified = new Date(
          remoteNote.updatedAt || remoteNote.createdAt
        );

        if (localModified > remoteModified) {
          try {
            await NoteAPI.updateNote(localNote.id, localNote);
          } catch (error) {
            console.error('Error updating note:', error);
          }
        }
      }
    }

    // Download remote notes that don't exist locally
    for (const remoteNote of remoteNotes) {
      const localNote = localNotes.find((l) => l.id === remoteNote.id);
      if (!localNote) {
        // Download to local
        await syncWithSQLite(remoteNote);
      }
    }
  };

  const handleConflictResolution = async (resolution, conflictId) => {
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    try {
      let resolvedNote;

      switch (resolution) {
        case 'keep_local':
          resolvedNote = conflict.local;
          await NoteAPI.updateNote(conflict.id, conflict.local);
          break;

        case 'keep_remote':
          resolvedNote = conflict.remote;
          await syncWithSQLite(conflict.remote);
          break;

        case 'keep_both':
          // Create new note with local content
          const newNote = {
            ...conflict.local,
            id: `${conflict.local.id}_copy_${Date.now()}`,
            title: `${conflict.local.title} (Bản sao)`,
          };
          await NoteAPI.createNote(newNote);
          await syncWithSQLite(newNote);
          resolvedNote = conflict.remote;
          await syncWithSQLite(conflict.remote);
          break;

        default:
          return;
      }

      // Remove resolved conflict
      const updatedConflicts = conflicts.filter((c) => c.id !== conflictId);
      setConflicts(updatedConflicts);

      if (updatedConflicts.length > 0) {
        setCurrentConflict(updatedConflicts[0]);
      } else {
        setShowConflictModal(false);
        setCurrentConflict(null);
        setSyncStatus('success');
        Alert.alert('Thành công', 'Xung đột đã được giải quyết!');
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
      Alert.alert('Lỗi', 'Không thể giải quyết xung đột');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkSyncStatus();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa đồng bộ';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const renderSyncStatus = () => {
    let statusColor = Colors.light.textSecondary;
    let statusText = 'Không xác định';
    let statusIcon = 'help-circle';

    switch (syncStatus) {
      case 'idle':
        statusColor = Colors.light.textSecondary;
        statusText = 'Sẵn sàng';
        statusIcon = 'checkmark-circle';
        break;
      case 'syncing':
        statusColor = Colors.primary;
        statusText = 'Đang đồng bộ...';
        statusIcon = 'sync';
        break;
      case 'success':
        statusColor = Colors.success;
        statusText = 'Đã đồng bộ';
        statusIcon = 'checkmark-circle';
        break;
      case 'error':
        statusColor = Colors.error;
        statusText = 'Lỗi đồng bộ';
        statusIcon = 'alert-circle';
        break;
      case 'conflict':
        statusColor = Colors.warning;
        statusText = 'Có xung đột';
        statusIcon = 'warning';
        break;
    }

    return (
      <View style={[styles.statusCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.statusHeader}>
          <Ionicons name={statusIcon} size={32} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {lastSyncTime && (
          <Text
            style={[styles.lastSyncText, { color: themeColors.textSecondary }]}
          >
            Lần cuối: {formatDate(lastSyncTime)}
          </Text>
        )}

        {unsyncedCount > 0 && (
          <View style={styles.unsyncedBadge}>
            <Text style={styles.unsyncedText}>
              {unsyncedCount} ghi chú chưa đồng bộ
            </Text>
          </View>
        )}

        {syncError && (
          <Text style={[styles.errorText, { color: Colors.error }]}>
            {syncError}
          </Text>
        )}
      </View>
    );
  };

  const renderConflictModal = () => {
    if (!currentConflict) return null;

    return (
      <Modal
        visible={showConflictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              ⚠️ Xung đột dữ liệu
            </Text>

            <Text
              style={[
                styles.modalDescription,
                { color: themeColors.textSecondary },
              ]}
            >
              Ghi chú "{currentConflict.local.title}" có 2 phiên bản khác nhau.
              Chọn phiên bản bạn muốn giữ lại:
            </Text>

            {/* Local Version */}
            <View style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <Ionicons
                  name="phone-portrait"
                  size={20}
                  color={Colors.primary}
                />
                <Text
                  style={[styles.versionTitle, { color: themeColors.text }]}
                >
                  Phiên bản trên máy
                </Text>
              </View>
              <Text
                style={[
                  styles.versionDate,
                  { color: themeColors.textSecondary },
                ]}
              >
                Sửa đổi: {formatDate(currentConflict.localModified)}
              </Text>
              <Text
                style={[styles.versionContent, { color: themeColors.text }]}
                numberOfLines={3}
              >
                {currentConflict.local.content}
              </Text>
              <TouchableOpacity
                style={[
                  styles.resolutionButton,
                  { backgroundColor: Colors.primary },
                ]}
                onPress={() =>
                  handleConflictResolution('keep_local', currentConflict.id)
                }
                testID="keep-local-button"
              >
                <Text style={styles.resolutionButtonText}>
                  Giữ phiên bản này
                </Text>
              </TouchableOpacity>
            </View>

            {/* Remote Version */}
            <View style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <Ionicons name="cloud" size={20} color={Colors.success} />
                <Text
                  style={[styles.versionTitle, { color: themeColors.text }]}
                >
                  Phiên bản trên cloud
                </Text>
              </View>
              <Text
                style={[
                  styles.versionDate,
                  { color: themeColors.textSecondary },
                ]}
              >
                Sửa đổi: {formatDate(currentConflict.remoteModified)}
              </Text>
              <Text
                style={[styles.versionContent, { color: themeColors.text }]}
                numberOfLines={3}
              >
                {currentConflict.remote.content}
              </Text>
              <TouchableOpacity
                style={[
                  styles.resolutionButton,
                  { backgroundColor: Colors.success },
                ]}
                onPress={() =>
                  handleConflictResolution('keep_remote', currentConflict.id)
                }
                testID="keep-remote-button"
              >
                <Text style={styles.resolutionButtonText}>
                  Giữ phiên bản này
                </Text>
              </TouchableOpacity>
            </View>

            {/* Keep Both Option */}
            <TouchableOpacity
              style={[
                styles.resolutionButton,
                styles.keepBothButton,
                { borderColor: themeColors.border },
              ]}
              onPress={() =>
                handleConflictResolution('keep_both', currentConflict.id)
              }
              testID="keep-both-button"
            >
              <Text style={[styles.keepBothText, { color: themeColors.text }]}>
                Giữ cả 2 phiên bản
              </Text>
            </TouchableOpacity>

            {conflicts.length > 1 && (
              <Text
                style={[
                  styles.conflictCount,
                  { color: themeColors.textSecondary },
                ]}
              >
                Còn {conflicts.length - 1} xung đột nữa
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      testID="offline-sync-screen"
    >
      <View style={styles.header}>
        <Ionicons name="sync-circle" size={48} color={Colors.primary} />
        <Text style={[styles.title, { color: themeColors.text }]}>
          Đồng bộ dữ liệu
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Quản lý đồng bộ giữa thiết bị và cloud
        </Text>
      </View>

      {renderSyncStatus()}

      {/* Sync Button */}
      <TouchableOpacity
        style={[
          styles.syncButton,
          { backgroundColor: Colors.primary },
          syncStatus === 'syncing' && styles.syncButtonDisabled,
        ]}
        onPress={handleManualSync}
        disabled={syncStatus === 'syncing'}
        testID="sync-button"
      >
        {syncStatus === 'syncing' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Ionicons name="sync" size={24} color="#FFFFFF" />
        )}
        <Text style={styles.syncButtonText}>
          {syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
        </Text>
      </TouchableOpacity>

      {/* Info Cards */}
      <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
        <Ionicons name="information-circle" size={24} color={Colors.primary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>
            Về đồng bộ
          </Text>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            • Dữ liệu được lưu trên máy (SQLite) và cloud (MockAPI)
          </Text>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            • Tự động đồng bộ khi có kết nối mạng
          </Text>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            • Xung đột sẽ được phát hiện và yêu cầu giải quyết
          </Text>
        </View>
      </View>

      {!isLoggedIn && (
        <View style={[styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="warning" size={24} color={Colors.warning} />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: Colors.warning }]}>
              Chế độ khách
            </Text>
            <Text style={styles.warningText}>
              Bạn cần đăng nhập để đồng bộ dữ liệu lên cloud.
            </Text>
          </View>
        </View>
      )}

      {renderConflictModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  statusCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginLeft: Spacing.md,
  },
  lastSyncText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  unsyncedBadge: {
    backgroundColor: Colors.warning,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  unsyncedText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.md,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  infoCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  warningCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
  },
  warningContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  warningTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  versionCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  versionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  versionDate: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  versionContent: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  resolutionButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  resolutionButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  keepBothButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  keepBothText: {
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  conflictCount: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default OfflineSyncScreen;
