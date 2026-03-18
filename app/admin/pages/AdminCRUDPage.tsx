import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

const API_BASE_URL = 'http://10.0.0.92:4000';

interface ContentItem {
  _id?: any;
  title?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

interface AdminCRUDPageProps {
  title: string;
  contentType: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  }>;
  onBack: () => void;
}

export default function AdminCRUDPage({ title, contentType, fields, onBack }: AdminCRUDPageProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  const inputBackground = useThemeColor({}, 'backgroundSecondary');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${contentType}`);
      const result = await response.json();
      setItems(result.data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      // Use mock data for demo if backend not available
      setItems(getMockData(contentType));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (type: string): ContentItem[] => {
    const mockData: Record<string, ContentItem[]> = {
      events: [
        { _id: '1', title: 'Campus Tour', date: '2026-04-01', time: '10:00 AM', location: 'Main Hall', description: 'Guided campus tour for new students' },
        { _id: '2', title: 'Health Fair', date: '2026-04-15', time: '9:00 AM', location: 'Student Center', description: 'Annual health and wellness fair' },
      ],
      publications: [
        { _id: '1', title: 'Mental Health Guide', author: 'Dr. Smith', date: '2026-01-15', description: 'Comprehensive mental health resources guide' },
        { _id: '2', title: 'Wellness Newsletter', author: 'Health Dept', date: '2026-02-01', description: 'Monthly wellness newsletter' },
      ],
      community: [
        { _id: '1', name: 'Community Health Center', address: '123 Main St', phone: '555-0100', description: 'Local health services' },
        { _id: '2', name: 'Youth Center', address: '456 Oak Ave', phone: '555-0200', description: 'Youth programs and activities' },
      ],
      financial: [
        { _id: '1', title: 'Emergency Fund', amount: '$500', eligibility: 'All students', description: 'Emergency financial assistance' },
        { _id: '2', title: 'Book Scholarship', amount: '$200', eligibility: 'Full-time students', description: 'Book and supply scholarship' },
      ],
      tutoring: [
        { _id: '1', name: 'Math Tutoring', subject: 'Mathematics', schedule: 'Mon/Wed 2-4pm', description: 'Free math tutoring sessions' },
        { _id: '2', name: 'Writing Center', subject: 'English', schedule: 'Tue/Thu 1-5pm', description: 'Writing assistance and feedback' },
      ],
      campus: [
        { _id: '1', name: 'Library', hours: '7am-11pm', location: 'Building A', description: 'Main campus library' },
        { _id: '2', name: 'Gym', hours: '6am-10pm', location: 'Rec Center', description: 'Fitness facilities' },
      ],
      health: [
        { _id: '1', category: 'Mental Health', title: 'Counseling Services', phone: '555-1000', description: 'Free counseling for students' },
        { _id: '2', category: 'Physical Health', title: 'Student Health Center', phone: '555-2000', description: 'Medical services on campus' },
      ],
      faculty: [
        { _id: '1', name: 'Dr. Jane Smith', department: 'Psychology', email: 'jsmith@university.edu', title: 'Professor' },
        { _id: '2', name: 'Dr. John Doe', department: 'Biology', email: 'jdoe@university.edu', title: 'Associate Professor' },
      ],
      contact: [
        { _id: '1', department: 'Main Office', phone: '555-0000', email: 'info@university.edu', hours: 'Mon-Fri 8am-5pm' },
        { _id: '2', department: 'Student Services', phone: '555-1000', email: 'students@university.edu', hours: 'Mon-Fri 9am-4pm' },
      ],
      homepage: [
        { _id: '1', section: 'banner', title: 'Welcome Students', content: 'Welcome to the new semester!', order: 1 },
        { _id: '2', section: 'announcement', title: 'Important Dates', content: 'Registration opens March 1st', order: 2 },
      ],
      research: [
        { _id: '1', title: 'Sleep Study', researcher: 'Dr. Smith', status: 'Recruiting', description: 'Study on sleep patterns in college students' },
        { _id: '2', title: 'Nutrition Research', researcher: 'Dr. Johnson', status: 'Ongoing', description: 'Impact of diet on academic performance' },
      ],
    };
    return mockData[type] || [];
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredField = fields.find(f => !formData[f.key]?.trim());
    if (requiredField) {
      Alert.alert('Error', `Please fill in ${requiredField.label}`);
      return;
    }

    try {
      if (editingItem?._id) {
        // Update existing item
        await fetch(`${API_BASE_URL}/api/admin/${contentType}/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new item
        await fetch(`${API_BASE_URL}/api/admin/${contentType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setModalVisible(false);
      setEditingItem(null);
      setFormData({});
      fetchItems();
    } catch (err) {
      // For demo, just update local state
      if (editingItem?._id) {
        setItems(items.map(item => 
          item._id === editingItem._id ? { ...item, ...formData } : item
        ));
      } else {
        const newItem = { ...formData, _id: Date.now().toString() };
        setItems([...items, newItem]);
      }
      setModalVisible(false);
      setEditingItem(null);
      setFormData({});
    }
  };

  const handleDelete = (item: ContentItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete this ${title.slice(0, -1)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/api/admin/${contentType}/${item._id}`, {
                method: 'DELETE',
              });
            } catch (err) {
              // For demo, just update local state
            }
            setItems(items.filter(i => i._id !== item._id));
          }
        },
      ]
    );
  };

  const openEditModal = (item?: ContentItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: ContentItem }) => (
    <View style={[styles.itemCard, { backgroundColor: cardBackground }]}>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: textColor }]}>
          {item.title || item.name || item.category || 'Untitled'}
        </Text>
        {item.description && (
          <Text style={[styles.itemDescription, { color: textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={[styles.itemMeta, { color: textSecondary }]}>
          {item.date || item.time || item.hours || item.status || item.department || ''}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={20} color={primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
        <TouchableOpacity onPress={() => openEditModal()} style={styles.addButton}>
          <Ionicons name="add" size={28} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No {title.toLowerCase()} yet
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: primaryColor }]}
              onPress={() => openEditModal()}
            >
              <Text style={styles.emptyButtonText}>Add First {title.slice(0, -1)}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: cardBackground }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButton, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editingItem ? 'Edit' : 'Add'} {title.slice(0, -1)}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveButton, { color: primaryColor }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {fields.map((field) => (
              <View key={field.key} style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: inputBackground, 
                      color: textColor,
                      minHeight: field.multiline ? 100 : 50,
                      textAlignVertical: field.multiline ? 'top' : 'center'
                    }
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={textSecondary}
                  value={formData[field.key] || ''}
                  onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                  multiline={field.multiline}
                  keyboardType={field.keyboardType || 'default'}
                />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
