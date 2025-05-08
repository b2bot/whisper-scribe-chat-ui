
import { Message } from '../types/chat';

/**
 * Storage utility for managing conversation history
 */

/**
 * Gets all user IDs that have saved conversations
 */
export const getUserIds = (): string[] => {
  try {
    const userIdsString = localStorage.getItem('chat_userIds');
    return userIdsString ? JSON.parse(userIdsString) : [];
  } catch (error) {
    console.error('Error getting user IDs:', error);
    return [];
  }
};

/**
 * Adds a user ID to the list of users with conversations
 */
export const addUserToList = (userId: string): void => {
  try {
    const userIds = getUserIds();
    if (!userIds.includes(userId)) {
      userIds.push(userId);
      localStorage.setItem('chat_userIds', JSON.stringify(userIds));
    }
  } catch (error) {
    console.error('Error adding user to list:', error);
  }
};

/**
 * Saves messages for a specific user
 */
export const saveUserMessages = (userId: string, messages: Message[]): void => {
  try {
    localStorage.setItem(`chat_messages_${userId}`, JSON.stringify(messages));
    addUserToList(userId);
  } catch (error) {
    console.error('Error saving user messages:', error);
  }
};

/**
 * Loads messages for a specific user
 */
export const loadUserMessages = (userId: string): Message[] => {
  try {
    const messagesString = localStorage.getItem(`chat_messages_${userId}`);
    return messagesString ? JSON.parse(messagesString) : [];
  } catch (error) {
    console.error('Error loading user messages:', error);
    return [];
  }
};

/**
 * Clears messages for a specific user
 */
export const clearUserMessages = (userId: string): void => {
  try {
    localStorage.removeItem(`chat_messages_${userId}`);
  } catch (error) {
    console.error('Error clearing user messages:', error);
  }
};

/**
 * Creates a new conversation for a user by clearing their history
 */
export const startNewConversation = (userId: string): void => {
  clearUserMessages(userId);
};

/**
 * Gets user nickname if it exists
 */
export const getUserNickname = (userId: string): string | null => {
  try {
    return localStorage.getItem(`chat_nickname_${userId}`);
  } catch (error) {
    console.error('Error getting user nickname:', error);
    return null;
  }
};

/**
 * Sets user nickname
 */
export const setUserNickname = (userId: string, nickname: string): void => {
  try {
    localStorage.setItem(`chat_nickname_${userId}`, nickname);
  } catch (error) {
    console.error('Error setting user nickname:', error);
  }
};
