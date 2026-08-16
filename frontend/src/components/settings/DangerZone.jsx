import { useState } from 'react';
import { AlertOctagon, Trash2 } from 'lucide-react';
import DeleteAccountModal from './DeleteAccountModal';

/**
 * DangerZone - Sección de acciones destructivas de la cuenta.
 * 
 * @param {function} onDeleteAccount - Callback que se ejecuta cuando el usuario confirma la eliminación.
 */
export const DangerZone = ({ onDeleteAccount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmDelete = () => {
    setIsModalOpen(false);
    if (onDeleteAccount) {
      onDeleteAccount();
    }
  };

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--bg-secondary, #18181b)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--danger, #ef4444)',
              margin: '0 0 0.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertOctagon size={18} />
            Danger Zone
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary, #a1a1aa)',
              margin: 0,
            }}
          >
            Irreversible and destructive actions for your account.
          </p>
        </div>

        {/* Fila de acción Delete */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--bg-primary, #09090b)',
            border: '1px solid var(--border, #27272a)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary, #ffffff)',
                margin: '0 0 0.25rem 0',
              }}
            >
              Delete this account
            </h4>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #a1a1aa)',
                margin: 0,
              }}
            >
              Once deleted, your account cannot be recovered.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: '1px solid var(--danger, #ef4444)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger, #ef4444)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      <DeleteAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default DangerZone;