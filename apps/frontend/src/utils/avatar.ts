/**
 * Get user avatar URL
 * @param profileImage - User's profile image URL from backend
 * @param fallback - Optional fallback URL (default: default avatar SVG)
 * @returns Avatar URL
 */
export const getAvatarUrl = (
  profileImage?: string | null,
  fallback?: string
): string => {
  if (profileImage && profileImage.trim()) {
    return profileImage
  }
  
  // Default avatar SVG (green circle with user icon)
  return fallback || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle fill="%2310b981" cx="50" cy="50" r="50"/%3E%3Cpath fill="white" d="M50 30c-8.284 0-15 6.716-15 15 0 4.418 1.791 8.418 4.687 11.313C42.582 59.209 46.582 61 51 61s8.418-1.791 11.313-4.687C65.209 53.418 67 49.418 67 45c0-8.284-6.716-15-15-15zm0 40c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z"/%3E%3C/svg%3E'
}

/**
 * Get user avatar URL from user object
 * @param user - User object with profileImage property
 * @returns Avatar URL
 */
export const getUserAvatar = (user?: { profileImage?: string | null } | null): string => {
  return getAvatarUrl(user?.profileImage)
}

