import { Injectable } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
@Injectable({
  providedIn: 'root'
})
export class EmergencyService {

  constructor() { }

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
}
