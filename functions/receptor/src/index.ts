import express, { Request, Response } from 'express';
import { Firestore } from '@google-cloud/firestore';
import { CloudTasksClient } from '@google-cloud/tasks';
import type { MetaWebhookPayload, MetaMessage, TaskPayload } from '../../shared/types';

const app = express();
app.use(express.json());

const firestore = new Firestore();
const tasksClient = new CloudTasksClient();

const PORT = process.env.PORT || 8080;
const AMBIENTE = process.env.AMBIENTE || 'demo';
const GCP_PROJECT = process.env.GCP_PROJECT_ID!;
const GCP_REGION = process.env.GCP_REGION || 'us-east1';
const PROCESADOR_URL = process.env.PROCESADOR_URL!;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN!;

// ── HEALTH CHECK ──────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ambiente: AMBIENTE, timestamp: new Date().toISOString() });
});

// ── VERIFICACIÓN DEL WEBHOOK (Meta Cloud API) ─────────────────
// Meta llama a GET para verificar el webhook antes de activarlo

app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('✅ Webhook de Meta verificado correctamente');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️  Verificación de webhook fallida — token incorrecto');
    res.sendStatus(403);
  }
});

// ── RECEPTOR DE WEBHOOKS (Meta Cloud API) ─────────────────────
// Meta llama a POST con cada mensaje nuevo

app.post('/webhook', async (req: Request, res: Response) => {
  // Responder 200 INMEDIATAMENTE — Meta cancela si no responde en 5s
  res.sendStatus(200);

  try {
    const payload = req.body as MetaWebhookPayload;

    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        if (!value.messages?.length) continue; // solo status updates, ignorar

        for (const message of value.messages) {
          await processIncomingMessage(message, entry.id);
        }
      }
    }
  } catch (error) {
    // El 200 ya fue enviado — loguear pero no crashear
    console.error('❌ Error procesando webhook:', error);
  }
});

// ── LÓGICA PRINCIPAL ──────────────────────────────────────────

async function processIncomingMessage(
  message: MetaMessage,
  whatsapp_business_account_id: string
): Promise<void> {
  const messageId = message.id;
  const fromNumber = message.from; // número E.164 del consumidor

  console.log(`📨 Mensaje recibido: ${messageId} de ${fromNumber}`);

  // 1. Verificar idempotency — ¿ya procesamos este mensaje?
  const idempotencyRef = firestore.doc(`processed_messages/${messageId}`);
  const idempotencyDoc = await idempotencyRef.get();

  if (idempotencyDoc.exists) {
    console.log(`⏭️  Mensaje duplicado ignorado: ${messageId}`);
    return;
  }

  // 2. Marcar como procesado (con TTL de 24h via scheduled cleanup)
  await idempotencyRef.set({
    message_id: messageId,
    from: fromNumber,
    processed_at: new Date(),
    ambiente: AMBIENTE,
  });

  // 3. Determinar el conv_id (usamos el número de WhatsApp como clave de conversación)
  const convId = `${whatsapp_business_account_id}_${fromNumber}`;

  // 4. Encolar en Cloud Tasks con la queue dedicada a esta conversación
  await enqueueTask(convId, messageId, fromNumber);

  console.log(`✅ Mensaje ${messageId} encolado para conv ${convId}`);
}

async function enqueueTask(
  convId: string,
  messageId: string,
  fromNumber: string
): Promise<void> {
  const queueName = tasksClient.queuePath(GCP_PROJECT, GCP_REGION, `axel-queue-${AMBIENTE}`);

  const payload: TaskPayload = {
    conv_id: convId,
    message_id: messageId,
    cliente_id: '', // el procesador lo resuelve desde el número de WhatsApp
    consumidor_whatsapp: fromNumber,
    timestamp: Date.now(),
  };

  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: `${PROCESADOR_URL}/process`,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      oidcToken: {
        serviceAccountEmail: process.env.PROCESADOR_SA_EMAIL,
      },
    },
    // Visibility timeout de 30s — si el procesador no responde, reintenta
    scheduleTime: {
      seconds: Math.floor(Date.now() / 1000) + 1,
    },
  };

  await tasksClient.createTask({ parent: queueName, task });
}

// ── START ─────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Receptor Axel iniciado — puerto ${PORT} — ambiente ${AMBIENTE}`);
});

export default app;
