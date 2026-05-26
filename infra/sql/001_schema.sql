-- ============================================================
-- Axel · A Team — Schema PostgreSQL v1.0
-- Cloud SQL (PostgreSQL 15)
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ── ENUMs ────────────────────────────────────────────────────

CREATE TYPE condicion_iva AS ENUM ('RI', 'Mono', 'CF');

CREATE TYPE estado_cobranza AS ENUM (
  'pendiente_contacto',
  'contactado',
  '2do_seguimiento',
  '3er_seguimiento',
  'en_conversacion',
  'comprobante_recibido',
  'pagado',
  'escalado',
  'promesa_registrada',
  'promesa_rota'
);

CREATE TYPE estado_factura AS ENUM (
  'pendiente',
  'pagada',
  'vencida',
  'anulada'
);

CREATE TYPE estado_pago AS ENUM (
  'pendiente_validacion',
  'validado',
  'rechazado'
);

CREATE TYPE estado_promesa AS ENUM (
  'activa',
  'cumplida',
  'rota',
  'cancelada'
);

-- ── TABLA: clientes ──────────────────────────────────────────
-- Tenant raíz. Cada empresa que contrata A Team es un cliente.
CREATE TABLE clientes (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  razon_social        VARCHAR(200)  NOT NULL,
  cuit                VARCHAR(13)   NOT NULL UNIQUE,
  email_admin         VARCHAR(255)  NOT NULL,
  telefono            VARCHAR(20),

  -- ARCA / fiscal (paths en Cloud Storage)
  arca_cert_path      TEXT,                          -- [cliente_id]/arca/cert.pem
  arca_clave_path     TEXT,                          -- [cliente_id]/arca/clave.key
  condicion_iva       condicion_iva NOT NULL DEFAULT 'RI',

  -- Configuración de Axel
  config_cadencia     JSONB         NOT NULL DEFAULT '{"msg1_horas":1,"msg2_horas":24,"msg3_horas":72}',
  whatsapp_notif      VARCHAR(20),                   -- número interno del equipo
  chatwoot_inbox_id   VARCHAR(50),                   -- inbox_id del cliente en Chatwoot

  -- Estado
  activo              BOOLEAN       NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Empresas que contratan el servicio de cobranza de A Team (tenants).';
COMMENT ON COLUMN clientes.config_cadencia IS 'Ejemplo: {"msg1_horas":1,"msg2_horas":24,"msg3_horas":72}';
COMMENT ON COLUMN clientes.chatwoot_inbox_id IS 'ID del inbox de Chatwoot asignado a este cliente para routing multi-tenant.';

-- ── TABLA: cuentas_recaudadoras ──────────────────────────────
-- CVU/alias bancario por cliente. Los links de pago se generan
-- on-the-fly con estos datos — no hay tabla de links_pago.
CREATE TABLE cuentas_recaudadoras (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID          NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Datos bancarios
  cvu             VARCHAR(22)   NOT NULL UNIQUE,
  alias           VARCHAR(50)   NOT NULL UNIQUE,
  banco           VARCHAR(100)  NOT NULL,
  titular         VARCHAR(200)  NOT NULL,
  cuit_titular    VARCHAR(13)   NOT NULL,

  -- Estado
  activa          BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cuentas_recaudadoras IS 'CVU/alias por cliente. Link de pago generado on-the-fly: CVU + alias + monto.';

CREATE INDEX idx_cuentas_recaudadoras_cliente ON cuentas_recaudadoras(cliente_id);

-- ── TABLA: consumidores ───────────────────────────────────────
-- Identidad global del deudor. Sin estado de cobranza aquí.
-- El estado vive en consumidores_clientes (por relación).
CREATE TABLE consumidores (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  nombre                VARCHAR(200)  NOT NULL,
  apellido              VARCHAR(200)  NOT NULL,
  cuit                  VARCHAR(13),                 -- opcional, requerido para ARCA
  condicion_fiscal      condicion_iva,               -- opcional, para tipo de factura

  -- Contacto
  email                 VARCHAR(255),
  whatsapp              VARCHAR(20)   NOT NULL UNIQUE, -- clave de identificación
  chatwoot_contact_id   VARCHAR(50),                 -- ID del contacto en Chatwoot

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE consumidores IS 'Identidad global del deudor. Estado de cobranza en consumidores_clientes (por relación N:N).';
COMMENT ON COLUMN consumidores.whatsapp IS 'Número único en formato E.164 (ej: +5491123456789). Clave de lookup del procesador.';

CREATE UNIQUE INDEX idx_consumidores_whatsapp ON consumidores(whatsapp);

-- ── TABLA: consumidores_clientes ──────────────────────────────
-- Join table N:N con el estado de cobranza por relación.
-- Un consumidor puede tener "pagado" para cliente A y "escalado" para cliente B.
CREATE TABLE consumidores_clientes (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  consumidor_id       UUID            NOT NULL REFERENCES consumidores(id) ON DELETE CASCADE,
  cliente_id          UUID            NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Estado de cobranza para esta relación específica
  estado_cobranza     estado_cobranza NOT NULL DEFAULT 'pendiente_contacto',
  tag                 VARCHAR(50),                   -- ej: 'promesa_rota', 'legal', 'VIP'

  -- Métricas de contacto
  intentos_contacto   SMALLINT        NOT NULL DEFAULT 0,
  ultimo_contacto_at  TIMESTAMPTZ,

  -- Referencia a Chatwoot
  chatwoot_conv_id    VARCHAR(50),                   -- conversation_id en Chatwoot

  -- Notas
  notas_internas      TEXT,

  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  -- Una sola relación por consumidor+cliente
  UNIQUE (consumidor_id, cliente_id)
);

COMMENT ON TABLE consumidores_clientes IS 'Estado de cobranza por relación N:N. Permite estados independientes por cliente.';

CREATE INDEX idx_cc_consumidor    ON consumidores_clientes(consumidor_id);
CREATE INDEX idx_cc_cliente       ON consumidores_clientes(cliente_id);
CREATE INDEX idx_cc_estado        ON consumidores_clientes(estado_cobranza);
CREATE INDEX idx_cc_tag           ON consumidores_clientes(tag) WHERE tag IS NOT NULL;

-- ── TABLA: facturas ──────────────────────────────────────────
-- Facturas pendientes de cobro. Soporta cuotas.
CREATE TABLE facturas (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID          NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  consumidor_id     UUID          NOT NULL REFERENCES consumidores(id) ON DELETE CASCADE,

  -- Datos de la deuda
  concepto          TEXT          NOT NULL,          -- ej: "Servicio de internet - Agosto 2025"
  monto_total       NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
  tiene_cuotas      BOOLEAN       NOT NULL DEFAULT false,
  cuota_actual      SMALLINT,                        -- null si no tiene cuotas
  cuotas_total      SMALLINT,

  -- Datos fiscales (ARCA)
  cae               VARCHAR(14),                     -- Código de Autorización Electrónica
  cae_vencimiento   DATE,
  tipo_comprobante  VARCHAR(10),                     -- 'B', 'C'
  pdf_path          TEXT,                            -- Cloud Storage path al PDF

  -- Fechas
  fecha_emision     DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE          NOT NULL,

  -- Estado
  estado            estado_factura NOT NULL DEFAULT 'pendiente',

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE facturas IS 'Facturas pendientes. Referencia al PDF fiscal en Cloud Storage.';

CREATE INDEX idx_facturas_cliente     ON facturas(cliente_id);
CREATE INDEX idx_facturas_consumidor  ON facturas(consumidor_id);
CREATE INDEX idx_facturas_estado      ON facturas(estado);
CREATE INDEX idx_facturas_vencimiento ON facturas(fecha_vencimiento) WHERE estado = 'pendiente';

-- ── TABLA: pagos ──────────────────────────────────────────────
-- Pagos procesados. Un pago puede corresponder a una o más facturas.
CREATE TABLE pagos (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id        UUID          NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  cliente_id        UUID          NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  consumidor_id     UUID          NOT NULL REFERENCES consumidores(id) ON DELETE CASCADE,

  -- Monto
  monto             NUMERIC(12,2) NOT NULL CHECK (monto > 0),

  -- Comprobante de transferencia
  comprobante_path  TEXT,                            -- Cloud Storage path
  nro_operacion     VARCHAR(100),                    -- número de CBU/alias de transferencia
  banco_origen      VARCHAR(100),
  fecha_transferencia DATE,

  -- Validación
  estado            estado_pago   NOT NULL DEFAULT 'pendiente_validacion',
  validado_por      VARCHAR(50),                     -- 'axel' | 'humano'
  motivo_rechazo    TEXT,

  -- Recibo emitido
  recibo_path       TEXT,                            -- Cloud Storage path al recibo PDF
  recibo_enviado_at TIMESTAMPTZ,

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pagos IS 'Pagos procesados con referencia al comprobante en Cloud Storage.';

CREATE INDEX idx_pagos_factura   ON pagos(factura_id);
CREATE INDEX idx_pagos_cliente   ON pagos(cliente_id);
CREATE INDEX idx_pagos_consumidor ON pagos(consumidor_id);
CREATE INDEX idx_pagos_estado    ON pagos(estado);

-- ── TABLA: promesas ───────────────────────────────────────────
-- Resumen de promesas de pago para Dashboard y Scheduler.
-- El detalle conversacional completo vive en Firestore.
CREATE TABLE promesas (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  consumidor_id     UUID            NOT NULL REFERENCES consumidores(id) ON DELETE CASCADE,
  cliente_id        UUID            NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  factura_id        UUID            REFERENCES facturas(id) ON DELETE SET NULL,

  -- Datos de la promesa
  fecha_prometida   DATE            NOT NULL,
  monto_prometido   NUMERIC(12,2)   NOT NULL CHECK (monto_prometido > 0),
  frase_original    TEXT,                            -- "te pago el viernes"

  -- Recordatorios programados
  recordatorio_d1_at TIMESTAMPTZ,                   -- cuándo se envió/enviará el recordatorio D-1
  recordatorio_dd_at TIMESTAMPTZ,                   -- cuándo se envió/enviará el mensaje día D
  scheduler_job_id   VARCHAR(200),                  -- Cloud Scheduler job name para cancelar si es necesario

  -- Estado
  estado            estado_promesa  NOT NULL DEFAULT 'activa',

  -- Referencia a la promesa completa en Firestore
  firestore_promise_id VARCHAR(200),

  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promesas IS 'Resumen de promesas de pago para Dashboard. Detalle conversacional completo en Firestore.';

CREATE INDEX idx_promesas_consumidor ON promesas(consumidor_id);
CREATE INDEX idx_promesas_cliente    ON promesas(cliente_id);
CREATE INDEX idx_promesas_estado     ON promesas(estado);
CREATE INDEX idx_promesas_fecha      ON promesas(fecha_prometida) WHERE estado = 'activa';

-- ── TRIGGERS: updated_at automático ──────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_clientes
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_consumidores_clientes
  BEFORE UPDATE ON consumidores_clientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_facturas
  BEFORE UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_pagos
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_promesas
  BEFORE UPDATE ON promesas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
