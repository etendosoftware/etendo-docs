# Void or correct an issued invoice

## Overview

An **issued** (completed, `documentStatus = CO`) invoice is never voided, edited in place or deleted. Spanish invoicing rules require a **credit note** (*factura rectificativa*) that references it. This guide shows how an agent does that through MCP, for sales (`sales-invoice`) and supplier (`purchase-invoice`) invoices alike.

| The user asks | Do this | Never this |
|---------------|---------|------------|
| "void / cancel / anular this invoice" | A credit note for the **full** amount | `docAction: VO` (refused) · reactivating and deleting it |
| "one unit came back broken, correct it" | A credit note for **that line and quantity** | Editing the issued invoice |
| "it has a typo and it was never sent" | Ask the user first: reactivating (`RE`) reopens it as a draft; it does not void it | Assuming `RE` voids it |

`documentAction` on a completed invoice offers **only `RE`** (reactivate). `RE` reopens the invoice as a draft to fix a mistake before it is sent; the invoice keeps its number and stays an invoice. It is not a way to void it. Sending `VO` is refused with a message that points to the credit note.

## Prerequisites

- The original invoice is completed (`documentStatus = CO`).
- The accounting period of the credit note's date is open.
- The token has write scope.

## Create a credit note

The same five calls for a sales or a purchase invoice; replace `sales-invoice` with `purchase-invoice` for a supplier.

### 1. Find the corrective document type

```json
{ "tool": "etendo_selectors", "arguments": { "spec": "sales-invoice", "column": "transactionDocument" } }
```

Pick the item labelled *Corrective Sales Invoice* (*Corrective Purchase Invoice* for suppliers). Its id is tenant-specific: always look it up.

### 2. Create the credit note header

Same customer (or vendor) and address as the original, with the corrective document type:

```json
{
  "tool": "etendo_create",
  "arguments": {
    "spec": "sales-invoice",
    "fields": { "transactionDocument": "<corrective type id>", "businessPartner": "<customer id>", "partnerAddress": "<address id>" }
  }
}
```

### 3. Read the lines of the original

`id` is the **credit note**; `invoiceId` is the **original** invoice.

```json
{
  "tool": "etendo_action",
  "arguments": { "spec": "sales-invoice", "id": "<credit note id>", "action": "availableOriginInvoiceLines", "parameters": { "invoiceId": "<original invoice id>" } }
}
```

`availableOriginInvoices` (same `id`, no parameters) lists the invoices of that customer that can be corrected, when the user did not say which one.

### 4. Import the lines to correct

All lines with their full quantities to void the invoice; only the affected line and quantity for a partial correction.

```json
{
  "tool": "etendo_action",
  "arguments": {
    "spec": "sales-invoice", "id": "<credit note id>", "action": "importOriginInvoiceLines",
    "parameters": { "invoiceId": "<original invoice id>", "lines": [ { "sourceLineId": "<original line id>", "quantity": 1 } ] }
  }
}
```

### 5. Complete it

```json
{ "tool": "etendo_action", "arguments": { "spec": "sales-invoice", "id": "<credit note id>", "action": "documentAction", "parameters": { "docAction": "CO" } } }
```

The credit note gets its own number (e.g. `FVR1000000`) and a negative total. The original stays completed with its number.

## Error handling

| Status | Message | Cause | What to do |
|--------|---------|-------|------------|
| 422 | *Value 'VO' of 'docAction' is not offered …* | Tried to void the invoice directly | Create a credit note (this guide) |
| 400 | *The Period does not exist or it is not opened* | The credit note's accounting date falls in a closed period | Ask the user to open the period, or use a date in an open one |
