
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUserId } from '../utils/uuidUtils';
import { 
  getUserIds, 
  addUserToList, 
  getUserNickname, 
  setUserNickname,
  loadUserMessages,
  saveUserMessages,
  clearUserMessages,
  startNewConversation
} from '../utils/storageUtils';
import { Message, UserSession } from '../types/chat';
import { toast } from '@/components/ui/sonner';

interface UserContextType {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  userSessions: UserSession[];
  createNewUser: () => string;
  switchUser: (userId: string) => void;
  setUserNickname: (userId: string, nickname: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearHistory: () => void;
  startNewChat: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Initialize current user on component mount
  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
    addUserToList(userId);
    loadUserSessionsData();
  }, []);
  
  // Load user messages when user changes
  useEffect(() => {
    if (currentUserId) {
      const userMessages = loadUserMessages(currentUserId);
      setMessages(userMessages);
    }
  }, [currentUserId]);
  
  // Save messages when they change
  useEffect(() => {
    if (currentUserId && messages.length > 0) {
      saveUserMessages(currentUserId, messages);
    }
  }, [messages, currentUserId]);
  
  // Load all user session data
  const loadUserSessionsData = () => {
    const userIds = getUserIds();
    const sessions = userIds.map(id => ({
      id,
      nickname: getUserNickname(id)
    }));
    setUserSessions(sessions);
  };
  
  // Create a new user session
  const createNewUser = () => {
    const newId = getCurrentUserId(); // This generates a new UUID
    localStorage.setItem('currentUserId', newId);
    addUserToList(newId);
    setCurrentUserId(newId);
    setMessages([]);
    loadUserSessionsData();
    toast.success('New user session created');
    return newId;
  };
  
  // Switch to an existing user session
  const switchUser = (userId: string) => {
    localStorage.setItem('currentUserId', userId);
    setCurrentUserId(userId);
    const userMessages = loadUserMessages(userId);
    setMessages(userMessages);
    toast.success('User session switched');
  };
  
  // Update user nickname
  const updateUserNickname = (userId: string, nickname: string) => {
    setUserNickname(userId, nickname);
    loadUserSessionsData();
    toast.success('Nickname updated');
  };
  
  // Clear history for current user
  const clearHistory = () => {
    clearUserMessages(currentUserId);
    setMessages([]);
    toast.success('Chat history cleared');
  };
  
  // Start a new conversation (clear history)
  const startNewChat = () => {
    startNewConversation(currentUserId);
    setMessages([]);
    toast.success('Started new conversation');
  };
  
  return (
    <UserContext.Provider value={{
      currentUserId,
      setCurrentUserId,
      userSessions,
      createNewUser,
      switchUser,
      setUserNickname: updateUserNickname,
      messages,
      setMessages,
      clearHistory,
      startNewChat
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
