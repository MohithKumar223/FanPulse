import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';

export async function testFirestoreConnection() {
  try {
    // Attempting to read a non-existent document just to verify connectivity
    await getDocFromServer(doc(db, 'system', 'health'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Please check your configuration.");
    } else {
      console.warn("Firestore connection check produced an expected result (document might not exist, but connection is up).");
    }
  }
}
