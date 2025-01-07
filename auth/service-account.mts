import fbAdmin, { ServiceAccount } from "firebase-admin";
import { initializeFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { resolve } from "path";

export async function authenticateFirestore(
  serviceAccountPath: string,
  dbId?: string
) {
  const { default: serviceAccount } = await import(
    resolve(serviceAccountPath),
    {
      assert: { type: "json" },
    }
  );
  const app = initializeApp({
    credential: fbAdmin.credential.cert(serviceAccount as ServiceAccount),
  });
  // TOD0: remove "staging" in production
  return initializeFirestore(app, {}, dbId);
}
