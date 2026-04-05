import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig =  {
  apiKey: "AIzaSyDGu_CoT4XzwaMucIzkroRvIHTgoWMWXOo",
  authDomain: "investly-pwa.firebaseapp.com",
  projectId: "investly-pwa",
  storageBucket: "investly-pwa.firebasestorage.app",
  messagingSenderId: "84557928518",
  appId: "1:84557928518:web:ea1ac957d97211c15a1247",
  measurementId: "G-VQ57MB361V"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FCM_VAPID_KEY });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (err) { console.error(err); }
  return null;
};

export const onForegroundMessage = (callback) => onMessage(messaging, callback);
