// Chatwoot API wrapper para el procesador de Axel

const CHATWOOT_URL = process.env.CHATWOOT_URL!;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN!;

interface ChatwootMessage {
  content: string;
  message_type: 'outgoing';
  private: boolean;
  content_type?: 'text';
}

// ── ENVIAR MENSAJE ────────────────────────────────────────────

export async function sendMessage(params: {
  inboxId: string;
  convId: string;
  message: string;
  isPrivate?: boolean;
}): Promise<void> {
  const { inboxId, convId, message, isPrivate = false } = params;

  const body: ChatwootMessage = {
    content: message,
    message_type: 'outgoing',
    private: isPrivate,
    content_type: 'text',
  };

  const res = await fetch(
    `${CHATWOOT_URL}/api/v1/accounts/1/conversations/${convId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_TOKEN,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chatwoot sendMessage error ${res.status}: ${err}`);
  }

  console.log(`📤 Mensaje enviado a Chatwoot conv ${convId}`);
}

// ── ESCALAR A HUMANO ──────────────────────────────────────────

export async function assignToHuman(params: {
  convId: string;
  motivo: string;
}): Promise<void> {
  const { convId, motivo } = params;

  // 1. Agregar nota privada con el motivo del escalamiento
  await sendMessage({
    inboxId: '',
    convId,
    message: `🤖 Axel escala a humano\n\nMotivo: ${motivo}`,
    isPrivate: true,
  });

  // 2. Cambiar el estado de la conversación a "open" (sin asignar para que lo tome un agente)
  const res = await fetch(
    `${CHATWOOT_URL}/api/v1/accounts/1/conversations/${convId}/assignments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_TOKEN,
      },
      body: JSON.stringify({ assignee_id: null }),
    }
  );

  if (!res.ok) {
    console.warn(`⚠️  No se pudo reasignar conversación ${convId}:`, await res.text());
  }

  console.log(`👤 Conversación ${convId} escalada a humano — motivo: ${motivo}`);
}

// ── SNOOZE (para promesas de pago) ───────────────────────────

export async function snoozeConversation(params: {
  convId: string;
  snoozedUntil: Date;
}): Promise<void> {
  const { convId, snoozedUntil } = params;

  const res = await fetch(
    `${CHATWOOT_URL}/api/v1/accounts/1/conversations/${convId}/toggle_status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_TOKEN,
      },
      body: JSON.stringify({
        status: 'snoozed',
        snoozed_until: Math.floor(snoozedUntil.getTime() / 1000),
      }),
    }
  );

  if (!res.ok) {
    console.warn(`⚠️  No se pudo snooze conversación ${convId}:`, await res.text());
  }

  console.log(`😴 Conversación ${convId} snoozed hasta ${snoozedUntil.toISOString()}`);
}

// ── NOTIFICAR AL EQUIPO ───────────────────────────────────────

export async function notifyTeam(params: {
  whatsapp_notif: string;
  message: string;
}): Promise<void> {
  // TODO: implementar notificación vía Meta Cloud API al número del equipo
  // Por ahora loguea — en producción esto enviará un WhatsApp al equipo
  console.log(`📣 NOTIFICACIÓN AL EQUIPO (${params.whatsapp_notif}): ${params.message}`);
}
