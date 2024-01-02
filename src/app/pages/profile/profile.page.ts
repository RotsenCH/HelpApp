import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { EmergencyService } from '../../services/emergency.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;
  pictureUrl!: string;
  mediaRecorder: any;
  chunks: any[] = [];
  pictureTaken = false;
  videoRecorded = false;
  user: any | null = null;
  editUser: any | null = null;
  editing = false;
  videoUrl!: string;
  videoStream!: MediaStream;
  recordingVideo = false;
  countdownValue = 0;
  recordingCountdownValue = 5;
  recording = false;
  successMessage: string | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  locationLink!: string;
  showLocationButton = true;
  showLocationLink = false;
  recordingAudio = false;
  audioRecorded = false;
  audioUrl!: string;
  audioStream!: MediaStream;
  recordingAudioCountdownValue = 3;

  audioData: { url: string; stream: MediaStream | null } = {
    url: '',
    stream: null,
  };

  constructor(
    private toastController: ToastController,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    private emergencyService: EmergencyService,
    private changeDetector: ChangeDetectorRef
  ) {}
  ngOnInit() {
    this.authService.user$.subscribe((user) => (this.user = user));
  }
  async getLocation() {
    try {
      const position = await this.getCurrentPosition();
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;

      if (this.latitude !== null && this.longitude !== null) {
        this.locationLink = `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`;
        console.log('Ubicación:', this.locationLink);
        this.showLocationButton = false; // Oculta el botón después de obtener la ubicación
        this.showLocationLink = true; // Muestra el enlace de la ubicación
      }
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      // Maneja el error aquí, muestra un mensaje al usuario o realiza alguna acción.
    }
    this.changeDetector.detectChanges();
  }

  openLocation() {
    window.open(this.locationLink, '_blank'); // Abre el enlace en una nueva pestaña
  }

  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error)
      );
    });
  }

  async startAudioRecordingCountdown() {
    this.recordingAudio = true; // Iniciar la grabación de audio
    this.audioRecorded = false; // Asegurarse de que el audio no se haya grabado aún

    this.successMessage = `El audio está siendo grabado...`;
    this.changeDetector.detectChanges();

    setTimeout(async () => {
      await this.startAudioRecording();
      this.showLocationButton = true;
    }, this.recordingAudioCountdownValue * 1000);
  }

  async startAudioRecording() {
    try {
      const audioUrl = await this.emergencyService.recordAudio();
      this.audioUrl = audioUrl; // Asigna la URL del audio a this.audioUrl
      console.log('URL del audio:', this.audioUrl); // Verifica la URL del audio
      this.audioRecorded = true;
      this.successMessage = 'Grabación de audio completada';
      this.changeDetector.detectChanges();

      // Detener el micrófono después de obtener el audio
      if (this.audioStream) {
        const tracks = this.audioStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    } catch (error) {
      console.error('Error al iniciar la grabación de audio:', error);
      // Maneja el error aquí
    }
  }

  async toggleAudioRecording() {
    await this.startAudioRecordingCountdown();
  }

  async takePicture() {
    try {
      this.pictureUrl = await this.emergencyService.takePicture();
      console.log(this.pictureUrl);
      this.pictureTaken = true;
      this.successMessage =
        'Foto tomada con éxito, a continuación se grabará un video de 5 segundos';
      this.changeDetector.detectChanges();

      // Detener la cámara después de tomar la foto
      if (this.videoStream) {
        const tracks = this.videoStream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
      // Maneja el error aquí
    }
  }

  async recordVideo() {
    try {
      if (this.pictureTaken) {
        this.countdownValue = 3;
        await this.startRecordingAfterCountdown(); // Comienza a grabar el video
        this.videoRecorded = true;
        this.recording = false;
        this.successMessage = 'Video grabado con éxito';
        this.changeDetector.detectChanges();
      }
    } catch (error) {
      console.error('Error al grabar el video:', error);
      // Maneja el error aquí
    }
  }

  async startRecording() {
    if (this.pictureTaken) {
      this.countdownValue = 3;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      this.videoStream = mediaStream;
      this.videoElement.nativeElement.srcObject = this.videoStream;

      const countdownInterval = setInterval(() => {
        this.countdownValue--;
        if (this.countdownValue === 0) {
          clearInterval(countdownInterval);
          this.startRecordingAfterCountdown();
        }
      }, 1000);
    }
  }

  async startRecordingAfterCountdown() {
    this.recording = true;
    this.successMessage = null;

    const mediaRecorder = new MediaRecorder(this.videoStream);
    const chunks: any[] = [];
    let recordingSeconds = 5;

    mediaRecorder.start();

    const storageRefPath = `videos/${Date.now()}.mp4`;
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = async (event) => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const storageRef = this.emergencyService.getStorageRef(storageRefPath);

      try {
        const videoRef = storageRef.put(blob);
        await videoRef;
        storageRef.getDownloadURL().subscribe(
          (videoUrl: string) => {
            console.log('URL del video en Storage:', videoUrl);
            this.videoUrl = videoUrl;
            this.videoRecorded = true;
            this.recording = false;
            this.successMessage = 'Video grabado con éxito';
            this.changeDetector.detectChanges();

            // Detener la cámara después de la grabación del video
            const tracks = this.videoStream.getTracks();
            tracks.forEach((track) => track.stop());
          },
          (error) => {
            console.error('Error al obtener la URL del video:', error);
          }
        );
      } catch (error) {
        console.error('Error al subir el video:', error);
      }
    };

    const countdownInterval = setInterval(() => {
      recordingSeconds--;
      this.recordingCountdownValue = recordingSeconds;

      if (recordingSeconds === 0) {
        clearInterval(countdownInterval);
        mediaRecorder.stop();
      }
    }, 1000);
    this.changeDetector.detectChanges();
  }

  async emergency() {
    await this.takePicture();
    this.changeDetector.detectChanges();
  }

  toggleEdit() {
    if (this.editing) {
      this.user = this.editUser;
      this.updateProfile();
    } else {
      this.editUser = { ...this.user };
    }
    this.editing = !this.editing;
    this.changeDetector.detectChanges();
  }
  cancelEdit() {
    this.editing = false;
    this.changeDetector.detectChanges();
  }

  async updateImage(event: any) {
    if (this.editing && event) {
      const url = await this.authService.uploadImage(
        event,
        this.user?.uid || ''
      );
      this.editUser.photoURL = url;
    }
  }

  async updateProfile() {
    if (this.editing) {
      if (this.editUser.username) {
        await this.authService.updateUsername(
          this.editUser.username,
          this.user?.uid || ''
        );
      }
      if (this.editUser.photoURL) {
        await this.authService.uploadImage(
          this.editUser.photoURL,
          this.user?.uid || ''
        );
      }
    }
    this.changeDetector.detectChanges();
  }

  async sendEmergency() {
    try {
      console.log('Datos antes de enviar la emergencia:', {
        pictureUrl: this.pictureUrl,
        videoUrl: this.videoUrl,
        audioUrl: this.audioUrl,
        locationLink: this.locationLink,
        userName: this.user?.username,
      });

      if (
        this.pictureUrl &&
        this.videoUrl &&
        this.audioUrl &&
        this.locationLink
      ) {
        const emergencyData = {
          picture: this.pictureUrl,
          video: this.videoUrl,
          audio: this.audioUrl,
          location: this.locationLink,
          timestamp: new Date().toISOString(),
          userName: this.user?.username,
        };

        await this.emergencyService.saveEmergency(emergencyData);

        // Reiniciar el proceso para enviar otra emergencia
        this.pictureUrl = '';
        this.videoUrl = '';
        this.audioUrl = '';
        this.locationLink = '';
        this.pictureTaken = false;
        this.videoRecorded = false;
        this.audioRecorded = false;
        this.showLocationButton = true;
        this.showLocationLink = false;
        this.successMessage = null;

        // Restablecer las variables relacionadas con la grabación de audio
        this.recordingAudio = false; // Esto evita que se muestre el ícono y el mensaje de grabación

        this.changeDetector.detectChanges();
        // Mostrar notificación de éxito
        const toast = await this.toastController.create({
          message: 'Emergencia enviada exitosamente',
          duration: 3000, // Duración de la notificación en milisegundos
          position: 'bottom', // Posición de la notificación (opcional)
        });
        toast.present();
      } else {
        console.error('Faltan datos necesarios para enviar la emergencia');
      }
    } catch (error) {
      console.error('Error al enviar la emergencia:', error);
      // Maneja el error aquí
    }
    this.changeDetector.detectChanges();
  }

  logout() {
    this.chatService.signOut();
    this.router.navigateByUrl('/login');
    this.changeDetector.detectChanges();
  }
}
