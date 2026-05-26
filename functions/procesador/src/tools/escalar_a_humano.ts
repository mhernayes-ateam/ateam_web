import type { ToolResult, ProcessorContext } from '../../../../shared/types';
import * as chatwoot from '../chatwoot';
import * as sql from '../sql';

/**
 * escalar_a_humano
 * Transfiere la conversación a un agente humano en Chatwoot.
 * Agrega nota privada con el motivo y notifica al equipo.
 */
export async function escalarAHumano(
  input: { motivo: string },
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    const convId = ctx.consumidor_cliente.chatwoot_conv_id;

    if (!convId) {
      return {
        success: false,
        error: 'No hay conversation_id de Chatwoot para escalar.',
      };
    }

    // 1. Escalar en Chatwoot (nota privada + quitar asignación)
    await chatwoot.assignToHuman({
      convId,
      motivo: input.motivo,
    });

    // 2. Actualizar estado en Cloud SQL
    await sql.updateEstadoCobranza(
      ctx.consumidor.id,
      ctx.cliente.id,
      'escalado'
    );

    // 3. Notificar al equipo
    if (ctx.cliente.whatsapp_notif) {
      await chatwoot.notifyTeam({
        whatsapp_notif: ctx.cliente.whatsapp_notif,
        message: `⚠️ Axel escaló a humano\n👤 ${ctx.consumidor.nombre} ${ctx.consumidor.apellido} (${ctx.consumidor.whatsapp})\n📋 Motivo: ${input.motivo}\n🔗 Chatwoot conv: ${convId}`,
      });
    }

    console.log(`👤 Escalado a humano: ${ctx.consumidor.whatsapp} — ${input.motivo}`);

    return {
      success: true,
      data: {
        escalado: true,
        conv_id: convId,
        motivo: input.motivo,
        instruccion_para_claude:
          `La conversación fue escalada al equipo humano. Despedite amablemente del consumidor y explicale que un agente se va a comunicar pronto.`,
      },
    };
  } catch (error) {
    console.error('❌ escalar_a_humano error:', error);
    return { success: false, error: `Error escalando a humano: ${error}` };
  }
}
