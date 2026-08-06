import { useState } from 'react';
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
import { DEFAULT_PROFILE } from '../data/profile';

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
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [scanSettings, setScanSettings] = useState(INITIAL_SCAN_SETTINGS);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [preferences, setPreferences] = useState({ theme: 'dark', language: 'en' });

  const toggleItem = (setter) => (id, value) => {
    setter((items) => items.map((item) => (item.id === id ? { ...item, checked: value } : item)));
  };

  const handleSaveProfile = (updatedProfile) => {
    setProfile(updatedProfile);
    console.log('Profile updated:', updatedProfile);
  };

  const handleUpdatePassword = (passwords) => {
    console.log('Password update request:', passwords);
  };

  const handleSavePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    console.log('Preferences updated:', newPrefs);
  };

  const handleDeleteAccount = () => {
    console.log('Account deletion confirmed');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <PageHeader title="Settings" description="Manage your account settings and preferences" />

      {/* Contenedor principal con flex layout y gap para garantizar la separación vertical */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* FASE 1: Profile */}
        <ProfileSection profile={profile} onSave={handleSaveProfile} />

        {/* FASE 2: Security */}
        <SecuritySection onUpdatePassword={handleUpdatePassword} />

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