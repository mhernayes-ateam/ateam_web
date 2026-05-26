import { Pool } from 'pg';
import type {
  Cliente,
  CuentaRecaudadora,
  Consumidor,
  ConsumidorCliente,
  Factura,
  EstadoCobranza,
} from './shared_types';

// Pool de conexiones — Cloud Run escala y abre instancias paralelas.
// pg-pool limita las conexiones para no saturar Cloud SQL.
const pool = new Pool({
  host: process.env.DB_HOST!,       // IP privada de Cloud SQL o socket
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  max: 5,                           // máximo 5 conexiones por instancia de Cloud Run
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// ── CLIENTES ──────────────────────────────────────────────────

export async function getClienteByInboxId(inboxId: string): Promise<Cliente | null> {
  const result = await pool.query<Cliente>(
    'SELECT * FROM clientes WHERE chatwoot_inbox_id = $1 AND activo = true LIMIT 1',
    [inboxId]
  );
  return result.rows[0] ?? null;
}

export async function getClienteById(clienteId: string): Promise<Cliente | null> {
  const result = await pool.query<Cliente>(
    'SELECT * FROM clientes WHERE id = $1',
    [clienteId]
  );
  return result.rows[0] ?? null;
}

// ── CUENTAS RECAUDADORAS ──────────────────────────────────────

export async function getCuentaRecaudadora(clienteId: string): Promise<CuentaRecaudadora | null> {
  const result = await pool.query<CuentaRecaudadora>(
    'SELECT * FROM cuentas_recaudadoras WHERE cliente_id = $1 AND activa = true LIMIT 1',
    [clienteId]
  );
  return result.rows[0] ?? null;
}

// ── CONSUMIDORES ──────────────────────────────────────────────

export async function getConsumidorByWhatsApp(whatsapp: string): Promise<Consumidor | null> {
  const result = await pool.query<Consumidor>(
    'SELECT * FROM consumidores WHERE whatsapp = $1 LIMIT 1',
    [whatsapp]
  );
  return result.rows[0] ?? null;
}

export async function getConsumidorCliente(
  consumidorId: string,
  clienteId: string
): Promise<ConsumidorCliente | null> {
  const result = await pool.query<ConsumidorCliente>(
    'SELECT * FROM consumidores_clientes WHERE consumidor_id = $1 AND cliente_id = $2 LIMIT 1',
    [consumidorId, clienteId]
  );
  return result.rows[0] ?? null;
}

export async function updateEstadoCobranza(
  consumidorId: string,
  clienteId: string,
  estado: EstadoCobranza,
  tag?: string
): Promise<void> {
  await pool.query(
    `UPDATE consumidores_clientes
     SET estado_cobranza = $3,
         tag = COALESCE($4, tag),
         intentos_contacto = intentos_contacto + 1,
         ultimo_contacto_at = NOW(),
         updated_at = NOW()
     WHERE consumidor_id = $1 AND cliente_id = $2`,
    [consumidorId, clienteId, estado, tag ?? null]
  );
}

export async function updateChatwootConvId(
  consumidorId: string,
  clienteId: string,
  chatwootConvId: string
): Promise<void> {
  await pool.query(
    `UPDATE consumidores_clientes
     SET chatwoot_conv_id = $3, updated_at = NOW()
     WHERE consumidor_id = $1 AND cliente_id = $2`,
    [consumidorId, clienteId, chatwootConvId]
  );
}

// ── FACTURAS ──────────────────────────────────────────────────

export async function getFacturaPendiente(
  consumidorId: string,
  clienteId: string
): Promise<Factura | null> {
  const result = await pool.query<Factura>(
    `SELECT * FROM facturas
     WHERE consumidor_id = $1 AND cliente_id = $2 AND estado = 'pendiente'
     ORDER BY fecha_vencimiento ASC
     LIMIT 1`,
    [consumidorId, clienteId]
  );
  return result.rows[0] ?? null;
}

export async function marcarFacturaPagada(facturaId: string): Promise<void> {
  await pool.query(
    `UPDATE facturas SET estado = 'pagada', updated_at = NOW() WHERE id = $1`,
    [facturaId]
  );
}

// ── PAGOS ─────────────────────────────────────────────────────

export async function registrarPago(params: {
  facturaId: string;
  clienteId: string;
  consumidorId: string;
  monto: number;
  comprobantePath?: string;
  nroOperacion?: string;
  bancoOrigen?: string;
  fechaTransferencia?: Date;
  validadoPor: 'axel' | 'humano';
}): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO pagos (
      factura_id, cliente_id, consumidor_id, monto,
      comprobante_path, nro_operacion, banco_origen, fecha_transferencia,
      estado, validado_por
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'validado', $9)
    RETURNING id`,
    [
      params.facturaId,
      params.clienteId,
      params.consumidorId,
      params.monto,
      params.comprobantePath ?? null,
      params.nroOperacion ?? null,
      params.bancoOrigen ?? null,
      params.fechaTransferencia ?? null,
      params.validadoPor,
    ]
  );
  return result.rows[0].id;
}

export async function actualizarReciboPago(pagoId: string, reciboPdf: string): Promise<void> {
  await pool.query(
    `UPDATE pagos SET recibo_path = $2, recibo_enviado_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [pagoId, reciboPdf]
  );
}

// ── PROMESAS ──────────────────────────────────────────────────

export async function registrarPromesa(params: {
  consumidorId: string;
  clienteId: string;
  facturaId?: string;
  fechaPrometida: Date;
  montoPrometido: number;
  fraseOriginal: string;
  firestorePromiseId?: string;
}): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO promesas (
      consumidor_id, cliente_id, factura_id,
      fecha_prometida, monto_prometido, frase_original,
      estado, firestore_promise_id
    ) VALUES ($1, $2, $3, $4, $5, $6, 'activa', $7)
    RETURNING id`,
    [
      params.consumidorId,
      params.clienteId,
      params.facturaId ?? null,
      params.fechaPrometida,
      params.montoPrometido,
      params.fraseOriginal,
      params.firestorePromiseId ?? null,
    ]
  );
  return result.rows[0].id;
}

export async function marcarPromesaRota(promesaId: string): Promise<void> {
  await pool.query(
    `UPDATE promesas SET estado = 'rota', updated_at = NOW() WHERE id = $1`,
    [promesaId]
  );
}

// ── CONVENIENCE: contexto completo por WhatsApp ───────────────

/**
 * Devuelve todo el contexto necesario para el procesador en un solo query:
 * cliente, consumidor_cliente y cuenta_recaudadora.
 * Toma el primer cliente activo relacionado al consumidor.
 */
export async function getConsumidorPorWhatsapp(whatsapp: string): Promise<{
  cliente: Cliente;
  consumidor_cliente: ConsumidorCliente;
  cuenta_recaudadora: CuentaRecaudadora | null;
} | null> {
  const result = await pool.query(
    `SELECT
       cl.*,
       cc.id AS cc_id,
       cc.estado_cobranza,
       cc.tag,
       cc.intentos_contacto,
       cc.ultimo_contacto_at,
       cc.chatwoot_conv_id,
       cc.notas_internas,
       cc.created_at AS cc_created_at,
       cc.updated_at AS cc_updated_at,
       cr.id AS cr_id,
       cr.cvu,
       cr.alias,
       cr.banco,
       cr.titular,
       cr.cuit_titular,
       cr.activa AS cr_activa
     FROM consumidores co
     JOIN consumidores_clientes cc ON cc.consumidor_id = co.id
     JOIN clientes cl ON cl.id = cc.cliente_id AND cl.activo = true
     LEFT JOIN cuentas_recaudadoras cr ON cr.cliente_id = cl.id AND cr.activa = true
     WHERE co.whatsapp = $1
     LIMIT 1`,
    [whatsapp]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];

  const cliente: Cliente = {
    id: row.id,
    razon_social: row.razon_social,
    cuit: row.cuit,
    email_admin: row.email_admin,
    telefono: row.telefono,
    arca_cert_path: row.arca_cert_path,
    arca_clave_path: row.arca_clave_path,
    condicion_iva: row.condicion_iva,
    config_cadencia: row.config_cadencia,
    whatsapp_notif: row.whatsapp_notif,
    chatwoot_inbox_id: row.chatwoot_inbox_id,
    activo: row.activo,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  const consumidor_cliente: ConsumidorCliente = {
    id: row.cc_id,
    consumidor_id: row.consumidor_id ?? '',
    cliente_id: row.id,
    estado_cobranza: row.estado_cobranza,
    tag: row.tag,
    intentos_contacto: row.intentos_contacto,
    ultimo_contacto_at: row.ultimo_contacto_at,
    chatwoot_conv_id: row.chatwoot_conv_id,
    notas_internas: row.notas_internas,
    created_at: row.cc_created_at,
    updated_at: row.cc_updated_at,
  };

  const cuenta_recaudadora: CuentaRecaudadora | null = row.cr_id ? {
    id: row.cr_id,
    cliente_id: row.id,
    cvu: row.cvu,
    alias: row.alias,
    banco: row.banco,
    titular: row.titular,
    cuit_titular: row.cuit_titular,
    activa: row.cr_activa,
    created_at: row.created_at,
  } : null;

  return { cliente, consumidor_cliente, cuenta_recaudadora };
}
