import fbAdmin, { ServiceAccount } from "firebase-admin";
import { initializeFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { resolve } from "path";

export async function authenticateFirestore(
  serviceAccountPath: string,
  dbId?: string
) {
  const { default: secretKey } = await import(resolve(serviceAccountPath), {
    assert: { type: "json" },
  });
  const app = initializeApp({
    credential: fbAdmin.credential.cert(secretKey as ServiceAccount),
  });
  return initializeFirestore(app, {}, dbId);
}
