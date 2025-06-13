import { Injectable } from '@angular/core';
import { User, UserFile } from '../models/user.model';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private app;
  private db;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  /**
   * Create a new user and return it
   */
  async createUser(name: string, phone?: string): Promise<User> {
    try {
      // Create a user object
      const user: User = {
        id: this.generateId(),
        name,
        phone,
        createdAt: Date.now()
      };

      // Add user to Firestore
      const docRef = await addDoc(collection(this.db, 'users'), user);
      console.log('User created with ID:', docRef.id);

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Register a file upload for a specific user
   */
  async registerUserFile(userId: string, fileData: Omit<UserFile, 'userId'>): Promise<UserFile> {
    try {
      const userFile: UserFile = {
        ...fileData,
        userId
      };

      // Add to Firestore
      await addDoc(collection(this.db, 'userFiles'), userFile);
      
      return userFile;
    } catch (error) {
      console.error('Error registering file:', error);
      throw error;
    }
  }

  /**
   * Get all files for a specific user
   */
  async getUserFiles(userId: string): Promise<UserFile[]> {
    try {
      const q = query(
        collection(this.db, 'userFiles'),
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const files: UserFile[] = [];
      
      querySnapshot.forEach((doc) => {
        files.push(doc.data() as UserFile);
      });
      
      return files;
    } catch (error) {
      console.error('Error getting user files:', error);
      throw error;
    }
  }
  
  /**
   * Get all users with their files
   */
  async getAllUsersWithFiles(): Promise<{user: User, files: UserFile[]}[]> {
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(this.db, 'users'));
      const users: User[] = [];
      
      usersSnapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      
      // Get files for each user
      const result = await Promise.all(
        users.map(async (user) => {
          const files = await this.getUserFiles(user.id);
          return { user, files };
        })
      );
      
      return result;
    } catch (error) {
      console.error('Error getting all users with files:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID for a user
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
