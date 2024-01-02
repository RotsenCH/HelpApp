import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-new-emergency-alert',
  templateUrl: './new-emergency-alert.component.html',
  styleUrls: ['./new-emergency-alert.component.scss']
})
export class NewEmergencyAlertComponent {
  @Input() emergencyData: any;
  constructor(private modalController: ModalController) { }
  dismissModal() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }
}
