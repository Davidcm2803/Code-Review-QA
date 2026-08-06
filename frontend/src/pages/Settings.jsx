import { useState } from 'react'
import { GitBranch, KeyRound, Bell, ShieldCheck, RefreshCw, Mail, AlertTriangle, FileText, GitPullRequest, Search, Save } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import SettingsSection from '../components/settings/SettingsSection'
import SettingRow from '../components/settings/SettingRow'

const INITIAL_NOTIFICATIONS = [
  { id: 'email', icon: Mail, label: 'Email notifications', description: 'Receive alerts via email', checked: true },
  { id: 'critical', icon: AlertTriangle, label: 'Critical vulnerability alerts', description: 'Immediate alerts for critical issues', checked: true },
  { id: 'digest', icon: FileText, label: 'Weekly security digest', description: 'Summary of all scans and findings', checked: false },
]

const INITIAL_SCAN_SETTINGS = [
  { id: 'autoScan', icon: GitPullRequest, label: 'Auto-scan on push', description: 'Automatically scan when code is pushed', checked: true },
  { id: 'deepScan', icon: Search, label: 'Deep dependency scan', description: 'Scan transitive dependencies (slower)', checked: false },
  { id: 'secrets', icon: KeyRound, label: 'Secrets detection', description: 'Scan for exposed API keys and credentials', checked: true },
]

export default function Settings() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [scanSettings, setScanSettings] = useState(INITIAL_SCAN_SETTINGS)

  const toggleItem = (setter) => (id, value) =>
    setter((items) => items.map((item) => (item.id === id ? { ...item, checked: value } : item)))

  return (
    <div className="min-w-0 @container space-y-6 p-8">
      <PageHeader
        title="Settings"
        subtitle="Configure your security scanning preferences"
      />

      <div className="grid grid-cols-1 gap-5 @lg:grid-cols-2">
        <SettingsSection icon={GitBranch} title="GitHub Integration" subtitle="Connect your GitHub account to scan repositories">
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <span className="flex min-w-0 items-center gap-2 truncate text-[13px]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} />
              Connected as <span className="font-mono" style={{ color: 'var(--muted)' }}>@developer</span>
            </span>
            <Button variant="ghost" size="sm" className="shrink-0">Disconnect</Button>
          </div>
        </SettingsSection>

        <SettingsSection icon={KeyRound} title="API Keys" subtitle="Manage your API access tokens">
          <div>
            <label className="mb-1.5 block text-xs" style={{ color: 'var(--muted)' }}>API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                readOnly
                value="sk_live_a1b2c3d4e5f6g7h8"
                className="h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 font-mono text-[13px]"
                style={{ borderColor: 'var(--border)' }}
              />
              <Button variant="ghost" size="md" className="shrink-0">
                <RefreshCw size={13} />
                Regenerate
              </Button>
            </div>
          </div>
        </SettingsSection>


        <SettingsSection icon={Bell} title="Notifications" subtitle="Configure how you receive security alerts">
          <div>
            {notifications.map((item, i) => (
              <SettingRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                description={item.description}
                checked={item.checked}
                onChange={(val) => toggleItem(setNotifications)(item.id, val)}
                last={i === notifications.length - 1}
              />
            ))}
          </div>
        </SettingsSection>


        <SettingsSection icon={ShieldCheck} title="Scan Settings" subtitle="Configure security scanning behavior">
          <div>
            {scanSettings.map((item, i) => (
              <SettingRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                description={item.description}
                checked={item.checked}
                onChange={(val) => toggleItem(setScanSettings)(item.id, val)}
                last={i === scanSettings.length - 1}
              />
            ))}
          </div>
        </SettingsSection>
      </div>

      <Button variant="primary" size="md">
        <Save size={14} />
        Save Changes
      </Button>
    </div>
  )
}