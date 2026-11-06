---
title: Crear y gestionar albaranes de compra
description: >-
  Aprende a crear y gestionar albaranes de compra en Etendo para registrar
  la recepción física de mercancía y habilitar la factura correspondiente.
tags:
  - Albarán de Compra
  - Compras
  - Operaciones
  - Gestión Documental
  - Etendo
---

# Crear y gestionar albaranes de compra

## Descripción general

El **albarán de compra** registra la recepción física de mercancía de un proveedor. Puede generarse desde un [pedido de compra](../gestionar-tus-pedidos-de-compra/gestionar-tus-pedidos-de-compra.md#gestionar-los-documentos-pendientes) confirmado — marcando la opción **Crear albarán de proveedor** en el popup de confirmación, o más adelante con el botón **Gestionar recepción y factura** del pedido —, desde una [factura de compra](../gestionar-tus-facturas-de-compra/gestionar-tus-facturas-de-compra.md) confirmada con el botón **Gestionar recepción**, o crearse directamente desde la ventana **[Compras > Albarán](https://app.etendo.ai/goods-receipt){target="_blank"}** con **+ Nuevo albarán**. Una vez completado, habilita la generación de la [factura de compra](../crear-una-factura-de-compra/crear-una-factura-de-compra.md) o de una devolución.

```mermaid
flowchart LR
  A[Pedido de compra] -->|Gestionar recepción| B[Albarán de compra]
  F[Factura de compra] -->|Gestionar recepción| B
  N[Nuevo albarán] --> B
  B -->|Confirmar| C[Completado]
  C -->|Crear Factura| D[Factura de compra]
  C -->|Crear Devolución| E[Albarán de devolución]
```

Este artículo se organiza en dos flujos: primero cómo **crear un albarán** y confirmarlo, y luego cómo **gestionarlo** — generar la factura o la devolución correspondiente.

---

## Crear un albarán

### 1. Empieza un albarán nuevo

Puedes generar el albarán desde un [pedido de compra](../gestionar-tus-pedidos-de-compra/gestionar-tus-pedidos-de-compra.md#gestionar-los-documentos-pendientes) confirmado — marcando **Crear albarán de proveedor** en el popup de confirmación del pedido, o más adelante con el botón **Gestionar recepción y factura** — en cuyo caso el albarán hereda el contacto y las líneas pendientes del pedido de origen.

Si ya registraste la factura del proveedor y la mercancía llega después, puedes generar el albarán desde la [factura de compra](../gestionar-tus-facturas-de-compra/gestionar-tus-facturas-de-compra.md) confirmada con el botón **Gestionar recepción**. Se abre la ventana **¿Gestionar recepción?**, con el resumen de la factura y la opción **Crear albarán de compra**. Pulsa **Crear recepción**: el albarán se crea en Borrador con el contacto y las cantidades que faltan por recibir de esa factura. Revísalo y confírmalo como cualquier otro.

<figure markdown="span">
  ![Ventana ¿Gestionar recepción? abierta desde una factura de compra, con la opción Crear albarán de compra](assets/gestionar-recepcion-factura.png)
  <figcaption>Ventana ¿Gestionar recepción? de una factura confirmada: resumen de la factura y opción Crear albarán de compra, que se generará en Borrador con las líneas pendientes de recepción.</figcaption>
</figure>

Alternativamente, puedes crearlo directamente accediendo a **[Compras > Albarán](https://app.etendo.ai/goods-receipt){target="_blank"}** y usando el botón **+ Nuevo albarán** en la esquina superior derecha.

### 2. Completa el formulario

<figure markdown="span">
  ![Vista formulario del Albarán de compra](assets/crear-y-gestionar-albaranes-de-compra-1.png)
  <figcaption>Cabecera del albarán con las opciones + Añadir líneas, Importar desde pedido y Añadir desde Factura.</figcaption>
</figure>

El formulario se abre al crear un albarán nuevo o al hacer clic en **Editar** desde la vista detalle.

**Cabecera**

- **Contacto** *(requerido)* — proveedor que envía la mercancía; se autocompleta desde el pedido de origen si el albarán se generó desde uno.
- **Nº documento** — número del albarán del proveedor. Manual; puede dejarse en blanco.
- **Fecha del movimiento** *(requerido)* — fecha real de la recepción; por defecto la fecha actual, editable.
- **Almacén** *(requerido)* — almacén donde se recibe la mercancía; se carga con tu almacén por defecto y es editable.
- **Moneda** *(requerido)* — moneda del documento.
- **Dirección** *(requerido)* — dirección del proveedor para este movimiento.

**Pestaña Líneas**

En un albarán de compra en borrador, la pestaña Líneas ofrece tres formas de incorporar productos: **+ Añadir líneas** agrega una línea vacía para completar manualmente (producto y cantidad recibida); **Importar desde pedido** abre un buscador de pedidos de compra confirmados del proveedor, con cada pedido expandible para elegir qué líneas y qué cantidad importar; y **Añadir desde Factura** importa líneas desde una factura de compra ya existente del mismo proveedor.

<figure markdown="span">
  ![Albarán con dos líneas de producto añadidas manualmente](assets/crear-y-gestionar-albaranes-de-compra-2.png)
  <figcaption>Albarán en Borrador con dos líneas añadidas manualmente: Cámara Web Full HD y Altavoz Portátil Bluetooth.</figcaption>
</figure>

A diferencia de una factura o un pedido, las líneas del albarán solo registran **Producto**, **Cant. movida** (cantidad recibida) y, cuando la línea proviene de un pedido, **Cant. pedido** (cantidad original solicitada) — no incluyen precio ni impuesto, porque el albarán es un movimiento de stock, no un documento de cobro o pago.

Debajo de las líneas, la sección **DOCUMENTOS** muestra el pedido de origen como enlace navegable cuando corresponde, y el campo **NOTAS** permite añadir observaciones internas que no se incluyen en el PDF. El formulario incluye también una pestaña **Adjuntos**, para vincular archivos al albarán (PDF, Word, Excel, PowerPoint o imágenes).

En Borrador, la barra superior muestra **Cancelar**, las etiquetas **Borrador** y **Sin contabilizar**, y las acciones **Eliminar** (icono de papelera), **Copiar enlace**, **Clonar**, **Guardar** y **Confirmar**.

### 3. Confirma el albarán

<figure markdown="span">
  ![Popup ¿Registrar factura? al confirmar un Albarán de compra](assets/registrar-factura.png)
  <figcaption>Popup ¿Registrar factura? mostrado al confirmar el albarán, con el interruptor Crear Factura de Compra activado por defecto y el selector Tarifa.</figcaption>
</figure>

Al hacer clic en **Confirmar**, el sistema muestra el popup **¿Registrar factura?**, con el número del albarán y el proveedor. Desde ahí confirmas el albarán y, si quieres, generas la factura en el mismo paso:

- El interruptor **Crear Factura de Compra** viene activado por defecto: genera una [factura de compra](../crear-una-factura-de-compra/crear-una-factura-de-compra.md) precompletada con el proveedor, los productos recibidos y las cantidades del albarán.
- El selector **Tarifa** define la lista de precios que se aplica a esa factura.
- Pulsa **Confirmar y crear factura** para confirmar el albarán y generar la factura en el mismo paso.

Si no quieres generar la factura ahora, desactiva el interruptor: el selector **Tarifa** desaparece y el botón pasa a llamarse **Confirmar albarán**.

!!! warning "El albarán no se puede editar tras confirmar"
    Una vez confirmado, el albarán queda bloqueado. Verifica el contacto, el almacén y las cantidades antes de confirmar.

---

## Gestionar albaranes

### 1. Busca el albarán

<figure markdown="span">
  ![Vista lista de Albarán de compra](assets/crear-y-gestionar-albaranes-de-compra-5.png)
  <figcaption>Vista lista de Albarán de compra con columnas de estado y progreso de facturación.</figcaption>
</figure>

La vista lista de **[Compras > Albarán](https://app.etendo.ai/goods-receipt){target="_blank"}** muestra las columnas **Fecha del movimiento**, **Nº documento**, **Contacto**, **Estado doc.**, **Contabilizado**, **Almacén** y **Estado de facturación** — esta última con un indicador circular con el porcentaje. Al pasar el cursor sobre una fila aparecen accesos rápidos para abrir el documento y clonarlo. Los selectores de **estado del documento** y **fecha** permiten filtrar la lista, y **Filtros** habilita condiciones adicionales.

### 2. Abre el albarán

<figure markdown="span">
  ![Vista detalle de Albarán de compra](assets/crear-y-gestionar-albaranes-de-compra-6.png)
  <figcaption>Vista detalle de un albarán completado sin factura generada todavía: Pedido origen y Documentos relacionados muestran "—" / vacío.</figcaption>
</figure>

Al hacer clic sobre un albarán existente en la lista se abre el panel de detalle, con la acción **Editar** en la cabecera. El panel muestra **Nº documento**, **Proveedor**, **Almacén**, **Fecha del movimiento**, **Estado** y **Estado de facturación** (el mismo indicador de progreso que en la vista lista); el campo **Pedido origen** enlaza al pedido de compra desde el que se generó el albarán y muestra "—" cuando el albarán se creó directamente o desde una factura, y la sección **DOCUMENTOS RELACIONADOS** muestra los documentos vinculados al albarán, cuando corresponde: el pedido de origen, las facturas generadas a partir del albarán y la devolución, si la hay.

A la izquierda del panel, un área para **subir un documento** (PDF, JPG, PNG, WebP o GIF) permite adjuntar una copia del comprobante físico entregado por el proveedor, útil como respaldo del movimiento aunque no se haya cargado nada en la pestaña Adjuntos del formulario.

### 3. Genera la factura o la devolución

<figure markdown="span">
  ![Albarán completado y facturado parcialmente con la acción Crear Factura](assets/formulario-facturado-parcial.png)
  <figcaption>Albarán Completado y Contabilizado, facturado en parte: la acción Crear Factura sigue disponible en la barra superior para facturar lo que queda pendiente.</figcaption>
</figure>

<figure markdown="span">
  ![Popup Generar factura abierto desde un Albarán de compra con el selector Tarifa](assets/generar-factura-albaran.png)
  <figcaption>Popup Generar factura de un albarán completado, con el proveedor, el importe, el selector Tarifa y las unidades pendientes de facturar.</figcaption>
</figure>

Mientras quede cantidad pendiente de facturar, la acción **Crear Factura** abre el popup **Generar factura**, que muestra el proveedor, el importe, el selector **Tarifa** y las unidades pendientes de facturar. Pulsa **Crear →** para generar la [factura de compra](../crear-una-factura-de-compra/crear-una-factura-de-compra.md) con el proveedor, los productos recibidos y las cantidades pendientes: la factura se crea y se confirma automáticamente, en estado Completado, y el popup **Factura creada** te lo confirma. Pulsa **Cancelar** para cerrar el popup sin generar nada.

**Crear Factura** sigue disponible aunque el albarán ya tenga facturas generadas, si estas cubren solo una parte (facturación parcial). Cuando el albarán llega a **Facturado 100%**, el botón desaparece y solo queda **Crear Devolución**. Para ver qué línea de factura quedó emparejada con cada línea del albarán, consulta [Relación albarán-factura](../relacion-albaran-factura/relacion-albaran-factura.md).

!!! info "El proveedor necesita una tarifa de compra para generar la factura"
    Si el proveedor no tiene una lista de precios de compra configurada, **Crear Factura** (o la opción del popup al confirmar) muestra un aviso y no genera el documento. Configura la tarifa del proveedor antes de intentarlo de nuevo.

La acción **Crear Devolución** abre el asistente **Crear Devolución desde Albarán**, en el que eliges qué productos y qué cantidades devuelves. El asistente crea un albarán de devolución en Borrador. Consulta [Crear una devolución de compra](../crear-una-devolucion-de-compra/crear-una-devolucion-de-compra.md#registrar-una-devolucion-fisica) para el paso a paso. Las devoluciones ya registradas se consultan en [Gestionar tus albaranes de devolución](../gestionar-tus-albaranes-de-devolucion/gestionar-tus-albaranes-de-devolucion.md).

Independientemente de estas acciones, usa **Contabilizar** (menú ⋮) cuando quieras registrar el movimiento contablemente — la etiqueta **Contabilizado / Sin contabilizar** no cambia automáticamente al confirmar el albarán. El menú ⋮ muestra una sola opción según el caso: **Contabilizar** si el albarán está sin contabilizar, o **Descontabilizar** si ya está contabilizado, para revertir su contabilización.

---

## Estados del Documento

| Estado | Descripción |
|---|---|
| <span style="background:#F3F4F6;color:#6B7280;padding:2px 10px;border-radius:12px;font-size:.85em;white-space:nowrap">Borrador</span> | En preparación. El documento es completamente editable. |
| <span style="background:#F0FDF4;color:#22C55E;padding:2px 10px;border-radius:12px;font-size:.85em;white-space:nowrap">Completado</span> | Confirmado. Ya no es editable. Puede facturarse o devolverse. |

---

## Acciones Disponibles

| Acción | Descripción | Estado |
| :--- | :--- | :--- |
| **Cancelar** | Cierra el formulario y vuelve a la lista, descarta los cambios no guardados. | Borrador y Completado |
| **Guardar** | Guarda el documento sin cambiar su estado. | Solo en Borrador |
| **Confirmar** | Confirma el albarán y lo pasa a estado Completado, con la opción de generar la factura en el mismo paso (consulta [Confirma el albarán](#3-confirma-el-albaran)). | Solo en Borrador |
| **Crear Devolución** | Abre el asistente **Crear Devolución desde Albarán**, que genera un [albarán de devolución](../crear-una-devolucion-de-compra/crear-una-devolucion-de-compra.md#registrar-una-devolucion-fisica) en Borrador. | Solo en Completado |
| **Crear Factura** | Abre el popup **Generar factura** y crea una [factura de compra](../crear-una-factura-de-compra/crear-una-factura-de-compra.md) en estado Completado con las cantidades pendientes de facturar. | Completado, mientras quede cantidad pendiente de facturar |
| **Clonar** | Crea un nuevo borrador con el mismo proveedor y líneas. | Borrador y Completado |
| **Copiar enlace** | Copia la dirección del albarán para compartirla con otra persona de tu equipo. | Borrador y Completado |
| **Contabilizar** | Disponible en el menú ⋮. Registra el movimiento contablemente. | Completado y Sin contabilizar |
| **Descontabilizar** | Disponible en el menú ⋮. Revierte la contabilización del albarán. | Completado y Contabilizado |
| **Eliminar** | Icono de papelera. Elimina el documento con confirmación previa. | Solo en Borrador |

## Artículos Relacionados

- [Gestionar tus pedidos de compra](../gestionar-tus-pedidos-de-compra/gestionar-tus-pedidos-de-compra.md)
- [Registrar una factura de compra](../crear-una-factura-de-compra/crear-una-factura-de-compra.md)
- [Crear una devolución de compra](../crear-una-devolucion-de-compra/crear-una-devolucion-de-compra.md)

---
Esta obra está bajo la licencia :material-creative-commons: :fontawesome-brands-creative-commons-by: :fontawesome-brands-creative-commons-sa: [CC BY-SA 2.5 ES](https://creativecommons.org/licenses/by-sa/2.5/es/){target="_blank"} de [Futit Services S.L](https://etendo.software){target="_blank"}.
