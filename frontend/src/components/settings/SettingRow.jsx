/**
 * SettingRow - Fila individual para opciones tipo toggle.
 */
export const SettingRow = ({ icon: Icon, label, description, checked, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        borderRadius: '0.375rem',
        backgroundColor: 'transparent',
        transition: 'background-color 0.2s',
        gap: '1rem',
      }}
    >
      {/* Lado izquierdo: Icono + Textos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        {Icon && (
          <Icon
            size={18}
            style={{
              color: 'var(--text-secondary, #a1a1aa)',
              marginTop: '0.125rem',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              lineHeight: 1.25,
            }}
          >
            {label}
          </div>
          {description && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #a1a1aa)',
                marginTop: '0.125rem',
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Lado derecho: Switch Toggle contenido */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '2.75rem',
          height: '1.5rem',
          borderRadius: '9999px',
          backgroundColor: checked ? 'var(--primary, #10b981)' : 'var(--border, #3f3f46)',
          position: 'relative',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background-color 0.2s',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: '1.125rem',
            height: '1.125rem',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: '0.1875rem',
            left: checked ? '1.4375rem' : '0.1875rem',
            transition: 'left 0.2s',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          }}
        />
      </button>
    </div>
  );
};

export default SettingRow;