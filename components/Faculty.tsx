import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useContentBlocks } from "@/hooks/useContentBlocks";
import { useFacultyMembers } from "@/hooks/useFacultyMembers";
import type { FacultyMember as DbFacultyMember } from "@/hooks/useFacultyMembers";

interface FacultyMember {
  name: string;
  title: string;
  email: string;
  phone: string;
  imageSource: any;
  isDirector?: boolean;
}

const FALLBACK_FACULTY: FacultyMember[] = [
  {
    name: 'Larry Keen II, Ph.D',
    title: 'Associate Professor in Psychology;\nPNIRD Lab Director',
    email: 'LKeen@vsu.edu',
    phone: '(804) 524-5523',
    imageSource: require('@/assets/images/Larry.jpeg'),
    isDirector: true,
  },
  {
    name: 'Kimberly Lawrence, Ph.D.',
    title: 'Associate Professor in Psychology',
    email: 'KLawrence@vsu.edu',
    phone: '(804) 524-5447',
    imageSource: require('@/assets/images/Kimberly.jpeg'),
  },
  {
    name: 'Arlener D. Turner, Ph.D',
    title: 'Associate Professor\nDepartment of Psychiatry and Behavioral Sciences\nUniversity of Miami',
    email: 'adanielleturner@gmail.com',
    phone: '(773) 339-1797',
    imageSource: require('@/assets/images/Arlener.png'),
  },
  {
    name: 'Alexis Morris, M.S.',
    title: 'Graduate Research Assistant',
    email: '',
    phone: '',
    imageSource: require('@/assets/images/Alexis.jpeg'),
  },
  {
    name: 'Diamond Adams',
    title: 'Graduate Research Assistant',
    email: '',
    phone: '',
    imageSource: require('@/assets/images/Diamond.jpeg'),
  },
];

function mapDbMember(db: DbFacultyMember, fallback: FacultyMember): FacultyMember {
  return {
    name: db.name,
    title: db.title,
    email: db.email ?? fallback.email,
    phone: db.phone ?? fallback.phone,
    imageSource: db.image_url ? { uri: db.image_url } : fallback.imageSource,
    isDirector: db.is_director ?? fallback.isDirector,
  };
}

export function FacultyForm() {
  const { blocks } = useContentBlocks('faculty');
  const { members: dbMembers, loading, error } = useFacultyMembers();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const facultyMembers: FacultyMember[] = dbMembers.length > 0
    ? dbMembers.map((db) => {
        const fb = FALLBACK_FACULTY.find((f) => f.name === db.name) ?? FALLBACK_FACULTY[0];
        return mapDbMember(db, fb);
      })
    : FALLBACK_FACULTY;

  const handleEmailPress = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handlePhonePress = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9]/g, '')}`);
    }
  };

  const renderFacultyCard = (member: FacultyMember, index: number) => (
    <View 
      key={index} 
      style={[
        styles.facultyCard, 
        { backgroundColor: cardBg, borderColor: cardBorder },
        member.isDirector && styles.directorCard
      ]}
    >
      <View style={styles.cardHeader}>
        <Image
          source={member.imageSource}
          style={member.isDirector ? styles.directorImage : styles.facultyImage}
          resizeMode="cover"
        />
        {member.isDirector && (
          <View style={[styles.directorBadge, { backgroundColor: primaryColor }]}>
            <Text style={styles.directorBadgeText}>Director</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.facultyName, { color: textColor }]}>{member.name}</Text>
        <Text style={[styles.facultyTitle, { color: textSecondary }]}>{member.title}</Text>
        
        {member.email || member.phone ? (
          <View style={styles.contactInfo}>
            {member.email && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => handleEmailPress(member.email)}
              >
                <Ionicons name="mail" size={16} color={primaryColor} />
                <Text style={[styles.contactText, { color: primaryColor }]}>{member.email}</Text>
              </TouchableOpacity>
            )}
            {member.phone && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => handlePhonePress(member.phone)}
              >
                <Ionicons name="call" size={16} color={primaryColor} />
                <Text style={[styles.contactText, { color: primaryColor }]}>{member.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
         <Text style={[styles.title, { color: textColor }]}>{blocks.page_title ?? 'Team'}</Text>
         <Text style={[styles.subtitle, { color: textSecondary }]}>
           {blocks.page_subtitle ?? 'Meet our dedicated research team'}
         </Text>
      </View>

      {/* Faculty Cards */}
      <View style={styles.facultyList}>
        {loading && dbMembers.length === 0 ? (
          <ActivityIndicator size="large" color={primaryColor} />
        ) : (
          facultyMembers.map((member, index) => renderFacultyCard(member, index))
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: '#ef4444' }]}>
          Could not load faculty from the database — showing the built-in list.
        </Text>
      )}

      {/* Lab Info */}
      <View style={[styles.labInfoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Ionicons name="flask" size={32} color={primaryColor} />
        <Text style={[styles.labInfoTitle, { color: textColor }]}>{blocks.lab_title ?? 'PNIRD Lab'}</Text>
        <Text style={[styles.labInfoText, { color: textSecondary }]}>
          {blocks.lab_description ?? 'Psychological Neuroscience & Interdisciplinary Research Division'}
        </Text>
        <Text style={[styles.labInfoSubtext, { color: textSecondary }]}>
          {blocks.lab_institution ?? 'Virginia State University'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  facultyList: {
    gap: 16,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  facultyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
  },
  directorCard: {
    borderWidth: 2,
  },
  cardHeader: {
    position: 'relative',
  },
  facultyImage: {
    width: 80,
    height: 100,
    borderRadius: 12,
  },
  directorImage: {
    width: 100,
    height: 120,
    borderRadius: 12,
  },
  directorBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  directorBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  facultyName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  facultyTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  contactInfo: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '500',
  },
  labInfoCard: {
    marginTop: 24,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  labInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  labInfoText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  labInfoSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
