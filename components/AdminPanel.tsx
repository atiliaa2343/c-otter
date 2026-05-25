import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAdminAuth } from '@/app/admin/context/AdminAuthContext';

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminPanel({ visible, onClose }: AdminPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'health' | 'faculty' | 'research' | 'content'>('health');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, isLoading: authIsLoading, login, logout, register } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  // Close panel when user logs out (user was present and then became null)
  const prevUserRef = React.useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      onClose();
    }
    prevUserRef.current = user;
  }, [user, onClose]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setLoginError(null);
    
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerName || !registerPassword || !confirmPassword) {
      setLoginError('Please fill in all fields');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setLoginError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setLoginError(null);
    
    try {
      await register(registerEmail, registerName, registerPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    // onClose will be called via useEffect when user becomes null
  };

  const renderLoginForm = () => (
    <View style={styles.loginContainer}>
      <Ionicons name="shield-checkmark" size={64} color={primaryColor} style={{ marginBottom: 20 }} />
      <Text style={[styles.loginTitle, { color: textColor }]}>
        {authMode === 'login' ? 'Admin Login' : 'Admin Registration'}
      </Text>
      <Text style={[styles.loginSubtitle, { color: textSecondary }]}>
        {authMode === 'login' 
          ? 'Enter your credentials to access the management panel' 
          : 'Create an admin account for content management'}
      </Text>

      {authMode === 'register' && (
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
          placeholder="Full Name"
          placeholderTextColor={textSecondary}
          value={registerName}
          onChangeText={setRegisterName}
          autoCorrect={false}
        />
      )}

      <TextInput
        style={[styles.input, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
        placeholder="Email"
        placeholderTextColor={textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={authMode === 'login' ? loginEmail : registerEmail}
        onChangeText={authMode === 'login' ? setLoginEmail : setRegisterEmail}
        autoCorrect={false}
      />

      <TextInput
        style={[styles.input, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
        placeholder="Password"
        placeholderTextColor={textSecondary}
        secureTextEntry
        value={authMode === 'login' ? loginPassword : registerPassword}
        onChangeText={authMode === 'login' ? setLoginPassword : setRegisterPassword}
        onSubmitEditing={authMode === 'login' ? handleLogin : handleRegister}
      />

      {authMode === 'register' && (
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }]}
          placeholder="Confirm Password"
          placeholderTextColor={textSecondary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onSubmitEditing={handleRegister}
        />
      )}

      {loginError && (
        <Text style={[styles.errorText, { color: '#ef4444' }]}>{loginError}</Text>
      )}

      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: primaryColor }]}
        onPress={authMode === 'login' ? handleLogin : handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading 
            ? (authMode === 'login' ? 'Logging in...' : 'Registering...') 
            : (authMode === 'login' ? 'Login' : 'Register')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
        <Text style={[styles.cancelButtonText, { color: primaryColor }]}>
          {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={[styles.cancelButtonText, { color: textSecondary }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdminPanel = () => (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.adminHeader, { backgroundColor: primaryColor }]}>
        <View style={styles.adminHeaderLeft}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
          <Text style={styles.adminHeaderTitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'health' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('health')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'health' ? primaryColor : textSecondary }]}>
            Health
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'faculty' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('faculty')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'faculty' ? primaryColor : textSecondary }]}>
            Faculty
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'research' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('research')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'research' ? primaryColor : textSecondary }]}>
            Research
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'content' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('content')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'content' ? primaryColor : textSecondary }]}>
            Content
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView style={[styles.contentArea, { backgroundColor }]}>
        <View style={styles.contentPadding}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Manage {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Add, edit, or remove {selectedTab} content
          </Text>

          {/* Placeholder for management tools */}
          <View style={[styles.managementCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="construct" size={48} color={primaryColor} />
            <Text style={[styles.managementTitle, { color: textColor }]}>Management Tools</Text>
            <Text style={[styles.managementText, { color: textSecondary }]}>
              Content management interface for {selectedTab} will be displayed here.
              You can add forms to create, update, and delete {selectedTab} items.
            </Text>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: primaryColor }]}
              onPress={() => Alert.alert('Add Content', `Add new ${selectedTab} content`)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add New {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statNumber, { color: primaryColor }]}>12</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>Total Items</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>8</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>Published</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>4</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>Drafts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { backgroundColor, flex: 1 }]}>
        {!user ? renderLoginForm() : renderAdminPanel()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  adminHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  managementCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  managementTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  managementText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
