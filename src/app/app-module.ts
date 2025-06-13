import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { App } from './app';
import { Upload } from './components/upload/upload';
import { Home } from './home/home';
import { Feed } from './components/feed/feed';
import { UploadProgress } from './components/upload-progress/upload-progress';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { NgxFileDropModule } from 'ngx-file-drop';
import { AppRoutingModule } from './app-routing-module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

import { FirebaseService } from './services/firebase.service';
import { UserService } from './services/user.service';

@NgModule({
  declarations: [
    App,
    Upload,
    Home,
    Feed,
    UploadProgress
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MatToolbarModule,
    MatCardModule,
    NgxFileDropModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTabsModule,
    MatDialogModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    FirebaseService,
    UserService
  ],
  bootstrap: [App]
})
export class AppModule { }
