import Card from '../layout/Card'

export default function StatCard({ label, value, trend, icon: Icon }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            background: 'var(--secondary)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
          }}
        >
          <Icon size={15} />
        </div>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--safe)' }}>{trend}</span>
      </div>
      <p style={{ fontSize: 19, fontWeight: 600, fontFamily: 'monospace', margin: 0, marginTop: 8 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, marginTop: 2 }}>{label}</p>
    </Card>
  )
}