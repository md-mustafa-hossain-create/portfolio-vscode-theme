import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const PORTFOLIO_OWNER_EMAIL = 'hussainmustafa2001@gmail.com';

export function isVerifiedOwnerUser(user: User | null): boolean {
  return Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === PORTFOLIO_OWNER_EMAIL.toLowerCase()
  );
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInAsPortfolioOwner(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutPortfolioOwner(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

export interface FirestoreContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  source: 'form' | 'terminal';
  read: boolean;
  recipientEmail: string;
  createdAt: string;
}

export async function submitContactMessageToFirestore(input: {
  name: string;
  email: string;
  message: string;
  source: 'form' | 'terminal';
}): Promise<void> {
  // Defensive payload sanitization & boundary truncation matching firebase-blueprint.json
  const cleanName = input.name.trim().slice(0, 100);
  const cleanEmail = input.email.trim().slice(0, 254);
  const cleanMessage = input.message.trim().slice(0, 5000);
  const cleanSource: 'form' | 'terminal' = input.source === 'terminal' ? 'terminal' : 'form';

  if (
    cleanName.length < 1 ||
    cleanEmail.length < 3 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanMessage.length < 1
  ) {
    throw new Error('Please provide a valid name, email address, and message.');
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const path = `messages/${messageId}`;

  try {
    await setDoc(doc(db, 'messages', messageId), {
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      source: cleanSource,
      read: false,
      recipientEmail: PORTFOLIO_OWNER_EMAIL,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleContactMessageReadInFirestore(
  messageId: string,
  nextRead: boolean
): Promise<void> {
  const path = `messages/${messageId}`;
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: Boolean(nextRead),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessageFromFirestore(messageId: string): Promise<void> {
  const path = `messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'messages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToOwnerMessages(
  onMessages: (messages: FirestoreContactMessage[]) => void
): () => void {
  const q = query(
    collection(db, 'messages'),
    where('recipientEmail', '==', PORTFOLIO_OWNER_EMAIL)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreContactMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let createdIso = new Date().toISOString();
        if (data.createdAt instanceof Timestamp) {
          createdIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdIso = data.createdAt;
        }
        return {
          id: docSnap.id,
          name: String(data.name || ''),
          email: String(data.email || ''),
          message: String(data.message || ''),
          source: data.source === 'terminal' ? 'terminal' : 'form',
          read: Boolean(data.read),
          recipientEmail: String(data.recipientEmail || PORTFOLIO_OWNER_EMAIL),
          createdAt: createdIso,
        };
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onMessages(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    }
  );
}
