import { Subscription } from 'rxjs';
import { NotificationService } from './services/notification-service.service';
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})

export class AppComponent implements OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;

  private newEmergencySubscription: Subscription = undefined!;

  constructor(private notificationService: NotificationService) {
    this.listenForNewEmergencies();
  }

  private listenForNewEmergencies() {
    this.newEmergencySubscription = this.notificationService.onNewEmergency().subscribe(async (emergencyId: string) => {
      await this.notificationService.showNewEmergencyAlert(emergencyId);
    });
  }
  
  

  ngOnDestroy() {
    if (this.newEmergencySubscription) {
      this.newEmergencySubscription.unsubscribe();
    }
  }
}