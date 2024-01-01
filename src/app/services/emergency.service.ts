import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { switchMap, first } from 'rxjs/operators';
import { Camera, CameraResultType } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class EmergencyService {

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  async takePicture(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl
    });
  
    return image.dataUrl as string;
  }
  
  async recordVideo() {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const mediaRecorder = new MediaRecorder(mediaStream);
    const chunks: any[] = [];

    mediaRecorder.start();

    return new Promise<{stream: MediaStream, url: string}>((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = (event) => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        resolve({stream: mediaStream, url: URL.createObjectURL(blob)});
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('Error al grabar video'));
      };

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    });
  }
  async recordAudio(): Promise<{ stream: MediaStream, url: string }> {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(mediaStream);
    const chunks: any[] = [];

    mediaRecorder.start();

    return new Promise<{ stream: MediaStream, url: string }>((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = (event) => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        resolve({ stream: mediaStream, url: URL.createObjectURL(blob) });
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('Error al grabar audio'));
      };

      // Definir la duración de la grabación de audio (en este caso, 5 segundos)
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    });
  }
  async saveEmergency(emergencyData: any): Promise<void> {
    const emergencyCollection = this.afs.collection<any>('emergencies');
    const result = await emergencyCollection.add(emergencyData);
    console.log(result)
    // You can get the ID of the newly added emergency with result.id if needed
  }
}
