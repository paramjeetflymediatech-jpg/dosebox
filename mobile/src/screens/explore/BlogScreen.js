import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';
import { getFullImageUrl } from '../../utils/image';

export default function BlogScreen({ navigation }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const res = await api.get('/blogs');
      if (res.data?.success) {
        setBlogs(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load blogs', err);
    } finally {
      setLoading(false);
    }
  };

  const renderBlog = ({ item: post }) => {
    const bgColors = ['#E0F2FE', '#DCFCE7', '#FEE2E2', '#FEF3C7'];
    const textColors = ['#0284C7', '#16A34A', '#DC2626', '#D97706'];
    const colorIdx = post.id % bgColors.length;
    
    const bgColor = post.color || bgColors[colorIdx];
    const textColor = post.text || textColors[colorIdx];
    
    const dateStr = post.createdAt 
      ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : post.date;

    const imageUrl = getFullImageUrl(post.coverImage);

    return (
      <TouchableOpacity 
        key={post.id} 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('BlogDetail', { blogId: post.id })}
      >
        <View style={styles.imagePlaceholder}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Text style={styles.imageIcon}>📰</Text>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{post.category || 'Health'}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{dateStr}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.meta}>{post.read || '5 min read'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dosebox Blog</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0c888d" style={{ marginTop: rv(40) }} />
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBlog}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#64748B', marginTop: rv(40) }}>No blogs found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingTop: rv(12), paddingBottom: rv(14),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  headerRight: { width: rm(24) },
  content: { padding: spacing.md, paddingBottom: rv(40) },
  card: {
    backgroundColor: '#fff', borderRadius: radius.xl, marginBottom: rv(20), overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  imagePlaceholder: { height: rv(140), backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  imageIcon: { fontSize: rm(40) },
  cardBody: { padding: spacing.lg },
  badge: { alignSelf: 'flex-start', paddingHorizontal: rv(10), paddingVertical: rv(4), borderRadius: radius.sm, marginBottom: rv(10) },
  badgeText: { fontSize: rm(12), fontWeight: '600' },
  title: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', marginBottom: rv(12), letterSpacing: -0.2, lineHeight: rv(24) },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: rm(13), color: '#64748B', fontWeight: '500' },
  metaDot: { fontSize: rm(13), color: '#CBD5E1', marginHorizontal: rv(8) },
});