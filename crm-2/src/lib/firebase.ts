import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

export interface UploadProgress {
  progress: number;
  state: "running" | "paused" | "success" | "canceled" | "error";
}

export interface UploadResult {
  downloadURL: string;
  storagePath: string;
}

export function deleteMachineImage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  return import("firebase/storage").then(({ deleteObject }) => deleteObject(storageRef));
}

export async function uploadMachineImage(
  machineId: number,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `machines/${machineId}/images/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          progress,
          state: snapshot.state as UploadProgress["state"],
        });
      },
      (error) => {
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.({ progress: 100, state: "success" });
          resolve({ downloadURL, storagePath });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Unknown error";
          reject(new Error(`Failed to get download URL: ${message}`));
        }
      }
    );
  });
}

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

export async function initFirebaseAnalytics() {
  const supported = await isSupported();
  if (supported) {
    analyticsInstance = getAnalytics(app);
  }
  return analyticsInstance;
}

export function getFirebaseAnalytics() {
  return analyticsInstance;
}
