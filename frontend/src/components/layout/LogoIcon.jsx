import { Shield } from 'lucide-react'

export default function LogoIcon() {
  return (
    <div
      style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
      className="flex items-center justify-center w-8 h-8 rounded-md shrink-0"
    >
      <Shield size={18} />
    </div>
  )
}