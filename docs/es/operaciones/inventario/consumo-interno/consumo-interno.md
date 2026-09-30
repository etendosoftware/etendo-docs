---
tags:
    - Consumo interno
    - Inventario
    - Almacén
    - Etendo
---

# ¿Qué es la sección Consumo interno?

La sección **Consumo interno** es donde registras salidas de stock que no son una venta — por ejemplo, mercadería dañada, muestras, uso interno o materia prima consumida en un proceso. A diferencia de un [albarán de venta](../../../comercial/ventas/crear-y-gestionar-albaranes/crear-y-gestionar-albaranes.md), un consumo interno no está asociado a ningún cliente ni genera una factura.

## Vista lista

<figure markdown="span">
  ![Vista lista de Consumo interno](assets/que-es-consumo-interno-1.png)
  <figcaption>Vista lista de Consumo interno, con columnas de Fecha del movimiento, Nombre, Estado y Contabilizado.</figcaption>
</figure>

La lista de Consumo interno muestra los documentos creados, con columnas **Fecha del movimiento**, **Nombre**, **Estado** (Borrador o Completado) y **Contabilizado** (Sin contabilizar, Contabilizado o Error al contabilizar). Para registrar un consumo nuevo usa el botón **+ Nuevo consumo**.

## Detalle de un consumo interno

<figure markdown="span">
  ![Detalle de un Consumo interno](assets/que-es-consumo-interno-2.png)
  <figcaption>Detalle de un Consumo interno completado y contabilizado, con sus líneas de producto, cantidad, unidad y almacén.</figcaption>
</figure>

El encabezado del documento incluye:

- **Fecha del movimiento** *(obligatorio)*.
- **Nombre** *(obligatorio)* — un texto libre que identifica el consumo (por ejemplo, *Material de taller*).

A diferencia de un ajuste de [Inventario físico](../inventario-fisico/inventario-fisico.md), aquí **no eliges un almacén en el encabezado**: cada línea define su propio almacén. Las líneas se habilitan una vez que guardas el encabezado: haz clic en **Guardar** y luego en **+ Añadir líneas**. En cada línea agregas un producto:

- **Producto** — el buscador muestra los productos con stock y, al desplegar uno, los almacenes donde lo tiene y la cantidad disponible en cada uno. Al elegir un almacén de esa lista, se completan el producto y el almacén de la línea.
- **Cant. movida** *(obligatorio)* — la cantidad que sale del almacén.
- **Unidad** (solo lectura) — la unidad de medida del producto.
- **Almacén** — el almacén del que sale la mercadería. Se completa con la opción que elegiste en **Producto**, pero puedes cambiarlo desde el desplegable.

Además de las líneas, cada consumo tiene una pestaña **Adjuntos** para sumar archivos relacionados.

## Qué pasa al confirmar el documento

Al hacer clic en **Confirmar**, el sistema resta el stock del almacén elegido en cada línea. El documento queda con estado **Completado** y bloqueado para edición: si te equivocaste, se corrige con un nuevo consumo.

Contablemente, ese movimiento no se registra como venta: se contabiliza contra la cuenta de gastos definida en la [categoría del producto](../productos/index.md#categoria-y-configuracion-contable), en lugar de la cuenta de ingresos que usaría un albarán de venta. La contabilización no es inmediata: justo después de confirmar, el documento aparece como **Sin contabilizar** hasta que un proceso automático lo contabiliza, al cabo de unos minutos. También puedes contabilizarlo manualmente sin esperar.

!!! warning "Si la contabilización falla"
    El documento queda marcado como "Error al contabilizar", pero la salida de stock ya se aplicó igual. Revisa la configuración contable de la categoría del producto.

## Recursos y próximos pasos

Si en cambio la salida de stock corresponde a una venta a un cliente, usa la [sección Ventas](../../../comercial/ventas/que-es-la-seccion-ventas/que-es-la-seccion-ventas.md) en lugar de un consumo interno. Y si lo que necesitas es corregir el stock registrado tras un conteo físico, usa [Inventario físico](../inventario-fisico/inventario-fisico.md).

---

## Artículos Relacionados

- [¿Qué es la sección Inventario?](../que-es-inventario/que-es-inventario.md)
- [¿Qué es la sección Almacén?](../almacenes/index.md)
- [¿Qué es la sección Movimiento entre almacenes?](../movimiento-de-almacenes/movimiento-de-almacenes.md)

---
Esta obra está bajo la licencia :material-creative-commons: :fontawesome-brands-creative-commons-by: :fontawesome-brands-creative-commons-sa: [CC BY-SA 2.5 ES](https://creativecommons.org/licenses/by-sa/2.5/es/){target="_blank"} de [Futit Services S.L](https://etendo.software){target="_blank"}.
