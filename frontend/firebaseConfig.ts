import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAV61bOArvFYHeB943NTB7yaY0SFuYQK3U",
  authDomain: "sahayaassistency.firebaseapp.com",
  projectId: "sahayaassistency",
  storageBucket: "sahayaassistency.firebasestorage.app",
  messagingSenderId: "531591498411",
  appId: "1:531591498411:web:c4b83eea2d511c3b4185ee",
  measurementId: "G-L1SD9F70B3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
