# Treasury

## Overview

This guide documents the MCP operations that cover day-to-day treasury work in Etendo GO:

- **Collect a sales invoice** and **pay a purchase invoice** — in full, partially, as a draft to confirm later, with existing credit, in another currency, or writing off a small difference.
- Read and manage the resulting **payments** (`payment-in` collections, `payment-out` payments).
- Maintain **financial accounts** (`financial-account/account`).
- Record **manual movements** of an account — a deposit or a withdrawal booked against a G/L item — and edit, process, reactivate or delete them.
- **Transfer funds** between two of the company's accounts.
- Read **account movements**, **payment terms** and **conversion rates**.

The MCP surface equals the Etendo GO UI surface, both ways: what the UI offers, an agent can do; what the UI does not offer is hidden from agents and refused. The section [Not available to agents](#not-available-to-agents) lists the routes that are refused and what to use instead.

Every payment goes through the **invoice**: the actions below run the same backend code as the invoice's payment panel in the UI. Never build a payment by hand.

## Prerequisites

- The Etendo MCP server is reachable and authenticated (see [MCP setup](../mcp/index.md)).
- The token has write scope (`neo:write` or `neo:*`): `etendo_action` is only published to write-capable tokens.
- The current role can access the `sales-invoice` and/or `purchase-invoice` windows and the `financial-account` window (verify with `etendo_discover`).
- The invoice to collect or pay is **completed** (`documentStatus = CO`) and has an outstanding amount.
- At least one financial account accepts a payment method for the direction you need (collections or payments). `invoiceAccounts` tells you which.

## Configuration

No configuration beyond the base MCP server. Discover the payment actions once per session:

```json
{
  "tool": "etendo_schema",
  "arguments": { "spec": "sales-invoice", "entity": "header", "view": "actions" }
}
```

The answer lists the invoice's AD buttons and, after them, the declared payment actions with their full parameter schema (`invokeVia: "etendo_action"`). `etendo_discover` also names them under the invoice header entity (`actions[]`). Use `spec: "purchase-invoice"` for supplier invoices — the action names and parameters are identical.

## Available capabilities

### Invoice payment actions

Call each with `etendo_action(spec: "sales-invoice" | "purchase-invoice", entity: "header", id: <invoiceId>, action: <name>, parameters: {...})`. In every action, `id` is the **invoice** id.

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

Collections (`payment-in/finPayment`) and payments (`payment-out/header`) cannot be created or edited through MCP: use `etendo_list` / `etendo_get` to read them. Three buttons are available on them, the same the payment window offers, through `etendo_action(spec: "payment-in" | "payment-out", entity: "finPayment" | "header", id: <paymentId>, action: <name>, parameters: {})`:

| Action | UI label | Effect |
|--------|----------|--------|
| `aPRMProcessPayment` | Confirmar | Processes a draft payment. Send `parameters: {}`. |
| `etprReactivatePayment` | Reactivar | Reactivates a processed payment back to draft, removing its account movement. Send `parameters: {}`. |
| `eTPRRemovePayment` | Eliminar | Deletes the payment at any status except void (`RPVOID`) and except while it is locked by its bank transfer (`pisLocked`); in those two cases it answers 422 and nothing changes. A processed payment is reactivated first and then deleted. It gives back **no** credit the payment consumed. Send `parameters: {}`. |

To delete a **draft** and give back the credit it consumed, use the invoice's `deletePayment` instead: it also answers what it deleted. Use `eTPRRemovePayment` for a processed payment, or when the user deletes it from the payment record. For a draft created from an invoice, also prefer the invoice's `confirmPayment`: it answers with the invoice's new state.

### Financial accounts

Spec `financial-account`, entity `account` (`FIN_Financial_Account`): `etendo_list`, `etendo_get`, `etendo_create`, `etendo_update`, `etendo_delete`. Read the writable fields with `etendo_schema(spec: "financial-account", entity: "account", view: "create")` before writing. `name`, `currency`, `type` (Bank `B`, Cash `C`, Card `CA`) and `country` are required; `country` is never derived from the IBAN. None of the account's Core buttons is invokable (see [Not available to agents](#not-available-to-agents)).

### Account movements

A **movement** is the account's own record of money in (deposit) or out (withdrawal), booked against a G/L item (concept). It is what the account's Movements tab records with *New movement*, and once processed it changes the account balance. It is **not a bank-statement line**: a statement line is what the bank reports, imported or entered by hand and then matched to movements in a reconciliation ([Bank reconciliation](./bank-reconciliation.md)). When the user asks to "record a deposit", record a movement.

Movements of invoices are created by their payments (`registerPayment`); the actions below are for the movements a person records by hand. Call each with `etendo_action(spec: "financial-account", entity: "account", id: <financialAccountId>, action: <name>, parameters: {...})`. In every action, `id` is the **financial account** id.

| Action | Kind | Parameters (required in **bold**) | Returns |
|--------|------|-----------------------------------|---------|
| `listMovements` | read | — | `transactions[]` (newest first): `id`, `date`, `trxType`, `amount`, `depositAmount`, `withdrawalAmount`, `description`, `processed` (`false` = draft), `posted`, `paymentId` (set when it belongs to a payment), `transferTxnId` (set on a funds-transfer leg), `glItemId`, `bpartnerId`; and the account `totals` |
| `movementGlItems` | read | `search` | G/L items a movement can be booked against: `id`, `name` |
| `createMovement` | write | **`trxType`** (`BPD` deposit \| `BPW` withdrawal), **`amount`** (> 0, account currency), **`date`** (`yyyy-MM-dd`, also the accounting date), **`glItemId`**, `description` (≤ 255 characters), `bpartnerId`, `projectId`, `costcenterId`, `productId`, `process` | the movement |
| `updateMovement` | write | **`movementId`** and only what changes | the movement |
| `processMovement` | write | **`movementId`** | the movement |
| `reactivateMovement` | write | **`movementId`** | the movement |
| `deleteMovement` | write | **`movementId`** | `{deleted:{...}}` |

- `process: true` on `createMovement` processes the movement at once (the form's *Confirmar*). Without it the movement stays a **draft** (*Guardar*): editable, deletable, and confirmed later with `processMovement`. A draft does not change the balance.
- `updateMovement` keeps every field you do not send. A draft accepts every field (and `process: true` to confirm it after saving). A processed movement accepts only `description`, `glItemId`, `bpartnerId` and the dimensions; reactivate it first to change its type, amount or date. A posted movement cannot be edited until it is reactivated.
- `reactivateMovement` takes a processed movement back to draft, undoing its posting and its reconciliation first.
- `deleteMovement` removes a draft, or reactivates and removes a processed movement.
- A movement that belongs to a payment or a collection is edited, processed, reactivated and deleted with that payment, never here. A leg of a funds transfer cannot be deleted.
- The answer of every write is the movement as it now is: `{id, accountId, trxType, amount, depositAmount, paymentAmount, date, description, glItemId, bpartnerId, status, processed, posted}`.

### Funds transfers

A transfer moves money between two of the company's accounts, as the Movements tab's *Transfer* form does: it books a processed withdrawal in the source and a processed deposit in the destination, plus optional bank fees. Call `etendo_action(spec: "financial-account", entity: "account", id: <sourceAccountId>, action: <name>, parameters: {...})` — here `id` is the account the money **leaves**.

| Action | Kind | Parameters (required in **bold**) | Returns |
|--------|------|-----------------------------------|---------|
| `transferDestinations` | read | — | `items[]` of accounts the money can go to: `id`, `name`, `currency`, `sameCurrency` and, between two currencies, today's `conversionRate` (`null` when the system has none) |
| `transferFunds` | write | **`destinationAccountId`**, **`amount`** (> 0, in the source currency), **`glItemId`**, `conversionRate`, `description` (≤ 255 characters), `bankFeeFrom`, `bankFeeTo` | `{transferred, sourceAccountId, destinationAccountId, amount, date, conversionRate, amountReceived, hint}` |

- The transfer is dated **today**, as in the UI; there is no date parameter.
- Between two currencies, `conversionRate` defaults to today's system rate. If the system has none, send one; without it the transfer is refused.
- A transfer **cannot be deleted** afterwards, in the UI or here. To undo it, transfer the money back.
- The G/L item comes from `movementGlItems`.
- Classic's *Funds Transfer* button (`aprmFundsTrans`) is not run; its refusal names `transferFunds`.

Adding a payment or a collection from the account (without an invoice) is not offered: register payments from the invoice with `registerPayment`.

### Read-only finance data

| Spec / entity | What it is |
|---------------|------------|
| `financial-account/transaction` | Movements of an account (`FIN_Finacc_Transaction`). Write them with the [account movement actions](#account-movements). Posting is the one action available here: `etendo_action(spec: "financial-account", entity: "transaction", id: <transactionId>, action: "post" \| "unpost", parameters: {})` — not listed by `view: "actions"` |
| `financial-account/reconciliations`, `financial-account/clearedItems` | Reconciliations and their matched items |
| `financial-account/importedBankStatements`, `financial-account/bankStatementLines` | Bank statements (write them through the `bank-statements` actions — see [Bank reconciliation](./bank-reconciliation.md)) |
| `sales-invoice/paymentPlan`, `purchase-invoice/paymentPlan` | The invoice's installments; an id here is a valid `scheduleId` |
| `sales-invoice/paymentDetails`, `purchase-invoice/paymentDetails` | How payments are allocated to the installments |
| `payment-in/*`, `payment-out/*` | Payment headers, allocation lines, credit used, execution history |
| `conversion-rates/conversionRate` | Currency conversion rates |

`payment-term/header` (payment terms) is writable: read its fields with `etendo_schema(spec: "payment-term", entity: "header", view: "create")`.

## End-to-end usage example

### Example 1 — Collect a sales invoice in full

1. Find the accounts and the method each would use:

   ```json
   {
     "tool": "etendo_action",
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
     "tool": "etendo_action",
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
     "tool": "etendo_action",
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
     "tool": "etendo_action",
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
     "tool": "etendo_action",
     "arguments": {
       "spec": "sales-invoice", "entity": "header", "id": "<invoiceId>",
       "action": "invoiceCreditSources", "parameters": {}
     }
   }
   ```

2. Pass the items you consume in `creditSources`, with `use` up to each `avail`, and lower `actual_payment` by the same amount:

   ```json
   {
     "tool": "etendo_action",
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

### Example 6 — Record a deposit in an account

1. Find the account and a G/L item:

   ```json
   { "tool": "etendo_list", "arguments": { "spec": "financial-account", "entity": "account", "filters": { "name": "Banco Paridad" } } }
   ```

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "financial-account", "entity": "account", "id": "<accountId>",
       "action": "movementGlItems", "parameters": { "search": "ingreso" }
     }
   }
   ```

2. Record and book the deposit:

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "financial-account", "entity": "account", "id": "<accountId>",
       "action": "createMovement",
       "parameters": {
         "trxType": "BPD",
         "amount": 100,
         "date": "2026-09-30",
         "glItemId": "<glItemId>",
         "description": "Cash deposit",
         "process": true
       }
     }
   }
   ```

3. Read the answer: `processed` is `true`, `amount` is `100`, `date` is `2026-09-30`. To undo it, `deleteMovement` with `parameters: { "movementId": "<id>" }`.

### Example 7 — Transfer 10 € to another account

1. List the destinations from the source account:

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "financial-account", "entity": "account", "id": "<sourceAccountId>",
       "action": "transferDestinations", "parameters": {}
     }
   }
   ```

2. Transfer. Between two currencies the rate shown in step 1 is used unless you send `conversionRate`:

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "financial-account", "entity": "account", "id": "<sourceAccountId>",
       "action": "transferFunds",
       "parameters": {
         "destinationAccountId": "<destinationAccountId>",
         "amount": 10,
         "glItemId": "<glItemId>",
         "description": "Cash to the USD account"
       }
     }
   }
   ```

3. Read the answer: `amountReceived` is what arrives in the destination, in its currency. `listMovements` on either account shows the two movements, linked by `transferTxnId`.

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

These routes are refused through MCP because the UI does not offer them, or — for bank and fiscal integrations (PIS / PSD2, SII, TicketBAI, Verifactu, AFIP, Hacienda) — because those integrations stay limited for agents even where the UI offers them. Use the replacement.

| Route | Answer | Use instead |
|-------|--------|-------------|
| `etendo_create` / `etendo_update` / `etendo_delete` / `etendo_batch` on `payment-in/finPayment`, `payment-out/header` | 405 `method_not_allowed` | `registerPayment` (with `paymentId` to edit a draft), `deletePayment` for a draft, `eTPRRemovePayment` on the payment |
| Any write on `payment-in/finPaymentScheduleDetail`, `payment-out/lines`, `sales-invoice/paymentDetails`, `purchase-invoice/paymentDetails`, `sales-invoice/paymentPlan`, `purchase-invoice/paymentPlan` | 405 | `registerPayment` |
| `etendo_defaults` on the payment headers | 405 | `invoiceAccounts`, `invoicePaymentMethods` |
| An advance payment or collection without an invoice | not offered | — (the UI does not offer it) |
| One payment applied to several invoices | not offered | one `registerPayment` per invoice |
| Bank-initiated payments (PIS / PSD2): `pisSupplierAccounts`, `pisTemplates`, `pisPaymentStatus`, `cancelPisPayment`, `retryPisPayment`, the `psd2GenerateBankPayment` button, writes on `payment-out/bankPayments`, the `pis` key of `registerPayment` | 405 (422 for `pis`) | a manual transfer with `registerPayment`. A bank-initiated payment needs a person to authorize it at the bank (SCA) |
| Payment buttons `aPRMAddScheduledpayments`, `aprmExecutepayment`, `aPRMReversePayment`, `aPRMReconcilePayment`, `aeatsiiSend`, `etblkpBulkposting`, `posted`, `retryPisPayment`, `pisPaymentStatus` | 405 | `registerPayment`; `etprReactivatePayment` to undo a processed payment; `eTPRRemovePayment` to delete it |
| `eTPRRemovePayment` on a void (`RPVOID`) payment, or on one locked by its bank transfer (`pisLocked`) | 422 | — (the UI does not offer Eliminar there either) |
| Overpaying a purchase invoice, or a collection in a currency other than the organization's | 422 (`outstandingAmount`, `excess`) | lower `actual_payment` to at most the outstanding |
| `aPRMProcessPayment` with a value other than `P` | 422 `allowedValues: ["P"]` | `parameters: {}` |
| Classic *Add Payment* (`aPRMAddpayment`) on the invoice | 405, hint `registerPayment` | `registerPayment` |
| Financial-account buttons `aPRMImportBankFile`, `aPRMMatchTransactions`, `aPRMMatchTransactionsForce`, `aPRMReconcile`, `aprmAddMultiplePayments`, `pSD2GetBankstatement`, `pSD2GetConsent`, `psd2ReconnectFa`, `psd2GetConnections`, `psd2RefreshConnections` | 405 | statements and reconciliation: [Bank reconciliation](./bank-reconciliation.md) |
| Writes on `financial-account/transaction`, and its buttons `etprReactivateTransaction`, `etprRemoveTransaction`, `posted`, `etblkpBulkposting` | 405, hint naming the account movement actions | the [account movement actions](#account-movements) (`createMovement`, `updateMovement`, `processMovement`, `reactivateMovement`, `deleteMovement`). `post` / `unpost` stay |
| Deleting a leg of a funds transfer | 409 | a transfer back with `transferFunds` |
| Adding a payment or collection from the financial account (no invoice) | not offered | `registerPayment` on the invoice |
| Writes on `financial-account/reconciliations` | 405 | the `bank-reconciliation` actions |

## Error handling

`etendo_action` errors arrive as `{status, error, detail, ...}`, where `error` is `validation_error` (4xx), `not_found` (404), `method_not_allowed` (405) or `server_error` (5xx), and `detail` is the message. Extra keys carry what you need to retry.

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
| 400 | *Cannot delete a processed payment* | `deletePayment` on a confirmed payment | Use `eTPRRemovePayment` on the payment (reactivates and deletes it, no credit given back), or `etprReactivatePayment` then `deletePayment` to also give the credit back |
| 422 | *This payment is void (RPVOID) and cannot be deleted…* | `eTPRRemovePayment` on a voided payment | Do not retry; a void payment is not deleted |
| 422 | *This payment belongs to a live bank transfer (pisLocked)…* | `eTPRRemovePayment` on a payment whose bank transfer is in progress or executed | Do not retry; a person handles it in the UI |
| 400 | *This payment was generated from a processed Payment Proposal…* | `eTPRRemovePayment` on a payment of a processed proposal | Reverse the Payment Proposal instead |
| 404 | *Movement not found in this financial account* | `movementId` unknown, of another account, or not visible to your role | Take the id from `listMovements` of the same account |
| 409 | *This movement belongs to a payment; it is edited with the payment, not here.* (or *receipt*) | Editing or processing a payment's movement | Work on the payment instead |
| 409 | *The movement is already processed.* / *The movement is a draft; there is nothing to reactivate.* / *A posted movement cannot be edited…* | The movement's state does not allow the action | Read it with `listMovements`; reactivate first to edit a posted movement |
| 409 | *Movements generated by a funds transfer cannot be deleted.* | `deleteMovement` on a transfer leg | Do not retry |
| 404 | *Destination account not found* | `destinationAccountId` unknown or not visible to your role | Take it from `transferDestinations` |
| 409 | *The destination account is archived…* | Transfer to an archived account | Pick another destination |
| 422 | `field: conversionRate` — *There is no conversion rate from X to Y for <date>; send conversionRate.* | Between two currencies with no system rate | Ask the user for the rate and send it |
| 400 | *PeriodNotAvailable* (or another Classic message) | The transfer is processed today and today's period is not open | Ask the user to open the period; do not back-date |
| 422 | `field` + message (e.g. *glItemId is required…*, *'amount' cannot change on a processed movement…*, *bpartnerId 'X' was not found.*) | A movement parameter the form would refuse | Fix that field; nothing was run |
| 405 | `method_not_allowed` + hint | A route in [Not available to agents](#not-available-to-agents) | Do not retry; follow the hint |
| 500 | *The payment was not saved; nothing was registered — it is safe to retry* (or *The draft was not deleted; nothing changed — it is safe to retry*) | The transaction was rolled back | Retry the same call |
