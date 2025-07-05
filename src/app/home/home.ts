import { Component, ViewChild } from '@angular/core';
import { Feed } from '../components/feed/feed';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  standalone: false,
})
export class Home {
  @ViewChild(Feed) feedComponent!: Feed;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;

  constructor() {}

  /**
   * Handle upload complete event from upload component
   */
  onUploadComplete(success: boolean): void {
    if (success) {
      // Refresh the feed without switching tabs
      setTimeout(() => {
        if (this.feedComponent) {
          this.feedComponent.loadFeedItems();
        }
      }, 1000);
    }
  }
}
