import fbAdmin, { ServiceAccount } from "firebase-admin";
import { initializeFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

export async function authenticateFirestore(serviceAccountPath: string) {
  const { default: secretKey } = await import(
    "./secret-key/linkid-app-561d4-firebase-adminsdk-boiy2-a1b3f125aa.json",
    { assert: { type: "json" } }
  );
  const app = initializeApp({
    credential: fbAdmin.credential.cert(secretKey as ServiceAccount),
  });
  return initializeFirestore(app);
}
