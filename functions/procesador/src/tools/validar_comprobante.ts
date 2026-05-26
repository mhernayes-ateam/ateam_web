import { Storage } from '@google-cloud/storage';
import type { ToolResult, ProcessorContext } from '../shared_types';
import * as sql from '../sql';

const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET!;

/**
 * validar_comprobante
 * Recibe el media_id de Meta, descarga la imagen a Cloud Storage,
 * y Claude la analiza visualmente para extraer los datos del pago.
 * La validación real contra API bancaria es un TODO para MVP posterior.
 */
export async function validarComprobante(
  input: {
    media_id: string;        // ID del media en Meta Cloud API
    monto_esperado?: number; // monto de la factura para comparar
  },
  ctx: ProcessorContext
): Promise<ToolResult> {
  try {
    if (!input.media_id) {
      return { success: false, error: 'Se necesita el media_id de la imagen del comprobante.' };
    }

    // 1. Obtener URL de descarga desde Meta Cloud API
    const mediaUrl = await getMetaMediaUrl(input.media_id);

    // 2. Descargar y subir a Cloud Storage con URL permanente
    const storagePath = `comprobantes/${ctx.cliente.id}/${ctx.consumidor.id}/${Date.now()}.jpg`;
    await downloadAndUploadToGCS(mediaUrl, storagePath);

    const gcsUrl = `gs://${BUCKET}/${storagePath}`;
    console.log(`📎 Comprobante guardado en: ${gcsUrl}`);

    // 3. Claude ya tiene la imagen en el contexto de la conversación (via tool_result).
    //    Aquí retornamos la URL para que Claude haga el análisis visual en el siguiente turno.
    //    En el sistema prompt se indica que Claude debe verificar visualmente el comprobante.

    // 4. MVP: confiamos en el análisis visual de Claude.
    //    TODO: integrar API bancaria real para confirmar acreditación.

    return {
      success: true,
      data: {
        comprobante_guardado: true,
        storage_path: storagePath,
        gcs_url: gcsUrl,
        monto_esperado: input.monto_esperado ?? ctx.factura?.monto_total,
        instruccion_para_claude:
          'Analizá visualmente la imagen del comprobante. Extraé: monto, alias/CVU destino, banco, fecha y número de operación. Verificá que el monto coincida con la deuda y que el alias/CVU destino sea el de A Team. Si todo es correcto, proceder con emitir_recibo.',
      },
    };
  } catch (error) {
    console.error('❌ validar_comprobante error:', error);
    return { success: false, error: `Error procesando el comprobante: ${error}` };
  }
}

async function getMetaMediaUrl(mediaId: string): Promise<string> {
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
  const res = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Meta media API error: ${res.status}`);
  const data = await res.json() as { url: string };
  return data.url;
}

async function downloadAndUploadToGCS(url: string, destPath: string): Promise<void> {
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Error descargando media: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const file = storage.bucket(BUCKET).file(destPath);
  await file.save(Buffer.from(buffer), { contentType: 'image/jpeg' });
}
