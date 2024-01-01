import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
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

    const dataUrl = image.dataUrl as string;
    const storageRef = this.storage.ref(`pictures/${Date.now()}.jpeg`);
    const pictureRef = storageRef.putString(dataUrl, 'data_url');

    return new Promise<string>((resolve, reject) => {
      pictureRef.then(() => {
        storageRef.getDownloadURL().subscribe((pictureUrl: string) => {
          resolve(pictureUrl); // Resuelve la URL de la imagen cuando se completa el Observable
        }, (error) => {
          reject(new Error('Error al obtener la URL de la imagen'));
        });
      }).catch((error) => {
        reject(new Error('Error al subir la imagen a Firebase'));
      });
    });
  }
  
  async recordVideo(): Promise<string> {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const mediaRecorder = new MediaRecorder(mediaStream);
    const chunks: any[] = [];
  
    mediaRecorder.start();
  
    return new Promise<string>((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
  
      mediaRecorder.onstop = async (event) => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        console.log('Blob:', blob);
  
        const storageRef = this.storage.ref(`videos/${Date.now()}.mp4`);
        console.log('StorageRef:', storageRef);
  
        try {
          const snapshot = await storageRef.put(blob);
          console.log('Upload successful:', snapshot);
  
          const videoUrl = await storageRef.getDownloadURL().toPromise();
          console.log('Video URL:', videoUrl);
  
          resolve(videoUrl);
        } catch (error) {
          console.error('Error uploading video:', error);
          reject(new Error('Error al subir el video a Firebase'));
        }
      };
  
      mediaRecorder.onerror = (event) => {
        console.error('Error al grabar video:', event);
        reject(new Error('Error al grabar video'));
      };
  
      // Definir la duración de la grabación de video (en este caso, 5 segundos)
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    });
  }
  
  async recordAudio(): Promise<string> {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(mediaStream);
    const chunks: any[] = [];
  
    mediaRecorder.start();
  
    return new Promise<string>((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
  
      mediaRecorder.onstop = async (event) => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        const storageRef = this.storage.ref(`audios/${Date.now()}.mp3`);
        const audioRef = storageRef.put(blob);
  
        await audioRef;
        
        try {
          const audioUrl = await storageRef.getDownloadURL().toPromise();
          resolve(audioUrl); // Resuelve la URL del audio una vez que se completa la operación
        } catch (error) {
          reject(new Error('Error al obtener la URL del audio'));
        }
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
  
  getStorageRef(path: string) {
    return this.storage.ref(path);
  }
  async saveEmergency(emergencyData: any): Promise<void> {
    const emergencyCollection = this.afs.collection<any>('emergencies');
    const result = await emergencyCollection.add(emergencyData);
    console.log(result)
    // You can get the ID of the newly added emergency with result.id if needed
  }
}
