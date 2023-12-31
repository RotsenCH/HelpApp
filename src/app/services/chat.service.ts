import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

export interface User {
  uid?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  currentUser: User | null = null;
  
  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email || '' // Aquí asignamos un valor por defecto si el email es null o undefined
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  async signup({ email, password }: { email: string; password: string }): Promise<any> {
    const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);

    const uid = credential.user?.uid;

    return this.afs.doc(
      `users/${uid}`
    ).set({
      uid,
      email: credential.user?.email,
    });
  }

  signIn({ email, password }: { email: string; password: string }) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  signOut(): Promise<void> {
    return this.afAuth.signOut();
  }
}
