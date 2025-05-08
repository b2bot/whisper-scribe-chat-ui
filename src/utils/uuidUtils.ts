
/**
 * UUID generation utility for user sessions
 */

/**
 * Generates a simple UUID v4 for user identification
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Gets the current user ID from localStorage or creates a new one
 */
export const getCurrentUserId = (): string => {
  const storedId = localStorage.getItem('currentUserId');
  if (storedId) {
    return storedId;
  }
  
  const newId = generateUUID();
  localStorage.setItem('currentUserId', newId);
  return newId;
};
