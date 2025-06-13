import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app;
  private storage;
  
  constructor() {
    // Initialize Firebase
    this.app = initializeApp(environment.firebase);
    this.storage = getStorage(this.app);
    console.log('Firebase initialized with bucket:', environment.firebase.storageBucket);
  }
  
  /**
   * Upload a file to Firebase Storage
   * Simple implementation that works with the test button
   */
  async uploadFile(file: File): Promise<string> {
    try {
      // Create a unique file path
      const timestamp = Date.now();
      const fileName = file.name.replace(/[&/\\#,+()$~%'":*?<>{}]/g, '_');
      const filePath = `uploads/${timestamp}_${fileName}`;
      
      console.log(`Starting upload to path: ${filePath}`);
      
      // Create storage reference
      const storageRef = ref(this.storage, filePath);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful:', snapshot.metadata);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Delete a file from Firebase Storage by URL
   */
  async deleteFile(url: string): Promise<void> {
    try {
      // Extract path from URL
      const path = this.getPathFromURL(url);
      console.log('Deleting file at path:', path);
      
      if (!path) {
        throw new Error('Could not extract path from URL');
      }
      
      const fileRef = ref(this.storage, path);
      await deleteObject(fileRef);
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  
  /**
   * Extract file path from Firebase Storage URL
   */
  private getPathFromURL(url: string): string | null {
    try {
      const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${environment.firebase.storageBucket}/o/`;
      let path = url.replace(baseUrl, '');
      
      // Remove query parameters
      const queryIndex = path.indexOf('?');
      if (queryIndex !== -1) {
        path = path.substring(0, queryIndex);
      }
      
      // URL decode the path
      return decodeURIComponent(path);
    } catch (e) {
      console.error('Error extracting path from URL:', e);
      return null;
    }
  }
}
