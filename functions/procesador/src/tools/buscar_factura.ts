import type { ToolResult, ProcessorContext } from '../shared_types';
import * as sql from '../sql';

/**
 * buscar_factura
 * Busca la factura pendiente del consumidor para este cliente.
 * Claude la llama cuando necesita saber el detalle actualizado de la deuda.
 */
export async function buscarFactura(
  _input: Record<string, unknown>,
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    const factura = await sql.getFacturaPendiente(ctx.consumidor.id, ctx.cliente.id);

    if (!factura) {
      return {
        success: true,
        data: { tiene_deuda: false, mensaje: 'No se encontraron facturas pendientes para este consumidor.' },
      };
    }

    const hoy = new Date();
    const vencimiento = new Date(factura.fecha_vencimiento);
    const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      data: {
        tiene_deuda: true,
        factura_id: factura.id,
        concepto: factura.concepto,
        monto: factura.monto_total,
        monto_formateado: `$${factura.monto_total.toLocaleString('es-AR')}`,
        fecha_vencimiento: factura.fecha_vencimiento,
        dias_para_vencer: diasParaVencer,
        vencida: diasParaVencer < 0,
        tiene_cuotas: factura.tiene_cuotas,
        cuota_actual: factura.cuota_actual,
        cuotas_total: factura.cuotas_total,
        estado: factura.estado,
      },
    };
  } catch (error) {
    console.error('❌ buscar_factura error:', error);
    return { success: false, error: `No pude consultar la factura: ${error}` };
  }
}
