# KlanList — README completo

> Documento escrito para que una IA (u otro desarrollador) pueda entender el proyecto en su totalidad, reproducirlo, probarlo e instalarlo en un dispositivo Android sin información adicional.

---

## 1. ¿Qué es KlanList?

KlanList es una aplicación móvil nativa para Android que permite a un grupo de personas (familia, compañeros de departamento, etc.) compartir:

- **Chat grupal en tiempo real** — mensajes visibles por todos los miembros del grupo al instante.
- **Listas compartidas en tiempo real** — listas de compras, tareas u otras categorías personalizables. Cualquier miembro puede agregar ítems, tacharlos o eliminarlos y los cambios se reflejan instantáneamente en todos los dispositivos.
- **Gestión del grupo** — cada grupo tiene un código de invitación único (formato `KLAN-XXXX`). Cualquier persona puede crear un grupo nuevo o unirse a uno existente ingresando ese código.

### Características clave

- **Multi-grupo**: múltiples familias o grupos pueden usar la misma app de forma completamente aislada. Los datos de un grupo nunca son visibles para otro.
- **Sin registro**: no hay email ni contraseña. Solo nombre de usuario (guardado localmente) y código de grupo.
- **Primer uso guiado**: al abrir la app por primera vez, un flujo de onboarding de 2 pasos configura todo. Nunca más vuelve a pedirlo.
- **Fondo siempre blanco**: la app ignora el modo oscuro del teléfono. El fondo es siempre blanco.
- **Distribución manual**: el APK se distribuye por WhatsApp, Google Drive u otro medio. No requiere Google Play Store.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework mobile | React Native + Expo | Expo SDK 51 |
| Navegación | React Navigation (Bottom Tabs) | v6 |
| Base de datos / tiempo real | Firebase Firestore | v10 |
| Persistencia local | AsyncStorage | 1.23.1 |
| Iconos | @expo/vector-icons (Ionicons) | v14 |
| Portapapeles | expo-clipboard | v6 |
| Build / distribución | EAS Build (Expo Application Services) | — |
| Lenguaje | JavaScript (ES2020+) | — |
| Plataforma objetivo | Android | — |

---

## 3. Estructura de archivos

```
klanlist/
├── App.js                          # Punto de entrada. Maneja splash, onboarding gate y navegación principal.
├── app.json                        # Configuración de Expo: nombre, ícono, orientación, fondo blanco forzado.
├── babel.config.js                 # Configuración de Babel para Expo.
├── package.json                    # Dependencias del proyecto.
├── firestore.rules                 # Reglas de seguridad de Firestore (pegar en Firebase Console).
├── INSTALACION.md                  # Guía de instalación para el usuario/desarrollador humano.
│
└── src/
    ├── theme.js                    # Tokens de diseño: colores, radios, sombras, paleta de avatares.
    │
    ├── components/
    │   └── Avatar.js               # Componente Avatar: círculo con iniciales, color determinístico por nombre.
    │
    ├── firebase/
    │   └── config.js               # Inicialización de Firebase. El desarrollador pega aquí sus credenciales.
    │
    └── screens/
        ├── OnboardingScreen.js     # Flujo de primer uso: nombre → crear grupo o unirse con código.
        ├── ChatScreen.js           # Pantalla de chat grupal con listener en tiempo real.
        ├── ListsScreen.js          # Pantalla de listas: pestañas, ítems, crear/borrar lista, limpiar tachados.
        └── GroupScreen.js          # Pantalla de info del grupo: código, compartir, miembros, editar nombre.
```

---

## 4. Estructura de datos en Firestore

La base de datos es NoSQL. La jerarquía de colecciones es la siguiente:

```
groups/                              (colección raíz)
└── {groupCode}                      (documento: ej. "KLAN-4X9K")
    ├── name: string                 nombre del grupo (ej. "Familia García")
    ├── code: string                 igual al ID del documento
    ├── createdAt: timestamp
    │
    ├── messages/                    (subcolección)
    │   └── {msgId}
    │       ├── user: string         nombre del autor
    │       ├── text: string         contenido del mensaje
    │       └── createdAt: timestamp
    │
    ├── lists/                       (subcolección)
    │   └── {listId}
    │       ├── name: string         nombre de la lista (ej. "Supermercado")
    │       ├── createdBy: string
    │       ├── createdAt: timestamp
    │       │
    │       └── items/               (sub-subcolección)
    │           └── {itemId}
    │               ├── text: string
    │               ├── done: boolean
    │               ├── by: string   nombre del usuario que lo agregó
    │               └── createdAt: timestamp
    │
    └── members/                     (subcolección)
        └── {memberName}             (el ID del documento ES el nombre)
            ├── name: string
            └── joinedAt: timestamp
```

### Reglas de seguridad

Las reglas son abiertas (sin autenticación), apropiadas para uso familiar privado:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      allow read, write: if true;
      match /messages/{msgId}   { allow read, write: if true; }
      match /lists/{listId} {
        allow read, write: if true;
        match /items/{itemId}   { allow read, write: if true; }
      }
      match /members/{memberId} { allow read, write: if true; }
    }
  }
}
```

---

## 5. Flujo de la aplicación

### 5.1 Primera apertura

```
App.js arranca
    └── Lee AsyncStorage: 'kl_username', 'kl_groupCode', 'kl_groupName'
        ├── Si existen los 3 → ir directamente a la app principal
        └── Si faltan → mostrar OnboardingScreen

OnboardingScreen:
    Paso 1: campo de texto → nombre de usuario (mín. 2 caracteres)
    Paso 2: dos opciones
        ├── "Crear grupo nuevo"
        │       └── campo: nombre del grupo
        │           → genera código aleatorio formato KLAN-XXXX
        │           → crea documento en Firestore: groups/{code}
        │           → crea documento: groups/{code}/members/{username}
        │           → guarda en AsyncStorage los 3 valores
        │           → llama onDone() → App.js actualiza estado → app principal
        │
        └── "Unirme a un grupo"
                └── campo: código (autoUppercase)
                    → getDoc(groups/{code})
                    ├── No existe → Alert "Código incorrecto, reintentá"
                    └── Existe    → crea documento en members
                                  → guarda en AsyncStorage
                                  → llama onDone() → app principal
```

### 5.2 App principal — 3 tabs

**Tab 1 — Chat:**
- `onSnapshot` sobre `groups/{code}/messages` ordenado por `createdAt asc`
- Cada nuevo mensaje dispara re-render inmediato en todos los dispositivos
- Mensajes propios a la derecha (color acento), ajenos a la izquierda (blanco)
- Avatar con iniciales solo aparece cuando cambia el autor

**Tab 2 — Listas:**
- `onSnapshot` sobre `groups/{code}/lists` → renderiza pestañas horizontales
- Al seleccionar una lista: `onSnapshot` sobre `lists/{listId}/items`
- Acciones: crear lista (modal), borrar lista (Alert de confirmación + elimina subcol. items), agregar ítem, tachar ítem (toggle `done`), borrar ítem, limpiar tachados (elimina todos los `done: true`)
- El botón de borrar lista es el ícono `close-circle` a la derecha de cada pestaña
- El botón de borrar ítem es el ícono `trash-outline` al extremo derecho de cada fila

**Tab 3 — Grupo:**
- Muestra nombre del grupo y código en caja destacada
- Botón "Copiar" → `expo-clipboard`
- Botón "Compartir" → `Share.share()` con mensaje preformateado para WhatsApp
- Lista de miembros con `onSnapshot` sobre `groups/{code}/members`
- Editar nombre propio: modal → actualiza AsyncStorage + crea nuevo doc en members

---

## 6. Diseño visual

### Paleta de colores (src/theme.js)

```javascript
bg:          '#FFFFFF'   // fondo principal
bgSoft:      '#F8F7F4'   // fondo secundario (inputs, listas)
surface:     '#FFFFFF'   // tarjetas, burbujas
border:      '#EBEBEB'
borderMd:    '#D4D2CC'
text:        '#181818'
text2:       '#696760'
text3:       '#AAAAA8'   // placeholders, metadatos
accent:      '#4338CA'   // indigo — color principal
accentDark:  '#3730A3'
accentSoft:  '#EEF2FF'   // fondo de badges y botones suaves
red:         '#DC2626'
redSoft:     '#FEF2F2'
green:       '#16A34A'
white:       '#FFFFFF'
```

### Avatares
Color determinístico por nombre: hash simple `h = (h * 31 + charCode) >>> 0`, resultado módulo 8 sobre una paleta de 8 pares `{ bg, fg }`. Mismo nombre → siempre mismo color en cualquier dispositivo.

### Modo oscuro
Desactivado a nivel de Expo en `app.json`:
```json
"userInterfaceStyle": "light"
```
Y a nivel de React Navigation con un tema personalizado que fuerza `background: '#FFFFFF'`.

---

## 7. Requisitos previos para reproducir el proyecto

### En la computadora (Windows)
- **Node.js LTS** — https://nodejs.org
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **VS Code** (recomendado) — https://code.visualstudio.com

### En el celular Android (para probar)
- App **Expo Go** — Google Play Store
- Misma red WiFi que la computadora durante el desarrollo

### Cuenta externa
- **Google account** para Firebase (gratuito)
- **Cuenta en expo.dev** (gratuita) para generar el APK con EAS

---

## 8. Pasos para configurar Firebase (obligatorio antes de correr)

1. Ir a https://console.firebase.google.com
2. **Agregar proyecto** → nombre: `klanlist` → Continuar × 2 → Crear
3. **Firestore Database** → Crear base de datos → **Modo prueba** → Región: `us-east1` → Listo
4. Engranaje ⚙ → **Configuración del proyecto** → **Tus apps** → ícono `</>` (Web)
5. Registrar app con nombre `klanlist-web` → copiar el objeto `firebaseConfig`
6. Abrir `src/firebase/config.js` → reemplazar los 6 campos `"PEGAR-AQUI"` con los valores copiados → guardar
7. En Firebase Console → **Firestore** → pestaña **Reglas** → borrar contenido → pegar `firestore.rules` → **Publicar**

---

## 9. Pasos para correr en modo desarrollo

```bash
# 1. Descomprimir la carpeta del proyecto
# 2. Abrir terminal en la raíz del proyecto

npm install
# Instala todas las dependencias (~2-3 minutos)

npx expo start
# Inicia el servidor de desarrollo y muestra un QR en la terminal
```

3. Abrir **Expo Go** en el celular Android
4. Escanear el QR que aparece en la terminal
5. La app se carga en el celular en ~15 segundos

> **Importante:** la PC y el celular deben estar en la misma red WiFi.
> Si el QR no funciona, presionar `w` en la terminal para abrir en web (solo para verificar errores).

---

## 10. Pasos para generar el APK instalable

```bash
# 1. Iniciar sesión en Expo
eas login
# Ingresá tu usuario y contraseña de expo.dev

# 2. Configurar EAS (genera eas.json)
eas build:configure
# Cuando pregunte la plataforma, elegir: Android

# 3. Generar el APK
eas build --platform android --profile preview
# Tarda ~10 minutos en los servidores de Expo
# Al finalizar muestra un link para descargar el .apk
```

### Instalar el APK en cada celular Android

1. Descargar el `.apk` (por WhatsApp, Google Drive, email, etc.)
2. En el celular: **Ajustes → Seguridad → Instalar apps de fuentes desconocidas → Permitir**
   (en algunos Android: Ajustes → Aplicaciones → menú → Acceso especial → Instalar apps desconocidas)
3. Abrir el archivo `.apk` → **Instalar**
4. Abrir KlanList desde el menú de apps

---

## 11. Flujo de uso para el usuario final

```
1. Instalar el APK
2. Abrir KlanList → pantalla de bienvenida
3. Escribir nombre → Continuar
4. Elegir:
   a) "Crear grupo nuevo" → escribir nombre del grupo → se genera código KLAN-XXXX
      → compartir el código por WhatsApp a los demás miembros
   b) "Unirme a un grupo" → ingresar el código recibido → Unirme
5. App lista — chat y listas disponibles de inmediato
6. Cada miembro instala el APK en su celular y repite desde el paso 2
   usando el mismo código para unirse al mismo grupo
```

---

## 12. Consideraciones para extensiones futuras

| Feature | Complejidad | Notas |
|---|---|---|
| Notificaciones push | Media | Requiere Firebase Cloud Messaging + Expo Notifications |
| Múltiples grupos por usuario | Baja | Guardar array de grupos en AsyncStorage |
| Salir de un grupo | Baja | Borrar doc de members + limpiar AsyncStorage |
| Roles (admin/miembro) | Media | Agregar campo `role` en members |
| Imágenes en el chat | Media | Requiere Firebase Storage |
| Publicar en Google Play | Media | Requiere cuenta de desarrollador ($25 único) + build `production` en EAS |
| Autenticación real | Alta | Migrar a Firebase Auth (email/password o Google) |

---

## 13. Errores comunes y soluciones

| Error | Causa probable | Solución |
|---|---|---|
| `FirebaseError: projectId must be a non-empty string` | No se pegaron las credenciales | Completar `src/firebase/config.js` |
| `Network request failed` al unirse | Sin conexión a internet | Verificar WiFi/datos |
| QR no conecta con Expo Go | PC y celular en distintas redes | Conectar ambos a la misma WiFi |
| App en negro al abrir | Error de JS no capturado | Revisar terminal, usualmente credenciales de Firebase |
| `expo: command not found` | Expo CLI no instalado | `npm install -g expo-cli` |
| `eas: command not found` | EAS CLI no instalado | `npm install -g eas-cli` |

---

*Generado para KlanList v1.0.0 — React Native + Expo SDK 51 + Firebase Firestore*
