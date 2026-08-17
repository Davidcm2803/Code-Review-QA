import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  AlertTriangle,
  FileText,
  GitPullRequest,
  Search,
  KeyRound,
} from 'lucide-react';

import PageHeader from '../components/layout/PageHeader';
import ProfileSection from '../components/settings/ProfileSection';
import SecuritySection from '../components/settings/SecuritySection';
import PreferencesSection from '../components/settings/PreferencesSection';
import DangerZone from '../components/settings/DangerZone';
import SettingsSection from '../components/settings/SettingsSection';
import SettingRow from '../components/settings/SettingRow';
import { useAuth } from '../context/AuthContext';
import { authService } from '../config/Api';
import { resolveAvatarUrl } from '../lib/avatar';

const INITIAL_NOTIFICATIONS = [
  { id: 'email', icon: Mail, label: 'Email notifications', description: 'Receive alerts via email', checked: true },
  { id: 'critical', icon: AlertTriangle, label: 'Critical vulnerability alerts', description: 'Immediate alerts for critical issues', checked: true },
  { id: 'digest', icon: FileText, label: 'Weekly security digest', description: 'Summary of all scans and findings', checked: false },
];

const INITIAL_SCAN_SETTINGS = [
  { id: 'autoScan', icon: GitPullRequest, label: 'Auto-scan on push', description: 'Automatically scan when code is pushed', checked: true },
  { id: 'deepScan', icon: Search, label: 'Deep dependency scan', description: 'Scan transitive dependencies (slower)', checked: false },
  { id: 'secrets', icon: KeyRound, label: 'Secrets detection', description: 'Scan for exposed API keys and credentials', checked: true },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [scanSettings, setScanSettings] = useState(INITIAL_SCAN_SETTINGS);

  const [profile, setProfile] = useState({
    username: user?.name || '',
    email: user?.email || '',
    avatar: resolveAvatarUrl(user?.photo) || null,
    provider: user?.provider || 'local',
    hasPassword: user?.has_password ?? (user?.provider === 'local' || !user?.provider),
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [preferences, setPreferences] = useState({ theme: 'dark', language: 'en' });

  const toggleItem = (setter) => (id, value) => {
    setter((items) => items.map((item) => (item.id === id ? { ...item, checked: value } : item)));
  };

  const handleSaveProfile = async (updatedProfile) => {
    setProfileError('');
    setProfileLoading(true);
    try {
      let photo = profile.avatar;

      // 1. Si hay un archivo nuevo, sube el avatar primero
      if (updatedProfile.avatarFile) {
        const avatarResult = await authService.uploadAvatar(updatedProfile.avatarFile);
        photo = resolveAvatarUrl(avatarResult.photo); 
      }

      // 2. Actualiza name / email
      const result = await authService.updateProfile({
        name: updatedProfile.username,
        email: updatedProfile.email,
      });

      setProfile({ ...profile, username: result.name, email: result.email, avatar: photo });
      // 3. Refleja el cambio en el resto de la app (sidebar, avatar) sin recargar
      updateUser({ name: result.name, email: result.email, photo });
    } catch (err) {
      setProfileError(err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (passwords) => {
    await authService.changePassword(passwords);
    // A partir de ahora sí tiene password (importa si era una cuenta OAuth
    // que recién se puso su primera contraseña): la próxima vez que la
    // cambie, el form le va a pedir la actual.
    setProfile((prev) => ({ ...prev, hasPassword: true }));
  };

  const handleSavePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    // Persistencia en backend: pendiente/opcional (ver notas del resumen de auth)
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err.message || 'No se pudo eliminar la cuenta.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <PageHeader title="Settings" description="Manage your account settings and preferences" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>

        {/* FASE 1: Profile */}
        <ProfileSection
          profile={profile}
          onSave={handleSaveProfile}
          loading={profileLoading}
          error={profileError}
        />

        {/* FASE 2: Security */}
        <SecuritySection
          onUpdatePassword={handleUpdatePassword}
          requireCurrentPassword={profile.hasPassword}
        />

        {/* FASE 3: Preferences */}
        <PreferencesSection preferences={preferences} onSavePreferences={handleSavePreferences} />

        {/* Notifications */}
        <SettingsSection title="Notifications" description="Configure how you receive alerts">
          {notifications.map((item) => (
            <SettingRow
              key={item.id}
              {...item}
              onChange={(checked) => toggleItem(setNotifications)(item.id, checked)}
            />
          ))}
        </SettingsSection>

        {/* Scan Settings */}
        <SettingsSection title="Scan Settings" description="Configure automated scanning behaviors">
          {scanSettings.map((item) => (
            <SettingRow
              key={item.id}
              {...item}
              onChange={(checked) => toggleItem(setScanSettings)(item.id, checked)}
            />
          ))}
        </SettingsSection>

        {/* FASE 4: Danger Zone */}
        <DangerZone onDeleteAccount={handleDeleteAccount} />

      </div>
    </div>
  );
}