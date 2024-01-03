import { Subscription } from 'rxjs';
import { NotificationService } from './services/notification-service.service';
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { SplashComponent } from '../app/splash/splash.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;

  private newEmergencySubscription: Subscription = undefined!;
  public isSplashScreenVisible = true; // Flag to control splash screen visibility

  constructor(private notificationService: NotificationService) {
    this.listenForNewEmergencies();
  }

  private listenForNewEmergencies() {
    this.newEmergencySubscription = this.notificationService.onNewEmergency().subscribe(async (emergencyId: string) => {
      await this.notificationService.showNewEmergencyAlert(emergencyId);
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.isSplashScreenVisible = false;
    }, 1000); 
  }

  ngOnDestroy() {
    if (this.newEmergencySubscription) {
      this.newEmergencySubscription.unsubscribe();
    }
  }
}
