import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

interface FacultyMember {
  name: string;
  title: string;
  email: string;
  phone: string;
  imageSource: any;
  isDirector?: boolean;
}

export function FacultyForm() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const facultyMembers: FacultyMember[] = [
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
    {
      name: 'Corrina Stevenson',
      title: 'Graduate Research Assistant',
      email: '',
      phone: '',
      imageSource: require('@/assets/images/Corrina.jpeg'),
    },
    {
      name: 'Ayanna Reid',
      title: 'Graduate Research Assistant',
      email: '',
      phone: '',
      imageSource: require('@/assets/images/Ayanna.jpeg'),
    },
    {
      name: 'Manuelene Deigh',
      title: 'Graduate Research Assistant',
      email: '',
      phone: '',
      imageSource: require('@/assets/images/Manuelene.jpeg'),
    },
    {
      name: 'Davian Clifton',
      title: 'Research Assistant',
      email: '',
      phone: '',
      imageSource: require('@/assets/images/Davian.jpeg'),
    },
  ];

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
        <Text style={[styles.title, { color: textColor }]}>Faculty</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Meet our dedicated research team
        </Text>
      </View>

      {/* Faculty Cards */}
      <View style={styles.facultyList}>
        {facultyMembers.map((member, index) => renderFacultyCard(member, index))}
      </View>

      {/* Lab Info */}
      <View style={[styles.labInfoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Ionicons name="flask" size={32} color={primaryColor} />
        <Text style={[styles.labInfoTitle, { color: textColor }]}>PNIRD Lab</Text>
        <Text style={[styles.labInfoText, { color: textSecondary }]}>
          Psychological Neuroscience & Interdisciplinary Research Division
        </Text>
        <Text style={[styles.labInfoSubtext, { color: textSecondary }]}>
          Virginia State University
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
