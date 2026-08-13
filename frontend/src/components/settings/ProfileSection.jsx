import { useState, useEffect } from 'react';
import AvatarUploader from './AvatarUploader';

export const ProfileSection = ({ profile, onSave }) => {
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: profile?.email || '',
    provider: profile?.provider || 'local',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || null);

  // Limpieza de memoria para URLs creadas temporalmente
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (fileOrNull) => {
    if (!fileOrNull) {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(null);
      setAvatarPreview(null);
    } else {
      const objectUrl = URL.createObjectURL(fileOrNull);
      setAvatarFile(fileOrNull);
      setAvatarPreview(objectUrl);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      avatarFile,
      avatar: avatarPreview,
    });
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary, #ffffff)',
            margin: '0 0 0.25rem 0',
          }}
        >
          Profile
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #a1a1aa)',
            margin: 0,
          }}
        >
          Update your account's profile information and email address.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '0.5rem',
            }}
          >
            Profile Photo
          </label>
          <AvatarUploader
            avatar={avatarPreview}
            username={formData.username}
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <label
            htmlFor="username"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '0.375rem',
            }}
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g. Developer"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border, #3f3f46)',
              backgroundColor: 'var(--bg-primary, #09090b)',
              color: 'var(--text-primary, #ffffff)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '0.375rem',
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="developer@example.com"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border, #3f3f46)',
              backgroundColor: 'var(--bg-primary, #09090b)',
              color: 'var(--text-primary, #ffffff)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary, #ffffff)',
              marginBottom: '0.375rem',
            }}
          >
            Authentication Provider
          </label>
          <div
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '0.25rem',
              backgroundColor: 'var(--badge-bg, #27272a)',
              color: 'var(--text-secondary, #a1a1aa)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {formData.provider}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: 'var(--primary, #2563eb)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSection;