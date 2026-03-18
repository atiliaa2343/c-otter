import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

interface CategorySection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: CategoryItem[];
}

interface CategoryItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  examples?: ExampleItem[];
}

interface ExampleItem {
  title: string;
  description: string;
  contact: string;
  dateTime: string;
  link: string;
}

export function CommunityPage() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');

  const volunteerOpportunities: CategorySection = {
    id: 'volunteer',
    title: 'Volunteer Opportunities',
    icon: 'hand-right',
    color: '#10B981',
    items: [
      { 
        id: 'events',
        title: 'Events', 
        description: 'Find volunteer events and opportunities',
        icon: 'calendar',
        examples: [
          { title: 'Campus Cleanup Day', description: 'Help clean up the campus grounds and gardens', contact: 'Student Activities Office - (555) 123-4567', dateTime: 'Saturday, March 22 - 9:00 AM to 12:00 PM', link: 'https://campus.edu/cleanup' },
          { title: 'Food Bank Sorting', description: 'Sort and package food donations for distribution', contact: 'Local Food Bank - (555) 234-5678', dateTime: 'Sunday, March 23 - 10:00 AM to 2:00 PM', link: 'https://foodbank.org/volunteer' },
          { title: 'Tutor Math at Elementary', description: 'Help elementary students with math homework', contact: 'Lincoln Elementary - (555) 345-6789', dateTime: 'Weekdays - 3:00 PM to 5:00 PM', link: 'https://lincolnschool.edu/tutoring' },
          { title: 'Animal Shelter Volunteering', description: 'Care for animals and help with shelter operations', contact: 'City Animal Shelter - (555) 456-7890', dateTime: 'Flexible Hours', link: 'https://animalshelter.org/volunteer' },
          { title: 'Community Garden Planting', description: 'Plant vegetables and maintain community garden beds', contact: 'Parks & Rec Department - (555) 567-8901', dateTime: 'Saturday, March 29 - 8:00 AM to 11:00 AM', link: 'https://parksrecrec.org/garden' },
        ]
      },
      { 
        id: 'community',
        title: 'Community', 
        description: 'Connect with local organizations and partners',
        icon: 'people',
        examples: [
          { title: 'Local Food Bank', description: 'Weekly sorting and food distribution', contact: 'info@foodbank.org - (555) 234-5678', dateTime: 'Ongoing', link: 'https://foodbank.org' },
          { title: 'Homeless Shelter', description: 'Meal service and tutoring for residents', contact: 'shelter@homelesshelp.org - (555) 345-6789', dateTime: 'Flexible Shifts', link: 'https://homelesshelp.org' },
          { title: 'Elementary Schools', description: 'After-school mentoring program', contact: 'mentor@schools.org - (555) 456-7890', dateTime: 'School Days - 2:30 PM to 4:30 PM', link: 'https://schools.org/mentor' },
          { title: 'Animal Shelter', description: 'Animal care, walking, and socialization', contact: 'volunteer@animalshelter.org - (555) 567-8901', dateTime: 'Any Time', link: 'https://animalshelter.org' },
          { title: 'Community Gardens', description: 'Planting and maintenance of garden beds', contact: 'gardens@parks.org - (555) 678-9012', dateTime: 'Seasonal', link: 'https://communitygardens.org' },
        ]
      },
    ],
  };

  const foodPantryInfo: CategorySection = {
    id: 'food-pantry',
    title: 'Food Pantry & Basic Needs',
    icon: 'fast-food',
    color: '#F59E0B',
    items: [
      { 
        id: 'financial-assistance',
        title: 'Financial Assistance', 
        description: 'Emergency funds, grants, and financial support',
        icon: 'card',
        examples: [
          { title: 'Emergency Student Fund', description: 'One-time grants for students in crisis', contact: 'financialaid@campus.edu - (555) 111-2222', dateTime: 'Mon-Fri - 8:00 AM to 5:00 PM', link: 'https://campus.edu/emergencyfund' },
          { title: 'Book Vouchers', description: 'Vouchers for textbooks and course materials', contact: 'bookstore@campus.edu - (555) 222-3333', dateTime: 'Mon-Fri - 9:00 AM to 6:00 PM', link: 'https://campus.edu/bookvouchers' },
          { title: 'Transportation Assistance', description: 'Bus passes and gas cards for students', contact: 'transport@campus.edu - (555) 333-4444', dateTime: 'Mon-Fri - 8:00 AM to 5:00 PM', link: 'https://campus.edu/transport' },
          { title: 'Financial Counseling', description: 'Budget planning and financial wellness support', contact: 'counseling@campus.edu - (555) 444-5555', dateTime: 'Mon-Fri - 9:00 AM to 4:00 PM', link: 'https://campus.edu/financialcounseling' },
        ]
      },
      { 
        id: 'tutoring-study',
        title: 'Tutoring & Study Help', 
        description: 'Academic support and tutoring services',
        icon: 'book',
        examples: [
          { title: 'Peer Tutoring Center', description: 'Free one-on-one tutoring in all subjects', contact: 'tutoring@campus.edu - (555) 111-2222', dateTime: 'Mon-Sun - 10:00 AM to 8:00 PM', link: 'https://campus.edu/tutoring' },
          { title: 'Writing Center', description: 'Essay review, feedback, and writing support', contact: 'writing@campus.edu - (555) 222-3333', dateTime: 'Mon-Fri - 9:00 AM to 6:00 PM', link: 'https://campus.edu/writingcenter' },
          { title: 'Study Groups', description: 'Subject-specific study sessions and group tutoring', contact: 'academicsupport@campus.edu - (555) 333-4444', dateTime: 'Varies by Group', link: 'https://campus.edu/studygroups' },
          { title: 'Online Resources', description: 'Access to Khan Academy, Quizlet Plus, and more', contact: 'library@campus.edu - (555) 444-5555', dateTime: '24/7 Online', link: 'https://campus.edu/onlineresources' },
        ]
      },
      { 
        id: 'campus-services',
        title: 'Campus Services', 
        description: 'Campus offices and support services',
        icon: 'business',
        examples: [
          { title: 'Counseling Center', description: 'Mental health support and counseling services', contact: 'counseling@campus.edu - (555) 111-2222', dateTime: 'Mon-Fri - 8:00 AM to 5:00 PM', link: 'https://campus.edu/counseling' },
          { title: 'Career Services', description: 'Resume reviews, job fairs, and career guidance', contact: 'careers@campus.edu - (555) 222-3333', dateTime: 'Mon-Fri - 9:00 AM to 5:00 PM', link: 'https://campus.edu/careers' },
          { title: 'Student Health Center', description: 'Medical care and health services', contact: 'health@campus.edu - (555) 333-4444', dateTime: 'Mon-Fri - 8:00 AM to 6:00 PM', link: 'https://campus.edu/health' },
          { title: 'Disability Services', description: 'Accommodations and support for students with disabilities', contact: 'disability@campus.edu - (555) 444-5555', dateTime: 'Mon-Fri - 8:00 AM to 5:00 PM', link: 'https://campus.edu/disability' },
          { title: 'International Student Office', description: 'Visa support and international student services', contact: 'international@campus.edu - (555) 555-6666', dateTime: 'Mon-Fri - 9:00 AM to 5:00 PM', link: 'https://campus.edu/international' },
        ]
      },
    ],
  };

  const handleItemPress = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const findItemById = (id: string): CategoryItem | undefined => {
    const allItems = [...volunteerOpportunities.items, ...foodPantryInfo.items];
    return allItems.find(item => item.id === id);
  };

  // Render detail page for selected item
  if (selectedItem) {
    const item = findItemById(selectedItem);
    if (!item) return null;

    return (
      <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
        {/* Back Button */}
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: cardBackground, borderColor }]} 
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={20} color={primaryColor} />
          <Text style={[styles.backButtonText, { color: primaryColor }]}>Back to Community</Text>
        </TouchableOpacity>

        {/* Detail Header */}
        <View style={[styles.detailHeader, { backgroundColor: cardBackground, borderColor }]}>
          <View style={[styles.detailIconContainer, { backgroundColor: `${primaryColor}15` }]}>
            <Ionicons name={item.icon as any} size={32} color={primaryColor} />
          </View>
          <Text style={[styles.detailTitle, { color: textColor }]}>{item.title}</Text>
          <Text style={[styles.detailDescription, { color: textSecondary }]}>{item.description}</Text>
        </View>

        {/* Examples Section */}
        <View style={styles.examplesSection}>
          {item.examples?.map((example, index) => (
            <View key={index} style={[styles.exampleCard, { backgroundColor: cardBackground, borderColor }]}>
              <Text style={[styles.exampleTitle, { color: textColor }]}>{example.title}</Text>
              <Text style={[styles.exampleDesc, { color: textSecondary }]}>{example.description}</Text>
              
              <View style={styles.exampleDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="call" size={14} color={primaryColor} />
                  <Text style={[styles.detailText, { color: textSecondary }]}>{example.contact}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={14} color={primaryColor} />
                  <Text style={[styles.detailText, { color: textSecondary }]}>{example.dateTime}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.linkButton, { backgroundColor: primaryColor }]}
                onPress={() => handleLinkPress(example.link)}
              >
                <Text style={styles.linkButtonText}>Learn More</Text>
                <Ionicons name="open-outline" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Render main list
  const renderCategory = (section: CategorySection) => (
    <View key={section.id} style={[styles.categoryContainer, { backgroundColor: cardBackground, borderColor }]}>
      <View style={[styles.categoryHeader, { backgroundColor: `${section.color}15` }]}>
        <Ionicons name={section.icon as any} size={24} color={section.color} />
        <Text style={[styles.categoryTitle, { color: textColor }]}>{section.title}</Text>
      </View>
      
      {section.items.map((item, index) => (
        <TouchableOpacity 
          key={item.id}
          style={[
            styles.itemCard, 
            { borderBottomColor: borderColor },
            index === section.items.length - 1 && { borderBottomWidth: 0 }
          ]}
          activeOpacity={0.7}
          onPress={() => handleItemPress(item.id)}
        >
          <View style={[styles.itemIconContainer, { backgroundColor: `${section.color}15` }]}>
            <Ionicons name={item.icon as any} size={20} color={section.color} />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: textColor }]}>{item.title}</Text>
            <Text style={[styles.itemDescription, { color: textSecondary }]}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={[styles.headerIcon, { backgroundColor: `${primaryColor}15` }]}>
          <Ionicons name="people" size={32} color={primaryColor} />
        </View>
        <Text style={[styles.headerTitle, { color: textColor }]}>Community Resources</Text>
        <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
          Connect with campus and local community support services
        </Text>
      </View>

      {/* Volunteer Opportunities Section */}
      {renderCategory(volunteerOpportunities)}

      {/* Food Pantry & Basic Needs Section */}
      {renderCategory(foodPantryInfo)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryContainer: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Detail page styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  detailIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  examplesSection: {
    marginBottom: 24,
  },
  exampleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  exampleDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  linkButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
