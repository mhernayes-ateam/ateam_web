import type { ToolResult, ProcessorContext } from '../shared_types';
import * as sql from '../sql';
import * as chatwoot from '../chatwoot';
import { saveConversation } from '../firestore';

/**
 * registrar_promesa
 * Registra una promesa de pago futura.
 * Guarda el resumen en Cloud SQL para el Dashboard.
 * Guarda el detalle completo en Firestore para Axel.
 * Marca la conversación como snoozed en Chatwoot hasta D-1.
 */
export async function registrarPromesa(
  input: {
    fecha_prometida: string;  // ISO date string, ej: "2025-12-15"
    monto_prometido?: number;
    frase_original: string;   // lo que dijo el consumidor
  },
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    const fechaPrometida = new Date(input.fecha_prometida);
    const hoy = new Date();

    if (isNaN(fechaPrometida.getTime())) {
      return { success: false, error: `Fecha inválida: ${input.fecha_prometida}. Usá formato YYYY-MM-DD.` };
    }

    if (fechaPrometida <= hoy) {
      return { success: false, error: 'La fecha prometida debe ser en el futuro.' };
    }

    const monto = input.monto_prometido ?? ctx.factura?.monto_total ?? 0;

    // 1. Guardar en Firestore (detalle conversacional completo)
    const firestoreId = `promise_${ctx.consumidor.id}_${Date.now()}`;
    await saveConversation({
      conv_id: firestoreId,
      cliente_id: ctx.cliente.id,
      consumidor_id: ctx.consumidor.id,
      whatsapp: ctx.consumidor.whatsapp,
      messages: [],
      processing: false,
      updated_at: new Date(),
    });

    // 2. Guardar resumen en Cloud SQL
    const promesaId = await sql.registrarPromesa({
      consumidorId: ctx.consumidor.id,
      clienteId: ctx.cliente.id,
      facturaId: ctx.factura?.id,
      fechaPrometida,
      montoPrometido: monto,
      fraseOriginal: input.frase_original,
      firestorePromiseId: firestoreId,
    });

    // 3. Actualizar estado de cobranza
    await sql.updateEstadoCobranza(ctx.consumidor.id, ctx.cliente.id, 'promesa_registrada');

    // 4. Snooze en Chatwoot hasta D-1 (el día anterior)
    const convId = ctx.consumidor_cliente.chatwoot_conv_id;
    if (convId) {
      const snoozedUntil = new Date(fechaPrometida);
      snoozedUntil.setDate(snoozedUntil.getDate() - 1); // D-1
      snoozedUntil.setHours(9, 0, 0, 0);                // a las 9am
      await chatwoot.snoozeConversation({ convId, snoozedUntil });
    }

    // 5. TODO: crear Cloud Scheduler job para D-1 y día D

    const fechaFormateada = fechaPrometida.toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    const montoFormateado = `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    console.log(`📅 Promesa registrada: ${promesaId} — ${fechaFormateada}`);

    return {
      success: true,
      data: {
        promesa_id: promesaId,
        fecha_prometida: input.fecha_prometida,
        fecha_formateada: fechaFormateada,
        monto,
        monto_formateado: montoFormateado,
        frase_original: input.frase_original,
        estado: 'promesa_registrada',
        instruccion_para_claude:
          `La promesa fue registrada para el ${fechaFormateada}. Confirmá al consumidor que registraste su compromiso de pagar ${montoFormateado} el ${fechaFormateada}, y que lo vas a contactar el día anterior para recordarle.`,
      },
    };
  } catch (error) {
    console.error('❌ registrar_promesa error:', error);
    return { success: false, error: `Error registrando la promesa: ${error}` };
  }
}
