importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const firebaseConfig =  {
  apiKey: "AIzaSyDGu_CoT4XzwaMucIzkroRvIHTgoWMWXOo",
  authDomain: "investly-pwa.firebaseapp.com",
  projectId: "investly-pwa",
  storageBucket: "investly-pwa.firebasestorage.app",
  messagingSenderId: "84557928518",
  appId: "1:84557928518:web:ea1ac957d97211c15a1247",
  measurementId: "G-VQ57MB361V"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Investly Update';
  const notificationOptions = {
    body: payload.notification?.body || 'Check your investments!',
    icon: '/icons/icon-192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
