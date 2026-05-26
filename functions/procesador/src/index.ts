import express, { Request, Response } from 'express';
import * as firestoreOps from './firestore';
import * as sql from './sql';
import * as chatwoot from './chatwoot';
import { runToolUseLoop } from './claude';
import type { TaskPayload, ProcessorContext } from '../../../shared/types';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const AMBIENTE = process.env.AMBIENTE || 'demo';

// ── HEALTH CHECK ──────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ambiente: AMBIENTE, timestamp: new Date().toISOString() });
});

// ── ENDPOINT PRINCIPAL (llamado por Cloud Tasks) ──────────────

app.post('/process', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const payload = req.body as TaskPayload;
  const { conv_id, consumidor_whatsapp } = payload;

  console.log(`⚡ Procesando: conv=${conv_id} whatsapp=${consumidor_whatsapp}`);

  // Responder 200 rápido para que Cloud Tasks no reintente por timeout
  res.sendStatus(200);

  try {
    await processConversation(payload);
    console.log(`✅ Conversación procesada en ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error(`❌ Error procesando conversación ${conv_id}:`, error);
    // Cloud Tasks va a reintentar automáticamente con backoff exponencial
    // Nos aseguramos de liberar el lock si falló
    try {
      await firestoreOps.releaseLock(conv_id);
    } catch (lockError) {
      console.error('❌ Error liberando lock:', lockError);
    }
  }
});

// ── LÓGICA PRINCIPAL ──────────────────────────────────────────

async function processConversation(payload: TaskPayload): Promise<void> {
  const { conv_id, consumidor_whatsapp, message_id } = payload;

  // 1. Adquirir lock de conversación (evita procesamiento paralelo)
  const lockAcquired = await firestoreOps.acquireLock(conv_id);
  if (!lockAcquired) {
    console.warn(`⚠️  Lock no adquirido para ${conv_id} — skipping`);
    return;
  }

  try {
    // 2. Buscar el consumidor en Cloud SQL por su número de WhatsApp
    const consumidor = await sql.getConsumidorByWhatsApp(consumidor_whatsapp);
    if (!consumidor) {
      console.warn(`⚠️  Consumidor no encontrado: ${consumidor_whatsapp}`);
      await firestoreOps.releaseLock(conv_id);
      return;
    }

    // 3. Buscar el cliente (tenant) — obtenemos el primer cliente activo de este consumidor
    //    En multi-tenant real, el cliente_id viene del inbox_id del webhook
    //    Por ahora lo resolvemos desde la relación del consumidor
    const consumidorClientes = await sql.getConsumidorPorWhatsapp(consumidor_whatsapp);
    if (!consumidorClientes) {
      console.warn(`⚠️  No hay relación consumidor-cliente para: ${consumidor_whatsapp}`);
      await firestoreOps.releaseLock(conv_id);
      return;
    }

    const { cliente, consumidor_cliente, cuenta_recaudadora } = consumidorClientes;
    const factura = await sql.getFacturaPendiente(consumidor.id, cliente.id);

    // 4. Construir el contexto del procesador
    const ctx: ProcessorContext = {
      conv_id,
      cliente,
      consumidor,
      consumidor_cliente,
      factura: factura ?? undefined,
      cuenta_recaudadora: cuenta_recaudadora ?? undefined,
      whatsapp: consumidor_whatsapp,
      chatwoot_inbox_id: cliente.chatwoot_inbox_id ?? '',
    };

    // 5. Recuperar historial de conversación de Firestore
    const conversation = await firestoreOps.getConversation(conv_id);
    const history = conversation?.messages ?? [];

    // 6. Obtener el mensaje actual (el que disparó el webhook)
    //    En este punto el mensaje ya está en Chatwoot — lo recuperamos de ahí
    const newUserMessage = await getLatestMessageFromChatwoot(
      consumidor_cliente.chatwoot_conv_id ?? '',
      message_id
    );

    if (!newUserMessage) {
      console.warn(`⚠️  No se encontró el mensaje ${message_id} en Chatwoot`);
      await firestoreOps.releaseLock(conv_id);
      return;
    }

    // 7. Actualizar estado a "en_conversacion"
    await sql.updateEstadoCobranza(consumidor.id, cliente.id, 'en_conversacion');

    // 8. ¡TOOL USE LOOP!
    const { response, updatedHistory } = await runToolUseLoop({
      history,
      newUserMessage,
      ctx,
    });

    // 9. Guardar historial actualizado en Firestore
    await firestoreOps.saveConversation({
      conv_id,
      cliente_id: cliente.id,
      consumidor_id: consumidor.id,
      whatsapp: consumidor_whatsapp,
      messages: updatedHistory,
      processing: false,
      updated_at: new Date(),
    });

    // 10. Enviar la respuesta de Axel a Chatwoot (que la publica en WhatsApp)
    if (response && consumidor_cliente.chatwoot_conv_id) {
      await chatwoot.sendMessage({
        inboxId: cliente.chatwoot_inbox_id ?? '',
        convId: consumidor_cliente.chatwoot_conv_id,
        message: response,
      });
    }

  } finally {
    // Siempre liberar el lock, incluso si hay error
    await firestoreOps.releaseLock(conv_id);
  }
}

// ── HELPER: obtener mensaje de Chatwoot ───────────────────────

async function getLatestMessageFromChatwoot(
  convId: string,
  _messageId: string
): Promise<string | null> {
  if (!convId) return null;

  const CHATWOOT_URL = process.env.CHATWOOT_URL!;
  const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN!;

  try {
    const res = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/1/conversations/${convId}/messages`,
      { headers: { 'api_access_token': CHATWOOT_TOKEN } }
    );

    if (!res.ok) return null;

    const data = await res.json() as { payload: { content: string; message_type: string }[] };
    const messages = data.payload ?? [];

    // El último mensaje entrante del consumidor
    const lastIncoming = [...messages]
      .reverse()
      .find(m => m.message_type === 'incoming');

    return lastIncoming?.content ?? null;
  } catch (error) {
    console.error('❌ Error obteniendo mensaje de Chatwoot:', error);
    return null;
  }
}

// ── START ─────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Procesador Axel iniciado — puerto ${PORT} — ambiente ${AMBIENTE}`);
});

export default app;
