---
title: Guía de Documentación — Etendo
tags:
  - guia-de-estilo
  - documentacion
---

# Guía de Documentación para Etendo

## 1. Arquitectura de la Información

### Estructura del sitio

La organización general del sitio sigue una jerarquía de cuatro niveles (actualizado 2026-08-06 para reflejar la estructura real de carpetas del repositorio, que agrupa los módulos bajo categorías temáticas de nivel superior):

- **Página de inicio**: grilla de grupos temáticos (3 columnas) con tarjetas que muestran: icono + nombre del grupo + descripción en una línea + cantidad de artículos + avatares de autores.
- **Grupos temáticos**: carpetas de nivel 1 dentro de `docs/es/`, cada una reúne uno o más módulos funcionales relacionados. Grupos actuales: **Primeros pasos**, **Comercial** (Contactos, Ventas), **Operaciones** (Compras, Inventario), **Finanzas** (Activos, Amortización), **Sistema** (Configuración), y la categoría aún no desarrollada Dashboard. RRHH, CRM, Proyectos, Analítica y TPV todavía no tienen grupo asignado en el repo — al incorporarlos, decidir si son grupo propio o módulo dentro de uno existente antes de crear la carpeta.
- **Módulos**: carpetas de nivel 2, una por área funcional del producto (ej. Ventas y Contactos dentro de Comercial; Compras e Inventario dentro de Operaciones). Cada módulo tiene su propia página de descripción general ("¿Qué es la sección X?").
- **Colecciones**: subcategorías dentro de un módulo que agrupan artículos por tema. Por ejemplo, dentro de Ventas → "Configuración de facturación", "Documentos de ventas", "Preguntas frecuentes". En módulos chicos, la colección puede quedar implícita (los artículos viven directamente bajo el módulo).
- **Artículos**: hojas del sitio. Nunca mezclar tipos de artículo dentro de una misma subcolección.

### Patrón de profundidad

```
Inicio
└── Grupo temático (nivel 1, ej. "Operaciones")
    └── Módulo (nivel 2, ej. "Compras")
        ├── [2-3 artículos de descripción general al inicio]
        ├── Subcolección: "Configuración"
        ├── Subcolección: "Documentos / Operaciones"
        ├── Subcolección: "Cumplimiento / Legal" (si aplica)
        ├── Subcolección: "Importación / Migración" (si aplica)
        └── Subcolección: "Preguntas frecuentes"
```

Ejemplo real: `docs/es/operaciones/compras/que-es-la-seccion-compras/que-es-la-seccion-compras.md` — grupo "Operaciones", módulo "Compras", artículo "¿Qué es la sección Compras?".

### Cantidad de artículos por categoría

- Priorizar profundidad donde la complejidad es alta (Ventas: ~77 artículos; Primeros pasos: ~26).
- Categorías pequeñas (1-5 artículos) son válidas para integraciones específicas o funcionalidades puntuales.

## 2. Tipos de Artículo

Definir exactamente 6 tipos y usarlos de forma consistente. Cada artículo debe ser de un solo tipo: nunca mezclar una guía con una FAQ en la misma página.

| Tipo | Propósito | Ejemplo |
|:-----|:----------|:--------|
| Descripción general | ¿Qué es esta funcionalidad? ¿Por qué existe? | "¿Qué es la sección de Ventas?" |
| Guía de inicio | Configuración secuencial desde cero | "Facturación: guía de inicio" |
| Artículo de tarea | Cómo hacer una cosa específica | "Crear una factura de venta" |
| Referencia / Glosario | Definiciones, explicación de campos | "Glosario de Ventas" |
| Referencia de ventana / Gestión | Cómo consultar y administrar una ventana ya poblada de registros: vista lista, vista detalle/formulario, estados y acciones disponibles | "Gestionar tus facturas de compra" |
| Preguntas frecuentes | Resolución de problemas, casos borde | "App móvil: preguntas frecuentes" |

## 3. Estilo y Tono de Escritura

### Principios fundamentales

- **Cercano pero profesional**: no corporativo ni demasiado informal. Tratar al lector como un profesional capaz.
- **Segunda persona, siempre**: dirigirse al usuario como "tú". Usar "puedes", nunca comandos sin contexto.
- **Español neutro**: el lector es el responsable de una pyme o un profesional independiente. Tuteo (nunca voseo, "vosotros" ni "usted") y vocabulario que se entienda igual en cualquier lugar de habla hispana. Ver [Léxico y registro](#lexico-y-registro).
- **Lenguaje orientado al beneficio**: explicar el para qué antes del cómo. ("Para que tus facturas reflejen la información correcta, completa los siguientes campos...")
- **Lenguaje claro**: evitar tecnicismos. Si un término técnico es necesario, definirlo en línea la primera vez o enlazar al glosario.
- **Voz activa**: "Haz clic en **Guardar**", no "El botón Guardar debe ser presionado".
- **Tiempo presente**: describir lo que ocurre ahora, no lo que "ocurrirá".

### Ejemplos de tono

- ✅ CORRECTO: "Una vez creada tu cuenta, inicia sesión para comenzar a configurar lo básico."
- ✅ CORRECTO: "De este modo, podrás empezar a trabajar cómodamente sin perder un segundo."
- ❌ INCORRECTO: "El usuario debe proceder a configurar los parámetros del sistema."
- ❌ INCORRECTO: "En esta sección se explicará el proceso de creación de facturas."

### Nivel de lectura

Apuntar a un nivel intermedio. Oraciones cortas. Una idea por oración. Dividir explicaciones largas en viñetas.

### Léxico y registro

Escribe como le hablarías a alguien que lleva su propio negocio, no como un consultor de ERP. Habla de su negocio (cuánto debe, cuándo cobra, qué le queda en el almacén), no de cómo funciona el sistema por dentro. El texto tiene que sonar natural para cualquier lector de habla hispana, sin palabras que delaten de dónde es quien escribe.

#### Reglas

- **Primero el para qué**: cada campo o acción se presenta por lo que le resuelve al usuario, y después cómo se usa.
- **Una idea por frase**: nada de paréntesis dentro de paréntesis ni de punto y coma encadenados.
- **El detalle contable o técnico, al final**: fechas contables, tipos de cambio, numeraciones internas y similares van en una nota aparte, titulada `!!! info "Para tu asesor"`, no en mitad del paso a paso.
- **Español neutro**: tuteo (nunca voseo, "vosotros" ni "usted"). Si una palabra solo se usa en una región, elegir otra que se entienda en todas (por ejemplo, "teléfono" en vez de "móvil" o "celular"). Cuando hay dos formas igual de comprensibles, usar la de la tabla.
- **Nunca nombrar países ni regiones**: la documentación no menciona países ni compara cómo se dice algo en cada lugar. La única excepción son las opciones que aparecen literalmente en la interfaz (por ejemplo, los territorios fiscales que se eligen al configurar los impuestos).
- **Obligaciones fiscales concretas** (SII, VERI*FACTU, TicketBAI, modelos de Hacienda y similares) se mencionan solo en los artículos que tratan de ellas. En artículos generales se habla de "la administración tributaria" o "tu identificación fiscal".
- **Los nombres de la interfaz no se tocan**: botones, campos, pestañas y documentos (por ejemplo, **Albarán**) se escriben exactamente como aparecen en pantalla, en negrita, aunque no sigan esta tabla. Si un nombre de la interfaz puede no entenderse, se explica en el glosario con un sinónimo (por ejemplo, albarán: documento que acompaña la entrega de la mercancía, también llamado remito), sin nombrar países. Si un nombre suena mal, se avisa al equipo de producto; no se cambia en la documentación.

#### Términos a evitar

| Evitar | Usar en su lugar | Motivo |
|---|---|---|
| popup, modal | ventana (o ventana emergente si hace falta distinguirla) | Jerga de desarrollo |
| pulsa, clica, cliquea, presiona | haz clic | Una sola forma en todo el sitio |
| rellenar (un formulario o campo) | completar | Forma más extendida |
| cargar, cargado (un registro) | registrar, crear | Ambiguo: también significa subir un archivo |
| ingresar, introducir (datos) | escribir | Regionalismos |
| monto | importe | Una sola forma en todo el sitio |
| mercadería, género | mercancía (o productos) | Regionalismos |
| móvil, celular | teléfono | Regionalismos |
| ordenador, computadora | equipo (o evitarlo) | Regionalismos |
| autónomo, monotributista | profesional independiente | Figuras fiscales locales |
| Hacienda (en artículos generales) | la administración tributaria | Organismo local |
| NIF, CUIT, RUT (en artículos generales) | identificación fiscal | Identificadores locales |
| vale, guay, coger | (no usar) | Coloquialismos; "coger" tiene un sentido ofensivo en algunas regiones |
| grilla | lista, tabla | Regionalismo |
| heredado de | viene de, se completa con lo de | Jerga técnica |
| editable / no editable | puedes cambiarlo / no se puede cambiar | Jerga técnica |
| *(requerido)* | *(obligatorio)* | Más claro |
| autocompleta, autocarga, prellenado | se completa solo, ya viene completado | Jerga técnica |
| documento de origen | el pedido (o el albarán, la factura) del que sale | Nombrar el documento concreto |
| obligación de pago | lo que le debes al proveedor | Lenguaje contable innecesario |
| contabilización del documento | para tu contabilidad | Lenguaje contable innecesario |
| Etendo Go, Etendo GO | Etendo | El producto ya no se llama Etendo Go |
| asistente (referido a Copilot o a cualquier IA) | agente | Terminología del producto. "Asistente" solo se usa para los formularios guiados de varios pasos (ej. el asistente **Crear Devolución desde Albarán**) |

#### Antes y después

- ❌ "Sigue esta guía cuando necesites registrar la obligación de pago a un proveedor."
- ✅ "Cuando un proveedor te envía una factura, regístrala aquí para saber cuánto le debes y cuándo tienes que pagarle."

- ❌ "**Moneda** *(requerido)* — por defecto EUR, editable si necesitas facturar en otra moneda. Al cambiarla, el sistema aplica automáticamente el tipo de cambio registrado (se actualiza diariamente al cierre del día); si lo editas manualmente, queda registrado en la pestaña Tipos de cambio, ya que ese tipo de cambio es el que luego se usa para la contabilización del documento."
- ✅ "**Moneda** *(obligatorio)* — viene con la moneda de tu empresa. Si el proveedor te factura en otra moneda, cámbiala y Etendo aplica el tipo de cambio del día de la factura. Si tu proveedor o tu asesor te indican otro, puedes cambiarlo a mano."

- ❌ "**Dirección**, **Método de pago** y **Condiciones de pago** — heredados del contacto; editables para este documento."
- ✅ "**Dirección**, **Método de pago** y **Condiciones de pago** — vienen de la ficha del proveedor. Puedes cambiarlos solo para esta factura."

- ❌ "Una vez que tienes pedidos de compra cargados, vas a necesitar consultarlos."
- ✅ "Cuando ya tengas pedidos de compra registrados, necesitarás consultarlos."

- ❌ "Pulsa **Guardar** y rellena los datos de la mercadería que te ha llegado."
- ✅ "Completa los datos de la mercancía que te ha llegado y haz clic en **Guardar**."

#### Prueba final

Antes de dar un artículo por bueno, léelo como lo leería el responsable de una pyme sin formación técnica, de cualquier lugar de habla hispana. Si en alguna frase tendría que preguntar qué significa, si una palabra solo se entiende en una región o si el texto menciona un país, hay que reescribirla.

## 4. Plantillas de Estructura de Artículos

### Artículo de descripción general

```
H1: [Nombre de la funcionalidad] — qué es ("¿Qué es...?")
[1-2 párrafos de apertura: definición + beneficio principal]
[Opcional: video embebido]

H2: [Capacidad principal 1]
  - Lista de viñetas (etiqueta en negrita + descripción en 1 línea)

H2: [Capacidad principal 2]
  ...

H2: Recursos / Próximos pasos
  - Enlaces a guías de inicio relacionadas

[CTA o frase de cierre]
[Artículos relacionados: máximo 3 enlaces]
```

### Guía de inicio / Configuración

```
H1: [Módulo]: Guía de inicio
[1 oración de contexto: "Una vez creada tu cuenta..."]

H2: 1. [Primer paso — título con verbo de acción]
  [Breve explicación en prosa]
  [Sub-pasos numerados si son necesarios]
  [Captura de pantalla]

H2: 2. [Segundo paso]
  ...

H2: [N]. Recursos y próximos pasos
```

Cada H2 en una guía de configuración va numerado y representa un paso discreto y completable.

### Artículo de tarea

```
H1: Cómo [hacer algo específico]
[1 oración de apertura: qué cubre este artículo y cuándo es necesario]
[Prerrequisitos si los hay — viñeta breve]

H2: [Grupo de pasos 1]
  [Pasos numerados]
  [Captura de pantalla después del paso clave]

H2: [Grupo de pasos 2 si es necesario]
  ...

[Artículos relacionados: máximo 3 enlaces]
```

### Referencia de ventana / Gestión

```
H1: [Nombre de la ventana en plural o "Gestionar tus [documentos]"]
[1 oración de apertura: qué cubre este artículo y enlace al artículo de tarea de creación si existe]

H2: Vista Lista
  [Columnas de la vista lista, filtros disponibles]
  [Captura de pantalla]

H2: Vista Detalle
  [Información e íconos de la vista detalle, acciones rápidas]
  [Captura de pantalla]

H2: Estados del Documento
  [Tabla de estados con descripción]

H2: Acciones Disponibles
  [Tabla de acciones con descripción y estado en que aplican]
  [Sub-secciones para popups o flujos de gestión adicionales]

[Artículos relacionados: máximo 3 enlaces]
```

### Artículo de referencia / glosario

```
H1: [Módulo / Funcionalidad]: Referencia / Glosario

H2: [Término, campo o parámetro]
  [Definición de 1-2 oraciones. Si aplica: tipo de dato, valores posibles, valor por defecto o unidad.]

H2: [Siguiente término, campo o parámetro]
  ...

[Artículos relacionados]
```

### Artículo de preguntas frecuentes

```
H1: [Módulo / Funcionalidad]: Preguntas frecuentes

H2: [Pregunta formulada como la haría el usuario]
  [Respuesta de 1-3 oraciones. Si es procedimental: pasos numerados.]

H2: [Siguiente pregunta]
  ...

[Artículos relacionados]
```

## 5. Convenciones de Formato

### Encabezados

- **H1**: solo el título del artículo — uno por página.
- **H2**: secciones principales o pasos numerados.
- **H3**: usar con moderación, sólo cuando el contenido de un H2 necesita sub-agrupación.
- Nunca saltarse niveles (no pasar de H1 a H3).

### Formato de texto

| Elemento | Convención |
|:---------|:-----------|
| Botón o etiqueta de UI | Negrita (ej. **Guardar**, **Nueva factura**) |
| Ruta de navegación | Links con separador `>`: Configuración > Cuenta > Preferencias |
| Nombre de campo | Negrita |
| Concepto importante | Negrita en la primera mención |
| Artículos enlazados | Hipervínculo en línea, no al pie de página |
| Valores del sistema | Usar backticks |
| Advertencias / notas importantes | Admonitions de MkDocs (`!!! warning`, `!!! tip`, `!!! info`) con un título breve entre comillas — actualizado 2026-08-24 para reflejar la convención ya en uso en todos los artículos publicados; no usar blockquotes (`>`) para este caso |

### Listas

- Listas sin orden: para funcionalidades, opciones o conceptos sin orden requerido.
- Listas ordenadas: para pasos que deben seguirse en secuencia.
- Listas anidadas: aceptable un nivel de profundidad; evitar más niveles.
- Cada elemento de lista: una idea, conciso, estructura paralela.

### Párrafos

- Máximo 3-4 oraciones por párrafo.
- Un concepto por párrafo.
- Dejar una línea en blanco entre párrafos y entre un párrafo y una lista.

### Imágenes y capturas de pantalla

- Colocar la captura inmediatamente después del encabezado de la sección, antes del texto explicativo: el lector ve primero el contexto visual y después la descripción (actualizado 2026-08-06, según la convención vigente en los artículos ya publicados).
- La `<figcaption>` de la captura debe describir qué muestra la imagen; al ir la captura antes del texto, esa leyenda cumple el rol de contexto y el párrafo que sigue no necesita repetir una referencia textual a la imagen.
- Usar capturas anotadas (flechas, resaltados) para interfaces complejas.
- No insertar videos en medio de guías de tareas — interrumpen la lectura.

### Pestañas de contenido

- Usar pestañas (`=== "Título"`, extensión `pymdownx.tabbed`) solo cuando el mismo contenido tiene variantes paralelas que el lector elige según su caso (por ejemplo, Ventas frente a Compras). Nunca para esconder pasos que todos los lectores necesitan.
- El título de cada pestaña nombra el caso del lector ("Si tu proveedor te envía una rectificativa"), no una categoría interna.

### Fragmentos compartidos

- Cuando el mismo texto tiene que aparecer igual en varios artículos (por ejemplo, un aviso legal o una nota que se repite literal en varias páginas), se escribe una sola vez en `overrides/snippets/<nombre>.md` y se incluye con `--8<-- "overrides/snippets/<nombre>.md"` (extensión `pymdownx.snippets`). Así se mantiene en un único sitio.
- Si un artículo necesita solo una parte, el fragmento se divide con marcadores de sección (`<!-- --8<-- [start:nombre] -->` / `<!-- --8<-- [end:nombre] -->`) y se incluye `archivo.md:nombre`.
- El fragmento no lleva frontmatter ni H1, y **no lleva enlaces relativos**: las rutas cambian según el artículo que lo incluye. Los enlaces van en el artículo, justo antes o después de la inclusión.
- Antes de crear un fragmento, comprobar que el texto es de verdad idéntico en todos los artículos. Si cambia según la sección, mejor escribirlo en cada artículo.

## 6. Navegación y Enlazado

- **Artículos en navegación**: todo artículo debe aparecer en la navegación — sin páginas huérfanas.
- **Artículos relacionados**: máximo 3 enlaces al final de cada artículo. Siempre presentes, nunca omitidos.
- **Enlaces contextuales en línea**: enlazar de forma natural dentro del texto. No usar "haz clic aquí" — usar texto ancla descriptivo.
- **Enlaces entre colecciones**: aceptables y recomendados cuando la funcionalidad se superpone.
- **Enlaces externos**: abrir en pestaña nueva.

## 7. Estándares para Páginas de Categoría y Colección

Cada página de colección debe tener:

- Un título y una descripción en una línea.
- 1-3 artículos de descripción general anclados al inicio (fuera de las subcolecciones).
- Subcolecciones agrupadas por tema (no alfabéticamente).
- Vista previa de artículos con: título + descripción en una línea.

Orden recomendado de subcolecciones:

1. Configuración
2. Operaciones principales
3. Cumplimiento legal
4. Importación/Migración
5. Preguntas frecuentes

## 8. Estándares de Metadatos de Artículos

Cada artículo debe tener los siguientes metadatos completos:

- **Título**: descriptivo, orientado a la acción o en forma de pregunta. Máximo ~60 caracteres.
- **Tags**: mínimo 3, relacionados directamente al contenido de la página.
- **Autor** y **Fecha de última actualización**: visibles en el artículo, pero se resuelven automáticamente vía el plugin `git-committers` (a partir del historial de git del archivo). **No** agregar `author:` ni `date:` a mano en el front matter — eso genera datos falsos/desactualizados y ningún artículo del repo lo hace hoy.

## 9. Guías de Extensión de Contenido

| Tipo de artículo | Extensión objetivo |
|:------------------|:--------------------|
| Descripción general | 400-700 palabras |
| Guía de inicio | 600-1.200 palabras |
| Artículo de tarea | 300-600 palabras |
| Referencia / Glosario | Variable (definición por término) |
| Preguntas frecuentes | 200-500 palabras (suma de Q&A) |

Más corto es mejor. Si un artículo supera estos rangos, evaluar dividirlo en dos artículos enlazados — pero no es una regla absoluta: cuando el contenido cubre variantes estrechamente relacionadas de un mismo flujo (por ejemplo, distintas formas de completar el mismo popup o pantalla), mantenerlo en un solo artículo puede ser preferible a fragmentar la navegación, aunque supere el rango objetivo (actualizado 2026-08-24, caso de referencia: `anadir-pagos-a-tu-factura-de-venta.md`).

## 10. Qué Evitar

- Sin lenguaje de marketing: en artículos de tarea — reservarlo solo para artículos de descripción general.
- Sin asumir conocimiento previo del usuario — siempre indicar los prerrequisitos.
- Sin bloques de texto densos: cualquier bloque de más de 4 oraciones se convierte en lista o se divide.
- Sin saltarse la introducción: incluso los artículos de tarea necesitan una oración orientadora antes de los pasos.
- Sin contenido redundante: si dos artículos cubren pasos superpuestos, enlazar en vez de duplicar.
- Sin callejones sin salida: todo artículo termina con artículos relacionados o un enlace al paso siguiente.

## 11. Estándares de Capturas de Pantalla

### Dimensiones y formato

- Resolución mínima de las capturas de pantalla completa: 1280×720 px. Los recortes de una ventana o un campo pueden ser más pequeños.
- Formato: PNG.
- Relación de aspecto: mantener la proporción original — nunca estirar ni recortar de forma arbitraria.
- Área de captura: mostrar solo la sección relevante de la interfaz, no la pantalla completa, salvo que el contexto lo requiera.

### Herramientas de anotación

Usar una herramienta consistente en todo el equipo. Las anotaciones permitidas son:

- **Recuadros**: para delimitar una sección de la interfaz. El recuadro debe ser color amarillo Etendo (`#FFD000`). Respetarlo en todas las imágenes del sitio.
- **Numeración**: para correlacionar pasos del texto con elementos en la imagen.

### Qué no puede aparecer en una captura

- **El menú lateral desplegado**: plegarlo antes de capturar, de modo que solo se vean los iconos.
- **El usuario**: ni su nombre, ni su inicial o avatar, ni su email. Si al plegar el menú sigue viéndose la inicial abajo a la izquierda, recortar esa zona.
- **El cursor del ratón, avisos y notificaciones** (por ejemplo, avisos de pago o de límite de crédito).
- **Datos de clientes o documentos reales**, incluidos los de la empresa AGRO GM.
- **Datos que delaten una prueba**: palabras como test, prueba, QA, demo o ejemplo; códigos inventados (QA5654, TEST-001); direcciones como "Calle Prueba"; archivos llamados `factura-prueba…`.
- **Nombres de personas famosas** (cantantes, actores, deportistas…) como contactos, ni marcas o equipos reales como productos.
- **Textos en inglés o de una versión anterior de la interfaz.**

### Datos de ejemplo

- Usar datos creíbles, parecidos a los de una pyme real, pero inventados: nombres de empresa y de producto normales (por ejemplo, "Picos Verticales SL", "Mochila Trekking 40L"), direcciones con aspecto real y documentos con su numeración habitual.
- Nunca capturar emails reales, datos fiscales reales ni información financiera real de nadie.
- Si la captura ya existe con datos que no se pueden mostrar, recapturarla. Si no es posible, enmascarar con un bloque de color sólido — no usar blur ni pixelado.

### Texto alternativo (alt text)

- Obligatorio en todas las imágenes.
- Describir qué muestra la captura, no solo "imagen 1".
- Ejemplo correcto: "Formulario de configuración de datos de facturación con los campos de dirección completados".
- La barra de URL del navegador no debe aparecer en las capturas, salvo que la URL sea parte de la instrucción.

## 12. Nomenclatura de URLs (Slugs)

### Patrón general

| Tipo | Patrón | Ejemplo |
|:-----|:-------|:--------|
| Tarea | `como-[verbo]-[objeto]` | `como-crear-una-factura-de-venta` |
| Descripción general | `que-es-[modulo]` | `que-es-el-modulo-de-ventas` |
| Guía de inicio | `[modulo]-guia-de-inicio` | `ventas-guia-de-inicio` |
| Guía avanzada | `[modulo]-guia-avanzada` | `ventas-guia-avanzada` |
| FAQ | `[modulo]-preguntas-frecuentes` | `ventas-preguntas-frecuentes` |
| Glosario | `glosario-de-[modulo]` | `glosario-de-ventas` |

### Reglas

- Solo minúsculas, sin tildes, sin caracteres especiales.
- Separar palabras con guiones (`-`), nunca con guion bajo (`_`) ni espacios.
- Máximo 60 caracteres por slug.
- No incluir el nombre del módulo padre si ya está en la ruta de la colección.
- No usar fechas ni números de versión en el slug (envejecen mal).

## 13. Series Multi-Parte

### Cuándo usar una serie vs. un artículo largo

- **Serie**: cuando hay 3 o más etapas claramente diferenciadas, cada una completable de forma independiente en una sesión de trabajo.
- **Artículo largo**: cuando los pasos son cortos y el usuario los completa de corrido sin interrupciones.

### Estructura de cada parte

```
H1: Paso [N]: [Título de la parte]
[1 oración indicando en qué punto de la serie está el usuario]
[Prerrequisito: enlace a la parte anterior si aplica]

[Contenido del paso]

H2: ¿Qué sigue?
[Enlace explícito a la parte siguiente con una oración de contexto]
[Enlace a la parte anterior para quienes necesiten volver]
```

### Convenciones de navegación entre partes

- El título de cada artículo debe incluir el número de paso: "Paso 1:", "Paso 2:", "Paso 3:".
- Al final de cada parte, incluir siempre un bloque "¿Qué sigue?" con el enlace a la siguiente parte.
- La última parte incluye un bloque "Has completado la serie" con enlaces a recursos avanzados.
- La colección que agrupa la serie debe mostrar los artículos en orden estricto.

### Slugs para series

```
[perfil]-paso-1-[descripcion]
[perfil]-paso-2-[descripcion]
[perfil]-paso-3-[descripcion]
```

Ejemplo:

```
agencias-paso-1-configura-tu-cuenta
agencias-paso-2-adapta-la-plataforma
agencias-paso-3-implementa-en-tu-equipo
```

## 14. Guías por Perfil de Usuario / Sector

### Cuándo crear una guía por perfil

- El flujo de trabajo del perfil difiere significativamente del flujo genérico.
- El perfil usa solo un subconjunto de módulos.
- Las decisiones de configuración varían según el sector.

### Tipos de perfil a considerar

- **Por tipo de negocio**: servicios, productos básicos, comercio mayorista, agencias.
- **Por rol de usuario**: administrador, contador, operador, vendedor.
- **Por nivel de experiencia**: usuario nuevo, usuario intermedio, usuario avanzado.

### Estructura de una guía por perfil

```
H1: [Plataforma] para [perfil]: tu punto de partida
[Párrafo de apertura: para quién es esta guía y qué problema resuelve]

H2: ¿Qué módulos usarás principalmente?
[Lista de módulos relevantes para este perfil con descripción de 1 línea]

H2: 1. Configura tu cuenta para [perfil]
[Enlace a la guía de configuración general + particularidades del perfil]

H2: 2. [Flujo de trabajo central para este perfil]
...

H2: Recursos adicionales para [perfil]
[Links a guías avanzadas, tutoriales en video, casos de uso del sector]
```

Señalar con una nota destacada cuando una funcionalidad es exclusiva de cierto plan o requiere configuración adicional.

## 15. Guías de Inicio vs. Guías Avanzadas

### Qué va en cada nivel

| Guía de inicio | Guía avanzada |
|:----------------|:---------------|
| Configuración mínima para empezar a operar | Configuraciones opcionales y personalizaciones |
| Casos de uso más frecuentes | Casos de uso específicos o poco comunes |
| Funciones incluidas en todos los planes | Funciones de planes superiores |
| Sin prerrequisitos de conocimiento | Asume que la guía de inicio fue completada |
| Máximo 7-8 secciones | Sin límite de secciones, puede ser más larga |

### Enlace entre niveles

- La guía de inicio cierra con: "¿Ya dominas los conceptos básicos? Continúa con la Guía avanzada →".
- La guía avanzada abre con: "Esta guía asume que ya completaste la configuración básica. Si aún no lo hiciste, empieza por la Guía de inicio →".
- Nunca llamarlas "básica" y "avanzada" en el título visible — usar "Guía de inicio" y "Guía avanzada" para que el nivel quede claro sin implicar inferioridad.

## 16. SEO y Búsqueda Interna

### Meta title

- Formato: `[Título del artículo] | [Nombre del Help Center]`
- Ejemplo: `Cómo crear una factura de venta | Etendo Docs`
- Longitud máxima: 60 caracteres para el título del artículo (antes del separador).
- El meta title puede diferir ligeramente del H1 si el H1 es muy largo, pero deben ser consistentes.

### Meta description

- 1 oración que resume lo que aprende o puede hacer el usuario tras leer el artículo.
- Longitud: 140-155 caracteres.
- Incluir el nombre de la funcionalidad principal y un verbo de acción.
- Ejemplo: "Aprende a crear, personalizar y enviar facturas de venta desde el módulo de Facturación."
- Agregar siempre el campo `description:` en el frontmatter con este texto (actualizado 2026-08-24: el soporte en mkdocs ya está habilitado y es la convención en uso en todos los artículos publicados).

### Optimización del contenido para búsqueda

- Incluir el término principal de búsqueda en el primer párrafo del artículo.
- El H1 debe coincidir con cómo el usuario buscaría ese tema.
- Usar los mismos términos que usa la interfaz del producto — si el botón dice "Nueva factura", el artículo dice "Nueva factura".
- No usar sinónimos distintos para el mismo elemento de UI en el mismo artículo.
- Los títulos de artículos son el principal insumo para la búsqueda interna — comenzar con el sustantivo principal, no con el verbo.
