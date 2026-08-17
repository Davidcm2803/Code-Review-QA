import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 *
 * @param {function} onUpdatePassword 
 * @param {boolean} requireCurrentPassword 
 *   oculta el campo "Current Password" y no lo exige
 */
export const SecuritySection = ({ onUpdatePassword, requireCurrentPassword = true }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Visibilidad de contraseñas
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mensajes de feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { currentPassword, newPassword, confirmPassword } = formData;

    // Validaciones
    if (requireCurrentPassword && !currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await onUpdatePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary, #18181b)',
        border: '1px solid var(--border, #27272a)',
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
            color: 'var(--text-primary, #ffffff)',
            margin: '0 0 0.25rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Lock size={18} />
          Security
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #a1a1aa)',
            margin: 0,
          }}
        >
          Ensure your account is using a strong password.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Mensajes de feedback */}
        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger, #ef4444)',
              color: 'var(--danger, #ef4444)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid #22c55e',
              color: '#22c55e',
              fontSize: '0.875rem',
            }}
          >
            {success}
          </div>
        )}

        {/* Current Password (oculto para usuarios OAuth puros) */}
        {requireCurrentPassword && (
          <div>
            <label
              htmlFor="currentPassword"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary, #ffffff)',
                marginBottom: '0.375rem',
              }}
            >
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border, #3f3f46)',
                  backgroundColor: 'var(--bg-primary, #09090b)',
                  color: 'var(--text-primary, #ffffff)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #a1a1aa)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '0.375rem',
            }}
          >
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border, #3f3f46)',
                backgroundColor: 'var(--bg-primary, #09090b)',
                color: 'var(--text-primary, #ffffff)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #a1a1aa)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '0.375rem',
            }}
          >
            Confirm New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border, #3f3f46)',
                backgroundColor: 'var(--bg-primary, #09090b)',
                color: 'var(--text-primary, #ffffff)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #a1a1aa)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: 'var(--primary, #2563eb)',
              color: '#ffffff',
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySection;