-- ============================================================
-- Axel · A Team — Seeds de prueba v1.0
-- Para ambiente demo
-- ============================================================

-- ── CLIENTE DE DEMO (Bull Forward S.R.L.) ────────────────────

INSERT INTO clientes (
  id,
  razon_social,
  cuit,
  email_admin,
  telefono,
  condicion_iva,
  config_cadencia,
  whatsapp_notif,
  activo
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Bull Forward S.R.L.',
  '30-12345678-9',
  'admin@bullforward.com.ar',
  '+5491100000000',
  'RI',
  '{"msg1_horas":0.017,"msg2_horas":0.033,"msg3_horas":0.05}', -- demo: en minutos
  '+5491100000000',
  true
);

-- ── CUENTA RECAUDADORA DEL CLIENTE DEMO ──────────────────────

INSERT INTO cuentas_recaudadoras (
  id,
  cliente_id,
  cvu,
  alias,
  banco,
  titular,
  cuit_titular,
  activa
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '0000003100012345678901',
  'bullforward.cobros',
  'Mercado Pago',
  'Bull Forward S.R.L.',
  '30-12345678-9',
  true
);

-- ── CONSUMIDOR DE PRUEBA ──────────────────────────────────────
-- Reemplazá el WhatsApp con un número real para probar

INSERT INTO consumidores (
  id,
  nombre,
  apellido,
  email,
  whatsapp
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Test',
  'Consumidor',
  'test@test.com',
  '+5491100000001'  -- <-- cambiar por número real de prueba
);

-- ── RELACIÓN CONSUMIDOR ↔ CLIENTE ─────────────────────────────

INSERT INTO consumidores_clientes (
  id,
  consumidor_id,
  cliente_id,
  estado_cobranza
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'pendiente_contacto'
);

-- ── FACTURA DE PRUEBA ─────────────────────────────────────────

INSERT INTO facturas (
  id,
  cliente_id,
  consumidor_id,
  concepto,
  monto_total,
  tiene_cuotas,
  fecha_emision,
  fecha_vencimiento,
  estado
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'Servicio de asesoría financiera — Demo',
  15000.00,
  false,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'pendiente'
);
