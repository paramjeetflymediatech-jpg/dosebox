import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function AdminListControls({
  searchQuery,
  onSearchChange,
  filterOptions = [],
  filterValue,
  onFilterChange,
  sortOptions = [],
  sortValue,
  onSortChange,
}) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const activeFilterLabel = filterOptions.find(o => o.id === filterValue)?.label || 'All';
  const activeSortLabel = sortOptions.find(o => o.id === sortValue)?.label || 'Default';

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={rs(20)} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={rs(20)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Sort Buttons */}
      <View style={styles.controlsRow}>
        {filterOptions.length > 0 && (
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowFilterModal(true)}>
            <Ionicons name="filter" size={rs(16)} color="#475569" />
            <Text style={styles.dropdownBtnText} numberOfLines={1}>Filter: {activeFilterLabel}</Text>
            <Ionicons name="chevron-down" size={rs(16)} color="#475569" />
          </TouchableOpacity>
        )}

        {sortOptions.length > 0 && (
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSortModal(true)}>
            <Ionicons name="swap-vertical" size={rs(16)} color="#475569" />
            <Text style={styles.dropdownBtnText} numberOfLines={1}>Sort: {activeSortLabel}</Text>
            <Ionicons name="chevron-down" size={rs(16)} color="#475569" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Modal */}
      {filterOptions.length > 0 && (
        <Modal visible={showFilterModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter By</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {filterOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, filterValue === opt.id && styles.optionRowActive]}
                    onPress={() => {
                      onFilterChange(opt.id);
                      setShowFilterModal(false);
                    }}
                  >
                    <Text style={[styles.optionText, filterValue === opt.id && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                    {filterValue === opt.id && <Ionicons name="checkmark-circle" size={rs(20)} color="#1F5C52" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Sort Modal */}
      {sortOptions.length > 0 && (
        <Modal visible={showSortModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort By</Text>
                <TouchableOpacity onPress={() => setShowSortModal(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {sortOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, sortValue === opt.id && styles.optionRowActive]}
                    onPress={() => {
                      onSortChange(opt.id);
                      setShowSortModal(false);
                    }}
                  >
                    <Text style={[styles.optionText, sortValue === opt.id && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                    {sortValue === opt.id && <Ionicons name="checkmark-circle" size={rs(20)} color="#1F5C52" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: rv(12),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: rv(16),
    marginBottom: rv(12),
    paddingHorizontal: spacing.md,
    height: rv(48),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: rs(8),
    fontSize: rm(15),
    color: '#0F172A',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: rs(8),
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: rs(12),
    paddingVertical: rv(10),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: rm(13),
    fontWeight: '600',
    color: '#334155',
    marginHorizontal: rs(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: rm(18),
    fontWeight: '700',
    color: '#0F172A',
  },
  closeIcon: {
    fontSize: rm(20),
    color: '#64748B',
  },
  modalBody: {
    padding: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rv(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionRowActive: {
    backgroundColor: '#F8FAFC',
  },
  optionText: {
    fontSize: rm(15),
    color: '#334155',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#1F5C52',
    fontWeight: '700',
  },
});
