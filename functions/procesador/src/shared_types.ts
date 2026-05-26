// ============================================================
// Axel · A Team — Tipos TypeScript compartidos
// ============================================================

// ── ENUMs ────────────────────────────────────────────────────

export type CondicionIva = 'RI' | 'Mono' | 'CF';

export type EstadoCobranza =
  | 'pendiente_contacto'
  | 'contactado'
  | '2do_seguimiento'
  | '3er_seguimiento'
  | 'en_conversacion'
  | 'comprobante_recibido'
  | 'pagado'
  | 'escalado'
  | 'promesa_registrada'
  | 'promesa_rota';

export type EstadoFactura = 'pendiente' | 'pagada' | 'vencida' | 'anulada';
export type EstadoPago = 'pendiente_validacion' | 'validado' | 'rechazado';
export type EstadoPromesa = 'activa' | 'cumplida' | 'rota' | 'cancelada';

// ── ENTIDADES DE NEGOCIO (Cloud SQL) ─────────────────────────

export interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  email_admin: string;
  telefono?: string;
  arca_cert_path?: string;
  arca_clave_path?: string;
  condicion_iva: CondicionIva;
  config_cadencia: ConfigCadencia;
  whatsapp_notif?: string;
  chatwoot_inbox_id?: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConfigCadencia {
  msg1_horas: number;
  msg2_horas: number;
  msg3_horas: number;
}

export interface CuentaRecaudadora {
  id: string;
  cliente_id: string;
  cvu: string;
  alias: string;
  banco: string;
  titular: string;
  cuit_titular: string;
  activa: boolean;
  created_at: Date;
}

export interface Consumidor {
  id: string;
  nombre: string;
  apellido: string;
  cuit?: string;
  condicion_fiscal?: CondicionIva;
  email?: string;
  whatsapp: string;
  chatwoot_contact_id?: string;
  created_at: Date;
}

export interface ConsumidorCliente {
  id: string;
  consumidor_id: string;
  cliente_id: string;
  estado_cobranza: EstadoCobranza;
  tag?: string;
  intentos_contacto: number;
  ultimo_contacto_at?: Date;
  chatwoot_conv_id?: string;
  notas_internas?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Factura {
  id: string;
  cliente_id: string;
  consumidor_id: string;
  concepto: string;
  monto_total: number;
  tiene_cuotas: boolean;
  cuota_actual?: number;
  cuotas_total?: number;
  cae?: string;
  cae_vencimiento?: Date;
  tipo_comprobante?: string;
  pdf_path?: string;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  estado: EstadoFactura;
  created_at: Date;
  updated_at: Date;
}

export interface Pago {
  id: string;
  factura_id: string;
  cliente_id: string;
  consumidor_id: string;
  monto: number;
  comprobante_path?: string;
  nro_operacion?: string;
  banco_origen?: string;
  fecha_transferencia?: Date;
  estado: EstadoPago;
  validado_por?: 'axel' | 'humano';
  motivo_rechazo?: string;
  recibo_path?: string;
  recibo_enviado_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Promesa {
  id: string;
  consumidor_id: string;
  cliente_id: string;
  factura_id?: string;
  fecha_prometida: Date;
  monto_prometido: number;
  frase_original?: string;
  recordatorio_d1_at?: Date;
  recordatorio_dd_at?: Date;
  scheduler_job_id?: string;
  estado: EstadoPromesa;
  firestore_promise_id?: string;
  created_at: Date;
  updated_at: Date;
}

// ── ESTADO DE CONVERSACIÓN (Firestore) ───────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
  timestamp: Date;
}

export interface ConversationState {
  conv_id: string;                    // Chatwoot conversation_id
  cliente_id: string;
  consumidor_id: string;
  whatsapp: string;
  messages: ConversationMessage[];
  processing: boolean;
  processing_since?: Date;
  last_message_id?: string;
  updated_at: Date;
}

export interface PromesaFirestore {
  conv_id: string;
  consumidor_id: string;
  cliente_id: string;
  fecha_prometida: Date;
  monto_prometido: number;
  frase_original: string;
  estado: EstadoPromesa;
  created_at: Date;
}

// ── CLAUDE API ───────────────────────────────────────────────

export type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export type ToolName =
  | 'buscar_factura'
  | 'validar_comprobante'
  | 'emitir_recibo'
  | 'escalar_a_humano'
  | 'enviar_cadencia'
  | 'actualizar_estado'
  | 'generar_link_pago'
  | 'registrar_promesa';

export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ── CONTEXTO DEL PROCESADOR ──────────────────────────────────

export interface ProcessorContext {
  conv_id: string;
  cliente: Cliente;
  consumidor: Consumidor;
  consumidor_cliente: ConsumidorCliente;
  factura?: Factura;
  cuenta_recaudadora?: CuentaRecaudadora;
  whatsapp: string;
  chatwoot_inbox_id: string;
}

// ── WEBHOOK META CLOUD API ───────────────────────────────────

export interface MetaWebhookPayload {
  object: 'whatsapp_business_account';
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  value: MetaWebhookValue;
  field: 'messages';
}

export interface MetaWebhookValue {
  messaging_product: 'whatsapp';
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: Array<{ profile: { name: string }; wa_id: string }>;
  messages?: MetaMessage[];
  statuses?: MetaMessageStatus[];
}

export interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'reaction';
  text?: { body: string };
  image?: { caption?: string; mime_type: string; sha256: string; id: string };
  document?: { caption?: string; filename: string; mime_type: string; sha256: string; id: string };
}

export interface MetaMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

// ── CLOUD TASKS ──────────────────────────────────────────────

export interface TaskPayload {
  conv_id: string;
  message_id: string;
  cliente_id: string;
  consumidor_whatsapp: string;
  timestamp: number;
}
