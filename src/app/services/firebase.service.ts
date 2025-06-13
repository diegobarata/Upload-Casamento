import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { environment } from '../../environments/environment';

// Interface for feed items
export interface UploadedFileInfo {
  name: string;
  path: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: number;
  uploadedBy: string; // Add user name who uploaded the file
}

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
   * Upload a file to Firebase Storage with user information
   */
  async uploadFile(file: File, userName: string = 'Anonymous'): Promise<string> {
    try {
      // Create a unique file path
      const timestamp = Date.now();
      const fileName = file.name.replace(/[&/\\#,+()$~%'":*?<>{}]/g, '_');
      const filePath = `uploads/${timestamp}_${fileName}`;
      
      console.log(`Starting upload to path: ${filePath}`);
      
      // Create storage reference
      const storageRef = ref(this.storage, filePath);
      
      // Add metadata with timestamp and user name (no phone)
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedAt': timestamp.toString(),
          'originalName': file.name,
          'uploadedBy': userName
        }
      };
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file, metadata);
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
   * Get all uploaded files for the feed
   */
  async getUploadedFiles(): Promise<UploadedFileInfo[]> {
    try {
      // Get references to all files in the uploads folder
      const uploadsRef = ref(this.storage, 'uploads');
      const listResult = await listAll(uploadsRef);
      
      // Process each file to get metadata and download URL
      const filePromises = listResult.items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          const downloadUrl = await getDownloadURL(itemRef);
          
          // Parse upload timestamp from metadata or use creation time
          const customMeta = metadata.customMetadata || {};
          const uploadedAt = customMeta['uploadedAt'] 
            ? parseInt(customMeta['uploadedAt']) 
            : new Date(metadata.timeCreated).getTime();
            
          // Use original name if available
          const name = customMeta['originalName'] || metadata.name;
          
          // Get uploader name
          const uploadedBy = customMeta['uploadedBy'] || 'Anonymous';
          
          return {
            name,
            path: itemRef.fullPath,
            downloadUrl,
            contentType: metadata.contentType || 'application/octet-stream',
            size: metadata.size,
            uploadedAt,
            uploadedBy // Include uploader name
          };
        } catch (error) {
          console.error(`Error processing file ${itemRef.name}:`, error);
          return null;
        }
      });
      
      // Wait for all files to be processed and filter out any errors
      const files = (await Promise.all(filePromises)).filter(file => file !== null);
      
      return files as UploadedFileInfo[];
    } catch (error) {
      console.error('Error listing uploaded files:', error);
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
