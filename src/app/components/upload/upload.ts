import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { FirebaseService } from '../../services/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UploadProgress, UploadProgressData } from '../upload-progress/upload-progress';

// Keep the existing interface without user-related fields
interface UploadedFile {
  name: string;
  type: string;
  url: string;
  firebaseUrl?: string;
  _file?: File;
}

@Component({
  selector: 'app-upload',
  standalone: false,
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss']
})
export class Upload {
  public files: NgxFileDropEntry[] = [];
  public uploadedFiles: UploadedFile[] = [];
  public isUploading = false;
  public isPostUpload = false;
  public userInfoForm: FormGroup;

  @ViewChild('fileSelector') fileSelector!: ElementRef<HTMLInputElement>;

  // Add event emitter to notify about new uploads
  @Output() uploadComplete = new EventEmitter<boolean>();

  private dialogRef: MatDialogRef<UploadProgress> | null = null;
  
  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    // Initialize form with validation - remove phone field
    this.userInfoForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  public onFileDropped(files: NgxFileDropEntry[]) {
    // Don't accept new files during upload or post-upload period
    if (this.isUploading || this.isPostUpload) return;
    
    this.files = this.files.concat(files);
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          console.log('Arquivo recebido (drag-drop):', file);
          
          // Display error message if multiple files are rejected
          if (!this.isPhotoOrVideo(file)) {
            this.snackBar.open(
              `Arquivo "${file.name}" rejeitado: somente fotos e vídeos são permitidos.`,
              'Fechar',
              { duration: 3000, panelClass: ['warning-snackbar'] }
            );
            return;
          }
          
          this.addUploadedFile(file);
        });
      }
    }
  }

  public onFilesSelected(event: Event) {
    // Don't accept new files during upload or post-upload period
    if (this.isUploading || this.isPostUpload) return;
    
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      return;
    }

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files.item(i);
      if (file) {
        console.log('Arquivo recebido (seleção manual):', file);
        this.addUploadedFile(file);
      }
    }
    input.value = '';
  }

  private addUploadedFile(file: File) {
    // Check if file is a photo or video before adding
    if (!this.isPhotoOrVideo(file)) {
      this.snackBar.open(
        'Somente fotos e vídeos são permitidos.',
        'Fechar',
        { duration: 3000, panelClass: ['warning-snackbar'] }
      );
      return;
    }
    
    const url = URL.createObjectURL(file);
    this.uploadedFiles.push({
      name: file.name,
      type: file.type,
      url: url,
      // The actual file will be stored here temporarily
      _file: file as any
    });
  }

  /**
   * Check if a file is a photo or video
   * @param file File to check
   * @returns boolean indicating if the file is a photo or video
   */
  private isPhotoOrVideo(file: File): boolean {
    // List of allowed MIME types for photos
    const photoTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/bmp', 
      'image/tiff', 
      'image/svg+xml',
      'image/heic',
      'image/heif'
    ];
    
    // List of allowed MIME types for videos
    const videoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/x-ms-wmv',  // .wmv
      'video/3gpp',
      'video/3gpp2',
      'video/x-flv',
      'video/x-matroska' // .mkv
    ];
    
    // Check by MIME type
    const isAllowedMimeType = [...photoTypes, ...videoTypes].includes(file.type);
    
    // Also check by file extension as fallback (some browsers might not report correct MIME type)
    if (!isAllowedMimeType) {
      const extension = this.getFileExtension(file.name).toLowerCase();
      const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif'];
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', '3gp', 'flv', 'mkv', 'mpg', 'mpeg', 'm4v'];
      
      return [...photoExtensions, ...videoExtensions].includes(extension);
    }
    
    return isAllowedMimeType;
  }
  
  /**
   * Get file extension from filename
   * @param filename The filename to extract extension from
   * @returns The file extension without the dot
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  // Update removeFile to not delete from Firebase
  public async removeFile(index: number) {
    // Block removing files during upload or post-upload
    if (this.isUploading || this.isPostUpload) return;
    
    const file = this.uploadedFiles[index];
    
    // Revoke local object URL
    URL.revokeObjectURL(file.url);
    
    // Don't delete from Firebase - only remove from UI
    this.uploadedFiles.splice(index, 1);
  }

  // Update clearAll to not delete from Firebase
  public async clearAll() {
    // Block clearing during upload
    if (this.isUploading) return;
    
    // Only revoke object URLs and clear the list - don't delete from Firebase
    for (const file of this.uploadedFiles) {
      URL.revokeObjectURL(file.url);
    }
    
    this.uploadedFiles = [];
    this.isPostUpload = false; // Reset flag
  }

  // Revert the sendFiles method to its previous state without user creation
  public async sendFiles() {
    // Check form validity
    if (this.userInfoForm.invalid) {
      this.snackBar.open('Por favor, preencha o campo Nome.', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (this.uploadedFiles.length === 0) {
      this.snackBar.open('Nenhum arquivo para enviar', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    // Set state to uploading
    this.isUploading = true;
    
    // Disable form controls programmatically
    this.userInfoForm.disable();
    
    // Open progress dialog
    const progressData: UploadProgressData = {
      totalFiles: this.uploadedFiles.length,
      completedFiles: 0,
      success: false,
      error: false
    };
    
    this.dialogRef = this.dialog.open(UploadProgress, {
      data: progressData,
      disableClose: true
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Get the user name from the form
      const userName = this.userInfoForm.get('name')?.value || 'Anonymous';
      
      // Process each file
      for (let i = 0; i < this.uploadedFiles.length; i++) {
        const fileData = this.uploadedFiles[i];
        const file = fileData._file;
        
        if (!file) {
          console.error('File object missing for:', fileData.name);
          errorCount++;
          progressData.completedFiles++;
          // Update dialog data
          this.updateProgressDialog(progressData);
          continue;
        }
        
        // Skip already uploaded files
        if (fileData.firebaseUrl) {
          console.log(`File ${fileData.name} already uploaded`);
          successCount++;
          progressData.completedFiles++;
          // Update dialog data
          this.updateProgressDialog(progressData);
          continue;
        }
        
        try {
          // Log the attempt
          console.log(`Uploading file ${i+1}/${this.uploadedFiles.length}:`, file.name);
          
          // Pass the user name to the upload method
          const firebaseUrl = await this.firebaseService.uploadFile(file, userName);
          
          // Log success
          console.log(`Successfully uploaded: ${file.name} to ${firebaseUrl}`);
          
          // Store the URL on the file data object
          this.uploadedFiles[i] = {
            ...fileData,
            firebaseUrl
          };
          
          successCount++;
        } catch (uploadError) {
          console.error(`Failed to upload ${fileData.name}:`, uploadError);
          errorCount++;
        } finally {
          // Update progress count regardless of success/failure
          progressData.completedFiles++;
          // Update dialog data
          this.updateProgressDialog(progressData);
        }
      }
      
      // Handle results
      if (errorCount === 0 && successCount > 0) {
        // Update dialog to show success
        progressData.success = true;
        this.updateProgressDialog(progressData);
        
        // Success message
        this.snackBar.open(
          `Upload concluído com sucesso! ${successCount} ${successCount === 1 ? 'arquivo enviado' : 'arquivos enviados'}.`,
          'Fechar',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );
        
        // Set post-upload flag before timeout
        this.isPostUpload = true;
        
        // Clear files after success - wait 5 seconds
        setTimeout(() => {
          this.clearFilesOnly();
          if (this.dialogRef) {
            this.dialogRef.close();
            this.dialogRef = null;
          }
        }, 5000);
      } else if (successCount > 0) {
        // Update dialog to show partial error
        progressData.error = true;
        this.updateProgressDialog(progressData);
        
        // Partial success
        this.snackBar.open(
          `Upload parcial: ${successCount} ok, ${errorCount} com erro.`,
          'Fechar',
          { duration: 5000, panelClass: ['warning-snackbar'] }
        );
        
        // Re-enable form
        this.userInfoForm.enable();
      } else {
        // Update dialog to show error
        progressData.error = true;
        this.updateProgressDialog(progressData);
        
        // Complete failure
        this.snackBar.open(
          'Falha no upload. Tente novamente.',
          'Fechar',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        
        // Re-enable form
        this.userInfoForm.enable();
      }
    } catch (error) {
      // Update dialog to show error
      progressData.error = true;
      this.updateProgressDialog(progressData);
      
      console.error('Upload process error:', error);
      this.snackBar.open(
        'Erro ao processar o upload.',
        'Fechar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      
      // Re-enable form on error
      this.userInfoForm.enable();
    } finally {
      this.isUploading = false;
    }
  }
  
  /**
   * Update the progress dialog with current state
   */
  private updateProgressDialog(progressData: UploadProgressData): void {
    if (this.dialogRef) {
      this.dialogRef.componentInstance.data = { ...progressData };
    }
  }
  
  // Update clearFilesOnly to not delete from Firebase
  private async clearFilesOnly() {
    // Only revoke object URLs, don't delete from Firebase
    for (const file of this.uploadedFiles) {
      URL.revokeObjectURL(file.url);
    }
    
    this.uploadedFiles = [];
    this.files = [];
    this.isPostUpload = false;
    
    // Re-enable form
    this.userInfoForm.enable();
  }
  
  /**
   * Test if an image URL is accessible
   * @param url URL to test
   * @returns Promise that resolves if the URL is accessible
   */
  private async testImageUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image URL test timed out'));
      }, 10000); // 10 second timeout
      
      // For images, try to load it
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        console.log('Image URL test successful');
        resolve();
      };
      img.onerror = (err) => {
        clearTimeout(timeout);
        console.warn('Image URL test failed:', err);
        // Don't reject, just log the warning
        resolve();
      };
      img.src = url;
    });
  }
  
  /**
   * Determine content type from file extension
   */
  private determineContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'application/octet-stream';
    
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov'];
    const docTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    
    if (imageTypes.includes(ext)) {
      return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    } else if (videoTypes.includes(ext)) {
      return `video/${ext}`;
    } else if (docTypes.includes(ext)) {
      switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'txt': return 'text/plain';
        default: return 'application/octet-stream';
      }
    }
    
    return 'application/octet-stream';
  }

  // Test function to diagnose upload issues
  public async testUpload() {
    if (this.uploadedFiles.length === 0 || !this.uploadedFiles[0]._file) {
      this.snackBar.open('Nenhum arquivo para testar', 'Fechar', { duration: 3000 });
      return;
    }
    
    this.snackBar.open('Iniciando teste de upload...', 'Fechar', { duration: 2000 });
    
    try {
      // Create a simple text file as a control test
      const testContent = 'Test file content ' + new Date().toISOString();
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      console.log('Uploading test file...');
      const testUrl = await this.firebaseService.uploadFile(testFile);
      console.log('Test file uploaded:', testUrl);
      
      // Now try with the actual file
      const realFile = this.uploadedFiles[0]._file as File;
      console.log('Uploading real file:', realFile.name);
      const realUrl = await this.firebaseService.uploadFile(realFile);
      console.log('Real file uploaded:', realUrl);
      
      this.snackBar.open(
        'Teste concluído! Verifique o console para detalhes.',
        'Fechar',
        { duration: 5000, panelClass: ['success-snackbar'] }
      );
    } catch (error) {
      console.error('Test upload failed:', error);
      this.snackBar.open(
        'Teste falhou. Verifique o console para detalhes.',
        'Fechar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }
}
