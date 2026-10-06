# Bank reconciliation

## Overview

This guide walks an MCP-only agent through the bank-reconciliation flow of one financial account in Etendo GO, the same flow the UI runs:

1. **Load a bank statement** — import a Cuaderno 43 / CSV file, or type the statement by hand — with the `bank-statements` actions.
2. **Process** it, so its lines become reconcilable.
3. **Reconcile** each line against existing movements or unpaid invoices — one by one, or by confirming the automatch proposal — with the `bank-reconciliation` actions.
4. **Undo** a reconciliation when it was wrong.

Everything runs through `etendo_action` on two specs that serve named actions (`etendo_discover` reports them with `status: "actions_only"`): `bank-statements` (entity `bank-statements`) and `bank-reconciliation` (entity `bank-reconciliation`). They re-enter the same backend code as the UI, with the same validations.

Do **not** use the financial account's Core buttons (*Import Statement*, *Match Statement*, *Reconcile*, *Add Multiple Payments*, *Funds Transfer*, the PSD2 buttons): they are refused for agents (a transfer between accounts is `transferFunds`, see [Treasury → Funds transfers](./treasury.md#funds-transfers)). Do not write `importedBankStatements`, `bankStatementLines`, `reconciliations` or `transaction` through `etendo_create` / `etendo_update` / `etendo_delete`: those entities are read-only through MCP.

**A statement line is not a movement.** A bank-statement line is what the bank *reports*: it changes nothing in the account until it is reconciled against a movement or an invoice. A **movement** is the account's own record of money in or out, booked against a G/L item, and it changes the balance once processed. To record a deposit or a withdrawal the user made — "record a 100 € deposit in the bank account" — create a movement with the financial account's movement actions (`etendo_action(spec: "financial-account", entity: "account", id: <accountId>, action: "createMovement", ...)`, see [Treasury → Account movements](./treasury.md#account-movements)), not a statement. A movement recorded that way is one of the "existing movements" a statement line can later be reconciled against (`candidates` with `kind: "transactions"`).

## Prerequisites

- The Etendo MCP server is reachable and authenticated (see [MCP setup](../mcp/index.md)).
- The token has write scope (`etendo:write` or `etendo:*`): `etendo_action` — including the read actions below — is only published to write-capable tokens.
- The current role can access the financial account window and its statements and reconciliation (verify with `etendo_discover`: `bank-statements` and `bank-reconciliation` are listed).
- The financial account exists. Its id is the `id` of every account-level action.
- For `reconcileDifference` and within-tolerance differences: the account has a difference G/L item configured, or you pass `glItemId`.

## Configuration

No configuration beyond the base MCP server. Read both action catalogues once per session — they give every parameter schema and what `id` means for each action:

```json
{
  "tool": "etendo_schema",
  "arguments": { "spec": "bank-statements", "entity": "bank-statements", "view": "actions" }
}
```

```json
{
  "tool": "etendo_schema",
  "arguments": { "spec": "bank-reconciliation", "entity": "bank-reconciliation", "view": "actions" }
}
```

## Available capabilities

### `bank-statements` actions

`etendo_action(spec: "bank-statements", entity: "bank-statements", id: <see column>, action: <name>, parameters: {...})`

| Action | Kind | `id` | Parameters (required in **bold**) |
|--------|------|------|-----------------------------------|
| `listStatements` | read | financial account | — |
| `statementLines` | read | bank statement | — |
| `previewStatement` | read | financial account | **`fileName`**, **`contentBase64`** — parses a file without saving it |
| `createStatement` | write | financial account | **`name`**, **`transactionDate`**, **`importDate`** (`yyyy-MM-dd`), **`lines[]`**, `process` (default `true`), `notes`, `fileName` |
| `importStatement` | write | financial account | **`fileName`**, **`contentBase64`** — stored processed |
| `updateStatement` | write | bank statement | **`name`**, **`transactionDate`**, **`importDate`**, `lines[]`, `process` (default `false`), `notes`, `fileName` — drafts only |
| `processStatement` | write | bank statement | — |
| `reactivateStatement` | write | bank statement | — — a processed, not posted statement; does not reverse reconciliations |
| `deleteStatement` | write | bank statement | — — drafts only |

A line of `lines[]` is `{date, in, out, description, reference, bpartnerName, bpartnerId, glItemId}`: `date` (`yyyy-MM-dd`) is required, and exactly one of `in` / `out` must be above zero (the other absent or 0, none negative). Lengths are refused, not truncated: `name` / `bpartnerName` ≤ 60, `reference` ≤ 30, `fileName` / `notes` ≤ 255, `description` ≤ 2000. `reference` defaults to `**`.

Upload formats: Cuaderno 43, or CSV with the header `Transaction Date, Reference No., Business Partner Name, Description, Amount OUT, Amount IN` (dates `dd/MM/yyyy`). `contentBase64` is standard base64 without line breaks, at most 1 MiB of file content.

### `bank-reconciliation` actions

`etendo_action(spec: "bank-reconciliation", entity: "bank-reconciliation", id: <financialAccountId>, action: <name>, parameters: {...})` — `id` is always the **financial account**.

| Action | Kind | Parameters (required in **bold**) | What it does |
|--------|------|-----------------------------------|--------------|
| `pendingLines` | read | `dateFrom`, `dateTo`, `q` | The account's statement lines with their state and counts. Start here: every write needs a `statementLineId` from this list. Lines of a draft statement are not listed as pending |
| `candidates` | read | **`statementLineId`**, `kind` (`transactions` \| `invoices`), `docType` (`receipts` \| `payments`), `dateFrom`, `dateTo` | What a line can be reconciled against: existing movements, or unpaid invoices. `amountBase` gives foreign-currency amounts in the account currency |
| `autoMatch` | read | — | Automatch proposal: groups of movements for the pending lines. Changes nothing |
| `reconcileGroup` | write | **`statementLineId`**, `operationIds[]`, `invoices[{invoiceId, scheduleId}]`, `paymentMethodId`, `writeoffDifference`, `glItemId`, `description` | Reconciles one line against movements (1:1, 1:N) and/or invoices, which are paid on the fly |
| `applySuggestions` | write | **`groups[{statementLineId, operationIds[], createPayment?}]`** | Confirms the automatch groups you send; a group not sent is rejected |
| `reconcileDifference` | write | **`statementLineId`**, `glItemId`, `description` | Closes a partially reconciled line by posting its remainder (within tolerance) to a G/L item |
| `undoReconciliation` | write | **`statementLineId`** | The line returns to pending; movements and payments the reconciliation created are removed, pre-existing ones are kept |
| `removeOperation` | write | **`statementLineId`**, **`transactionIds[]`** | Detaches movements from a reconciled line and deletes the ones the reconciliation created |
| `reactivateSelected` | write | **`statementLineId`**, **`transactionIds[]`** | Detaches movements so the line can be re-matched |

### Read-only entities

To read what the actions produced, `etendo_list` / `etendo_get` on the `financial-account` spec: `importedBankStatements`, `bankStatementLines`, `transaction`, `reconciliations`, `clearedItems`.

## End-to-end usage example

### Step 1 — Find the account

```json
{
  "tool": "etendo_list",
  "arguments": { "spec": "financial-account", "entity": "account", "filters": { "name": "Main EUR Bank" }, "limit": 5 }
}
```

Keep its `id` (`<accountId>`).

### Step 2 — Load the statement

From a file (optionally run `previewStatement` with the same parameters first to check what it parses):

```json
{
  "tool": "etendo_action",
  "arguments": {
    "spec": "bank-statements", "entity": "bank-statements", "id": "<accountId>",
    "action": "importStatement",
    "parameters": { "fileName": "june.csv", "contentBase64": "<base64 of the file>" }
  }
}
```

Or by hand:

```json
{
  "tool": "etendo_action",
  "arguments": {
    "spec": "bank-statements", "entity": "bank-statements", "id": "<accountId>",
    "action": "createStatement",
    "parameters": {
      "name": "June 2026",
      "transactionDate": "2026-06-30",
      "importDate": "2026-07-01",
      "lines": [
        { "date": "2026-06-02", "description": "Customer transfer", "bpartnerName": "Acme", "in": 3500, "out": 0 }
      ]
    }
  }
}
```

An imported statement and a statement created with the default `process: true` are processed. A statement saved as a draft must be processed with `processStatement` (`id` = the statement) before its lines can be reconciled.

### Step 3 — List the pending lines

```json
{
  "tool": "etendo_action",
  "arguments": {
    "spec": "bank-reconciliation", "entity": "bank-reconciliation", "id": "<accountId>",
    "action": "pendingLines", "parameters": { "dateFrom": "2026-06-01", "dateTo": "2026-06-30" }
  }
}
```

### Step 4a — Accept the automatch proposal

1. Call `autoMatch` (`parameters: {}`).
2. Send the groups you accept to `applySuggestions`. For each group: `statementLineId` = `group.statementLine.id`, `operationIds` = the ids of the group's operations whose `isNew` is `false`, and `createPayment` = `group.createPayment` only when present:

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "bank-reconciliation", "entity": "bank-reconciliation", "id": "<accountId>",
       "action": "applySuggestions",
       "parameters": { "groups": [ { "statementLineId": "<lineId>", "operationIds": ["<transactionId>"] } ] }
     }
   }
   ```

   Read `results[]`: an invalid group is reported there without blocking the others.

### Step 4b — Reconcile a line manually

1. Find what it can match:

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "bank-reconciliation", "entity": "bank-reconciliation", "id": "<accountId>",
       "action": "candidates", "parameters": { "statementLineId": "<lineId>", "kind": "invoices" }
     }
   }
   ```

2. Reconcile it against movements (`operationIds`), invoices (`invoices`, each `{invoiceId, scheduleId}` from `candidates`), or both. The selection must add up to the line amount:

   ```json
   {
     "tool": "etendo_action",
     "arguments": {
       "spec": "bank-reconciliation", "entity": "bank-reconciliation", "id": "<accountId>",
       "action": "reconcileGroup",
       "parameters": {
         "statementLineId": "<lineId>",
         "invoices": [ { "invoiceId": "<invoiceId>", "scheduleId": "<scheduleId>" } ]
       }
     }
   }
   ```

3. Read the 201 answer:
   - `partial: false` — the line is closed.
   - `partial: true` — the line is **not** complete: `pendingAmount` is still open. Continue with `remainderLineId` (another `reconcileGroup`, or `reconcileDifference` when the remainder is within the account's tolerance).

### Step 5 — Undo a wrong reconciliation

Call `undoReconciliation` with the line's `statementLineId`, or `reactivateSelected` / `removeOperation` with the `transactionIds` to detach. `removeOperation` and `reactivateSelected` report movements they could not free in `failedTransactionIds`.

### Step 6 — Check the result

`etendo_list(spec: "financial-account", entity: "reconciliations", filters: {"account": "<accountId>"})` and `etendo_list(spec: "financial-account", entity: "clearedItems", filters: {"reconciliation": "<reconciliationId>"})`.

## Error handling

Refusals arrive as `{status, error, detail, ...}`. A refused write rolls back its own changes, invoice payments included.

| Status | Detail / code | Cause | Resolution |
|--------|---------------|-------|------------|
| 422 | `unknownParameters` + `acceptedParameters`, `missingParameters`, `field` + `expectedType` / `allowedValues`, `availableActions` | The call does not match the action's contract | Fix the parameters; nothing was run |
| 422 | `lines[<i>]: <problem>` | A statement line breaks the UI's checks (no date, both or neither of `in`/`out`, negative amount, unknown key, too long, unknown contact / G/L item) | Fix that line and retry |
| 400 | `NO_VALID_LINES` | The imported file has no valid line; nothing was saved | Check the format and the encoding |
| 400 | *Only draft (unprocessed) statements can be modified* | `updateStatement` / `deleteStatement` on a processed statement | `reactivateStatement` first |
| 400 | *The statement is posted and cannot be reactivated* | `reactivateStatement` on a posted statement | Ask the user: a posted statement cannot be reactivated |
| 409 | — | `createStatement` / `importStatement` / `previewStatement` / `deleteStatement` on a PSD2-connected account | The account's statements come from the bank connection; ask the user |
| 409 | *Statement line is already reconciled* | The line, or its pending remainder, is already closed | Re-read `pendingLines` |
| 409 | *Reconciliation <documentNo> is an unconfirmed draft that already holds this line. Review it before reconciling the line again.* | A draft reconciliation holds the line's movement | Ask the user to review the draft; never discard it on your own |
| 4xx | `GL_ITEM_REQUIRED` | A difference must be posted and the account has no difference G/L item | Pass `glItemId` |
| 405 | `method_not_allowed` | A financial-account Core button, or a generic write on a read-only entity | Use the actions in this guide |
