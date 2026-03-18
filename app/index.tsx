import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  SafeAreaView,
  StyleSheet
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAppTheme } from "@/hooks/ThemeContext";
import { HomePage } from "@/components/HomePage";
import { HealthForm } from "@/components/Health";
import { FacultyForm } from "@/components/Faculty";
import Research from "@/components/Research";
import { ContactSection } from "@/components/Contact";
import { CommunityPage } from "@/components/Community";
import { getImageUrl } from "@/constants/BackendConfig";
import { useAdminAuth } from "@/app/admin/context/AdminAuthContext";
import AdminDashboard from "@/app/admin/dashboard";
import AdminLogin from "@/app/admin/login";

// Local logo as fallback
const LOCAL_LOGO = require("@/assets/images/Ce Otter.png");

// MongoDB API endpoint
const API_BASE_URL = 'http://10.0.0.92:4000';

// Types for MongoDB data
interface HourOfOperation {
  _id?: any;
  location_id: number;
  day: string;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

interface LocationData {
  _id?: any;
  name: string;
  address: string;
  phone: string;
  domain: string;
  description?: string;
}

type NavigationItem = "home" | "research" | "community" | "health" | "faculty" | "contact";

export default function Index() {
  const { theme, toggleTheme } = useAppTheme();
  const isDarkMode = theme === 'dark';
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<NavigationItem>("home");
  const [locations, setlocations] = useState<HourOfOperation[]>();
  const [loading, setLoading] = useState(true);
  const { isAdminAuthenticated } = useAdminAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Try MongoDB first, fallback to local asset for header logo
  const [headerLogoError, setHeaderLogoError] = useState(false);
  const headerLogoSource = headerLogoError ? LOCAL_LOGO : { uri: getImageUrl('Ce Otter.png') };

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tabBarBg = useThemeColor({}, 'tabBarBackground');
  const tabBarBorder = useThemeColor({}, 'tabBarBorder');
  const tabBarActive = useThemeColor({}, 'tabBarActive');
  const tabBarInactive = useThemeColor({}, 'tabBarInactive');

  async function getlocations() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hours`);
      const result = await response.json();
      if (result.data) {
        setlocations(result.data); 
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getlocations();
  }, []);

  // Navigation items configuration - replacing Resources with Contact
  const navigationItems = [
    { id: "home" as NavigationItem, label: "Home", icon: "home", iconSet: "Ionicons" },
    { id: "research" as NavigationItem, label: "Research", icon: "flask", iconSet: "Ionicons" },
    { id: "community" as NavigationItem, label: "Community", icon: "people", iconSet: "Ionicons" },
    { id: "health" as NavigationItem, label: "Health", icon: "medical", iconSet: "Ionicons" },
    { id: "faculty" as NavigationItem, label: "Faculty", icon: "school", iconSet: "Ionicons" },
    { id: "contact" as NavigationItem, label: "Contact", icon: "call", iconSet: "Ionicons" },
  ];

  // Render navigation icon based on icon set
  const renderIcon = (iconSet: string, iconName: string, isActive: boolean) => {
    const size = 22;
    const color = isActive ? tabBarActive : tabBarInactive;
    
    if (iconSet === "Ionicons") {
      return <Ionicons name={iconName as any} size={size} color={color} />;
    } else if (iconSet === "MaterialIcons") {
      return <MaterialIcons name={iconName as any} size={size} color={color} />;
    }
    return null;
  };

  // Render page content based on current selection
  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "research":
        return <Research />;
      case "community":
        return (
          <CommunityPage />
        );
      case "health":
        return <HealthForm />;
      case "faculty":
        return <FacultyForm />;
      case "contact":
        return <ContactSection />;
      default:
        return null;
    }
  };

  // Toggle dark mode
  const handleToggleTheme = () => {
    toggleTheme();
  };

  // Handle admin button press
  const handleAdminPress = () => {
    if (isAdminAuthenticated) {
      setShowAdminPanel(true);
    } else {
      // Navigate to admin login
      setShowAdminPanel(true);
    }
  };

  // Render admin panel or regular app content
  const renderContent = () => {
    if (showAdminPanel) {
      return null; // Will render AdminDashboard
    }
    return renderPageContent();
  };

  // Show splash screen
  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require("@/assets/images/Ce Otter.png")}
          style={{ width: 300, height: 300, borderRadius: 150, backgroundColor: 'transparent' }}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 24 }}>CE - OTTER</Text>
        <Text style={{ color: '#bfdbfe', fontSize: 14, marginTop: 8 }}>Connecting Campus Community</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Modern Header */}
      <SafeAreaView style={{ backgroundColor: tabBarBg }}>
        <View style={[styles.header, { backgroundColor: tabBarBg, borderBottomColor: tabBarBorder }]}>
          <View style={styles.headerLeft}>
            <Image
              source={headerLogoSource}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              onError={() => setHeaderLogoError(true)}
            />
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {showAdminPanel ? 'Admin Panel' : 'CE - OTTER'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* Close Admin Panel Button */}
            {showAdminPanel && (
              <TouchableOpacity 
                onPress={() => setShowAdminPanel(false)}
                style={[styles.adminButton, { backgroundColor: '#ef4444' }]}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="close" 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}

            {/* Admin Button */}
            {!showAdminPanel && (
            <TouchableOpacity 
              onPress={handleAdminPress}
              style={[styles.adminButton, { backgroundColor: isAdminAuthenticated ? '#10b981' : isDarkMode ? '#374151' : '#f3f4f6' }]}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isAdminAuthenticated ? "shield-checkmark" : "shield-outline"} 
                size={20} 
                color={isAdminAuthenticated ? '#fff' : isDarkMode ? '#fbbf24' : '#f59e0b'} 
              />
            </TouchableOpacity>
            )}

            {/* Dark Mode Toggle */}
            {!showAdminPanel && (
            <TouchableOpacity 
              onPress={handleToggleTheme}
              style={[styles.themeToggle, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={20} 
                color={isDarkMode ? '#fbbf24' : '#f59e0b'} 
              />
            </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Page Content */}
      <View style={{ flex: 1 }}>
        {showAdminPanel ? (
          isAdminAuthenticated ? (
            <AdminDashboard />
          ) : (
            <AdminLogin 
              onBack={() => setShowAdminPanel(false)}
              onLoginSuccess={() => {
                // Stay on admin panel after login - dashboard will show
              }}
            />
          )
        ) : (
          renderPageContent()
        )}
      </View>

      {/* Modern Bottom Navigation Bar */}
      {!showAdminPanel && (
      <SafeAreaView style={{ backgroundColor: tabBarBg }}>
        <View style={[styles.tabBar, { backgroundColor: tabBarBg, borderTopColor: tabBarBorder }]}>
          {navigationItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCurrentPage(item.id)}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                activeOpacity={0.7}
              >
                {renderIcon(item.iconSet, item.icon, isActive)}
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? tabBarActive : tabBarInactive },
                    isActive && styles.tabLabelActive
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center' as const,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 4,
  },
  tabItemActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '400' as const,
  },
  tabLabelActive: {
    fontWeight: '600' as const,
  },
  // Empty state styles
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  comingSoonButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  comingSoonButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
