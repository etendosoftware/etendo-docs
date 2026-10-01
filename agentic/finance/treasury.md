# Treasury

## Overview

This guide documents the MCP operations that cover day-to-day treasury work in Etendo GO:

- **Collect a sales invoice** and **pay a purchase invoice** — in full, partially, as a draft to confirm later, with existing credit, in another currency, or writing off a small difference.
- Read and manage the resulting **payments** (`payment-in` collections, `payment-out` payments).
- Maintain **financial accounts** (`financial-account/account`).
- Read **account movements**, **payment terms** and **conversion rates**.

The MCP surface equals the Etendo GO UI surface, both ways: what the UI offers, an agent can do; what the UI does not offer is hidden from agents and refused. The section [Not available to agents](#not-available-to-agents) lists the routes that are refused and what to use instead.

Every payment goes through the **invoice**: the actions below run the same backend code as the invoice's payment panel in the UI. Never build a payment by hand.

## Prerequisites

- The Etendo MCP server is reachable and authenticated (see [MCP setup](../mcp/index.md)).
- The token has write scope (`neo:write` or `neo:*`): `neo_action` is only published to write-capable tokens.
- The current role can access the `sales-invoice` and/or `purchase-invoice` windows and the `financial-account` window (verify with `neo_discover`).
- The invoice to collect or pay is **completed** (`documentStatus = CO`) and has an outstanding amount.
- At least one financial account accepts a payment method for the direction you need (collections or payments). `invoiceAccounts` tells you which.

## Configuration

No configuration beyond the base MCP server. Discover the payment actions once per session:

```json
{
  "tool": "neo_schema",
  "arguments": { "spec": "sales-invoice", "entity": "header", "view": "actions" }
}
```

The answer lists the invoice's AD buttons and, after them, the declared payment actions with their full parameter schema (`invokeVia: "neo_action"`). `neo_discover` also names them under the invoice header entity (`actions[]`). Use `spec: "purchase-invoice"` for supplier invoices — the action names and parameters are identical.

## Available capabilities

### Invoice payment actions

Call each with `neo_action(spec: "sales-invoice" | "purchase-invoice", entity: "header", id: <invoiceId>, action: <name>, parameters: {...})`. In every action, `id` is the **invoice** id.

| Action | Kind | Parameters (required in **bold**) | Returns |
|--------|------|-----------------------------------|---------|
| `invoiceAccounts` | read | — | `items[]` of financial accounts: `id`, label, currency, `writeoffLimit`, `paymentMethodIds`, `defaultMethodId` (the method used when `fin_paymentmethod_id` is omitted); top level `invoiceMethodId`, `invoiceMethodAccepted` |
| `invoicePaymentMethods` | read | — | payment methods available for this invoice: `id`, label |
| `invoiceCreditSources` | read | `editPaymentId` | `items[]` of consumable credit: `{kind:"credit", paymentId, avail}` (accumulated credit) or `{kind:"abono", psdId, avail}` (credit notes), in the invoice currency |
| `invoicePayments` | read | — | payments already registered on the invoice: `id`, `documentNo`, `amount`, `status`, `processed`, `appliedToInvoice`, account, `conversionRate` |
| `currencyOptions` | read | — | currencies with a rate for the invoice date: `[{id, isoCode, rate}]` |
| `registerPayment` | write | **`actual_payment`**, **`payment_date`**, **`fin_financial_account_id`**, **`process`**, `scheduleId`, `fin_paymentmethod_id`, `paymentId`, `creditSources`, `overpaymentAction`, `conversionRate`, `writeoffDifference` | the payment and the invoice's new state (see [The answer](#the-answer)) |
| `confirmPayment` | write | **`paymentId`** | the processed payment and the invoice's new state |
| `deletePayment` | write | **`paymentId`** | `{deleted:{id, documentNo, amount, status}, invoice:{...}}` |

### `registerPayment` parameters

| Parameter | Type | Meaning |
|-----------|------|---------|
| `actual_payment` | number | Amount in the **invoice** currency. Less than the outstanding = partial payment. More = overpayment (see `overpaymentAction`). |
| `payment_date` | date `yyyy-MM-dd` | Date of the payment. |
| `fin_financial_account_id` | string | Account the money goes to (collection) or leaves from (payment). Take it from `invoiceAccounts`. |
| `process` | `draft` \| `confirm` | `confirm` processes the payment and applies it to the invoice. `draft` only saves it; confirm it later with `confirmPayment`. Always send it. |
| `scheduleId` | string | The invoice installment being paid. Omit it when the invoice has one pending installment: it is resolved for you. With several pending installments the call is refused with the list. |
| `fin_paymentmethod_id` | string | Must be one of the chosen account's `paymentMethodIds`. Omit it to use the account's `defaultMethodId`. |
| `paymentId` | string | Id of a **draft** payment of this invoice to edit in place (same id and document number). |
| `creditSources` | array | Credit to consume: `{"kind":"credit","paymentId":<id>,"use":<amount>}` or `{"kind":"abono","psdId":<id>,"use":<amount>}`. Take the ids and the available amount (`avail`) from `invoiceCreditSources`. |
| `overpaymentAction` | `leave-credit` \| `refund` | Only for a **collection** (sales invoice) whose invoice is in the organization's currency: required there when `actual_payment` plus the `use` of every credit source exceeds the installment's outstanding amount. `leave-credit` keeps the excess as credit of the business partner; `refund` returns it as a separate refund payment. A payment (purchase invoice), or a collection in another currency, cannot be overpaid at all: any excess is refused, with or without this key — lower `actual_payment`. |
| `conversionRate` | number | Rate from the invoice currency to the account currency. Required when they differ. Find it with `currencyOptions`. |
| `writeoffDifference` | boolean | `true` writes off the difference between the amount and the outstanding and closes the installment. Refused when the difference exceeds the account's `writeoffLimit` (`invoiceAccounts`); a limit of 0 or empty means no limit. Not applied when editing a draft. |

Any key not listed here is refused (`unknownParameters`).

### Payment records

Collections (`payment-in/finPayment`) and payments (`payment-out/header`) are **read-only** through MCP: use `neo_list` / `neo_get` to read them. Two buttons are available on them, through `neo_action(spec: "payment-in" | "payment-out", entity: "finPayment" | "header", id: <paymentId>, action: <name>, parameters: {})`:

| Action | UI label | Effect |
|--------|----------|--------|
| `aPRMProcessPayment` | Confirmar | Processes a draft payment. Send `parameters: {}`. |
| `etprReactivatePayment` | Reactivar | Reactivates a processed payment back to draft, removing its account movement. Send `parameters: {}`. |

To delete a draft, use the invoice's `deletePayment`: it gives back any credit the draft consumed and answers what it deleted. A processed payment cannot be deleted by an agent. For a draft created from an invoice, also prefer the invoice's `confirmPayment`: it answers with the invoice's new state.

### Financial accounts

Spec `financial-account`, entity `account` (`FIN_Financial_Account`): `neo_list`, `neo_get`, `neo_create`, `neo_update`, `neo_delete`. Read the writable fields with `neo_schema(spec: "financial-account", entity: "account", view: "create")` before writing. `name`, `currency`, `type` (Bank `B`, Cash `C`, Card `CA`) and `country` are required; `country` is never derived from the IBAN. None of the account's Core buttons is invokable (see [Not available to agents](#not-available-to-agents)).

### Read-only finance data

| Spec / entity | What it is |
|---------------|------------|
| `financial-account/transaction` | Movements of an account (`FIN_Finacc_Transaction`). Posting is the one action available: `neo_action(spec: "financial-account", entity: "transaction", id: <transactionId>, action: "post" \| "unpost", parameters: {})` — not listed by `view: "actions"` |
| `financial-account/reconciliations`, `financial-account/clearedItems` | Reconciliations and their matched items |
| `financial-account/importedBankStatements`, `financial-account/bankStatementLines` | Bank statements (write them through the `bank-statements` actions — see [Bank reconciliation](./bank-reconciliation.md)) |
| `sales-invoice/paymentPlan`, `purchase-invoice/paymentPlan` | The invoice's installments; an id here is a valid `scheduleId` |
| `sales-invoice/paymentDetails`, `purchase-invoice/paymentDetails` | How payments are allocated to the installments |
| `payment-in/*`, `payment-out/*` | Payment headers, allocation lines, credit used, execution history |
| `conversion-rates/conversionRate` | Currency conversion rates |

`payment-term/header` (payment terms) is writable: read its fields with `neo_schema(spec: "payment-term", entity: "header", view: "create")`.

## End-to-end usage example

### Example 1 — Collect a sales invoice in full

1. Find the accounts and the method each would use:

   ```json
   {
     "tool": "neo_action",
     "arguments": {
       "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "invoiceAccounts", "parameters": {}
     }
   }
   ```

   Pick an account from `items[]`. Its `defaultMethodId` is the method `registerPayment` will use if you omit `fin_paymentmethod_id`; to use another, pick one of its `paymentMethodIds`. `invoiceMethodAccepted: false` means no listed account accepts the invoice's own method.

2. Register and confirm the collection. `scheduleId` can be omitted when the invoice has one pending installment:

   ```json
   {
     "tool": "neo_action",
     "arguments": {
       "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "registerPayment",
       "parameters": {
         "actual_payment": 121.00,
         "payment_date": "2026-09-30",
         "fin_financial_account_id": "<accountId>",
         "process": "confirm"
       }
     }
   }
   ```

3. Read the answer: `invoice.outstandingAmount` is `0` and `invoice.paymentComplete` is `true`.

### Example 2 — Partial payment of a purchase invoice, as a draft, then confirm

1. Register a draft for part of the amount:

   ```json
   {
     "tool": "neo_action",
     "arguments": {
       "spec": "purchase-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "registerPayment",
       "parameters": {
         "actual_payment": 100.00,
         "payment_date": "2026-09-30",
         "fin_financial_account_id": "<accountId>",
         "fin_paymentmethod_id": "<methodId>",
         "process": "draft"
       }
     }
   }
   ```

   The answer carries the draft's `id`, `processed: false` and a `note`: nothing is applied to the invoice yet.

2. Optionally edit the draft: call `registerPayment` again with `paymentId: "<draftId>"` and the new values.
3. Confirm it:

   ```json
   {
     "tool": "neo_action",
     "arguments": {
       "spec": "purchase-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "confirmPayment",
       "parameters": { "paymentId": "<draftId>" }
     }
   }
   ```

   Or discard it with `deletePayment` and the same `parameters`.

4. Register further payments the same way until `invoice.paymentComplete` is `true`. An invoice can take several payments; one payment applies to exactly one invoice.

### Example 3 — Consume existing credit

1. List the credit available to the business partner:

   ```json
   {
     "tool": "neo_action",
     "arguments": {
       "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "invoiceCreditSources", "parameters": {}
     }
   }
   ```

2. Pass the items you consume in `creditSources`, with `use` up to each `avail`, and lower `actual_payment` by the same amount:

   ```json
   {
     "tool": "neo_action",
     "arguments": {
       "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "registerPayment",
       "parameters": {
         "actual_payment": 92.00,
         "payment_date": "2026-09-30",
         "fin_financial_account_id": "<accountId>",
         "process": "confirm",
         "creditSources": [ { "kind": "credit", "paymentId": "<creditPaymentId>", "use": 29.00 } ]
       }
     }
   }
   ```

   `creditUsed` in the answer is `29`.

### Example 4 — Foreign-currency account

When the account currency differs from the invoice currency, `conversionRate` is required. `actual_payment` stays in the invoice currency; the account receives `actual_payment × conversionRate`.

1. Call `currencyOptions` (`parameters: {}`) and take the `rate` of the account's currency, or use the rate agreed with the user.
2. Call `registerPayment` with `"conversionRate": 1.1` added to the parameters.

### Example 5 — Write off a small difference

Send `"writeoffDifference": true` with an `actual_payment` below the outstanding. The installment is closed and the difference is stored as a write-off (`writeoffAmount` in the answer). Check `writeoffLimit` in `invoiceAccounts` first: a larger difference is refused.

## The answer

`registerPayment` and `confirmPayment` answer `response.data`:

```json
{
  "response": {
    "data": {
      "id": "<paymentId>",
      "documentNo": "1000003",
      "amount": 60.5,
      "status": "RDNC",
      "processed": true,
      "paymentMethod": { "id": "<methodId>", "name": "Transferencia bancaria" },
      "creditUsed": 0,
      "creditGenerated": 0,
      "creditAvailable": 0,
      "writeoffAmount": 0,
      "invoice": {
        "id": "<invoiceId>",
        "documentNo": "FV1000002",
        "outstandingAmount": 0,
        "totalPaid": 60.5,
        "paymentComplete": true
      }
    }
  }
}
```

- `creditUsed` is only returned by `registerPayment`.
- `creditGenerated` / `creditAvailable` are the credit an overpayment left (`creditAvailable` is 0 after a refund).
- A draft also carries `"note": "Draft: nothing is applied to the invoice until confirmPayment."`.
- `"enriched": false` means the payment **was saved** but its outcome could not be read. Do not retry: re-read it with `invoicePayments`.
- A refund payment created by `overpaymentAction: "refund"` is not listed by `invoicePayments` (it is not linked to the invoice).

## Not available to agents

These routes are refused through MCP because the UI does not offer them. Use the replacement.

| Route | Answer | Use instead |
|-------|--------|-------------|
| `neo_create` / `neo_update` / `neo_delete` / `neo_batch` on `payment-in/finPayment`, `payment-out/header` | 405 `method_not_allowed` | `registerPayment` (with `paymentId` to edit a draft), `deletePayment` |
| Any write on `payment-in/finPaymentScheduleDetail`, `payment-out/lines`, `sales-invoice/paymentDetails`, `purchase-invoice/paymentDetails`, `sales-invoice/paymentPlan`, `purchase-invoice/paymentPlan` | 405 | `registerPayment` |
| `neo_defaults` on the payment headers | 405 | `invoiceAccounts`, `invoicePaymentMethods` |
| An advance payment or collection without an invoice | not offered | — (the UI does not offer it) |
| One payment applied to several invoices | not offered | one `registerPayment` per invoice |
| Bank-initiated payments (PIS / PSD2): `pisSupplierAccounts`, `pisTemplates`, `pisPaymentStatus`, `cancelPisPayment`, `retryPisPayment`, the `psd2GenerateBankPayment` button, writes on `payment-out/bankPayments`, the `pis` key of `registerPayment` | 405 (422 for `pis`) | a manual transfer with `registerPayment`. A bank-initiated payment needs a person to authorize it at the bank (SCA) |
| Payment buttons `eTPRRemovePayment`, `aPRMAddScheduledpayments`, `aprmExecutepayment`, `aPRMReversePayment`, `aPRMReconcilePayment`, `aeatsiiSend`, `etblkpBulkposting`, `posted`, `retryPisPayment`, `pisPaymentStatus` | 405 | `registerPayment`; `deletePayment` on the invoice for a draft; `etprReactivatePayment` to undo a processed payment |
| Overpaying a purchase invoice, or a collection in a currency other than the organization's | 422 (`outstandingAmount`, `excess`) | lower `actual_payment` to at most the outstanding |
| `aPRMProcessPayment` with a value other than `P` | 422 `allowedValues: ["P"]` | `parameters: {}` |
| Classic *Add Payment* (`aPRMAddpayment`) on the invoice | 405, hint `registerPayment` | `registerPayment` |
| Financial-account buttons `aPRMImportBankFile`, `aPRMMatchTransactions`, `aPRMMatchTransactionsForce`, `aPRMReconcile`, `aprmAddMultiplePayments`, `aprmFundsTrans`, `pSD2GetBankstatement`, `pSD2GetConsent`, `psd2ReconnectFa`, `psd2GetConnections`, `psd2RefreshConnections` | 405 | statements and reconciliation: [Bank reconciliation](./bank-reconciliation.md) |
| Recording a deposit, withdrawal or funds transfer; editing, processing, reactivating or deleting a movement (writes on `financial-account/transaction`, its buttons `etprReactivateTransaction`, `etprRemoveTransaction`, `posted`, `etblkpBulkposting`) | 405 | not available through MCP; done from the financial account's movements in the UI. `post` / `unpost` stay |
| Writes on `financial-account/reconciliations` | 405 | the `bank-reconciliation` actions |

## Error handling

`neo_action` errors arrive as `{status, error, detail, ...}`, where `error` is `validation_error` (4xx), `not_found` (404), `method_not_allowed` (405) or `server_error` (5xx), and `detail` is the message. Extra keys carry what you need to retry.

| Status | Detail / extra keys | Cause | Resolution |
|--------|---------------------|-------|------------|
| 422 | *This invoice has N pending installments; send scheduleId…* + `installments[{id, outstandingAmount, dueDate}]` | `scheduleId` omitted and several installments are pending | Re-send with the `scheduleId` of the installment being paid (usually the earliest `dueDate`) |
| 422 | *No pending payment schedule details found for this installment* | Nothing left to pay on the invoice | Check `invoicePayments`; a draft may already hold the installment |
| 422 | *The X funding this payment … exceeds the installment's outstanding Y by Z. Send overpaymentAction…* + `outstandingAmount`, `excess`, `allowedValues` | Overpayment of a collection in the organization currency without `overpaymentAction` | Lower `actual_payment`, or ask the user and re-send with `overpaymentAction` |
| 422 | *… An overpayment is only possible on a collection whose invoice is in the organization's currency; lower actual_payment…* + `outstandingAmount`, `excess` | Excess on a payment, or on a foreign-currency collection | Lower `actual_payment` (plus credit) to at most `outstandingAmount` |
| 422 | *The financial account '…' does not accept the payment method…* + `validMethods[{id, name}]` | Method not enabled on the account | Re-send with one of `validMethods`, or omit `fin_paymentmethod_id` |
| 422 | `missingParameters`, `unknownParameters` + `acceptedParameters`, `field` + `expectedType` / `allowedValues` | The parameters do not match the action's contract (e.g. `process` missing) | Fix the parameters; nothing was run |
| 400 | *A conversion rate is required when the invoice and account currencies differ* | Foreign-currency account without `conversionRate` | Add `conversionRate` (see `currencyOptions`) |
| 400 | *The difference to write off (X) exceeds the write-off limit configured for this financial account (Y).* | `writeoffDifference` above the account's limit | Raise the amount or drop `writeoffDifference` |
| 404 | *Payment not found* | `paymentId` unknown, not a payment of this invoice, or not visible to your role | Take the id from `invoicePayments` of the same invoice |
| 404 | *Payment schedule not found* / *Invoice not found* | Wrong `scheduleId` or invoice id | Take `scheduleId` from `paymentPlan` of the same invoice |
| 400 | *Cannot delete a processed payment* | `deletePayment` on a confirmed payment | Reactivate it first (`etprReactivatePayment` on the payment) if the user wants it undone |
| 405 | `method_not_allowed` + hint | A route in [Not available to agents](#not-available-to-agents) | Do not retry; follow the hint |
| 500 | *The payment was not saved; nothing was registered — it is safe to retry* (or *The draft was not deleted; nothing changed — it is safe to retry*) | The transaction was rolled back | Retry the same call |
