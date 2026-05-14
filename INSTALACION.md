# KlanList — Guía de instalación
## De cero a app instalada en el celular

---

## PARTE 1 — Configurar Firebase (10 minutos, una sola vez)

### 1. Crear el proyecto
1. Ir a https://console.firebase.google.com e iniciar sesión con tu cuenta Google
2. Clic en **"Agregar proyecto"**
3. Nombre: `klanlist` → Continuar → Continuar → **Crear proyecto**

### 2. Crear la base de datos
1. En el menú izquierdo: **Firestore Database**
2. Clic en **"Crear base de datos"**
3. Elegir **"Iniciar en modo de prueba"** → Siguiente
4. Región: `us-east1` → **Listo**

### 3. Obtener las credenciales
1. Clic en el engranaje ⚙ (arriba a la izquierda) → **Configuración del proyecto**
2. Bajar hasta **"Tus apps"** → clic en el ícono **</>** (Web)
3. Nombre de la app: `klanlist-web` → **Registrar app**
4. Vas a ver un bloque con `firebaseConfig` — **copiar esos valores**

### 4. Pegar las credenciales en el código
- Abrir el archivo `src/firebase/config.js`
- Reemplazar cada `"PEGAR-AQUI"` con los valores copiados
- Guardar el archivo

### 5. Configurar las reglas de seguridad
1. En Firebase Console → **Firestore Database** → pestaña **Reglas**
2. Borrar todo el contenido actual
3. Pegar el contenido del archivo `firestore.rules`
4. Clic en **Publicar**

---

## PARTE 2 — Instalar herramientas en la PC (una sola vez)

### 1. Node.js
- Ir a https://nodejs.org → descargar versión **LTS**
- Instalar con opciones por defecto
- Verificar: abrir PowerShell y escribir `node --version`

### 2. Expo CLI y EAS CLI
En PowerShell:
```
npm install -g expo-cli eas-cli
```

### 3. Expo Go en el celular Android
- Buscar **"Expo Go"** en Google Play Store e instalarla
- Sirve para probar la app mientras desarrollás (sin generar APK)

---

## PARTE 3 — Correr el proyecto por primera vez

1. Descomprimí la carpeta `klanlist` donde quieras (ej: `C:\proyectos\klanlist`)
2. Abrí VS Code → Archivo → Abrir carpeta → elegir `klanlist`
3. En la terminal de VS Code (Ctrl + `):
```
npm install
```
4. Luego:
```
npx expo start
```
5. Aparece un **código QR** en la terminal
6. En el celular: abrir **Expo Go** → escanear el QR
7. La app se carga en el celular ✅

> La PC y el celular tienen que estar en la **misma red WiFi**

---

## PARTE 4 — Generar el APK instalable (versión final)

Cuando estés conforme con la app y quieras el APK para distribuir:

### 1. Crear cuenta en Expo (gratis)
- Ir a https://expo.dev → Sign up

### 2. Iniciar sesión desde la terminal
```
eas login
```

### 3. Configurar el build
```
eas build:configure
```
Cuando pregunte, elegir **Android**. Esto genera un archivo `eas.json`.

### 4. Generar el APK
```
eas build --platform android --profile preview
```
- Tarda ~10 minutos (corre en los servidores de Expo, no en tu PC)
- Al terminar te da un **link para descargar el `.apk`**

### 5. Instalar en cada celular Android
1. Descargar el `.apk` en el celular (por WhatsApp, Drive, o email)
2. En el celular: **Ajustes → Seguridad → Instalar apps desconocidas → Permitir**
3. Abrir el archivo `.apk` → Instalar
4. La app aparece en el menú como cualquier app nativa 📱

---

## Flujo de primer uso para cada miembro de la familia

```
Instalar el APK
      ↓
Escribir tu nombre
      ↓
¿Crear grupo o unirme?
      ├── Crear: escribís el nombre del grupo
      │         → la app genera un código (ej: KLAN-4X9K)
      │         → lo compartís por WhatsApp
      │
      └── Unirme: ingresás el código que te mandaron
      ↓
Listo — ya ves el chat y las listas del grupo
```

---

## Para dar la app a otra familia

Solo tenés que darles el APK (por WhatsApp, Drive, etc.).
Cada familia crea su propio grupo con su propio código.
Sus datos nunca se mezclan con los de otras familias.

---

## Preguntas frecuentes

**¿La app funciona sin internet?**
Muestra los últimos datos guardados. Cuando vuelve la conexión, sincroniza todo automáticamente.

**¿Cuánto cuesta Firebase?**
El plan gratuito (Spark) es más que suficiente para uso familiar o incluso decenas de familias. No se necesita tarjeta de crédito.

**¿Puedo cambiar mi nombre después?**
Sí, desde la pestaña **Grupo** → toca tu nombre → Editar.

**¿Cómo me uno a otro grupo?**
Por ahora hay que borrar los datos de la app (Ajustes del Android → Apps → KlanList → Almacenamiento → Borrar datos) y configurarla de nuevo. Se puede agregar como función en una próxima versión.

**¿Puedo tener la app en más de un celular con el mismo nombre?**
Sí, simplemente ingresás el mismo código de grupo en cada celular.
