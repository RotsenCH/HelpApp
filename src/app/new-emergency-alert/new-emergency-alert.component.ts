import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-new-emergency-alert',
  templateUrl: './new-emergency-alert.component.html',
  styleUrls: ['./new-emergency-alert.component.scss']
})
export class NewEmergencyAlertComponent {
  @Input() emergencyData: any;

  constructor() { }
}
