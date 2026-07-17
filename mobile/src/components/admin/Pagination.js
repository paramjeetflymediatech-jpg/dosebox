import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rs, rm, spacing, radius } from '../../utils/responsive';

export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </Text>
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, currentPage === 1 && styles.buttonDisabled]}
          disabled={currentPage === 1}
          onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <Ionicons name="chevron-back" size={rs(16)} color={currentPage === 1 ? '#94a3b8' : '#334155'} />
          <Text style={[styles.buttonText, currentPage === 1 && styles.textDisabled]}>Prev</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageText}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity 
          style={[styles.button, currentPage === totalPages && styles.buttonDisabled]}
          disabled={currentPage === totalPages}
          onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <Text style={[styles.buttonText, currentPage === totalPages && styles.textDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={rs(16)} color={currentPage === totalPages ? '#94a3b8' : '#334155'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: rs(12),
    color: '#64748b',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: rm(6),
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#f1f5f9',
  },
  buttonText: {
    fontSize: rs(13),
    color: '#334155',
    fontWeight: '600',
  },
  textDisabled: {
    color: '#94a3b8',
  },
  pageText: {
    fontSize: rs(13),
    fontWeight: '600',
    color: '#0f172a',
  }
});
