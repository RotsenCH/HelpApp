import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { EmergencyService } from '../../services/emergency.service';
import { ChangeDetectorRef } from '@angular/core';

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

  //

  recordingAudio = false;
  audioRecorded = false;
  audioUrl!: string;
  audioStream!: MediaStream;
  recordingAudioCountdownValue = 3; // Tiempo para iniciar la grabación

  //

  constructor(
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
  // ... (código existente) ...

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
    const audioData = await this.emergencyService.recordAudio();
    this.audioUrl = audioData.url;
    this.audioRecorded = true;
    this.audioStream = audioData.stream;

    this.successMessage = 'Grabación de audio completada';
    this.changeDetector.detectChanges();
    // Detener el micrófono una vez se ha grabado el audio
    const audioTracks = this.audioStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.stop();
    });
  }

  async toggleAudioRecording() {
    await this.startAudioRecordingCountdown();
  }

  async takePicture() {
    this.pictureUrl = await this.emergencyService.takePicture();
    console.log(this.pictureUrl);
    this.pictureTaken = true;
    this.successMessage =
      'Foto tomada con éxito, a continuación se grabará un video de 5 segundos';
    this.changeDetector.detectChanges();
  }

  async recordVideo() {
    if (this.pictureTaken) {
      this.countdownValue = 3;
      const countdownInterval = setInterval(() => {
        this.countdownValue--;
        if (this.countdownValue === 0) {
          clearInterval(countdownInterval);
          this.startRecording();
        }
      }, 1000);
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

    const countdownInterval = setInterval(() => {
      recordingSeconds--;
      this.recordingCountdownValue = recordingSeconds;

      if (recordingSeconds === 0) {
        clearInterval(countdownInterval);
        mediaRecorder.stop();
      }
    }, 1000);

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = (event) => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      this.videoUrl = URL.createObjectURL(blob);
      this.videoRecorded = true;
      this.recording = false;
      this.successMessage = 'Video grabado con éxito';
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.changeDetector.detectChanges();
    };

    setTimeout(() => {
      mediaRecorder.stop();
    }, 5005);
  }

  async emergency() {
    await this.takePicture();
  }

  toggleEdit() {
    if (this.editing) {
      this.user = this.editUser;
      this.updateProfile();
    } else {
      this.editUser = { ...this.user };
    }
    this.editing = !this.editing;
  }
  cancelEdit() {
    this.editing = false;
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
  }

  logout() {
    this.chatService.signOut();
    this.router.navigateByUrl('/login');
  }
}
