/**
 * Phase 0 Security Verification Specification for firestore.rules
 * Verifies that all 12 "Dirty Dozen" adversarial payloads return PERMISSION_DENIED
 * and only hussainmustafa2001@gmail.com (email_verified: true) can read/manage messages.
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated visitor cannot read any message',
    operation: 'get',
    auth: null,
    path: '/messages/msg_1',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Authenticated non-owner cannot read or list messages',
    operation: 'list',
    auth: { uid: 'user_2', email: 'visitor@example.com', email_verified: true },
    path: '/messages',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Spoofed owner email with email_verified=false is denied',
    operation: 'get',
    auth: { uid: 'spoof_1', email: 'hussainmustafa2001@gmail.com', email_verified: false },
    path: '/messages/msg_1',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field injection on create is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      source: 'form',
      read: false,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: 'SERVER_TIMESTAMP',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Creating a message with read=true is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      source: 'form',
      read: true,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Hijacking recipientEmail on create is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      source: 'form',
      read: false,
      recipientEmail: 'other@example.com',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Forged client timestamp on create is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      source: 'form',
      read: false,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Oversized message (>5000 chars) is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'x'.repeat(5001),
      source: 'form',
      read: false,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Invalid email format on create is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'invalid-email',
      message: 'Hello',
      source: 'form',
      read: false,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Invalid document ID with special characters is rejected',
    operation: 'create',
    auth: null,
    path: '/messages/msg$invalid!',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      source: 'form',
      read: false,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Non-owner cannot delete any message',
    operation: 'delete',
    auth: { uid: 'user_2', email: 'visitor@example.com', email_verified: true },
    path: '/messages/msg_1',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Owner cannot mutate immutable sender message text during update',
    operation: 'update',
    auth: { uid: 'owner_1', email: 'hussainmustafa2001@gmail.com', email_verified: true },
    path: '/messages/msg_1',
    payload: {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Tampered text',
      source: 'form',
      read: true,
      recipientEmail: 'hussainmustafa2001@gmail.com',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
