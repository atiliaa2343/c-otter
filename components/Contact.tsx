import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ContactCardProps {
  icon: string;
  iconSet: "Ionicons" | "MaterialIcons";
  title: string;
  subtitle?: string;
  value: string;
  onPress?: () => void;
}

function ContactCard({ icon, iconSet, title, subtitle, value, onPress }: ContactCardProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primaryColor = useThemeColor({}, 'primary');

  const IconComponent = iconSet === "Ionicons" ? Ionicons : MaterialIcons;

  return (
    <TouchableOpacity 
      style={[styles.contactCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
        <IconComponent name={icon as any} size={24} color={primaryColor} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactTitle, { color: textColor }]}>{title}</Text>
        {subtitle && <Text style={[styles.contactSubtitle, { color: textSecondary }]}>{subtitle}</Text>}
        <Text style={[styles.contactValue, { color: primaryColor }]}>{value}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={textSecondary} />
      )}
    </TouchableOpacity>
  );
}

interface QuickLinkProps {
  icon: string;
  title: string;
  url: string;
}

function QuickLink({ icon, title, url }: QuickLinkProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  
  return (
    <TouchableOpacity 
      style={[styles.quickLink, { backgroundColor: `${primaryColor}15` }]}
      onPress={() => Linking.openURL(url)}
    >
      <Ionicons name={icon as any} size={24} color={primaryColor} />
      <Text style={[styles.quickLinkText, { color: primaryColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function ContactSection() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primaryColor = useThemeColor({}, 'primary');

  const handlePhonePress = () => {
    Linking.openURL('tel:+18045245523');
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:lkeen@vsu.edu');
  };

  const handleLocationPress = () => {
    // Open maps - Virginia State University
    Linking.openURL('https://maps.google.com/?q=Virginia+State+University+Petersburg+VA');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Contact Us</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Get in touch with the C-OTTER Psychology Center
        </Text>
      </View>

{/* Emergency Banner */}
        <View style={[styles.emergencyBanner, { backgroundColor: '#fef2f2' }]}>
          <Ionicons name="warning" size={24} color="#dc2626" />
          <View style={styles.emergencyTextContainer}>
            <Text style={[styles.emergencyTitle, { color: '#dc2626' }]}>In case of emergency</Text>
            <Text style={[styles.emergencyText, { color: '#991b1b' }]}>
              This application provides general public health information and community resources and is not a substitute for emergency medical care, diagnosis, or crisis intervention. If you are experiencing a medical emergency or believe someone is in immediate danger, call 911 immediately or go to the nearest emergency room; for mental health emergencies or emotional distress, call or text 988 for the Suicide & Crisis Lifeline. If you need additional support connecting with healthcare or community services, please contact your local health department or healthcare provider directly.
            </Text>
          </View>
        </View>

       {/* Reach Out - Combined Card */}
        <View style={styles.section}>
         <Text style={[styles.sectionTitle, { color: textColor }]}>Reach Out</Text>
         
         <View style={[styles.reachOutCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
           <View style={styles.reachOutRow}>
             <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
               <Ionicons name="call" size={24} color={primaryColor} />
             </View>
             <View style={styles.reachOutInfo}>
               <Text style={[styles.reachOutLabel, { color: textColor }]}>Phone</Text>
               <Text style={[styles.reachOutValue, { color: primaryColor }]}>(804) 524-5523</Text>
             </View>
             <TouchableOpacity onPress={handlePhonePress}>
               <Ionicons name="call" size={20} color={primaryColor} />
             </TouchableOpacity>
           </View>
           
           <View style={[styles.divider, { backgroundColor: cardBorder }]} />
           
           <View style={styles.reachOutRow}>
             <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
               <Ionicons name="mail" size={24} color={primaryColor} />
             </View>
             <View style={styles.reachOutInfo}>
               <Text style={[styles.reachOutLabel, { color: textColor }]}>Email</Text>
               <Text style={[styles.reachOutValue, { color: primaryColor }]}>lkeen@vsu.edu</Text>
             </View>
             <TouchableOpacity onPress={handleEmailPress}>
               <Ionicons name="mail" size={20} color={primaryColor} />
             </TouchableOpacity>
           </View>
           
           <View style={[styles.divider, { backgroundColor: cardBorder }]} />
           
           <View style={styles.reachOutRow}>
             <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
               <Ionicons name="location" size={24} color={primaryColor} />
             </View>
             <View style={styles.reachOutInfo}>
               <Text style={[styles.reachOutLabel, { color: textColor }]}>Location</Text>
               <Text style={[styles.reachOutValue, { color: primaryColor }]}>Virginia State University</Text>
             </View>
             <TouchableOpacity onPress={handleLocationPress}>
               <Ionicons name="map" size={20} color={primaryColor} />
             </TouchableOpacity>
           </View>
         </View>
       </View>

      {/* Office Hours */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Office Hours</Text>
        
        <View style={[styles.hoursCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.hoursRow}>
            <Text style={[styles.hoursDay, { color: textColor }]}>Monday - Friday</Text>
            <Text style={[styles.hoursTime, { color: primaryColor }]}>8:00 AM - 5:00 PM</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: cardBorder }]} />
          <View style={styles.hoursRow}>
            <Text style={[styles.hoursDay, { color: textColor }]}>Saturday - Sunday</Text>
            <Text style={[styles.hoursTime, { color: textSecondary }]}>Closed</Text>
          </View>
        </View>
      </View>

{/* Quick Links */}
       <View style={styles.section}>
         <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Links</Text>
         
         <View style={styles.quickLinksContainer}>
           <QuickLink
             icon="globe"
             title="PNIRD Lab"
             url="http://www.pnird.com/"
           />
           
           <QuickLink
             icon="globe"
             title="C-OTTER"
             url="https://www.vsu.edu/academics/special-programs/center-for-otter.php"
           />
         </View>
       </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: textSecondary }]}>
          C-OTTER © 2024
        </Text>
        <Text style={[styles.footerSubtext, { color: textTertiary }]}>
          Connection, Outreach, Transformation, Teaching, Empowerment & Resources
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  emergencyTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  callButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    color: '#fff',
    fontWeight: '600',
    overflow: 'hidden',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  reachOutCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reachOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  reachOutInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reachOutLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  reachOutValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  hoursCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hoursDay: {
    fontSize: 15,
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ContactSection;
