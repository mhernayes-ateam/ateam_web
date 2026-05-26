import { Firestore } from '@google-cloud/firestore';
import type { ConversationState, ConversationMessage } from '../../../shared/types';

const db = new Firestore();
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

// ── HISTORIAL DE CONVERSACIÓN ────────────────────────────────

export async function getConversation(convId: string): Promise<ConversationState | null> {
  const doc = await db.doc(`conversations/${convId}`).get();
  if (!doc.exists) return null;
  return doc.data() as ConversationState;
}

export async function saveConversation(state: Partial<ConversationState> & { conv_id: string }): Promise<void> {
  const ref = db.doc(`conversations/${state.conv_id}`);
  await ref.set(
    { ...state, updated_at: new Date() },
    { merge: true }
  );
}

export async function appendMessage(convId: string, message: ConversationMessage): Promise<void> {
  const ref = db.doc(`conversations/${convId}`);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const current = doc.exists ? (doc.data() as ConversationState) : null;
    const messages = current?.messages ?? [];
    tx.set(ref, {
      messages: [...messages, message],
      updated_at: new Date(),
    }, { merge: true });
  });
}

// ── LOCKS DE CONVERSACIÓN ─────────────────────────────────────

/**
 * Intenta adquirir el lock de procesamiento para una conversación.
 * Si el lock está tomado pero expiró (>5min), lo libera automáticamente.
 * @returns true si adquirió el lock, false si ya está tomado
 */
export async function acquireLock(convId: string): Promise<boolean> {
  const ref = db.doc(`conversations/${convId}`);

  return await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.exists ? (doc.data() as ConversationState) : null;

    if (data?.processing) {
      // Verificar si el lock expiró (crash recovery)
      const lockAge = Date.now() - (data.processing_since?.getTime?.() ?? 0);
      if (lockAge < LOCK_TIMEOUT_MS) {
        console.warn(`⚠️  Conversación ${convId} ya está siendo procesada`);
        return false;
      }
      console.warn(`⚠️  Lock expirado (${Math.round(lockAge / 1000)}s) para ${convId} — liberando`);
    }

    tx.set(ref, {
      processing: true,
      processing_since: new Date(),
      updated_at: new Date(),
    }, { merge: true });

    return true;
  });
}

/**
 * Libera el lock de procesamiento.
 */
export async function releaseLock(convId: string): Promise<void> {
  const ref = db.doc(`conversations/${convId}`);
  await ref.set({
    processing: false,
    processing_since: null,
    updated_at: new Date(),
  }, { merge: true });
}

// ── IDEMPOTENCY ───────────────────────────────────────────────

export async function isMessageProcessed(messageId: string): Promise<boolean> {
  const doc = await db.doc(`processed_messages/${messageId}`).get();
  return doc.exists;
}

export async function markMessageProcessed(messageId: string, convId: string): Promise<void> {
  await db.doc(`processed_messages/${messageId}`).set({
    message_id: messageId,
    conv_id: convId,
    processed_at: new Date(),
  });
}
