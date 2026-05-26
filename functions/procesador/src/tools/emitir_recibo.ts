import type { ToolResult, ProcessorContext } from '../../../../shared/types';
import * as sql from '../sql';

/**
 * emitir_recibo
 * Registra el pago en Cloud SQL, marca la factura como pagada,
 * y genera un recibo (MVP: texto formateado vía WhatsApp).
 * TODO: generar PDF real y subir a Cloud Storage.
 * TODO: integrar ARCA para factura fiscal.
 */
export async function emitirRecibo(
  input: {
    monto: number;
    nro_operacion?: string;
    banco_origen?: string;
    fecha_transferencia?: string;
    comprobante_path?: string;
  },
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    if (!ctx.factura) {
      return { success: false, error: 'No hay factura activa para emitir el recibo.' };
    }

    // 1. Registrar el pago en Cloud SQL
    const pagoId = await sql.registrarPago({
      facturaId: ctx.factura.id,
      clienteId: ctx.cliente.id,
      consumidorId: ctx.consumidor.id,
      monto: input.monto,
      comprobantePath: input.comprobante_path,
      nroOperacion: input.nro_operacion,
      bancoOrigen: input.banco_origen,
      fechaTransferencia: input.fecha_transferencia ? new Date(input.fecha_transferencia) : undefined,
      validadoPor: 'axel',
    });

    // 2. Marcar la factura como pagada
    await sql.marcarFacturaPagada(ctx.factura.id);

    // 3. Actualizar estado de cobranza
    await sql.updateEstadoCobranza(ctx.consumidor.id, ctx.cliente.id, 'pagado');

    // 4. Generar número de recibo
    const nroRecibo = `REC-${Date.now()}`;
    const fechaEmision = new Date().toLocaleDateString('es-AR');
    const montoFormateado = `$${input.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    // 5. Texto del recibo para enviar por WhatsApp (MVP)
    const reciboTexto = `✅ *RECIBO DE PAGO*
━━━━━━━━━━━━━━━━━━
*${ctx.cliente.razon_social}*

Nro. Recibo: ${nroRecibo}
Fecha: ${fechaEmision}
Consumidor: ${ctx.consumidor.nombre} ${ctx.consumidor.apellido}
Concepto: ${ctx.factura.concepto}
*Monto abonado: ${montoFormateado}*
${input.nro_operacion ? `Operación: ${input.nro_operacion}` : ''}
━━━━━━━━━━━━━━━━━━
¡Gracias por tu pago! 🙏`;

    // TODO: generar PDF y subir a Cloud Storage
    // TODO: integrar ARCA para factura fiscal B/C

    console.log(`✅ Pago registrado: ${pagoId} — Recibo: ${nroRecibo}`);

    return {
      success: true,
      data: {
        pago_id: pagoId,
        nro_recibo: nroRecibo,
        fecha_emision: fechaEmision,
        monto: input.monto,
        monto_formateado: montoFormateado,
        recibo_texto: reciboTexto,
        estado: 'pagado',
        instruccion_para_claude:
          `El pago está registrado. Enviá este recibo al consumidor: "${reciboTexto}"`,
      },
    };
  } catch (error) {
    console.error('❌ emitir_recibo error:', error);
    return { success: false, error: `Error emitiendo el recibo: ${error}` };
  }
}
