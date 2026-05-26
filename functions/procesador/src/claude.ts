import Anthropic from '@anthropic-ai/sdk';
import type {
  ClaudeContentBlock,
  ConversationMessage,
  ProcessorContext,
  ToolName,
  ToolResult,
} from '../../../shared/types';
import { getSystemPrompt } from '../../../shared/prompts/axel.system';

// Tools
import { buscarFactura } from './tools/buscar_factura';
import { generarLinkPago } from './tools/generar_link_pago';
import { validarComprobante } from './tools/validar_comprobante';
import { emitirRecibo } from './tools/emitir_recibo';
import { escalarAHumano } from './tools/escalar_a_humano';
import { registrarPromesa } from './tools/registrar_promesa';
import { actualizarEstado, enviarCadencia } from './tools/actualizar_estado';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_TOKENS = 4096;
const MAX_ITERATIONS = 10; // prevención de loops infinitos

// ── DEFINICIÓN DE TOOLS PARA CLAUDE ──────────────────────────

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'buscar_factura',
    description: 'Busca la factura pendiente del consumidor. Llamala cuando necesités saber el monto exacto, la fecha de vencimiento o el estado de la deuda.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'generar_link_pago',
    description: 'Genera el link/instrucciones de transferencia con el CVU y alias del cliente y el monto exacto. SIEMPRE incluilo cuando le pedís al consumidor que pague.',
    input_schema: {
      type: 'object',
      properties: {
        monto: {
          type: 'number',
          description: 'Monto a pagar en pesos. Si no se especifica, usa el monto de la factura pendiente.',
        },
      },
      required: [],
    },
  },
  {
    name: 'validar_comprobante',
    description: 'Procesa la imagen del comprobante de pago enviado por el consumidor. Descarga el archivo y lo analiza. Llamala siempre que el consumidor mande una imagen de comprobante.',
    input_schema: {
      type: 'object',
      properties: {
        media_id: {
          type: 'string',
          description: 'ID del media de la imagen en Meta Cloud API.',
        },
        monto_esperado: {
          type: 'number',
          description: 'Monto de la factura pendiente para comparar con el comprobante.',
        },
      },
      required: ['media_id'],
    },
  },
  {
    name: 'emitir_recibo',
    description: 'Emite el recibo de pago y actualiza el estado en el sistema. Llamala SOLO después de confirmar visualmente que el comprobante es válido y el monto coincide.',
    input_schema: {
      type: 'object',
      properties: {
        monto: { type: 'number', description: 'Monto confirmado del pago.' },
        nro_operacion: { type: 'string', description: 'Número de operación/CBU de la transferencia.' },
        banco_origen: { type: 'string', description: 'Banco o billetera desde donde pagaron.' },
        fecha_transferencia: { type: 'string', description: 'Fecha de la transferencia (YYYY-MM-DD).' },
        comprobante_path: { type: 'string', description: 'Path en Cloud Storage del comprobante.' },
      },
      required: ['monto'],
    },
  },
  {
    name: 'escalar_a_humano',
    description: 'Escala la conversación a un agente humano. Usala cuando: hay un reclamo o disputa, el consumidor lo pide explícitamente, hay una situación compleja que no podés resolver, o después del 3er seguimiento sin respuesta.',
    input_schema: {
      type: 'object',
      properties: {
        motivo: {
          type: 'string',
          description: 'Motivo del escalamiento para que el agente humano entienda el contexto.',
        },
      },
      required: ['motivo'],
    },
  },
  {
    name: 'registrar_promesa',
    description: 'Registra una promesa de pago para una fecha futura. Llamala cuando el consumidor se compromete a pagar en una fecha específica.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_prometida: {
          type: 'string',
          description: 'Fecha en que el consumidor prometió pagar (formato YYYY-MM-DD).',
        },
        monto_prometido: {
          type: 'number',
          description: 'Monto prometido. Si no lo especifica, usar el monto de la factura.',
        },
        frase_original: {
          type: 'string',
          description: 'Frase exacta que usó el consumidor para la promesa.',
        },
      },
      required: ['fecha_prometida', 'frase_original'],
    },
  },
  {
    name: 'actualizar_estado',
    description: 'Actualiza el estado de cobranza del consumidor en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: [
            'pendiente_contacto', 'contactado', '2do_seguimiento', '3er_seguimiento',
            'en_conversacion', 'comprobante_recibido', 'pagado', 'escalado',
            'promesa_registrada', 'promesa_rota',
          ],
        },
        tag: { type: 'string', description: 'Tag opcional (ej: promesa_rota, legal).' },
      },
      required: ['estado'],
    },
  },
  {
    name: 'enviar_cadencia',
    description: 'Registra el envío de un mensaje de cadencia automática.',
    input_schema: {
      type: 'object',
      properties: {
        etapa: {
          type: 'string',
          enum: ['1er_contacto', '2do_seguimiento', '3er_seguimiento'],
        },
      },
      required: ['etapa'],
    },
  },
];

// ── EJECUTOR DE TOOLS ─────────────────────────────────────────

async function executeTool(
  name: ToolName,
  input: Record<string, unknown>,
  ctx: ProcessorContext
): Promise<ToolResult> {
  console.log(`🔧 Ejecutando tool: ${name}`, JSON.stringify(input));

  switch (name) {
    case 'buscar_factura':         return buscarFactura(input, ctx);
    case 'generar_link_pago':      return generarLinkPago(input as { monto?: number }, ctx);
    case 'validar_comprobante':    return validarComprobante(input as { media_id: string; monto_esperado?: number }, ctx);
    case 'emitir_recibo':          return emitirRecibo(input as Parameters<typeof emitirRecibo>[0], ctx);
    case 'escalar_a_humano':       return escalarAHumano(input as { motivo: string }, ctx);
    case 'registrar_promesa':      return registrarPromesa(input as Parameters<typeof registrarPromesa>[0], ctx);
    case 'actualizar_estado':      return actualizarEstado(input as Parameters<typeof actualizarEstado>[0], ctx);
    case 'enviar_cadencia':        return enviarCadencia(input as { etapa: '1er_contacto' | '2do_seguimiento' | '3er_seguimiento' }, ctx);
    default:
      return { success: false, error: `Tool desconocida: ${name}` };
  }
}

// ── TOOL USE LOOP ─────────────────────────────────────────────

export async function runToolUseLoop(params: {
  history: ConversationMessage[];
  newUserMessage: string;
  ctx: ProcessorContext;
}): Promise<{ response: string; updatedHistory: ConversationMessage[] }> {
  const { history, newUserMessage, ctx } = params;

  // System prompt con contexto del consumidor
  const systemPrompt = getSystemPrompt({
    razon_social: ctx.cliente.razon_social,
    nombre_consumidor: `${ctx.consumidor.nombre} ${ctx.consumidor.apellido}`,
    concepto_deuda: ctx.factura?.concepto ?? 'deuda pendiente',
    monto: ctx.factura?.monto_total?.toString() ?? '0',
    fecha_vencimiento: ctx.factura?.fecha_vencimiento?.toLocaleDateString('es-AR') ?? 'sin fecha',
  });

  // Construir messages en formato Anthropic
  const messages: Anthropic.MessageParam[] = [
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content as string | Anthropic.ContentBlock[],
    })),
    { role: 'user', content: newUserMessage },
  ];

  const updatedHistory: ConversationMessage[] = [
    ...history,
    { role: 'user', content: newUserMessage, timestamp: new Date() },
  ];

  let finalResponse = '';
  let iterations = 0;

  // LOOP principal
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`🔄 Iteración ${iterations} del tool use loop`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: TOOL_DEFINITIONS,
      messages,
    });

    console.log(`📊 Claude stop_reason: ${response.stop_reason}`);

    if (response.stop_reason === 'end_turn') {
      // Claude terminó — extraer el texto de la respuesta
      const textBlock = response.content.find(b => b.type === 'text');
      finalResponse = textBlock ? (textBlock as Anthropic.TextBlock).text : '';

      updatedHistory.push({
        role: 'assistant',
        content: finalResponse,
        timestamp: new Date(),
      });

      break;
    }

    if (response.stop_reason === 'tool_use') {
      // Claude quiere usar tools
      const assistantMessage: Anthropic.MessageParam = {
        role: 'assistant',
        content: response.content,
      };
      messages.push(assistantMessage);

      // Ejecutar todas las tools que Claude solicitó
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const toolName = block.name as ToolName;
        const toolInput = block.input as Record<string, unknown>;

        const result = await executeTool(toolName, toolInput, ctx);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result.success ? result.data : { error: result.error }),
        });

        console.log(`✅ Tool ${toolName}: ${result.success ? 'OK' : 'ERROR'}`);
      }

      // Agregar los resultados de las tools y continuar el loop
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // max_tokens u otro stop_reason inesperado
    console.warn(`⚠️  Stop reason inesperado: ${response.stop_reason}`);
    finalResponse = 'Un momento, estoy procesando tu solicitud.';
    break;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.error('❌ Se alcanzó el límite máximo de iteraciones del tool use loop');
    finalResponse = 'Hubo un problema procesando tu solicitud. Un agente te va a contactar pronto.';
  }

  return { response: finalResponse, updatedHistory };
}
