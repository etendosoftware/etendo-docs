# Finance — Agentic Documentation

## Overview

This topic covers the Etendo GO finance domain as exposed through the MCP server. It maps the finance specs, actions and report tools available to an MCP-only agent, and links to focused sub-guides for the two operational scenarios:

- **[Treasury](./treasury.md)** — collect sales invoices and pay purchase invoices through the invoice payment actions (`registerPayment`, `confirmPayment`, `deletePayment` and their read helpers), manage the resulting payments, maintain financial accounts, and what is not available to agents.
- **[Bank reconciliation](./bank-reconciliation.md)** — load, process and edit bank statements with the `bank-statements` actions, and reconcile their lines with the `bank-reconciliation` actions.

The MCP surface equals the Etendo GO UI surface, both ways: what the UI offers, an agent can do; what it does not offer is hidden and refused (`405 method_not_allowed` with a hint naming the route to use). The one deliberate exception is bank and fiscal integrations (PIS / PSD2, SII, TicketBAI, Verifactu, AFIP, Hacienda), which stay limited for agents even where the UI offers them. Payments are never created by hand: they are registered from the invoice.

The set of specs and entities the **current user** can see is role-dependent — always run `neo_discover` in your own environment before hard-coding anything.

## Prerequisites

- The Etendo MCP server is configured in your client. See [MCP setup](../mcp/index.md).
- The API user has a role that grants access to the finance windows (Sales / Purchase Invoice, Financial Account, Payment In, Payment Out, Payment Term, Conversion Rates).
- The token has write scope (`neo:write` or `neo:*`) for anything that uses `neo_action`.
- `etendo://status` is readable and `neo_discover` returns a non-empty `specs` array.

## Configuration

No additional configuration is needed beyond the base MCP server. The finance specs are exposed through the generic `neo_*` tools and the `generate_*` report tools described in the [MCP guide](../mcp/index.md).

## Available capabilities

### Window specs

| Spec | Main entities | Through MCP | Sub-guide |
|------|---------------|-------------|-----------|
| `sales-invoice`, `purchase-invoice` | `header`, `paymentPlan`, `paymentDetails` | The invoice header carries the payment actions (`invoiceAccounts`, `invoicePaymentMethods`, `invoiceCreditSources`, `invoicePayments`, `currencyOptions`, `registerPayment`, `confirmPayment`, `deletePayment`). `paymentPlan` and `paymentDetails` are read-only | [Treasury](./treasury.md) |
| `payment-in` | `finPayment`, `finPaymentScheduleDetail` | No create or edit. Buttons on `finPayment`: `aPRMProcessPayment` (Confirmar), `etprReactivatePayment` (Reactivar), `eTPRRemovePayment` (Eliminar: any status but `RPVOID` / `pisLocked`, reactivates a processed payment first, gives back no consumed credit). The invoice's `deletePayment` deletes a draft and gives its credit back | [Treasury](./treasury.md) |
| `payment-out` | `header`, `lines`, `bankPayments` | No create or edit. Buttons on `header`: same as `payment-in`. Bank-initiated (PIS) payments are not available: bank and fiscal integrations stay limited for agents | [Treasury](./treasury.md) |
| `financial-account` | `account`, `transaction`, `importedBankStatements`, `bankStatementLines`, `reconciliations`, `clearedItems` | `account` is writable (no invokable buttons); the other entities are read-only | [Treasury](./treasury.md) · [Bank reconciliation](./bank-reconciliation.md) |
| `payment-term` | `header` | Writable | [Treasury](./treasury.md) |
| `conversion-rates` | `conversionRate` | Read-only | [Treasury](./treasury.md) |

### Action specs (`neo_action` only)

`neo_discover` reports these with `isReport: true`, `callable: false` and `status: "actions_only"`: they are not report generators. Read their catalogue with `neo_schema(spec, entity, view: "actions")`.

| Spec | Entity | Actions | Sub-guide |
|------|--------|---------|-----------|
| `bank-statements` | `bank-statements` | `listStatements`, `statementLines`, `previewStatement`, `createStatement`, `importStatement`, `updateStatement`, `processStatement`, `reactivateStatement`, `deleteStatement` | [Bank reconciliation](./bank-reconciliation.md) |
| `bank-reconciliation` | `bank-reconciliation` | `pendingLines`, `candidates`, `autoMatch`, `reconcileGroup`, `applySuggestions`, `reconcileDifference`, `undoReconciliation`, `removeOperation`, `reactivateSelected` | [Bank reconciliation](./bank-reconciliation.md) |

### Report tools

| Tool | Purpose |
|------|---------|
| `generate_aging_receivable` | Aging of receivables |
| `generate_aging_payable` | Aging of payables |
| `generate_tax_report` | Tax report |

Call a report tool with `parameters: {}` first to discover its required keys from the validation message. The other finance pages of the UI (`financial-accounts-page`, `financial-account-transactions`, `financial-account-bank-connection`) are listed by `neo_discover` as `not_configured_for_report_generation`: they cannot be generated through MCP.

## End-to-end usage example

This walkthrough collects a sales invoice in full. The full recipe, with partial, draft, credit, foreign-currency and write-off variants, is in [Treasury](./treasury.md).

### Step 1 — Find the invoice

```json
{
  "tool": "neo_list",
  "arguments": {
    "spec": "sales-invoice",
    "entity": "header",
    "filters": { "documentNo": "FV1000002" },
    "limit": 1
  }
}
```

### Step 2 — Pick an account

```json
{
  "tool": "neo_action",
  "arguments": { "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>", "action": "invoiceAccounts", "parameters": {} }
}
```

Take an account `id` from `items[]`; its `defaultMethodId` is the method used when you omit `fin_paymentmethod_id`.

### Step 3 — Register the collection

```json
{
  "tool": "neo_action",
  "arguments": {
    "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>",
    "action": "registerPayment",
    "parameters": {
      "actual_payment": 60.50,
      "payment_date": "2026-09-30",
      "fin_financial_account_id": "<accountId>",
      "process": "confirm"
    }
  }
}
```

The answer carries the payment (`id`, `documentNo`, `status`, `paymentMethod`, credit and write-off amounts) and the invoice's new state (`outstandingAmount`, `totalPaid`, `paymentComplete`).

## Error handling

Errors from the finance specs follow the generic MCP error model described in [MCP — Error handling](../mcp/index.md#error-handling): `{status, error, detail, ...}`. The points specific to finance workflows are:

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| `neo_discover` returns no finance specs | The role lacks access to the finance windows | Assign the relevant finance role; re-run `neo_discover` |
| `405 method_not_allowed` on a payment, payment line, movement or reconciliation write, or on a financial-account button | The UI does not offer that route | Follow the `hint`; see [Treasury — Not available to agents](./treasury.md#not-available-to-agents) |
| `422` from `registerPayment` with `installments`, `validMethods` or `allowedValues` | The call needs a decision the UI would have asked for (which installment, which method, what to do with an overpayment) | Re-send with one of the listed values; see [Treasury — Error handling](./treasury.md#error-handling) |
| `422` from a `bank-statements` / `bank-reconciliation` action | Parameters do not match the action's contract | Read `neo_schema(spec, entity, view: "actions")` and fix the parameters |
| `generate_*` returns a validation error on the first call with empty `parameters` | Expected — the message lists the required keys | Fill the keys and retry |

Enum codes for `list`-typed fields (for example `type` on a financial account or `status` on a payment) are not enumerated here. Read them from `neo_schema(spec, entity, view: "full")` or sample existing records with `neo_list`.
