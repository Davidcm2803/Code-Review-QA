const API_BASE_URL = import.meta.env.VITE_API_URL;

export function resolveAvatarUrl(photo) {
  if (!photo) return null;
  if (
    photo.startsWith('http://') ||
    photo.startsWith('https://') ||
    photo.startsWith('blob:') ||
    photo.startsWith('data:')
  ) {
    return photo;
  }
  return `${API_BASE_URL}${photo}`;
}