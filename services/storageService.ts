import { Message, ChatMode } from '../types';

const STORAGE_PREFIX = 'cura_ai_';
const API_URL = 'http://localhost:3000/api';

// Helper to get or create a persistent anonymous User ID
const getUserId = (): string => {
  let userId = localStorage.getItem(`${STORAGE_PREFIX}user_id`);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(`${STORAGE_PREFIX}user_id`, userId);
  }
  return userId;
};

export const storageService = {
  getUserId,

  /**
   * Checks if the user has previously consented via API with fallback.
   */
  checkConsent: async (): Promise<boolean> => {
    try {
      const userId = getUserId();
      // Add a short timeout (1s) so the app loads quickly even if server is down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const res = await fetch(`${API_URL}/consent/${userId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error('Server unreachable');
      const data = await res.json();
      return data.hasConsented;
    } catch (e) {
      // Silently fallback to local storage so the user isn't blocked
      return localStorage.getItem(`${STORAGE_PREFIX}consent`) === 'true';
    }
  },

  /**
   * Saves the user's consent status via API with fallback.
   */
  setConsent: async (accepted: boolean) => {
    // Always save to local storage immediately
    localStorage.setItem(`${STORAGE_PREFIX}consent`, JSON.stringify(accepted));
    
    try {
      const userId = getUserId();
      await fetch(`${API_URL}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, hasConsented: accepted })
      });
    } catch (e) {
      console.warn('Could not sync consent to server (running offline mode).');
    }
  },

  /**
   * Retrieves chat history for a specific mode from API.
   */
  getMessages: async (mode: ChatMode): Promise<Message[] | null> => {
    try {
      const userId = getUserId();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_URL}/history?userId=${userId}&mode=${mode}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      return data.messages;
    } catch (e) {
      // If server fails, we just return null so the chat starts empty
      // In a full implementation, you might sync localStorage history here too
      return null;
    }
  },

  /**
   * Clears chat history for a specific mode via API.
   */
  clearMessages: async (mode: ChatMode) => {
    try {
      const userId = getUserId();
      await fetch(`${API_URL}/history?userId=${userId}&mode=${mode}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to clear messages on server:', e);
    }
  }
};