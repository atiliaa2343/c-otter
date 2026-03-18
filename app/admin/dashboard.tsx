import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from './context/AdminAuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import AdminCRUDPage from './pages/AdminCRUDPage';

// Admin menu items configuration
interface AdminMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const adminMenuItems: AdminMenuItem[] = [
  {
    id: 'homepage',
    title: 'Homepage',
    description: 'Manage homepage content, banners, announcements',
    icon: 'home',
    color: '#2563eb',
  },
  {
    id: 'publications',
    title: 'Publications',
    description: 'Add, edit, remove publications',
    icon: 'newspaper',
    color: '#7c3aed',
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Add, edit, remove events',
    icon: 'calendar',
    color: '#059669',
  },
  {
    id: 'community',
    title: 'Community Partners',
    description: 'Add, edit, remove community partners',
    icon: 'people',
    color: '#dc2626',
  },
  {
    id: 'financial',
    title: 'Financial Assistance',
    description: 'Manage financial aid resources',
    icon: 'cash',
    color: '#d97706',
  },
  {
    id: 'tutoring',
    title: 'Tutoring & Study Help',
    description: 'Add, edit, remove tutoring resources',
    icon: 'book',
    color: '#0891b2',
  },
  {
    id: 'campus',
    title: 'Campus Services',
    description: 'Manage campus services & resources',
    icon: 'business',
    color: '#4f46e5',
  },
  {
    id: 'health',
    title: 'Health Tab',
    description: 'Manage all health categories',
    icon: 'medical',
    color: '#e11d48',
  },
  {
    id: 'faculty',
    title: 'Faculty',
    description: 'Add, edit, remove faculty members',
    icon: 'school',
    color: '#65a30d',
  },
  {
    id: 'contact',
    title: 'Contact Page',
    description: 'Manage contact information',
    icon: 'call',
    color: '#0d9488',
  },
  {
    id: 'photos',
    title: 'Photos & Media',
    description: 'Manage photos and media gallery',
    icon: 'images',
    color: '#ea580c',
  },
  {
    id: 'research',
    title: 'Research',
    description: 'Manage research content',
    icon: 'flask',
    color: '#7c2d12',
  },
];

export default function AdminDashboard({ onBack }: { onBack?: () => void }) {
  const { adminUser, logout } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');

  const getFieldsForType = (type: string) => {
    const fieldsMap: Record<string, Array<{key: string, label: string, placeholder: string, multiline?: boolean}>> = {
      events: [
        { key: 'title', label: 'Event Title', placeholder: 'Enter event title' },
        { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD' },
        { key: 'time', label: 'Time', placeholder: 'e.g., 10:00 AM' },
        { key: 'location', label: 'Location', placeholder: 'Event location' },
        { key: 'description', label: 'Description', placeholder: 'Event description', multiline: true },
      ],
      publications: [
        { key: 'title', label: 'Publication Title', placeholder: 'Enter publication title' },
        { key: 'author', label: 'Author', placeholder: 'Author name' },
        { key: 'date', label: 'Date', placeholder: 'Publication date' },
        { key: 'description', label: 'Description', placeholder: 'Publication description', multiline: true },
      ],
      community: [
        { key: 'name', label: 'Organization Name', placeholder: 'Organization name' },
        { key: 'address', label: 'Address', placeholder: 'Full address' },
        { key: 'phone', label: 'Phone', placeholder: 'Phone number' },
        { key: 'description', label: 'Description', placeholder: 'Description', multiline: true },
      ],
      financial: [
        { key: 'title', label: 'Program Title', placeholder: 'Financial assistance program' },
        { key: 'amount', label: 'Amount', placeholder: 'e.g., $500' },
        { key: 'eligibility', label: 'Eligibility', placeholder: 'Who qualifies' },
        { key: 'description', label: 'Description', placeholder: 'Program description', multiline: true },
      ],
      tutoring: [
        { key: 'name', label: 'Service Name', placeholder: 'Tutoring service name' },
        { key: 'subject', label: 'Subject', placeholder: 'Subject area' },
        { key: 'schedule', label: 'Schedule', placeholder: 'When available' },
        { key: 'description', label: 'Description', placeholder: 'Service description', multiline: true },
      ],
      campus: [
        { key: 'name', label: 'Service Name', placeholder: 'Campus service name' },
        { key: 'hours', label: 'Hours', placeholder: 'Operating hours' },
        { key: 'location', label: 'Location', placeholder: 'Building/room' },
        { key: 'description', label: 'Description', placeholder: 'Service description', multiline: true },
      ],
      health: [
        { key: 'category', label: 'Category', placeholder: 'e.g., Mental Health' },
        { key: 'title', label: 'Resource Title', placeholder: 'Resource name' },
        { key: 'phone', label: 'Phone', placeholder: 'Contact phone' },
        { key: 'description', label: 'Description', placeholder: 'Resource description', multiline: true },
      ],
      faculty: [
        { key: 'name', label: 'Name', placeholder: 'Faculty member name' },
        { key: 'department', label: 'Department', placeholder: 'Department' },
        { key: 'title', label: 'Title', placeholder: 'e.g., Professor' },
        { key: 'email', label: 'Email', placeholder: 'Email address' },
      ],
      contact: [
        { key: 'department', label: 'Department', placeholder: 'Department name' },
        { key: 'phone', label: 'Phone', placeholder: 'Phone number' },
        { key: 'email', label: 'Email', placeholder: 'Email address' },
        { key: 'hours', label: 'Hours', placeholder: 'Office hours' },
      ],
      homepage: [
        { key: 'section', label: 'Section', placeholder: 'e.g., banner, announcement' },
        { key: 'title', label: 'Title', placeholder: 'Content title' },
        { key: 'content', label: 'Content', placeholder: 'Content text', multiline: true },
        { key: 'order', label: 'Order', placeholder: 'Display order (number)' },
      ],
      research: [
        { key: 'title', label: 'Research Title', placeholder: 'Study title' },
        { key: 'researcher', label: 'Researcher', placeholder: 'Lead researcher' },
        { key: 'status', label: 'Status', placeholder: 'e.g., Recruiting, Ongoing' },
        { key: 'description', label: 'Description', placeholder: 'Study description', multiline: true },
      ],
      photos: [
        { key: 'title', label: 'Title', placeholder: 'Photo title' },
        { key: 'description', label: 'Description', placeholder: 'Photo description', multiline: true },
        { key: 'category', label: 'Category', placeholder: 'Photo category' },
      ],
    };
    return fieldsMap[type] || [
      { key: 'title', label: 'Title', placeholder: 'Enter title' },
      { key: 'description', label: 'Description', placeholder: 'Enter description', multiline: true },
    ];
  };

  const handleMenuPress = (itemId: string) => {
    setActiveSection(itemId);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const renderMenuItem = (item: AdminMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: cardBackground }]}
      onPress={() => handleMenuPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={28} color={item.color} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemTitle, { color: textColor }]}>{item.title}</Text>
        <Text style={[styles.menuItemDescription, { color: textSecondary }]}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={textSecondary} />
    </TouchableOpacity>
  );

  // Render CRUD page if a section is active
  if (activeSection) {
    const menuItem = adminMenuItems.find(item => item.id === activeSection);
    return (
      <AdminCRUDPage
        title={menuItem?.title || 'Content'}
        contentType={activeSection}
        fields={getFieldsForType(activeSection)}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.adminBadge, { backgroundColor: primaryColor }]}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: textColor }]}>Admin Panel</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              Welcome, {adminUser?.username}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <Ionicons name="document-text" size={24} color="#2563eb" />
          <Text style={[styles.statNumber, { color: textColor }]}>24</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Publications</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <Ionicons name="calendar" size={24} color="#059669" />
          <Text style={[styles.statNumber, { color: textColor }]}>8</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Events</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <Ionicons name="people" size={24} color="#dc2626" />
          <Text style={[styles.statNumber, { color: textColor }]}>12</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Partners</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView 
        style={styles.menuContainer}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>Content Management</Text>
        {adminMenuItems.map(renderMenuItem)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 13,
    marginTop: 2,
  },
});
