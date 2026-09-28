---
tags:
    - Movimiento entre almacenes
    - Inventario
    - Almacén
    - Etendo
---

# ¿Qué es la sección Movimiento entre almacenes?

La sección **Movimiento entre almacenes** es donde transfieres stock de un almacén a otro dentro de Etendo, sin que eso se registre como una venta ni como una compra. Se usa, por ejemplo, para redistribuir mercadería entre sucursales o para centralizar stock antes de un pedido grande.

## Vista lista

La lista de Movimiento entre almacenes muestra los movimientos creados, con columnas **Nombre**, **Fecha del movimiento**, **Nº documento**, **Estado** (Borrador o Procesado) y **Contabilizado**. Para registrar un movimiento nuevo usa el botón **+ Nuevo movimiento**.

<figure markdown="span">
  ![Vista lista de Movimiento entre almacenes](assets/que-es-movimiento-entre-almacenes-1.png)
  <figcaption>Vista lista de Movimiento entre almacenes, con columnas de Nombre, Fecha del movimiento, Nº documento, Estado y Contabilizado.</figcaption>
</figure>

## Detalle de un movimiento

El encabezado del documento incluye:

- **Nombre** *(obligatorio)* — se autocompleta con la fecha, pero puede editarse.
- **Fecha del movimiento** *(obligatorio)*.
- **Nº documento** (solo lectura) — número secuencial que asigna el sistema al crear el registro.

En las líneas agregas un renglón por producto:

- **Producto** *(obligatorio)*.
- **Unidad** (solo lectura) — la unidad de medida del producto.
- **Almacén origen** *(obligatorio)* — de dónde sale la mercadería.
- **Almacén destino** *(obligatorio)* — a dónde llega. Debe ser distinto del almacén origen.
- **Cantidad** *(obligatorio)* — la cantidad a transferir. No puede superar el stock disponible del producto en el almacén origen.

Además de las líneas, cada movimiento tiene una pestaña **Adjuntos** para sumar archivos relacionados.

<figure markdown="span">
  ![Detalle de un Movimiento entre almacenes](assets/que-es-movimiento-entre-almacenes-2.png)
  <figcaption>Detalle de un Movimiento entre almacenes procesado, con el producto, el almacén origen, el almacén destino y la cantidad transferida.</figcaption>
</figure>

## Qué pasa al procesar el movimiento

Al hacer clic en **Procesar**, el sistema resta la cantidad transferida del stock del almacén origen y la suma al stock del almacén destino, y el documento queda con estado **Procesado** y bloqueado para edición: si te equivocaste, se corrige con un nuevo movimiento. El stock total de la empresa no cambia — solo se redistribuye entre almacenes.

A diferencia de Inventario físico y Consumo interno, un Movimiento entre almacenes no intenta contabilizarse: la columna Contabilizado siempre muestra **Documento deshabilitado**, porque transferir stock entre tus propios almacenes no genera ningún asiento contable.

## Recursos y próximos pasos

Antes de transferir stock entre dos almacenes, ambos deben existir: revisa cómo [crear un almacén](../almacenes/crear-un-almacen/crear-un-almacen.md) si todavía te falta alguno.

---

## Artículos Relacionados

- [¿Qué es la sección Inventario?](../que-es-inventario/que-es-inventario.md)
- [¿Qué es la sección de Productos?](../productos/index.md)
- [¿Qué es la sección Almacén?](../almacenes/index.md)
- [¿Qué es la sección Inventario físico?](../inventario-fisico/index.md)
- [¿Qué es la sección Consumo interno?](../consumo-interno/index.md)

---
Esta obra está bajo la licencia :material-creative-commons: :fontawesome-brands-creative-commons-by: :fontawesome-brands-creative-commons-sa: [CC BY-SA 2.5 ES](https://creativecommons.org/licenses/by-sa/2.5/es/){target="_blank"} de [Futit Services S.L](https://etendo.software){target="_blank"}.
