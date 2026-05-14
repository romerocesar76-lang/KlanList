// src/firebase/config.js
//
// ─────────────────────────────────────────────────────
//  PASO ÚNICO DE CONFIGURACIÓN — Solo lo hace el dueño
//  de la app una sola vez. Los usuarios finales no
//  necesitan tocar nada de esto.
// ─────────────────────────────────────────────────────
//
//  1. Ir a https://console.firebase.google.com
//  2. Crear proyecto → nombre: "klanlist"
//  3. Firestore Database → Crear → Modo prueba → us-east1
//  4. Configuración del proyecto (⚙) → Tus apps → </> (Web)
//  5. Registrar app → copiar firebaseConfig → pegarlo abajo
//  6. En Firestore → Reglas → pegar el contenido de firestore.rules
//

import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCqJR7NTjQRw5JlZizt6XHRfHqNQmcBko",
  authDomain: "klanlist.firebaseapp.com",
  databaseURL: "https://klanlist-default-rtdb.firebaseio.com",
  projectId: "klanlist",
  storageBucket: "klanlist.firebasestorage.app",
  messagingSenderId: "214870612749",
  appId: "1:214870612749:web:156c9c2199b78720716e44",
  measurementId: "G-4SSC2TJSEB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
