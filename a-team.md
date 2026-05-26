**A TEAM**

Site Map & Copy del sitio web

*Primer producto: Anibal — Agente AI de Cobranzas*

Versión 3.0 · Abril 2026

*Integra v1 \+ v2 \+ feedback GPT. Listo para Figma.*

# **Cambios clave respecto a la v1**

Este documento no es una iteración cosmética. Reescribe la home y agrega capas nuevas para moverla de "sitio que explica" a "sitio que vende", sin perder el nivel de detalle técnico-comercial de la v1.

### **Lo que cambia**

* Hero rehecho con más tensión comercial (dolor primero, producto después).

* Nueva calculadora de dolor arriba del fold (dinero flotando, no horas perdidas).

* Nueva sección "Agente vs Software" — posicionamiento anti-CRM.

* Verticalización: sección de industrias en home \+ páginas propias para Centros Educativos y Servicios Profesionales (Fase 1\) \+ preview para Fase 2\.

* Pricing con ROI explícito y anclaje ("se paga con X facturas").

* CTAs reemplazados: de "Agendar demo" a variantes orientadas a valor ("Ver cuánta plata recuperás", "Probar con mis facturas").

* Demo con pre-calificación (facturación, tipo de negocio) para mejorar calidad de leads.

### **Lo que se conserva de v1**

* Estructura de /sobre-nosotros, /anibal, /pricing, /casos, /blog, /demo, /legales.

* Nivel de detalle técnico del producto Anibal (funcionalidades, integraciones, seguridad, FAQ).

* Testimonio de aurent, métricas de casos, tono "argentino pyme" (sin caer en chicana).

### **Decisiones de tono**

Tono: balanceado pero vendedor. Más filo que v1, sin llegar al registro "agresivo argentino" que proponía GPT. Mantiene profesionalismo para clientes grandes (colegios, estudios contables) y compatibilidad con materiales de inversor.

# **1\. Arquitectura del sitio**

Mapa de navegación global. Cada nodo corresponde a una página o sección con URL propia. El menú superior muestra 5 items principales; Casos, Blog y legales viven en el footer y en CTAs contextuales.

### **Árbol de navegación**

A Team (/)  
├── Sobre A Team (/sobre-nosotros)  
├── Producto  
│    └── Anibal — Cobranzas AI (/anibal)  
├── Verticales  
│    ├── Centros Educativos (/verticales/colegios)          ★ Fase 1  
│    ├── Servicios Profesionales (/verticales/servicios)    ★ Fase 1  
│    ├── Real Estate (/verticales/real-estate)  
│    ├── Salud y Wellness (/verticales/salud)  
│    ├── Servicios Financieros (/verticales/financieros)  
│    ├── Distribuidoras (/verticales/distribuidoras)  
│    ├── Utilities (/verticales/utilities)  
│    └── Bienes y Servicios (/verticales/bienes-servicios)  
├── Pricing (/precios)  
├── Casos de éxito (/casos)  
├── Blog & Recursos (/blog)  
│    ├── Artículos (/blog/articulos)  
│    └── Guías descargables (/blog/recursos)  
├── Contacto / Demo (/demo)  
└── Footer  
     ├── Términos y condiciones (/legales/terminos)  
     ├── Política de privacidad (/legales/privacidad)  
     └── Aviso de cookies (/legales/cookies)

### **Menú principal (header)**

* Producto

* Verticales  ← nuevo, con mega-menú desplegable

* Precios

* Casos

* Blog

**CTA principal: Ver cuánta plata recuperás**

**CTA secundario:** Ingresar (login clientes — fase 2\)

### **Mega-menú de Verticales (hover en desktop / acordeón en mobile)**

Al pasar el mouse sobre "Verticales", se despliega una capa con las 8 industrias en grilla (ícono \+ nombre \+ una línea de dolor) y un footer con "Ver todas las verticales →". Esto cumple doble función: ancla rápida para leads con problema concreto \+ posicionamiento de cobertura multi-industria.

# **2\. Home (/)**

La home se reordena para seguir un embudo de tensión → prueba → acción. Hoy la v1 explica primero y vende después; la v3 invierte ese orden.

### **Orden de secciones (scroll-down)**

1. Hero (shock \+ CTA)

2. Calculadora de dolor

3. Demo visual rápida (4 pasos)

4. Esto no es software (agente vs software)

5. Conocé a Anibal (qué hace distinto)

6. Cómo funciona (3 pasos)

7. Verticales (grid de 8 industrias)

8. Resultados / métricas

9. Testimonio \+ casos

10. CTA final

## **2.1 Hero (rehecho)**

**Eyebrow:** Cobranzas con AI para PyMEs

**H1: Tus clientes ya podrían haberte pagado.**

**Subhead:** Anibal les escribe, insiste y concilia los pagos por transferencia. Por WhatsApp y automáticamente. Vos te dedicás a vender; él se encarga de que te paguen.

**CTA primario: Ver cuánta plata recuperás en 15 min →**

**CTA secundario:** Ver cómo funciona Anibal

#### **Prueba social (strip bajo hero)**

Logos de clientes \+ frase: "Más de 120 PyMEs ya cobran con A Team."

#### **Notas de diseño para el hero**

* Fondo sobrio. La tensión la pone el copy, no el visual.

* A la derecha del copy: mock reducido de un chat de WhatsApp real de Anibal (3 burbujas).

* El CTA primario va en color accent (acción) y el secundario en link sobrio.

## **2.2 Calculadora de dolor (nueva)**

**H2: ¿Cuánta plata estás cobrando tarde?**

Módulo interactivo arriba del fold medio. Tres inputs, un output grande, un CTA.

#### **Inputs**

* Facturas por mes (slider: 30 a 2.000)

* Ticket promedio en ARS (input numérico)

* Días de atraso promedio (slider: 0 a 30\)

#### **Output (en grande, tipografía destacada)**

| Estás financiando a tus clientes con $X.XXX.XXX por mes que ya deberían estar en tu cuenta. Si cobrás 5 días antes con Anibal, recuperás ese capital cada mes. |
| :---- |

#### **CTA**

**Botón: Quiero recuperar esa plata →**

#### **Lógica sugerida (MVP copy)**

Capital flotante mensual \= facturas/mes × ticket × (días\_atraso / 30). Mostrar solo el número redondeado, sin decimales. Agregar tooltip con el detalle del cálculo para que no parezca "marketing inflado".

## **2.3 Demo visual rápida (antes "Cómo funciona" — ahora más arriba)**

Sección de 4 pasos con mock de WhatsApp animado (loop GIF o Lottie). Sin explicaciones largas: se ve.

#### **Los 4 pasos**

11. Mensaje automático de Anibal al cliente por WhatsApp.

12. Cliente responde y manda comprobante.

13. Transferencia impacta en la cuenta.

14. Anibal concilia y marca la factura como cobrada.

| Texto final: *"Todo esto pasa sin que hagas nada."* |
| :---- |

## **2.4 Esto no es software (diferenciación clave)**

**H2: Esto no es un software más. Es un cobrador.**

Sección de posicionamiento anti-CRM. Comparación visual, una línea por fila, tipografía grande.

| Software tradicional | Anibal (agente de AI) |
| :---- | :---- |
| Te muestra la deuda | La cobra |
| Necesita que lo uses todos los días | Trabaja solo, 24/7 |
| Es una herramienta más | Es un empleado más (sin sueldo) |
| Reportes, dashboards, alertas | Ejecuta. Escribe. Persigue. Concilia. |
| Cada cliente empieza de cero | Aprende del histórico de pagos de cada cliente |

| Claim de cierre de la sección: "No es un CRM. No es un bot. No es un reminder automation. Es un cobrador." |
| :---- |

## **2.5 Conocé a Anibal**

**H2: Qué hace distinto a Anibal**

Cuatro bloques cortos con ícono. Foco en diferenciales, no features.

#### **Bloque 1 — Insiste automáticamente**

Cadencia T-3, T-1, T0, T+1, T+3, T+7 por WhatsApp. Tono configurable por cliente. No olvida, no se cansa, no chicanea.

#### **Bloque 2 — Aprende patrones de pago**

Cada cliente que paga entrena mejor la siguiente cobranza. Anibal sabe cuándo insistir, cuándo esperar y cuándo escalar a un humano.

#### **Bloque 3 — Centraliza WhatsApp**

Todo el canal de cobranza vive en un solo lugar. Historial por cliente, relación persistente, auditoría completa.

#### **Bloque 4 — Ejecuta, no sugiere**

Un dashboard te dice qué hacer. Anibal lo hace. La diferencia entre tener una lista de tareas y tener un equipo.

#### **Loop de producto (copy corto, al pie de la sección)**

| *"Cada interacción mejora la siguiente cobranza. Mientras más PyMEs cobran con Anibal, mejor cobra Anibal."* |
| :---- |

## **2.6 Cómo funciona (3 pasos, corto)**

**H2: Tres pasos. Ningún Excel.**

#### **Paso 1 — Conectás tus facturas y tu banco**

En una tarde. Sin dev interno. Integraciones nativas con AFIP, Tiendanube, Holded, Xubio, Contabilium \+ conexión bancaria de lectura con los principales bancos de Argentina.

#### **Paso 2 — Definís cómo habla Anibal**

Tono (formal, cercano, firme), horarios, cadencia de mensajes, cuándo escalar a un humano. Se configura una vez.

#### **Paso 3 — Anibal trabaja**

Desde el día 1\. Vos revisás un reporte al mediodía y listo.

## **2.7 Verticales (sección nueva en home)**

**H2: Hecho para tu industria, no para "PyMEs en general".**

Grid de 8 cards. Cada card lleva a su página vertical con copy adaptado. Las 2 primeras (Centros Educativos y Servicios Profesionales) van destacadas con badge "Fase 1".

Detalle completo en el capítulo 3 de este documento.

#### **Preview del grid (8 industrias, iconos ilustrativos)**

| Industria | Dolor ancla (1 línea) |
| :---- | :---- |
| Centros Educativos ★ | Cobrar 500 cuotas sin que la administración pelee con las familias. |
| Servicios Profesionales ★ | Mandar 120 recordatorios de honorarios sin perder el cliente. |
| Real Estate | Alquileres y expensas que se pagan tarde y comen el cashflow del mes. |
| Salud y Wellness | Cuotas de socios, gimnasios y clubes con mora alta y relación sensible. |
| Servicios Financieros | Suscripciones y planes con ciclos mensuales y conciliación manual. |
| Distribuidoras | Cuenta corriente B2B con cientos de clientes y plazos distintos. |
| Utilities | Servicios con facturación recurrente y alta dispersión de pagos. |
| Bienes y Servicios | Cualquier PyME que cobra por transferencia y depende de que le paguen. |

**CTA de la sección: Ver todas las verticales →**

## **2.8 Resultados (los números de nuestros clientes)**

**H2: Los números de las PyMEs que ya cobran con Anibal.**

#### **Tres métricas destacadas (bloque grande)**

* \-40% en días de cobranza promedio. De 22 a 13 días.

* \+95% de conciliación automática. El resto se revisa en 10 minutos.

* 8 horas semanales ahorradas por persona de administración.

*\*Datos promedio en PyMEs con 50 a 500 facturas mensuales después de 90 días de uso.*

## **2.9 Testimonio y casos**

#### **Testimonio destacado**

| *"Antes usábamos dos personas full time para conciliar. Hoy Anibal hace todo y yo reviso un reporte al mediodía. Es otra vida."* — Uma P., Administrativa en aurent |
| :---- |

#### **Mini cards de casos (3 cards horizontales)**

Cada card: logo \+ sector \+ 1 métrica ancla \+ link "Ver caso →".

* aurent — e-commerce — de 22 a 11 días promedio de cobro.

* Bullion Trading — servicios financieros — 98% de conciliación automática.

* Colegio Piloto (LOI, beachhead) — educación — \-35% de mora mensual a los 90 días.

## **2.10 CTA final**

**H2: Dejá de financiar a tus clientes sin darte cuenta.**

En 15 minutos te mostramos Anibal con tus facturas reales y te damos una estimación de cuánto te haría cobrar más rápido.

**CTA primario: Probar con mis facturas →**

**CTA secundario:** Hablá con ventas por WhatsApp

# **3\. Verticales (nueva sección)**

Una de las decisiones de mayor impacto de esta versión es dejar de hablarle a "PyMEs en general" y estructurar la narrativa por industria. El objetivo es que un lead haga ancla inmediata con su problema — como hace moonflow.ai — y bajar fricción de conversión.

Este capítulo contiene: (3.1) Cobertura total de verticales para el grid de home \+ hub /verticales, (3.2) Página completa de Centros Educativos (Fase 1), (3.3) Página completa de Servicios Profesionales (Fase 1). Las verticales de Fase 2 viven en una página hub compartida hasta que el producto tenga casos por industria.

## **3.1 Hub de verticales (/verticales)**

Página índice que lista las 8 verticales con el formato de card que se muestra abajo. Header con claim:

**H1: Cada industria cobra distinto. Anibal se adapta.**

Subhead: "Mismas raíces — transferencias, WhatsApp, reconciliación — con lenguaje, cadencias y reportes pensados para cada sector."

### **Formato de card por vertical**

Cada card (rendering tentativo abajo) tiene cuatro niveles de información: Industria → Dolor específico → Qué hace Anibal → Ejemplo real. Este patrón se repite en las 8 verticales.

### **Card — Centros Educativos  ★ Fase 1**

| Centros Educativos   *·   Foco comercial Fase 1* |
| :---- |
| **Dolor específico:**  Colegios con 500 familias, psicopedagogos con 80 pacientes, institutos con mora alta que no pueden cortar la relación educativa por una cuota. |
| **Qué hace Anibal:**  Secuencia empática (T-3, T-1, vencimiento, T+3, T+7) por WhatsApp, recepción de comprobantes, conciliación con el sistema del colegio, escalamiento a preceptoría solo cuando hace falta humano. |
| **Ejemplo real:**  Colegio K-12 de zona norte GBA: 500 alumnos, 15% de mora mensual histórica. Con Anibal, mora baja a 6% en 90 días y la administración deja de dedicar 12hs/semana a conciliación. |

### **Card — Servicios Profesionales  ★ Fase 1**

| Servicios Profesionales   *·   Foco comercial Fase 1* |
| :---- |
| **Dolor específico:**  Estudios contables, jurídicos y consultoras con honorarios mensuales recurrentes. El dueño cobra entre atender clientes; los socios no quieren chicanear por WhatsApp a un cliente de 10 años. |
| **Qué hace Anibal:**  Cobranza "de tono socio": formal, recordatorio temprano, nunca agresivo, escalamiento discreto. Procesa comprobantes, concilia contra AFIP/facturación y genera reporte semanal por socio. |
| **Ejemplo real:**  Estudio contable con 120 clientes mensuales y ticket promedio ARS 180.000: Anibal reduce el día de cobro promedio de 18 a 9 días y libera 6 hs/semana del administrativo. |

### **Card — Real Estate**

| Real Estate (Inmobiliarias · Barrios Privados · Consorcios) |
| :---- |
| **Dolor específico:**  Alquileres que se pagan tarde. Expensas con 30–40% de mora flotante. Administradores cruzando 400 transferencias en Excel el 10 de cada mes. |
| **Qué hace Anibal:**  Cobranza del alquiler y de expensas por WhatsApp, conciliación con CBU/alias, detección de pagos parciales, escalamiento a administrador si hay reclamo. |
| **Ejemplo real:**  Administración con 9 edificios y 320 unidades: se pasa de conciliación manual los días 2, 3 y 4 del mes a un reporte automático la mañana del día 2\. |

### **Card — Salud y Wellness**

| Salud y Wellness (Clínicas · Gimnasios · Clubes · Estudios) |
| :---- |
| **Dolor específico:**  Cuotas mensuales con alta recurrencia. Socios que "van a pagar la semana que viene". Relación personal con el cliente que desincentiva insistir. |
| **Qué hace Anibal:**  Cobranza con tono cuidado, desactivación automática al mes 2 de mora (configurable), reporte por disciplina/profesor, integración con sistemas de socios. |
| **Ejemplo real:**  Gimnasio con 600 socios: mora baja de 22% a 11% y la administración deja de hacer llamadas individuales para pasar al modelo de escalamiento por excepción. |

### **Card — Servicios Financieros**

| Servicios Financieros (Asesores · Fintechs · Planes de inversión) |
| :---- |
| **Dolor específico:**  Suscripciones con ciclos mensuales, comisiones variables, conciliación contra extracto bancario que consume horas. Alta sensibilidad regulatoria. |
| **Qué hace Anibal:**  Integración con los principales bancos locales, matcheo por referencia \+ monto \+ patrón histórico, log auditable de cada decisión, export a contabilidad. |
| **Ejemplo real:**  Asesor financiero con 80 clientes de cartera: 98% de conciliación automática, cierre mensual que antes tomaba 3 días en 4 horas. |

### **Card — Distribuidoras**

| Distribuidoras (Cuenta corriente B2B) |
| :---- |
| **Dolor específico:**  Cuentas corrientes con 200–2.000 clientes activos, plazos de pago distintos por cliente, cobradores en ruta, cruces con órdenes de compra y remitos. |
| **Qué hace Anibal:**  Cobranza B2B por WhatsApp con el contacto correcto de cada cliente, conciliación contra órdenes, alertas al vendedor cuando su cliente entra en mora. |
| **Ejemplo real:**  Distribuidora de consumo masivo con 450 clientes activos: \-30% de días de cobranza, cobradores dedicados a venta en vez de recupero. |

### **Card — Utilities**

| Utilities (Servicios con facturación recurrente) |
| :---- |
| **Dolor específico:**  Proveedores de servicios (internet, seguridad, limpieza, software) con facturación mensual y alta dispersión de pagos por transferencia. |
| **Qué hace Anibal:**  Ciclo de cobranza recurrente mes a mes, recordatorios configurables, soporte a dos canales de pago (transferencia \+ link) con conciliación unificada. |
| **Ejemplo real:**  Proveedor de internet en interior del país con 1.200 clientes: 92% de cobros automatizados en los primeros 5 días del ciclo. |

### **Card — Bienes y Servicios**

| Bienes y Servicios (PyME general) |
| :---- |
| **Dolor específico:**  Cualquier PyME que factura mayormente por transferencia: e-commerce B2B, agencias, mayoristas, talleres, servicios profesionales no específicos. |
| **Qué hace Anibal:**  Flujo estándar de Anibal: seguimiento por WhatsApp, conciliación bancaria, procesamiento de comprobantes. Es la vertical catch-all del producto. |
| **Ejemplo real:**  Agencia de marketing B2B con 40 cuentas mensuales: pasa de seguir cobros en Excel compartido a una bandeja con un reporte automático cada semana. |

## **3.2 Página completa — /verticales/colegios**

Esta es una de las dos páginas verticales "completas" de Fase 1\. La otra es Servicios Profesionales (3.3).

### **Hero**

**Eyebrow:** Cobranzas AI para Centros Educativos

**H1: Cobrá las cuotas sin poner al colegio del lado incómodo.**

**Subhead:** Anibal le escribe a las familias con el tono del colegio, concilia los pagos por transferencia y deja a la administración libre para enseñar, no para cobrar.

**CTA: Probar Anibal en mi colegio →**

### **Problema (copy específico)**

* Mora promedio histórica en colegios privados AR: 15–20% mensual.

* Un colegio de 500 alumnos tiene USD 9M–12M flotando sin cobrar cada mes.

* 8–15 horas mensuales de administración solo en conciliación bancaria.

* 7–10 días hasta identificar quién no pagó — cuando ya es tarde para recuperar.

### **Flujo real por mes**

15. El colegio carga o conecta la planilla de cuotas (AFIP, Tiendanube Colegios, sistema propio).

16. Anibal mandar T-3 y T-1 con el tono del colegio ("formal cercano", "cercano familiar", etc.).

17. Familia paga por transferencia y manda comprobante por WhatsApp.

18. Anibal concilia, marca la cuota y deja trazabilidad para secretaría.

19. Los casos de mora sostenida escalan automáticamente a un referente del colegio.

### **Métricas típicas del sector**

* De 15% de mora mensual a 6% en 90 días.

* De 12 hs/semana de conciliación manual a 30 minutos de revisión.

* Tiempo de respuesta a familias en mora: de 7 días a 24 horas.

### **FAQ específica de colegios**

#### **¿Las familias no se van a ofender con un bot?**

Anibal no escribe "como bot". Usa el tono del colegio — el que los padres ya conocen — y escala a un humano cuando la conversación lo pide. En las pruebas piloto, el NPS de la experiencia de cobro subió frente al canal anterior (secretaría por teléfono).

#### **¿Qué pasa con familias que pagan en efectivo o cheque?**

Anibal cubre el 85–90% del volumen que se paga por transferencia. El resto sigue en el circuito del colegio; la administración solo maneja excepciones.

#### **¿Podemos configurar cadencias distintas por curso / cuota?**

Sí. Cada categoría de cuota (regular, ajuste, arancel de material) puede tener su propia cadencia y tono.

### **CTA final de vertical**

**H2: En 15 minutos te mostramos el flujo con una cuota real de tu colegio.**

Botón: Agendar demo específica para colegios →

## **3.3 Página completa — /verticales/servicios**

### **Hero**

**Eyebrow:** Cobranzas AI para Estudios y Consultoras

**H1: Cobrá honorarios sin romper la relación con tus clientes.**

**Subhead:** Anibal hace el seguimiento que vos no querés hacer. Con el tono de un socio, no el de un cobrador.

**CTA: Probar Anibal con mis honorarios →**

### **Problema (copy específico)**

* Los socios no quieren ser los que mandan el WhatsApp de "¿llegó la transferencia?".

* Administrativos dividen su atención entre 60–120 clientes mensuales.

* Ciclos de cobranza que se estiran de 30 a 60 días por falta de seguimiento.

* Riesgo de perder al cliente si se insiste mal.

### **Flujo real por mes**

20. Emisión de honorarios desde el sistema (Holded, Xubio, Contabilium, AFIP directo).

21. Anibal hace seguimiento por WhatsApp desde el contacto del administrativo, no del socio.

22. Escalamiento al socio solo en casos de mora sostenida o cliente delicado.

23. Conciliación automática y cierre del mes sin horas extras.

### **Métricas típicas del sector**

* De 18 días promedio de cobro a 9 días.

* \-70% en tiempo administrativo dedicado a cobranza.

* 0 casos reportados de cliente perdido por "insistir mal" en pilotos tempranos.

### **CTA final**

Botón: Ver la demo aplicada a un estudio →

## **3.4 Verticales de Fase 2 (páginas "lite" por ahora)**

Para Real Estate, Salud y Wellness, Servicios Financieros, Distribuidoras, Utilities y Bienes y Servicios, la v3 define una página "lite" con: hero específico \+ dolor \+ ejemplo \+ CTA a demo. Cuando tengamos casos cerrados por vertical, cada una gradúa a página completa (como 3.2 y 3.3).

# **4\. Sobre A Team (/sobre-nosotros)**

## **4.1 Hero**

**H1: Un equipo de agentes AI, construido para las PyMEs.**

Subhead: Automatizar una PyME no es sumar software; es tener un equipo que trabaje por vos. Eso es A Team.

## **4.2 Nuestra historia**

A Team nace de una certeza: las PyMEs de Latinoamérica no necesitan más dashboards. Necesitan que alguien — o algo — haga el trabajo. Las grandes empresas tienen equipos enteros para cobrar, conciliar, responder clientes y procesar facturas. Las PyMEs no. Y los SaaS tradicionales te dan una herramienta más, pero no te dan tiempo.

Por eso construimos agentes de AI que no son una app más: son compañeros de trabajo que se hacen cargo de las tareas operativas que nadie quiere hacer. Empezamos por las cobranzas, porque es donde todos los fundadores con los que hablamos nos dijeron lo mismo: "cobrar tarde me está matando".

## **4.3 Qué hacemos**

A Team desarrolla agentes de AI especializados en procesos concretos de la PyME. Cada agente tiene un rol, una forma de trabajar y objetivos medibles. Anibal es el primero; se ocupa de cobranzas por transferencia. Los próximos van a generar leads, concretar ventas, atender clientes, procesar órdenes.

## **4.4 Nuestros principios**

* Trabajo real, no dashboards. Si no ejecuta, no es A Team.

* Transparencia auditable. Cada acción del agente queda registrada.

* La PyME manda. El humano aprueba excepciones; el agente nunca transfiere plata ni modifica facturas.

* Foco por vertical. Los agentes no son genéricos; hablan el idioma del sector.

## **4.5 El equipo**

Somos un equipo de fundadores de PyMEs, ingenieros de AI y operadores que pasamos años peleándonos con las mismas herramientas rotas que usan nuestros clientes. Ahora construimos la solución que hubiéramos querido tener.

#### **Estructura visual**

Grilla con foto, nombre, rol y una frase personal. Ej.: "Antes: Ingeniero de Calidad de Toyota. Ahora: construyendo a Anibal."

## **4.6 Respaldo**

Logos de inversores, aceleradoras, partners tecnológicos, prensa. Frase: "Construimos en serio, con gente que sabe."

## **4.7 CTA**

Botón: Ver a Anibal en acción →

# **5\. Producto · Anibal (/anibal)**

## **5.1 Hero**

**Eyebrow:** Conocé a Anibal

**H1: Tu nuevo jefe de cobranzas trabaja 24/7 y no pide aumento.**

**Subhead:** Anibal es un agente de AI que se encarga de todo el ciclo de cobranzas por transferencia: escribe por WhatsApp, recibe los comprobantes, concilia contra tu cuenta bancaria y te mantiene al tanto.

**CTA: Probar con mis facturas →**

## **5.2 Qué hace distinto a Anibal (nueva sección arriba)**

* Insiste automáticamente — cadencia T-3/T-1/T0/T+1/T+3/T+7.

* Aprende patrones de pago — cada cliente cobra distinto y Anibal ajusta.

* Centraliza WhatsApp — historial por cliente, un solo canal de cobranza.

* Ejecuta, no sugiere — no es un reporte; hace.

## **5.3 Para quién es**

* Cobrás principalmente por transferencia bancaria.

* Facturás entre 30 y 2.000 operaciones por mes.

* Tenés un equipo chico haciendo cobranzas (o sos vos).

* Tus clientes te pagan por WhatsApp, mail o te dejan el comprobante donde se les canta.

* Perdiste la cuenta de cuántas veces escribiste "¿me podés pasar el comprobante?".

## **5.4 Funcionalidades clave**

### **5.4.1 Seguimiento por WhatsApp**

Apenas emitís una factura, Anibal toma el control. Le escribe al cliente por WhatsApp con el monto, la fecha de vencimiento y los datos de pago. Si no paga en tiempo, manda recordatorios con una cadencia que vos definís: suave al principio, más firme sobre el vencimiento. Entiende respuestas en lenguaje natural: si el cliente dice "pago mañana", lo agenda; si manda el comprobante, lo procesa; si pide prórroga, te avisa.

* Cadencia personalizable (tono, frecuencia, horarios).

* Plantillas con la voz de tu empresa.

* Escalamiento automático a un humano cuando la conversación se complica.

### **5.4.2 Conciliación automática**

Anibal se conecta con tu cuenta bancaria y tu sistema de facturación. Cuando entra una transferencia, la cruza con las facturas pendientes y la matchea sola: monto, cliente, fecha. Si hay dudas, te muestra las opciones y decidís con un click.

* Conciliación en tiempo real contra tu cuenta.

* Matcheo inteligente por monto, referencia y patrón histórico.

* Log auditable de cada decisión.

### **5.4.3 Procesamiento de comprobantes**

Cuando un cliente manda un comprobante por WhatsApp — PDF, foto o captura — Anibal lo lee, extrae los datos y confirma el pago automáticamente. Si algo no cierra, queda en una bandeja de revisión.

### **5.4.4 Dashboard y reportes**

Panel simple con lo que importa: cuánto te deben, top deudores, cuánto cobraste esta semana, días promedio de cobro. Exportable a Excel.

### **5.4.5 Integraciones**

* Bancos: principales bancos de Argentina vía CBU/alias (expandimos por demanda).

* Facturación: Tiendanube, AFIP, Holded, Xubio, Contabilium.

* CRM: HubSpot, Pipedrive (opcional).

* WhatsApp: integración oficial vía API de WhatsApp Business.

## **5.5 Cómo se configura**

Listo en una tarde. Sin dev interno. Onboarding guiado por nuestro equipo en las primeras semanas.

## **5.6 Seguridad y confianza**

* Datos cifrados en tránsito (TLS) y reposo (AES-256).

* Acceso a tu banco solo de lectura.

* Cumplimiento con Ley 25.326 de Protección de Datos Personales.

* Aprobás las excepciones; Anibal nunca transfiere plata ni modifica facturas.

* 2FA obligatorio para administradores.

## **5.7 FAQ corta**

#### **¿Cuánto tarda en estar operativo?**

En promedio 24–48hs desde que firmamos.

#### **¿Qué pasa si un cliente no quiere hablar con un bot?**

Anibal escala al humano de tu equipo cuando detecta fricción, y el cliente nunca sabe que habló con un agente a menos que vos quieras decirlo.

#### **¿Se integra con mi banco?**

Sí, con los principales bancos de Argentina y Mercado Pago. Si el tuyo no está, lo agregamos bajo demanda en menos de 30 días.

## **5.8 CTA final**

Botón: Probar con mis facturas →     Link: Ver precios

# **6\. Pricing (/precios) — rehecho**

## **6.1 Hero**

**H1: Si cobramos antes, se paga solo.**

Subhead: Elegí el plan que se ajusta a tu volumen. Todos incluyen Anibal, dashboard y soporte humano. 14 días gratis, sin tarjeta.

| Frase ancla arriba de los planes: *"Nuestros clientes recuperan el costo del plan con 1–3 facturas cobradas antes."* |
| :---- |

## **6.2 Planes (4 columnas)**

Cada plan muestra: precio mensual, volumen incluido, features clave, ROI estimado y "se paga con X facturas". El plan "Crecimiento" va destacado visualmente (ribbon "Más elegido").

|  | Free | Arranque | Crecimiento (recomendado) | Escala |
| :---- | :---- | :---- | :---- | :---- |
| Facturas/mes | Hasta 20 | Hasta 100 | Hasta 500 | \+500 (a convenir) |
| Precio mensual | USD 0 | USD 29 | USD 79 | USD 199+ |
| WhatsApp \+ cadencia | Sí | Sí | Sí | Sí |
| Conciliación automática | Limitada | Sí | Sí \+ patrones históricos | Sí \+ reglas avanzadas |
| Integraciones bancarias | 1 | 2 | Todas | Todas \+ custom |
| Soporte | Self-serve | Email | WhatsApp prioritario | Dedicado |
| ROI estimado | — | 3x | 5x | 8x+ |
| Se paga con | — | 1 factura cobrada antes | 2 facturas cobradas antes | 3 facturas cobradas antes |

## **6.3 Preguntas frecuentes sobre pricing**

#### **¿Hay costo de setup?**

No. El onboarding está incluido en el plan desde el primer día.

#### **¿Qué pasa si me paso del volumen del plan?**

Te avisamos antes de cobrar nada. Escalás de plan cuando vos decidas.

#### **¿Cobran por mensaje de WhatsApp?**

Los costos de WhatsApp Business API están incluidos hasta los volúmenes de cada plan. Si lo excedés, te pasamos costo al valor del proveedor (sin markup).

## **6.4 CTA final**

Subhead: En la demo te hacemos un cálculo personalizado: cuánto te costaría Anibal y cuánto te devolvería en horas y en plata cobrada antes.

Botón: Ver mi ROI personalizado →

# **7\. Casos de éxito (/casos)**

## **7.1 Hero**

**H1: PyMEs reales. Cobranzas distintas.**

Subhead: Estas son algunas de las empresas que cambiaron su operación con Anibal. Sin letra chica, sin trucos: solo números y testimonios de equipos que antes perseguían plata y ahora cobran.

## **7.2 Grilla de casos**

Cards con logo, sector, tamaño, métrica destacada y link a la historia completa. Filtrable por vertical.

* Caso 1 · aurent (e-commerce) — de 22 a 11 días promedio.

* Caso 2 · Bullion Trading (servicios financieros) — 98% conciliación automática.

* Caso 3 · Colegio Piloto (educación) — mora de 15% a 6%.

## **7.3 CTA**

Botón: El próximo caso podría ser el tuyo. Probar con mis facturas →

# **8\. Blog & Recursos (/blog)**

## **8.1 Hero**

**H1: Cobrar mejor. Cada semana.**

Subhead: Contenido pensado para quienes viven la operación: fundadores, CFOs, equipos de administración y curiosos de la AI.

## **8.2 Navegación interna**

* Artículos (/blog/articulos) — notas cortas y análisis.

* Guías descargables (/blog/recursos) — PDFs, plantillas y calculadoras.

* Newsletter "El Cobrador Semanal" — cada martes.

## **8.3 Categorías sugeridas**

* Cobranzas y finanzas operativas.

* WhatsApp para empresas.

* AI para PyMEs.

* Cultura y equipo (detrás de A Team).

* Casos y métricas.

## **8.4 Pipeline editorial (títulos nuevos, tono con más edge)**

* "Cobrar tarde está fundiendo tu PyME (y no lo ves)."

* "El costo invisible de 'te pago mañana'."

* "Si usás Excel para cobrar, esto es para vos."

* "Cómo pasamos de 15 a 2 días de cobranza en una PyME real."

* "La plantilla de WhatsApp que más cobra, según 50 PyMEs que la usan."

* "Un día en la vida de Anibal: cómo trabaja un agente AI de cobranzas."

## **8.5 Bloque de newsletter**

**H2: Suscribite a El Cobrador Semanal.**

Subhead: Cinco minutos de lectura. Una idea para cobrar mejor. Sin spam, sin cursos, sin promesas. Cada martes a tu mail.

CTA: Input email · Botón: Suscribirme

# **9\. Contacto / Demo (/demo)**

## **9.1 Hero (rehecho)**

**H1: 15 minutos para empezar a recuperar plata todos los meses.**

Subhead: Agendá una demo con el equipo de A Team. Te mostramos Anibal en vivo, con un caso parecido al tuyo, y te damos una estimación de cuánto te haría cobrar más rápido.

## **9.2 Qué vas a ver en la demo**

* Una conversación real de Anibal con un cliente.

* Una transferencia conciliada en tiempo real.

* El dashboard que vas a usar todos los días.

* Un cálculo estimado de ROI para tu PyME.

## **9.3 Formulario (con pre-calificación)**

Se agregan dos campos para mejorar calidad de lead y priorización de agenda.

* Nombre y apellido \*

* Empresa \*

* Email de trabajo \*

* WhatsApp \*

* Tipo de negocio (select): Centros Educativos / Servicios Profesionales / Real Estate / Salud / Servicios Financieros / Distribuidoras / Utilities / Otro  ← nuevo

* Facturación mensual aproximada (select: \<ARS 5M / 5–20M / 20–100M / \+100M)  ← nuevo

* Cantidad de facturas / mes (select)

* ¿Qué usás hoy para cobrar? (texto libre, opcional)

**Botón: Agendar demo →**

*Legal al pie: Al completar el formulario aceptás nuestra Política de Privacidad. No hacemos spam.*

## **9.4 Canales alternativos**

* WhatsApp comercial: \+54 11 0000 0000

* Email: hola@ateam.ai

* Prensa: prensa@ateam.ai

## **9.5 Confirmación post-submit**

H2: ¡Listo\! Ya te escribimos por WhatsApp.

Subhead: Coordinamos un horario que te funcione y sumamos a alguien del equipo técnico si querés.

# **10\. Elementos globales**

## **10.1 Header**

* Logo A Team (link a /).

* Items de menú: Producto · Verticales (mega-menú) · Precios · Casos · Blog.

* CTA principal: Ver cuánta plata recuperás.

* Mobile: menú hamburguesa con los mismos items; verticales como acordeón.

## **10.2 Footer**

#### **Columna 1 · Producto**

* Anibal · Precios · Casos · Verticales

#### **Columna 2 · Empresa**

* Sobre A Team · Blog · Trabajá con nosotros (fase 2\)

#### **Columna 3 · Soporte**

* Contacto · Estado del servicio (fase 2\) · Documentación (fase 2\)

#### **Columna 4 · Legales**

* Términos y condiciones · Política de privacidad · Aviso de cookies

## **10.3 Sistema de CTAs (global)**

Reemplazar "Agendar demo" genérico en contextos de alto intent por variantes orientadas a valor. Usar la lista abajo según sección.

| Contexto | CTA recomendado |
| :---- | :---- |
| Hero Home | Ver cuánta plata recuperás en 15 min |
| Calculadora | Quiero recuperar esa plata |
| Diferenciación | Ver a Anibal trabajando |
| Pricing | Ver mi ROI personalizado |
| Vertical (colegios / servicios / etc.) | Probar Anibal en mi \[colegio / estudio / gimnasio\] |
| Demo | Agendar demo (con pre-calificación) |
| Blog / contenido | Probar con mis facturas |

# **11\. Prioridades de implementación**

Orden de trabajo sugerido para pasar a Figma y desarrollo. Priorizado por impacto comercial esperado vs esfuerzo.

| \# | Entregable | Impacto | Esfuerzo |
| :---- | :---- | :---- | :---- |
| 1 | Hero nuevo \+ CTAs reemplazados (home y global) | Alto | Bajo |
| 2 | Calculadora de dolor (home) | Alto | Medio |
| 3 | Sección "Esto no es software" (home) | Alto | Bajo |
| 4 | Páginas de vertical — Colegios y Servicios Profesionales | Alto | Medio |
| 5 | Pricing con ROI explícito y ancla "se paga con X facturas" | Alto | Bajo |
| 6 | Hub /verticales \+ 6 páginas "lite" de Fase 2 | Medio | Medio |
| 7 | Demo con pre-calificación | Medio | Bajo |
| 8 | Pipeline editorial de blog con tono nuevo | Medio | Medio |

## **Resultado esperado**

* Mayor tasa de conversión a demo (mensaje \+ CTAs más fuertes).

* Leads mejor calificados (pre-calificación \+ verticalización).

* Mensaje de posicionamiento más claro y diferenciado (agente vs software).

* Base lista para escalar a más verticales sin rehacer el sitio.

*Documento listo para pasar a diseño (Figma) con foco en performance comercial.*

A Team · Abril 2026