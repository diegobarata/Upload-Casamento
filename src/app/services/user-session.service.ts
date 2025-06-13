import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface UserSession {
  id: string;
  name: string;
  phone: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private currentSession: UserSession | null = null;

  constructor() {
    // Try to load session from localStorage
    this.loadSession();
  }

  /**
   * Start a new user session
   */
  startSession(name: string, phone: string): UserSession {
    const session: UserSession = {
      id: uuidv4(), // Generate a unique ID
      name,
      phone,
      timestamp: Date.now()
    };
    
    this.currentSession = session;
    this.saveSession();
    
    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
    localStorage.removeItem('userSession');
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.currentSession) {
      localStorage.setItem('userSession', JSON.stringify(this.currentSession));
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        this.currentSession = JSON.parse(savedSession);
      } catch (e) {
        console.error('Error loading saved session:', e);
        this.clearSession();
      }
    }
  }
}
