# Etendo — Agent Operating Manual

## Overview

This manual instructs an AI agent on how to operate against an Etendo instance end-to-end. It is written as a normative operating guide: every directive applies to the agent at runtime, not to the developer reading the document. Treat each rule as binding unless the user explicitly overrides it for a single session.

The companion document [./mcp/index.md](./mcp/index.md) lists the protocol's surface (configuration, tools, the single resource, and the `spec + entity` model). This manual explains **how** to use that surface — how to discover what is available, how to read schemas before mutating data, how to chain tool calls, how to interpret each response, and how to react when a process action fails.

## Operating environment and constraints

The agent operates under these constraints at all times:

- The MCP server documented in [./mcp/index.md](./mcp/index.md) is the **only** channel to Etendo. The agent must not call the Etendo REST API directly, must not browse the Etendo web UI, and must not assume access to the filesystem of the Etendo instance or of the MCP server host.
- The agent's capabilities are bounded by the tools listed in `agentic/mcp/index.md`. If a task cannot be expressed as a sequence of those tool calls, abort and escalate to a human operator.
- The MCP server exposes **one** resource, `etendo://status`. There are no per-entity schema resources. To obtain entity field metadata, call `etendo_schema(spec, entity, view)` (`view` is required).
- Every CRUD tool call is routed by two arguments — `spec` (the API namespace, e.g. `sales-order`) and `entity` (the tab inside that namespace, e.g. `header` or `lines`). Never invent a spec or entity name from memory; obtain them through `etendo_discover` at the start of the session.
- The agent is stateless between sessions. Do not rely on record IDs, user roles, spec lists, or configuration values learned in a previous run — confirm them through the MCP server before acting.
- Credentials (`ETENDO_USERNAME`, `ETENDO_PASSWORD`) and tokens are owned by the MCP server. The agent must never request them, store them, or echo them back to the user.

## The agent operating loop

Execute the following loop for every task the user delegates. Do not skip steps — each one prevents a specific class of failure.

1. **Restate the goal in MCP terms.** Map the user's request to a target `(spec, entity)` pair and an operation: discover, list, get, create, update, delete, action, or batch. If no mapping exists, stop and ask the user.
2. **Verify connectivity.** Read `etendo://status` before the first call of a session and whenever a previous call has failed with a transport-level error.
3. **Discover specs and entities.** Call `etendo_discover` once per session to obtain the authoritative set of `(spec, entity)` pairs the current user can access. Never hard-code these names.
4. **Read schemas before writing.** For every entity the agent will create, update, or delete, call `etendo_schema(spec, entity, view: "create")` first (`view` is required: `"create"` before a write, `"actions"` before `etendo_action`, `"full"` only when reading or filtering every field). Confirm planned `fields` keys against the schema's `name` values, and respect `required` and `readOnly` flags.
5. **Discover real values.** Before sending FK fields, resolve them through `etendo_selectors`. For child entities and FK fields whose selector depends on other values, pass `parentContext` / `recordContext`. The agent must never invent IDs, names, prices, or quantities.
6. **Invoke the tool.** Build the `fields` (or `body`, in `etendo_batch`) object using only the field names declared by the schema and the values resolved from selectors.
7. **Interpret the response.** A CRUD tool returns the created/updated record on success. `etendo_action` returns `{ processResult, processMessage }`. `etendo_batch` returns `{ committed, operations | failedAt, error }`. Branch on the result using the [Error handling](#error-handling) table.
8. **Stop or iterate.** Continue the loop until the goal is met or an error mandates abort or escalation. Report every created or modified record ID back to the user so the change is auditable inside Etendo.

## Reading metadata before acting

The MCP server exposes three read-only metadata tools that have no side effects. Use them as the source of truth for structural knowledge before mutating data.

| Tool | When to call | Purpose |
|------|--------------|---------|
| `etendo_discover` | First call of every session, and again after the user's role changes | Obtain the authoritative `(spec, entity)` map |
| `etendo_schema(spec, entity, view)` — `view` is required: `"create"`, `"actions"` or `"full"` | Before every `etendo_create`, `etendo_update`, `etendo_action`, or `etendo_batch` op that targets that entity | Discover field names, types, required flags, read-only flags, default expressions, and the buttons available for `etendo_action` |
| `etendo_defaults(spec, entity, parentId?, assetId?)` | Optional — before `etendo_create`, when the agent wants to preview server-side defaults without creating | Inspect computed default values |

If a schema call returns an unexpected structure (missing fields, unknown types, or an error payload), abort the mutation and report the discrepancy to the user. Do not attempt a write against an unverified schema.

## Selecting the right tool

Map the user goal to one of the tools from `agentic/mcp/index.md` using this decision table. If no row matches, stop and inform the user that the operation is outside the MCP server's surface.

| Goal | Tool |
|------|------|
| List specs and entities the current user can access | `etendo_discover` |
| Inspect field metadata for an entity | `etendo_schema` |
| Preview default values for a new record | `etendo_defaults` |
| Resolve a foreign-key field to valid IDs | `etendo_selectors` |
| Browse records of one entity (with filters / pagination / sort) | `etendo_list` |
| Fetch one record by ID | `etendo_get` |
| Create one record | `etendo_create` |
| Update one record by ID | `etendo_update` |
| Delete one record by ID | `etendo_delete` |
| Fire a process / document action on a record (confirm, post, copy lines, generate template, etc.) | `etendo_action` |
| Create a header and its children in one call across one or more specs | `etendo_batch` |
| Render a pre-built report | `generate_*` — e.g. `generate_aging_receivable`, `generate_aging_payable`, `generate_tax_report`; `etendo_discover` gives each report spec's `reportTool` |

## Resolving foreign-key fields

Most write operations include at least one foreign-key field. Always resolve FKs through `etendo_selectors` rather than guessing.

- **Simple selectors.** Pass `spec`, `entity`, and `column`. Optional `query` narrows the result.
- **Selectors that depend on other fields of the same record.** Pass `recordContext` carrying the values the selector needs. For example, `partnerAddress` on `sales-order/header` requires `{ "businessPartner": "<id>" }` in `recordContext`.
- **Line-level selectors that depend on the header.** Pass `parentContext` with the relevant header values. For example, `tax` on `sales-order/lines` typically requires `{ "businessPartner": "<id>", "orderDate": "<YYYY-MM-DD>", "priceList": "<id>" }`.

Never pass IDs that did not come back from a selector, a previous `etendo_list` / `etendo_get`, or directly from the user.

## Constructing arguments

- Use the exact `name` values declared by `etendo_schema` for the keys inside `fields` (or `body`, in `etendo_batch`). Do not use the underlying database column names; do not invent JSON keys.
- Submit only fields whose schema entry has `readOnly: false`. Fields such as `id` and `documentNo` are auto-generated; sending them produces a validation error.
- Provide every field with `required: true` (unless the field has a `defaultExpression` that satisfies the requirement server-side; in that case it is safe to omit).
- Pass dates in ISO 8601 (`YYYY-MM-DD`). Reject any other format before sending the call. `etendo_create` and `etendo_update` refuse an unusable date with a structured `422` (see [Error handling](#error-handling)) rather than silently corrupting it — do not treat that response as a transport failure.
- Pass identifiers exactly as returned by previous tool calls — do not normalise, lowercase, or truncate them.
- Buttons (`type: "button"` with `invokeVia: "etendo_action"`) are **not** regular fields. Fire them through `etendo_action` with `action` set to the button's `action` value (e.g. `"DocAction"`, `"Posted"`, `"CopyFrom"`). When the button accepts parameters (for example `DocAction` accepts `{ "docAction": "CO" }`), pass them via the `parameters` argument.
- Never include fields that do not appear in the schema, even if they seem natural. The server will reject the call.

## Interpreting responses

A successful CRUD response contains the affected record (or, for `etendo_list`, a list of records) and no error payload. The agent must:

1. Extract only the fields needed for the next step.
2. Persist nothing locally — pass relevant values directly into the next tool call.
3. Detect business-level conditions (for example, a `documentStatus` that is still `DR` after a confirmation attempt) and branch accordingly.

An `etendo_action` response is **always** a `{ processResult, processMessage }` envelope. Branch on `processResult`:

- `success` — continue.
- `warning` — treat the action as applied; surface `processMessage` to the user.
- `error` — abort and surface `processMessage` to the user. Do not blindly retry.

An `etendo_batch` response carries `committed: true` (with `operations[]` listing the resolved `recordId` per op) on success, or `committed: false` with `atomic`, `failedAt: { id, index }`, `persisted`, `hint` and `error: { status, error, detail, seeAlso }` on failure. A failure rolls back every op in the batch (`atomic: true`, `persisted: []`) — except when an op triggers an Etendo process, which commits internally and cannot be rolled back; the response then reports `atomic: false` and lists the surviving `recordId`s in `persisted`. Always check `atomic` before retrying.

## Complete pattern — create and confirm a sales order

This pattern shows the canonical sequence for the goal: "Create a sales order with one line for an existing customer, then confirm it."

### Step 1 — Verify the connection and discover specs

```
resource: etendo://status
```

```json
{ "tool": "etendo_discover", "arguments": {} }
```

Abort if either call returns a transport error. Confirm that `sales-order` is present in the `specs` array.

### Step 2 — Read schemas for every write target

Ask for `view: "create"` on each entity you will write — it returns only the fields you may send, split into `required` / `optional`:

```json
{ "tool": "etendo_schema", "arguments": { "spec": "sales-order", "entity": "header", "view": "create" } }
```

```json
{ "tool": "etendo_schema", "arguments": { "spec": "sales-order", "entity": "lines", "view": "create" } }
```

Then ask for `view: "actions"` on the header to get the buttons available for `etendo_action`:

```json
{ "tool": "etendo_schema", "arguments": { "spec": "sales-order", "entity": "header", "view": "actions" } }
```

Identify the required, writable fields and the buttons available for `etendo_action`. The `sales-order/header` actions view declares `documentAction` as a button with `action: "DocAction"` — the agent will use it in step 6.

### Step 3 — Resolve header foreign keys

Resolve `businessPartner`, then the dependent `partnerAddress` and `invoiceAddress`:

```json
{
  "tool": "etendo_selectors",
  "arguments": {
    "spec": "sales-order",
    "entity": "header",
    "column": "businessPartner",
    "query": "Acme"
  }
}
```

```json
{
  "tool": "etendo_selectors",
  "arguments": {
    "spec": "sales-order",
    "entity": "header",
    "column": "partnerAddress",
    "recordContext": { "businessPartner": "<bp-id>" }
  }
}
```

Repeat for `invoiceAddress`, `priceList`, `paymentTerms`, `warehouse`, `currency`, and `transactionDocument`.

### Step 4 — Create the header

```json
{
  "tool": "etendo_create",
  "arguments": {
    "spec": "sales-order",
    "entity": "header",
    "fields": {
      "businessPartner": "<bp-id>",
      "partnerAddress": "<partner-address-id>",
      "invoiceAddress": "<invoice-address-id>",
      "priceList": "<price-list-id>",
      "paymentTerms": "<payment-term-id>",
      "warehouse": "<warehouse-id>",
      "currency": "<currency-id>",
      "transactionDocument": "<doctype-target-id>",
      "orderDate": "2026-06-18",
      "scheduledDeliveryDate": "2026-06-20",
      "accountingDate": "2026-06-18"
    }
  }
}
```

Capture the response `id` — this is the header's `C_Order_ID`.

### Step 5 — Resolve line selectors and create the line

```json
{
  "tool": "etendo_selectors",
  "arguments": {
    "spec": "sales-order",
    "entity": "lines",
    "column": "product",
    "query": "Widget"
  }
}
```

```json
{
  "tool": "etendo_selectors",
  "arguments": {
    "spec": "sales-order",
    "entity": "lines",
    "column": "tax",
    "parentContext": {
      "businessPartner": "<bp-id>",
      "orderDate": "2026-06-18",
      "priceList": "<price-list-id>"
    }
  }
}
```

```json
{
  "tool": "etendo_create",
  "arguments": {
    "spec": "sales-order",
    "entity": "lines",
    "parentId": "<order-header-id>",
    "fields": {
      "product": "<product-id>",
      "orderedQuantity": 5
    }
  }
}
```

Name the header with `parentId` — a top-level argument next to `fields`, not a key inside it — not with the line's own `salesOrder` field. Only `parentId` makes
the server read the header record, and everything the line derives from it depends on that: the
business partner, the partner address, the order date, the tax rate and the price. Naming the header
with the line's own FK field instead does not merely lose those values — the create is rejected with
`422 validation_error`, because the order date has no source once the header is not read.

`unitPrice`, `listPrice` and `tax` are therefore **not** needed — the price comes from the header's
price list at the order date, and the tax from the product and the partner's shipping address. Pass
a price only to override the price list; a tax-included price list still needs an explicit price.

### Step 6 — Confirm the order — only when authorised

Do not auto-confirm unless the user has explicitly authorised confirmation in the current session. When authorised:

```json
{
  "tool": "etendo_action",
  "arguments": {
    "spec": "sales-order",
    "entity": "header",
    "id": "<order-header-id>",
    "action": "DocAction",
    "parameters": { "docAction": "CO" }
  }
}
```

Branch on `processResult`. On `success`, report the final `id` and the new `documentStatus` to the user.

### Step 7 — (Alternative) Atomic creation via `etendo_batch`

When the agent needs the header and lines to commit or roll back together, replace steps 4 and 5 with a single `etendo_batch` call. Use `parentRef: "<headerOpId>"` to set the line's parent FK, and `$ref:<opId>` substitution inside `body` if a value must be resolved from an earlier op. A confirmation `etendo_action` still runs after the batch commits.

## Error handling

> The MCP server today surfaces failures in three shapes: transport-level client errors, Etendo API errors propagated through `etendo_*` responses, and the `processResult: "error" | "warning"` envelope from `etendo_action`. Specific symbolic error codes (such as `AUTH_FAILED` or `RATE_LIMITED`) **have not been verified** against the running server; treat the rows below as the verified surface and add more rows only when you confirm a new shape in practice.

When a call fails, branch using this decision table. The "Agent action" column is normative.

| Symptom | Agent action |
|---------|--------------|
| Transport error from the MCP client (server unreachable, invalid credentials, role missing) | **Abort and escalate.** Do not retry. Report the client error verbatim and ask the user to verify `ETENDO_BASE_URL`, `ETENDO_USERNAME`, `ETENDO_PASSWORD`, and the API user's role assignments. |
| `etendo_discover` returns an empty `specs` array | **Abort and escalate.** The API user has no role granting access to any exposed window. Ask the user to assign an appropriate role in **Configuration → Users and permissions**. |
| `etendo_schema` returns a structure missing the expected fields | **Abort the mutation.** Report the discrepancy to the user. Do not attempt a write against an unverified schema. |
| `etendo_create` or `etendo_update` rejects a field as required or read-only | **Retry once with corrected arguments.** Re-read the schema, rebuild `fields` using only writable names, and retry. If the second attempt also fails, escalate with the server message. |
| `etendo_create` or `etendo_update` returns `status: 422` with an `invalidDates` array | **Retry once with corrected dates.** Each entry names the field (`name`), the rejected value (`received`), the `expectedFormat` (`yyyy-MM-dd` for dates, `yyyy-MM-dd'T'HH:mm:ss` for datetimes), and an `example`. Resend only the listed fields reformatted; do not touch fields not listed. If the second attempt also fails, escalate with the server message. |
| `etendo_list` or `etendo_get` response is missing a field you requested via `fields:[…]` | **Check the top-level `unknownFields` array before assuming the data is absent.** A name that matches nothing the entity can emit is reported there, sorted, on every call including an empty result set. Correct the name against `etendo_schema` and retry. |
| `etendo_selectors` returns no rows for a non-empty `query` | **Do not invent an ID.** Ask the user to confirm the search term, or broaden the query. |
| `etendo_action` returns `processResult: "warning"` | **Treat the action as applied.** Surface `processMessage` verbatim to the user; continue if downstream steps remain. |
| `etendo_action` returns `processResult: "error"` | **Abort and escalate.** Report `processMessage` verbatim. Do not retry blindly — the message usually points at a business rule, missing field, or state transition that the agent cannot fix without user input. |
| `etendo_batch` returns `committed: false` | **Check `atomic` first.** With `atomic: true` the batch was rolled back as a unit and nothing was persisted: use `failedAt.index` to locate the offending op and `error` / `error.detail` to diagnose, then retry the whole batch once the cause is fixed. With `atomic: false` an op triggered an Etendo process that committed internally: the `recordId`s in `persisted` exist — `etendo_delete` them or reuse them and retry only the remaining ops; never retry the whole batch as-is, it creates duplicates. |

For any failure shape not listed above, **abort and escalate**. Never proceed with a destructive operation on the basis of an unfamiliar error.

## Safety rules

The following rules apply to every task without exception:

- The agent must never auto-confirm (`etendo_action` with `DocAction`) a sales or purchase order, post (`Posted`) a financial document, or trigger a payment process unless the user has explicitly authorised that action in the current session.
- The agent must never invent identifiers, prices, quantities, dates, document statuses, or vendor / customer names. Every value sent in `fields` must originate from `etendo_selectors`, `etendo_list`, `etendo_get`, or the user.
- The agent must report every created or modified record ID back to the user so the change is auditable inside Etendo.
- When in doubt, prefer read tools (`etendo_discover`, `etendo_schema`, `etendo_defaults`, `etendo_selectors`, `etendo_list`, `etendo_get`) over write tools (`etendo_create`, `etendo_update`, `etendo_delete`, `etendo_action`, `etendo_batch`). A redundant read is always safer than an unwanted write.
