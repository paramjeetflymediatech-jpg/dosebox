import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RenderHtml from 'react-native-render-html';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';
import { getFullImageUrl } from '../../utils/image';

export default function BlogDetailScreen({ route, navigation }) {
  const { blogId } = route.params || {};
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (blogId) {
      loadBlog();
    } else {
      setLoading(false);
    }
  }, [blogId]);

  const loadBlog = async () => {
    try {
      const res = await api.get(`/blogs/${blogId}`);
      if (res.data?.success) {
        setBlog(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load blog details:', err);
    } finally {
      setLoading(false);
    }
  };

  const tags = useMemo(() => {
    if (!blog?.tags) return [];
    return blog.tags.split(',').map(t => t.trim());
  }, [blog?.tags]);

  const dateStr = useMemo(() => {
    if (!blog?.createdAt) return 'Jul 12, 2026';
    return new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [blog?.createdAt]);

  const imageUrl = blog?.coverImage ? getFullImageUrl(blog.coverImage) : (blog?.image ? getFullImageUrl(blog.image) : null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color="#0c888d" style={{ marginTop: rv(40) }} />
      </SafeAreaView>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#CBD5E1" style={{ marginBottom: rv(16) }} />
          <Text style={styles.errorTitle}>Article Not Found</Text>
          <Text style={styles.errorText}>The medical article you are looking for does not exist or has been removed.</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.errorBtnText}>Back to Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Article</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.metaTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{blog.category || 'Health'}</Text>
          </View>
          <View style={styles.metaTopInfo}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.metaTopText}>{blog.readTime || '5 min read'}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
            <Text style={styles.metaTopText}>{dateStr}</Text>
          </View>
        </View>

        <Text style={styles.title}>{blog.title}</Text>

        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Ionicons name="person" size={16} color="#94A3B8" />
          </View>
          <View>
            <Text style={styles.authorTitle}>Verified by Medical Team</Text>
            <Text style={styles.authorSubtitle}>DoseBox Clinical Pharmacy</Text>
          </View>
        </View>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="contain" />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: rm(40) }}>📰</Text>
          </View>
        )}

        <View style={styles.htmlContainer}>
          <RenderHtml
            contentWidth={width - spacing.md * 2}
            source={{ html: blog.content || '<p>No content available.</p>' }}
            tagsStyles={{
              p: { fontSize: rm(16), lineHeight: rv(24), color: '#334155', marginBottom: rv(16) },
              h1: { fontSize: rm(24), fontWeight: '800', color: '#0F172A', marginTop: rv(24), marginBottom: rv(12) },
              h2: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', marginTop: rv(20), marginBottom: rv(10) },
              h3: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', marginTop: rv(16), marginBottom: rv(8) },
              li: { fontSize: rm(16), lineHeight: rv(24), color: '#334155', marginBottom: rv(8) },
              a: { color: '#0c888d', textDecorationLine: 'none' },
            }}
          />
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Ionicons name="pricetag-outline" size={16} color="#94A3B8" style={{ marginRight: rs(8) }} />
            {tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.consultCard}>
          <View style={styles.consultCardHeader}>
            <Ionicons name="sparkles" size={20} color="#0c888d" />
            <Text style={styles.consultCardTitle}>Need Medical Advice?</Text>
          </View>
          <Text style={styles.consultCardDesc}>Consult our verified doctors online to discuss your health conditions.</Text>
          <TouchableOpacity style={styles.consultBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={styles.consultBtnText}>Book Consultation</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingTop: rv(12), paddingBottom: rv(14),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  headerTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3, flex: 1, textAlign: 'center' },
  content: { padding: spacing.md, paddingBottom: rv(60) },
  
  metaTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: rs(12), marginBottom: rv(16) },
  badge: { backgroundColor: '#EAF4F2', paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.sm },
  badgeText: { fontSize: rm(11), fontWeight: '700', color: '#0c888d', textTransform: 'uppercase' },
  metaTopInfo: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  metaTopText: { fontSize: rm(12), color: '#64748B', fontWeight: '500' },
  metaDot: { fontSize: rm(12), color: '#CBD5E1', marginHorizontal: rs(4) },
  
  title: { fontSize: rm(26), fontWeight: '800', color: '#0F172A', lineHeight: rv(34), marginBottom: rv(20), letterSpacing: -0.5 },
  
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(24), paddingBottom: rv(20), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  authorAvatar: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  authorTitle: { fontSize: rm(14), fontWeight: '700', color: '#0F172A' },
  authorSubtitle: { fontSize: rm(12), color: '#64748B' },
  
  coverImage: { width: '100%', height: rv(220), borderRadius: radius.xl, marginBottom: rv(24) },
  
  htmlContainer: { marginBottom: rv(24) },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingTop: rv(24), borderTopWidth: 1, borderTopColor: '#F1F5F9', marginBottom: rv(32) },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: radius.md, marginRight: rs(8), marginBottom: rv(8) },
  tagText: { fontSize: rm(11), fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  consultCard: { backgroundColor: '#EAF4F2', borderRadius: radius.xl, padding: spacing.lg, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(12, 136, 141, 0.1)' },
  consultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rv(8) },
  consultCardTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A' },
  consultCardDesc: { fontSize: rm(13), color: '#475569', lineHeight: rv(20), marginBottom: rv(20) },
  consultBtn: { backgroundColor: '#0c888d', paddingHorizontal: rs(24), paddingVertical: rv(12), borderRadius: radius.lg, alignSelf: 'stretch', alignItems: 'center' },
  consultBtnText: { color: '#fff', fontSize: rm(14), fontWeight: '700' },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorTitle: { fontSize: rm(20), fontWeight: '800', color: '#0F172A', marginBottom: rv(12) },
  errorText: { fontSize: rm(14), color: '#64748B', textAlign: 'center', lineHeight: rv(22), marginBottom: rv(24) },
  errorBtn: { backgroundColor: '#0c888d', paddingHorizontal: rs(24), paddingVertical: rv(14), borderRadius: radius.lg },
  errorBtnText: { color: '#fff', fontSize: rm(15), fontWeight: '700' },
});
