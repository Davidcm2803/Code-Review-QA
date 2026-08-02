import { AlertTriangle, X } from 'lucide-react';

/**
 * DeleteAccountModal - Modal de confirmación para eliminar la cuenta.
 * 
 * @param {boolean} isOpen - Controla la visibilidad del modal.
 * @param {function} onClose - Handler para cerrar el modal sin eliminar.
 * @param {function} onConfirm - Handler para confirmar la eliminación de la cuenta.
 */
export const DeleteAccountModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-secondary, #18181b)',
          border: '1px solid var(--danger, #ef4444)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #a1a1aa)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger, #ef4444)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary, #ffffff)',
                margin: 0,
              }}
            >
              Delete Account
            </h4>
            <span style={{ fontSize: '0.875rem', color: 'var(--danger, #ef4444)', fontWeight: 500 }}>
              This action cannot be undone.
            </span>
          </div>
        </div>

        {/* Mensaje */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #a1a1aa)',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          Are you sure you want to delete your account? All of your data, repositories, API keys, and configurations will be permanently removed from our servers.
        </p>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: '1px solid var(--border, #3f3f46)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: 'var(--danger, #ef4444)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Yes, Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;