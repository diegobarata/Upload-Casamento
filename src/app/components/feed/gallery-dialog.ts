import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface FeedItem {
  name: string;
  type: string;
  url: string;
  timestamp: number;
  uploadedBy: string;
}

interface FeedGroup {
  userName: string;
  items: FeedItem[];
}

@Component({
  selector: 'gallery-dialog',
  templateUrl: './gallery-dialog.html',
  styleUrls: ['./gallery-dialog.scss'],
  standalone: false
})
export class GalleryDialog implements OnInit {
  selectedItem: FeedItem | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { group: FeedGroup, initialItem?: FeedItem }) {}

  ngOnInit(): void {
    // Se foi passado um item inicial, abre ele
    if (this.data.initialItem) {
      this.selectedItem = this.data.initialItem;
    }
  }

  openMedia(item: FeedItem) {
    this.selectedItem = item;
  }

  closeMedia() {
    this.selectedItem = null;
  }

  downloadFile(item: FeedItem) {
    // For Firebase Storage URLs, we need to approach downloads differently due to CORS
    try {
      // Create a link with the download attribute to force download
      const link = document.createElement('a');
      
      // Add download token parameter to URL to help force download 
      // instead of navigation in some browsers
      const downloadUrl = item.url + (item.url.includes('?') ? '&' : '?') + 
        'response-content-disposition=attachment%3Bfilename%3D' + 
        encodeURIComponent(item.name);
      
      // Set link properties
      link.href = downloadUrl;
      link.setAttribute('download', item.name);
      link.setAttribute('target', '_blank');
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      // Show feedback
      this.showDownloadStarted(item.name);
    } catch (e) {
      console.error('Error starting download:', e);
      
      // Fallback: open in new window which will at least show the file
      window.open(item.url, '_blank');
    }
  }

  /**
   * Show a message that download has started
   */
  private showDownloadStarted(fileName: string): void {
    console.log(`Download started for: ${fileName}`);
    // Could add a snackbar notification here
  }
}
