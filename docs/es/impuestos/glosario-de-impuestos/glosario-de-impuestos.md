---
title: Glosario de Impuestos
tags:
    - Impuestos
    - Fiscalidad
    - Glosario
    - Etendo
---

# Glosario de Impuestos

## Impuesto

Registro que define un tipo impositivo: su nombre, el porcentaje que aplica (**Índice**), si opera en documentos de venta y/o de compra, su vigencia (**Válido desde**) y las cuentas contables de impuesto repercutido y reclamado que genera. Ver [Tipos de impuestos y sus porcentajes](../tipos-de-impuestos-y-sus-porcentajes/tipos-de-impuestos-y-sus-porcentajes.md).

## Índice

Porcentaje que un Impuesto aplica sobre la base imponible de una línea. Puede ser positivo (impuesto estándar), cero (operación exenta o no sujeta) o negativo (recargos de equivalencia e inversión del sujeto pasivo).

## Base Imponible

Importe sobre el que se calcula un impuesto. En la mayoría de los impuestos es el importe neto de línea.

## Tipo de impuesto

Régimen fiscal al que pertenece un impuesto, según el territorio de la organización: **IVA** (régimen común), **IGIC** (Canarias) o **IPSI** (Ceuta y Melilla).

## Tipo de tarifa

Nivel dentro de un régimen fiscal: **General**/**Normal**, **Reducido**, **Super reducido**, **Incrementado 1**, **Incrementado 2**, **Cero**, **Exento** o **No sujeto**.

## Categoría de Impuesto

Agrupa impuestos según su naturaleza fiscal, combinando un **Tipo de impuesto**, un tipo de operación y un **Tipo de tarifa**. Se usa para clasificar y filtrar impuestos, y para marcar si son declarables ante el SII.

## Territorio fiscal

La Hacienda ante la que tributa una organización según su domicilio fiscal: régimen común (AEAT), Comunidad Foral de Navarra (Hacienda Foral) o Territorios Históricos del País Vasco (Álava, Vizcaya o Guipúzcoa).

## Sistema fiscal

Mecanismo de envío telemático de la facturación asociado al territorio fiscal de la organización: **SII**, **TicketBAI** o **VERI\*FACTU**. Se activa desde Configuración Fiscal. Ver [Cómo activar tu sistema fiscal](../como-activar-un-modelo-tributario/como-activar-un-modelo-tributario.md).

## SIF

Sistema de Información Fiscal: el conjunto de sistemas a los que se remiten los registros de facturación según el sistema fiscal correspondiente (SII, TicketBAI o VERI\*FACTU). En Etendo da nombre a la pestaña **SIF** del detalle de cada factura y al botón **Enviar a SIF**, que reenvía sus registros al sistema o sistemas fiscales activos. Ver [Monitor Fiscal](../monitor-fiscal/monitor-fiscal.md).

## SII

[Suministro Inmediato de Información](../sii/sii.md). Sistema por el que se envían electrónicamente los registros de facturación a la Sede electrónica de la AEAT (o a la Hacienda Foral correspondiente), con un plazo general de remisión de 4 días. Es obligatorio para Grandes Empresas, grupos de IVA e inscritos en REDEME, y puede adoptarse también de forma voluntaria.

## TicketBAI

Sistema de facturación electrónica [obligatorio para sociedades con domicilio fiscal en Álava, Vizcaya o Guipúzcoa](../ticketbai/ticketbai.md). Según el volumen de la empresa, puede combinarse con el SII.

## VERI\*FACTU

Sistema de [verificación de facturas](../verifactu/verifactu.md): el propio software de facturación genera los registros de alta y anulación, su huella (*hash*) y un código QR, y los remite a la AEAT de forma automática y continuada. Es una alternativa al SII para quienes no están obligados a él.

## REDEME

Registro de Devolución Mensual del IVA. Estar inscrito en REDEME obliga a acogerse al SII.

## Gran Empresa

Organización cuyo volumen de operaciones superó los 6.010.121,04 € en el ejercicio anterior. Está obligada al SII y no puede acogerse a VERI\*FACTU.

## Grupo de IVA

Conjunto de entidades que tributan el IVA de forma conjunta y consolidada, acogiéndose a un régimen especial. Pertenecer a un grupo de IVA obliga a acogerse al SII.

## VIES

*VAT Information Exchange System*: sistema europeo de validación en tiempo real de números de IVA intracomunitario. El NIF-IVA de un contacto muestra un **Estado VIES** (**Pendiente**, **Inválido** o **Válido**) que confirma si ese NIF está registrado y activo para operar dentro de la UE. Es especialmente relevante para las operaciones intracomunitarias del [Modelo 349](../modelo-349/modelo-349.md).

## Recargo de equivalencia / Inversión del sujeto pasivo

Dos regímenes especiales de IVA que se reflejan con un **Índice** negativo en el impuesto aplicado: el **recargo de equivalencia** es un recargo adicional que el proveedor repercute a minoristas en lugar de que estos liquiden el IVA directamente; la **inversión del sujeto pasivo** traslada la obligación de liquidar el IVA del vendedor al comprador (habitual, por ejemplo, en operaciones intracomunitarias).

## Catálogo de modelos

Panel en **[Finanzas > Modelos Fiscales](https://app.etendo.ai/fiscal-models){target="_blank"}** donde activas los modelos fiscales que vas a gestionar: Modelo 303, Modelo 349 y Modelo 390. Un modelo tiene que estar activo antes de poder crear declaraciones para él. Mientras no tengas ninguno activo, Modelos Fiscales muestra el aviso "No hay modelos activos. Configúralos desde el Catálogo de modelos." Para activar uno: pulsa **Catálogo de modelos** y activa su interruptor (por ejemplo, "Modelo 303 - Autoliquidación IVA"); el cambio se guarda al momento y el botón **+ Nueva declaración** queda disponible para ese modelo.

Los modelos activos también deciden qué secciones fiscales ves en la ventana [Organización](../../sistema/configuracion/como-gestionar-tu-organizacion/como-gestionar-tu-organizacion.md#secciones-fiscales): el 303 y el 390 muestran **Actividades del IAE** y **Certificado digital**, y el 390 añade **Representante legal / Modelo 390**. El 349, en cambio, muestra la opción **Correctiva del 349** en las facturas rectificativas.

## IAE

*Impuesto sobre Actividades Económicas*: tributo que identifica la actividad económica de una empresa o un autónomo mediante un **epígrafe**. En Etendo se declara en la sección **Actividades del IAE** de la ventana [Organización](../../sistema/configuracion/como-gestionar-tu-organizacion/como-gestionar-tu-organizacion.md#actividades-del-iae), que aparece cuando está activo el [Modelo 303](../modelo-303/modelo-303.md) o el Modelo 390.

## Declaración

Documento periódico que resume la información fiscal de un período para presentarlo ante Hacienda, por ejemplo el Modelo 303, el Modelo 349 o el Modelo 390. Se crea desde **[Finanzas > Modelos Fiscales](https://app.etendo.ai/fiscal-models){target="_blank"}**, una vez activado el modelo correspondiente en el Catálogo de modelos.

## Período

Tramo de tiempo que cubre una declaración. Tanto el Modelo 303 como el Modelo 349 admiten periodicidad **trimestral** (T1 a T4) o **mensual**, según el volumen de operaciones de tu organización.

## Artículos Relacionados

- [¿Qué puedes hacer en Impuestos?](../que-puedes-hacer-en-impuestos/que-puedes-hacer-en-impuestos.md)
- [Cómo activar tu sistema fiscal](../como-activar-un-modelo-tributario/como-activar-un-modelo-tributario.md)
- [Modelo 303](../modelo-303/modelo-303.md)

---
Esta obra está bajo la licencia :material-creative-commons: :fontawesome-brands-creative-commons-by: :fontawesome-brands-creative-commons-sa: [CC BY-SA 2.5 ES](https://creativecommons.org/licenses/by-sa/2.5/es/){target="_blank"} de [Futit Services S.L](https://etendo.software){target="_blank"}.
