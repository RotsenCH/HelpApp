import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/compat/firestore';
import { ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { NewEmergencyAlertComponent } from '../new-emergency-alert/new-emergency-alert.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private newEmergencySubject = new Subject<string>(); // Emite el ID de la emergencia


  constructor(private afs: AngularFirestore, private modalController: ModalController) {
    this.observeNewEmergencies();
  }

  private observeNewEmergencies() {
    this.afs.collection('emergencies', ref => ref.orderBy('timestamp', 'desc').limit(1))
      .snapshotChanges()
      .subscribe((actions: DocumentChangeAction<any>[]) => {
        actions.forEach(action => {
          if (action.type === 'added') {
            const emergencyId = action.payload.doc.id; // Obtener el ID de la emergencia
            this.newEmergencySubject.next(emergencyId); // Emitir el ID
          }
        });
      });
  }

  onNewEmergency() {
    return this.newEmergencySubject.asObservable();
  }
  async showNewEmergencyAlert(emergencyId: string) {
    const emergencyDoc = this.afs.collection('emergencies').doc(emergencyId);
    const emergencySnapshot = await emergencyDoc.get().toPromise();
  
    if (emergencySnapshot && emergencySnapshot.exists) {
      const emergencyData = emergencySnapshot.data(); // Obtener los datos
      const modal = await this.modalController.create({
        component: NewEmergencyAlertComponent,
        componentProps: { emergencyData },
        cssClass: 'emergency-modal'
      });
      return await modal.present();
    } else {
      console.error('No se encontraron datos para la emergencia');
    }
  }
  
}
