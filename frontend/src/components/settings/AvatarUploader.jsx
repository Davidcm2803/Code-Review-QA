import { useRef } from 'react';
import { Camera, Trash2, User } from 'lucide-react';

/**
 * AvatarUploader - Componente independiente para cargar y previsualizar la foto de perfil.
 * 
 * @param {string|null} avatar - URL o preview Base64/ObjectUrl de la imagen actual.
 * @param {string} username - Nombre de usuario para calcular las iniciales de fallback.
 * @param {function} onChange - Callback que se ejecuta al seleccionar una nueva imagen o eliminar la actual. Devuelve (File | null).
 */
export const AvatarUploader = ({ avatar, username = '', onChange }) => {
  const fileInputRef = useRef(null);

  // Obtener iniciales a partir del nombre de usuario (máximo 2 letras)
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(username);

  // Manejar la selección de archivo desde el input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      // Pasa el objeto File al componente padre
      onChange(file);
    }
  };

  // Abrir el selector nativo de archivos
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Remover la imagen actual
  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Avatar / Preview / Iniciales */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary, #27272a)',
          border: '1px solid var(--border, #3f3f46)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary, #ffffff)',
          fontWeight: 600,
          fontSize: '1.25rem',
          flexShrink: 0,
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={username || 'User Avatar'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User size={32} style={{ opacity: 0.6 }} />
        )}
      </div>

      {/* Acciones del Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleTriggerUpload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
              border: '1px solid var(--border, #3f3f46)',
              backgroundColor: 'var(--button-bg, #18181b)',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <Camera size={16} />
            Change Photo
          </button>

          {avatar && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '0.375rem',
                border: '1px solid var(--border, #3f3f46)',
                backgroundColor: 'transparent',
                color: 'var(--danger, #ef4444)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <Trash2 size={16} />
              Remove
            </button>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a1a1aa)' }}>
          JPG, GIF or PNG. Max size 2MB.
        </span>
      </div>
    </div>
  );
};

export default AvatarUploader;