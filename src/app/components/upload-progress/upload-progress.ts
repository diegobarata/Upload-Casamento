import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface UploadProgressData {
  totalFiles: number;
  completedFiles: number;
  success: boolean;
  error: boolean;
}

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.html',
  styleUrls: ['./upload-progress.scss'],
  standalone: false
})
export class UploadProgress {
  constructor(
    public dialogRef: MatDialogRef<UploadProgress>,
    @Inject(MAT_DIALOG_DATA) public data: UploadProgressData
  ) {}

  getProgressPercentage(): number {
    return (this.data.completedFiles / this.data.totalFiles) * 100;
  }

  close(): void {
    this.dialogRef.close();
  }
}
