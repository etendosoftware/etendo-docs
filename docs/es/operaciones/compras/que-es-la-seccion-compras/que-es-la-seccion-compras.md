---
title: ¿Qué es la sección Compras?
tags:
  - Compras
  - Operaciones
  - Proveedores
  - Etendo
---

# ¿Qué es la sección Compras?

La sección **Compras**, dentro de **Operaciones**, reúne los documentos con los que gestionas el ciclo completo con tus proveedores: desde que pides mercancía o servicios hasta que pagas la factura correspondiente. Tenerla al día te permite saber en todo momento qué pediste, qué recibiste, qué te queda por pagar y con qué proveedores tienes saldo a tu favor.

```mermaid
flowchart LR
  A[Pedido] -->|Confirmar| B[Albarán]
  A -->|Confirmar| C[Factura]
  B --> C
  B -->|Devolución| D[Albarán de devolución]
  D --> E[Factura Rectificativa]
  C -->|Añadir pago| F[Pagada]
```

## Los documentos de Compras

- **Pedido** — formaliza la solicitud de productos o servicios a un proveedor. Es el punto de entrada del ciclo de compras y dispara el movimiento de stock esperado. Ver [Gestionar tus pedidos de compra](../gestionar-tus-pedidos-de-compra/gestionar-tus-pedidos-de-compra.md).
- **Albarán** — registra la recepción física de la mercancía pedida a un proveedor. Ver [Crear y gestionar albaranes de compra](../crear-y-gestionar-albaranes-de-compra/crear-y-gestionar-albaranes-de-compra.md).
- **Factura** — registra la obligación de pago al proveedor. Puede crearse directamente o generarse desde un pedido o un albarán confirmado. Ver [Gestionar tus facturas de compra](../gestionar-tus-facturas-de-compra/gestionar-tus-facturas-de-compra.md).
- **Albarán de devolución** — registra la devolución física de mercancía ya recibida a un proveedor, y permite generar la Factura Rectificativa correspondiente al confirmarlo. Ver [Gestionar tus albaranes de devolución](../gestionar-tus-albaranes-de-devolucion/gestionar-tus-albaranes-de-devolucion.md).
- **Factura Rectificativa** — corrige el importe de una factura de compra. Puede generarse a partir de una devolución de mercancía o crearse directamente como ajuste financiero, sin devolución (por ejemplo, para corregir un precio o aplicar un descuento del proveedor). Ver [Crear una devolución de compra](../crear-una-devolucion-de-compra/crear-una-devolucion-de-compra.md) y [Registrar una factura rectificativa](../registrar-una-factura-rectificativa/registrar-una-factura-rectificativa.md).

Estos cinco documentos se relacionan entre sí: un pedido confirmado puede generar un albarán y/o una factura. Un albarán ya recibido puede devolverse mediante un albarán de devolución, que a su vez puede generar una Factura Rectificativa. Cada documento queda enlazado al que le dio origen, así que en cualquier momento puedes navegar de uno a otro para seguir el rastro completo de una compra.

Además de estos documentos, la sección incluye una ventana de consulta:

- **Relación albarán-factura** — muestra qué línea de cada factura de compra (o Factura Rectificativa) se emparejó con qué línea de albarán (recepción o devolución). Es de solo consulta: no se crean documentos desde ahí. Ver [Relación albarán-factura](../relacion-albaran-factura/relacion-albaran-factura.md).

## Dónde lo vas a usar

- **Al pedir mercancía o un servicio a un proveedor** — creas un pedido de compra, que después puedes confirmar para generar el albarán de recepción y la factura correspondiente. Ver [Crear un pedido de compra](../crear-un-pedido-de-compra/crear-un-pedido-de-compra.md).
- **Al recibir la factura del proveedor** — subes el PDF y Copilot, el agente de IA integrado en la interfaz de Etendo (un agente dentro de la propia plataforma que te ayuda a consultar información y a ejecutar acciones sin salir del sistema), lee sus datos y completa la factura por ti (ver [Escanear facturas de compra con Copilot](../escanear-facturas-de-compra-con-copilot/escanear-facturas-de-compra-con-copilot.md)). También puedes cargarla a mano o generarla desde el pedido. Después haces seguimiento del pago hasta saldarla.
- **Al devolver mercancía** — registras una devolución de compra. Ver [Crear una devolución de compra](../crear-una-devolucion-de-compra/crear-una-devolucion-de-compra.md).
- **Al corregir un importe ya facturado** — registras la Factura Rectificativa que te envía el proveedor. Ver [Registrar una factura rectificativa](../registrar-una-factura-rectificativa/registrar-una-factura-rectificativa.md).
- **Al comprobar que lo facturado coincide con lo recibido** — revisas qué línea de factura se emparejó con cada línea de albarán. Ver [Relación albarán-factura](../relacion-albaran-factura/relacion-albaran-factura.md).

Para crear cualquiera de estos documentos necesitas tener cargado el [contacto](../../../comercial/contactos/que-es-la-seccion-contactos/que-es-la-seccion-contactos.md) del proveedor, con el rol **Proveedor** activo. Con el proveedor ya cargado, ya puedes avanzar a crear tu primer pedido o registrar directamente tu primera factura de compra.

## Recursos y próximos pasos

- [Crear un pedido de compra](../crear-un-pedido-de-compra/crear-un-pedido-de-compra.md)
- [Crear y gestionar albaranes de compra](../crear-y-gestionar-albaranes-de-compra/crear-y-gestionar-albaranes-de-compra.md)
- [Registrar una factura de compra](../crear-una-factura-de-compra/crear-una-factura-de-compra.md)
- [Añadir pagos a tu factura de compra](../anadir-pagos-a-tu-factura-de-compra/anadir-pagos-a-tu-factura-de-compra.md)
- [Gestionar tus facturas de compra](../gestionar-tus-facturas-de-compra/gestionar-tus-facturas-de-compra.md)
- [Crear una devolución de compra](../crear-una-devolucion-de-compra/crear-una-devolucion-de-compra.md)
- [Gestionar tus albaranes de devolución](../gestionar-tus-albaranes-de-devolucion/gestionar-tus-albaranes-de-devolucion.md)
- [Registrar una factura rectificativa](../registrar-una-factura-rectificativa/registrar-una-factura-rectificativa.md)
- [Relación albarán-factura](../relacion-albaran-factura/relacion-albaran-factura.md)

Empieza por el documento que necesites en este momento — no hace falta seguir un orden estricto entre pedido, albarán y factura.

## Artículos relacionados

- [¿Qué es la sección Contactos?](../../../comercial/contactos/que-es-la-seccion-contactos/que-es-la-seccion-contactos.md)
- [¿Qué es la sección Inventario?](../../inventario/que-es-inventario/que-es-inventario.md)

---
Esta obra está bajo la licencia :material-creative-commons: :fontawesome-brands-creative-commons-by: :fontawesome-brands-creative-commons-sa: [CC BY-SA 2.5 ES](https://creativecommons.org/licenses/by-sa/2.5/es/){target="_blank"} de [Futit Services S.L](https://etendo.software){target="_blank"}.
