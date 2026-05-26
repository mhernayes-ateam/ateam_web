import type { ToolResult, ProcessorContext } from '../../../../shared/types';
import * as sql from '../sql';
import type { EstadoCobranza } from '../../../../shared/types';

/**
 * actualizar_estado
 * Actualiza el estado de cobranza del consumidor en Cloud SQL.
 * Claude lo llama cuando hay un cambio significativo de estado.
 */
export async function actualizarEstado(
  input: {
    estado: EstadoCobranza;
    tag?: string;
    notas?: string;
  },
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    await sql.updateEstadoCobranza(
      ctx.consumidor.id,
      ctx.cliente.id,
      input.estado,
      input.tag
    );

    console.log(`📊 Estado actualizado: ${ctx.consumidor.whatsapp} → ${input.estado}`);

    return {
      success: true,
      data: {
        estado_anterior: ctx.consumidor_cliente.estado_cobranza,
        estado_nuevo: input.estado,
        tag: input.tag,
      },
    };
  } catch (error) {
    console.error('❌ actualizar_estado error:', error);
    return { success: false, error: `Error actualizando estado: ${error}` };
  }
}

/**
 * enviar_cadencia
 * Registra que se envió el siguiente mensaje de la cadencia.
 * El mensaje en sí lo envía Claude en el text response.
 */
export async function enviarCadencia(
  input: { etapa: '1er_contacto' | '2do_seguimiento' | '3er_seguimiento' },
  ctx: ProcessorContext
): Promise<ToolResult> {
  const estadoMap: Record<string, EstadoCobranza> = {
    '1er_contacto':    'contactado',
    '2do_seguimiento': '2do_seguimiento',
    '3er_seguimiento': '3er_seguimiento',
  };

  try {
    const nuevoEstado = estadoMap[input.etapa] as EstadoCobranza;
    await sql.updateEstadoCobranza(ctx.consumidor.id, ctx.cliente.id, nuevoEstado);

    console.log(`📤 Cadencia enviada: ${input.etapa} → estado ${nuevoEstado}`);

    return {
      success: true,
      data: {
        etapa: input.etapa,
        estado_actualizado: nuevoEstado,
        instruccion_para_claude:
          `Registrado el envío de ${input.etapa}. Ahora redactá y enviá el mensaje correspondiente a esta etapa de la cadencia.`,
      },
    };
  } catch (error) {
    console.error('❌ enviar_cadencia error:', error);
    return { success: false, error: `Error registrando cadencia: ${error}` };
  }
}
