import type { ToolResult, ProcessorContext } from '../../../../shared/types';

/**
 * generar_link_pago
 * Genera el link de transferencia con el CVU/alias del cliente y el monto exacto.
 * No persiste nada — se genera on-the-fly en runtime.
 */
export async function generarLinkPago(
  input: { monto?: number },
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    const cuenta = ctx.cuenta_recaudadora;

    if (!cuenta) {
      return {
        success: false,
        error: 'No hay cuenta recaudadora configurada para este cliente.',
      };
    }

    const monto = input.monto ?? ctx.factura?.monto_total;

    if (!monto) {
      return {
        success: false,
        error: 'No se pudo determinar el monto. Asegurate de buscar la factura primero.',
      };
    }

    // Formato del link de pago:
    // Para Mercado Pago / Home Banking: alias + monto
    const montoFormateado = monto.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Link de Mercado Pago (si es MP) o instrucciones de transferencia
    const linkMP = cuenta.banco.toLowerCase().includes('mercado pago')
      ? `https://mpago.la/pay/${cuenta.alias}?amount=${monto}`
      : null;

    return {
      success: true,
      data: {
        cvu: cuenta.cvu,
        alias: cuenta.alias,
        banco: cuenta.banco,
        titular: cuenta.titular,
        monto,
        monto_formateado: `$${montoFormateado}`,
        link_mp: linkMP,
        // Texto listo para pegar en el mensaje de WhatsApp
        instrucciones: linkMP
          ? `💳 Pagá con Mercado Pago:\n${linkMP}\n\nO transferí $${montoFormateado} al alias *${cuenta.alias}* (${cuenta.banco})`
          : `💳 Transferí $${montoFormateado} al:\n*CVU:* ${cuenta.cvu}\n*Alias:* ${cuenta.alias}\n*Titular:* ${cuenta.titular}\n*Banco:* ${cuenta.banco}`,
      },
    };
  } catch (error) {
    console.error('❌ generar_link_pago error:', error);
    return { success: false, error: `Error generando link de pago: ${error}` };
  }
}
