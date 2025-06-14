import { Component, OnInit } from '@angular/core';
import { FirebaseService, UploadedFileInfo } from '../../services/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { GalleryDialog } from './gallery-dialog';

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
  selector: 'app-feed',
  standalone: false,
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss']
})
export class Feed implements OnInit {
  public feedGroups: FeedGroup[] = [];
  public isLoading = false;
  public error: string | null = null;
  public carouselIndexes: { [userName: string]: number } = {};

  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFeedItems();
  }

  /**
   * Load feed items from Firebase
   */
  public async loadFeedItems(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const items = await this.firebaseService.getUploadedFiles();
      
      // Convert to feed items
      const feedItems = items.map(item => ({
        name: item.name,
        type: item.contentType,
        url: item.downloadUrl,
        timestamp: item.uploadedAt,
        uploadedBy: item.uploadedBy
      }));

      // Group items by uploader name
      const groupedItems: {[key: string]: FeedItem[]} = {};
      
      feedItems.forEach(item => {
        if (!groupedItems[item.uploadedBy]) {
          groupedItems[item.uploadedBy] = [];
        }
        groupedItems[item.uploadedBy].push(item);
      });
      
      // Convert to array and sort each group by timestamp
      this.feedGroups = Object.keys(groupedItems).map(userName => {
        return {
          userName,
          items: groupedItems[userName].sort((a, b) => b.timestamp - a.timestamp)
        };
      });
      
      // Sort groups alphabetically by user name
      this.feedGroups.sort((a, b) => a.userName.localeCompare(b.userName));

      console.log(`Loaded ${feedItems.length} items in ${this.feedGroups.length} groups`);
    } catch (error) {
      console.error('Error loading feed items:', error);
      this.error = 'Não foi possível carregar os itens do feed.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Refresh the feed to show newly uploaded items
   */
  public async refresh(): Promise<void> {
    this.snackBar.open(
      'Atualizando feed...',
      'Fechar',
      { duration: 2000 }
    );
    await this.loadFeedItems();
  }

  // Carrossel: navegação anterior
  prevItem(userName: string) {
    const idx = this.carouselIndexes[userName] ?? 0;
    const group = this.feedGroups.find(g => g.userName === userName);
    if (group) {
      this.carouselIndexes[userName] = (idx - 1 + group.items.length) % group.items.length;
    }
  }

  // Carrossel: navegação próxima
  nextItem(userName: string) {
    const idx = this.carouselIndexes[userName] ?? 0;
    const group = this.feedGroups.find(g => g.userName === userName);
    if (group) {
      this.carouselIndexes[userName] = (idx + 1) % group.items.length;
    }
  }

  // Abrir galeria em popup
  openGallery(group: FeedGroup) {
    this.dialog.open(GalleryDialog, {
      data: { group },
      width: '90vw',
      maxWidth: '900px'
    });
  }

  // Abrir mídia individual do feed (imagem/vídeo)
  openMediaFromFeed(item: FeedItem, group: FeedGroup) {
    this.dialog.open(GalleryDialog, {
      data: { group, initialItem: item },
      width: '90vw',
      maxWidth: '900px'
    });
  }
}
