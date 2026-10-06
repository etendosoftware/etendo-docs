# MCP — Model Context Protocol for Etendo

## Overview

The Etendo MCP server exposes the Etendo API through the [Model Context Protocol](https://modelcontextprotocol.io/), enabling AI agents to query and mutate ERP data, fire process actions, and generate reports directly from a conversation.

This guide covers:

- What the MCP server is and how it fits into Etendo.
- Prerequisites and step-by-step configuration.
- The `spec + entity` model used by every CRUD tool.
- The list of generic tools the server exposes.
- The list of report tools the server exposes.
- The list of specs available (verified through `etendo_discover`).
- An end-to-end usage example built only with real tools.

## Prerequisites

- An active Etendo account with API access enabled.
- Your Etendo instance URL (e.g., `https://app.etendo.ai`).
- A dedicated API user with the roles required for your agent's tasks.
- An MCP-compatible client: Claude Desktop, Claude Code, or any client implementing MCP spec `2024-11-05` or later.
- `Node.js >= 18` if running the MCP server locally via `npx`.

## What is MCP in the Etendo context

MCP (Model Context Protocol) is an open standard that lets AI models call structured tools and read resources from external systems. The Etendo MCP server is a connector that wraps the Etendo API and exposes it as a small set of **generic** tools that operate over any business entity, plus a set of **report** tools.

```
AI Agent  ──MCP protocol──>  Etendo MCP Server  ──REST──>  Etendo API
```

The MCP server handles:

- **Authentication**: acquires a JWT token from the Etendo API and renews it before expiry.
- **Spec/entity routing**: maps each tool call to the correct REST endpoint based on the `spec` and `entity` arguments.
- **Schema introspection**: returns field metadata so the agent can build valid payloads without guessing.
- **Process invocation**: fires `type:button` actions (document confirmation, posting, copy-from, etc.) through a single tool.

## Configuration

### Step 1 — Obtain API credentials

1. Log in to your Etendo instance as an administrator.
2. Navigate to **Configuration → Users and permissions**.
3. Create a dedicated API user (do not reuse a human user account).
4. Assign the roles that match the operations your agent will perform (for example, a role with access to the Sales Order, Purchase Order, or Product windows).
5. Note the username and password — the MCP server uses these to request tokens.

### Step 2 — Add the MCP server to your client configuration

Add the following entry to your MCP client configuration file.

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "etendo": {
      "command": "npx",
      "args": ["-y", "@etendosoftware/mcp-etendo-go"],
      "env": {
        "ETENDO_BASE_URL": "https://app.etendo.ai",
        "ETENDO_USERNAME": "<your-api-username>",
        "ETENDO_PASSWORD": "<your-api-password>"
      }
    }
  }
}
```

**Claude Code** (`.claude/mcp.json` in your project root):

```json
{
  "mcpServers": {
    "etendo": {
      "command": "npx",
      "args": ["-y", "@etendosoftware/mcp-etendo-go"],
      "env": {
        "ETENDO_BASE_URL": "https://app.etendo.ai",
        "ETENDO_USERNAME": "<your-api-username>",
        "ETENDO_PASSWORD": "<your-api-password>"
      }
    }
  }
}
```

**Environment variables reference**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ETENDO_BASE_URL` | Yes | — | Base URL of your Etendo instance |
| `ETENDO_USERNAME` | Yes | — | API user login |
| `ETENDO_PASSWORD` | Yes | — | API user password |

### Step 3 — Verify the connection

Restart your MCP client after saving the configuration, then read the only resource exposed by the server:

```
resource: etendo://status
```

If the read succeeds the server is reachable and authenticated. If it fails, the client surfaces a transport error — re-check the credentials and base URL.

As a second sanity check, invoke `etendo_discover` (it requires no arguments) and confirm you receive a `specs` array.

## The `spec + entity` model

Every CRUD tool exposed by the MCP server takes two routing arguments:

- **`spec`** — the API namespace, typically aligned with an Etendo window or business area (for example `sales-order`, `purchase-invoice`, `product`, `contacts`).
- **`entity`** — the tab or sub-resource inside that spec (for example `header`, `lines`, `lineTax`, `paymentPlan`).

A spec is composed of one or more entities. For example, the `sales-order` spec has the entities `header`, `lines`, `lineTax`, `intrastat`, `reservedStock`, `relatedProducts`, `relatedServices`, `basicDiscounts`, `tax`, `paymentPlan`, `paymentDetails`, and `replacementOrders`. To list sales-order headers you call `etendo_list` with `spec="sales-order"` and `entity="header"`; to list the lines of one sales order you call `etendo_list` with `spec="sales-order"`, `entity="lines"`, and a filter on the parent header ID.

The same pattern applies to every tool: `etendo_get`, `etendo_create`, `etendo_update`, `etendo_delete`, `etendo_schema`, `etendo_defaults`, `etendo_selectors`, and `etendo_action` all accept `spec` and `entity` as their routing arguments.

Discover the full list of `(spec, entity)` pairs available to the current user at runtime with `etendo_discover`. Never hard-code spec or entity names from memory — the discoverable list depends on the user's role and the modules installed in the instance.

## Available tools

The MCP server exposes a small set of generic tools that operate on any `(spec, entity)` pair, plus a set of report tools.

### Generic CRUD and metadata tools

| Tool | Purpose | Required arguments | Optional arguments |
|------|---------|--------------------|--------------------|
| `etendo_discover` | List every spec and entity the current user can access | — | — |
| `etendo_schema` | Return the field metadata for one entity: names, types, required flags, read-only flags, default expressions, and the buttons available for `etendo_action` | `spec`, `entity`, `view` (`"create"` before a write \| `"actions"` for buttons \| `"full"` for every field) | `fields[]` (applies to `view: "full"` only) |
| `etendo_defaults` | Return computed default values for a new record (useful before `etendo_create`). **For a child/line entity, `parentId` is required in practice, not optional** — see [Creating a child/line entity](#creating-a-childline-entity-the-parentid-step) below | `spec`, `entity` | `parentId`, `assetId`, `view` (`"full"` \| `"grouped"` \| `"minimal"`) |
| `etendo_selectors` | Resolve valid values for a foreign-key field (returns IDs the agent can pass into `etendo_create` / `etendo_update`) | `spec`, `entity`, `column` (`field` is an accepted alias) | `query`, `recordContext`, `parentContext` |
| `etendo_list` | List records of one entity with filters, pagination, and sort | `spec`, `entity` | `filters`, `limit`, `offset`, `orderBy`, `fields[]`, `view` (`"summary"`) |
| `etendo_get` | Retrieve a single record by ID | `spec`, `entity`, `id` | `fields[]`, `view` (`"summary"`) |
| `etendo_create` | Create a record | `spec`, `entity`, `fields` | `parentId` (top-level, next to `fields` — **required when creating a child/line record**, see [Creating a child/line entity](#creating-a-childline-entity-the-parentid-step)) |
| `etendo_update` | Update a record by ID | `spec`, `entity`, `id`, `fields` | — |
| `etendo_delete` | Delete a record by ID | `spec`, `entity`, `id` | — |
| `etendo_action` | Fire a `type:button` action on a record (document confirmation, posting, copy-lines, generate-template, etc.). The button column name and the available actions are listed in the entity schema. | `spec`, `entity`, `id`, `action` | `parameters` |
| `etendo_batch` | Run a sequence of cross-spec create operations in one call, chaining their IDs. Use `parentRef` to set the parent FK on a child-tab op, and `$ref:<opId>` substitution inside `body` to chain IDs across ops. Reports `{committed:true, operations:[…]}` or `{committed:false, failedAt:{index,id}, error:{…}}`. **Do not treat `committed:false` as "nothing happened"** — see the caveat below. | `operations[]` | — |

### Response-shaping arguments: `view` and `fields`

Four of the tools above accept arguments that shape the **size** of the response. They are optional
and every default is unchanged from before they existed — but on compliance-heavy specs (invoices,
payments, orders) the full response can exceed 60 kB and simply not fit in your context. Reach for
these first, not after a failed call.

| Instead of | Call | Why |
|---|---|---|
| `etendo_schema(spec, entity)` before a create | `etendo_schema(spec, entity, view: "create")` | Returns **only the fields you may send to `etendo_create`**, already split into `required` / `optional`. A field that is mandatory in the database but that the server can resolve on its own appears under `optional` with `serverDefaulted: true`, so `required` is the short list you actually have to fill. |
| Reading the full dump to find the buttons | `etendo_schema(spec, entity, view: "actions")` | Returns only the callable buttons/processes, each with the `action` value `etendo_action` expects. |
| Reading the full dump to check two fields | `etendo_schema(spec, entity, fields: ["businessPartner", "invoiceDate"])` | Returns just those descriptors. Names that match nothing come back under `unknownFields` — **check that key** if a field you expected is missing, rather than assuming the entity lacks it. Ignored when `view` is set. |
| `etendo_defaults(spec, entity)` | `etendo_defaults(spec, entity, view: "grouped")` | Splits the result into `confirm` (writable values you should review or override) and `systemManaged` (compliance/audit flags the server owns — leave them alone). `view: "minimal"` returns only `confirm`. In both, a field the server knows but could not resolve is listed under `metadata.unresolvedFields` instead of appearing in `confirm` with an empty value — **those are the ones you must supply yourself**. |
| `etendo_list` / `etendo_get` returning every column | `etendo_list(…, fields: ["documentNo", "businessPartner", "grandTotalAmount"])` | Returns only those keys per row. A foreign key's `$_identifier` label comes along automatically, so you do not need to request it. `view: "summary"` is the curated equivalent — the spec's business-critical fields — and is ignored when `fields` is given. Names that match nothing come back under a top-level `unknownFields` array, sorted — **check that key**, on every row count including zero, if a field you expected is missing, rather than assuming the entity lacks it. Same contract as `etendo_schema`'s `fields`. |

Two rules worth internalizing:

- **`fields` on `etendo_schema` and `fields` on `etendo_create` / `etendo_update` are different arguments.**
  On `etendo_schema` it is an array of names to *describe*; on the write tools it is the object of
  values to *write*.
- **`view` never changes semantics, only verbosity** — with one exception worth knowing: in
  `etendo_schema`'s full dump, `userRequired` is a static approximation (it reads the column's own
  default only, so it over-reports). `view: "create"` cross-checks against the real defaults and is
  the authoritative answer to "what must I send?".

### Creating a child/line entity (the `parentId` step)

Every spec with more than one entity has a parent/child shape — `header`/`lines`, `inventory`/`inventoryLine`, `product`/`price` — and creating a record in the child entity has one extra step that creating a header does not: **resolving the parent-dependent defaults before you call `etendo_create`.**

`etendo_schema(spec, entity, view: "create")` on a child entity does **not** list the parent foreign key among the fields it describes, yet `etendo_create` will reject the write with a 422 demanding a parent reference. Name the parent with `parentId`, not with the child entity's own foreign key to it (e.g. not `physInventory` on `inventory-line`, not `salesOrder` on `sales-order/lines`, not `product` on `product/price`) — the server loads the parent record only from `parentId`, so the FK form silently persists a record with every parent-derived field left null, and can still 422 on a mandatory parent-context field it could not resolve (e.g. `orderDate`).

More importantly, several fields on a child entity have a default expression that reads from the **parent** record (its warehouse, its price-list version, its running line number) — the server cannot compute them from the child entity alone. `etendo_defaults(spec, entity)` called **without `parentId`** will silently omit those fields rather than error, because it does not have the parent record to evaluate the expression against. Passing `parentId` is what makes the difference between a resolved value and an absent one.

**Worked example — `physical-inventory` / `inventoryLine`:**

1. Create (or already have) the parent `inventory` header, and keep its `id`.
2. Call `etendo_defaults` with `parentId` set to that header's `id`:

   ```json
   {
     "tool": "etendo_defaults",
     "arguments": {
       "spec": "physical-inventory",
       "entity": "inventoryLine",
       "parentId": "<inventory-header-id>"
     }
   }
   ```

   With `parentId`, the response resolves `storageBin` (the AD default expression is
   `@SQL=... WHERE M_WAREHOUSE_ID=@M_WAREHOUSE_ID@`, i.e. it needs the parent's warehouse).
   The same call **without** `parentId` returns the entity's defaults with `storageBin` missing
   from `confirm` entirely — not flagged as unresolved, just absent.
3. Resolve any remaining foreign keys with `etendo_selectors`, passing `parentContext` when a
   selector depends on parent-level values (see [Resolve dependent selectors](#step-4--resolve-dependent-selectors) above for the header/line pattern).
4. Call `etendo_create` with `parentId` as a top-level argument (next to `fields`, not inside it)
   and the entity's own fields, including the values you got from `etendo_defaults`:

   ```json
   {
     "tool": "etendo_create",
     "arguments": {
       "spec": "physical-inventory",
       "entity": "inventoryLine",
       "parentId": "<inventory-header-id>",
       "fields": {
         "product": "<product-id>",
         "storageBin": "<storage-bin-id-from-etendo_defaults>"
       }
     }
   }
   ```

The same shape applies to `product/price` (parent `product`, pass its `id` as `parentId` to
resolve price-list-version-dependent defaults) and to any other `header`/line pair in the table
above. **Rule of thumb: whenever the entity you are about to create is not the top-level entity of
its spec, call `etendo_defaults` with `parentId` before `etendo_create` — never without it.**

### Report tools

Report tools render a pre-built Etendo report and return it in the requested format. Each report owns the parameter shape it expects under the `parameters` argument; call the report with an empty `parameters` object first to discover the required keys via the server's validation message.

| Tool | Report |
|------|--------|
| `generate_aging_receivable` | Aging of Receivables |
| `generate_bank_statements` | Bank statement list, import (C43), and lines view for a financial account |
| `generate_financial_account_transactions` | Transactions list for a single financial account |
| `generate_financial_accounts_page` | Financial Accounts Page |
| `generate_inventory_stock_report` | Inventory Stock Report |
| `generate_tax_report` | Tax Report |

All report tools accept an optional `format` argument (`pdf`, `xlsx`, `csv`; default `pdf`).

## Available resources

Resources in the Etendo MCP server are intentionally minimal. The server exposes a single resource:

| Resource URI | Description |
|--------------|-------------|
| `etendo://status` | Server health and instance metadata. Read it to verify the server is reachable. |

There are **no** `etendo://schema/<entity>` resources. To obtain the JSON-Schema-like field metadata for an entity, call the tool `etendo_schema(spec, entity, view)` instead of reading a resource. Schema metadata is exposed through a tool rather than a resource because it depends on the spec/entity pair the agent is about to operate on.

## Specs available

The list below was obtained from `etendo_discover` against a current Etendo instance. The set of specs the **current user** can see depends on the user's role and the modules installed; rerun `etendo_discover` in your own environment to obtain the authoritative list.

Specs of type `W` (write/CRUD windows) expose one or more entities through `etendo_*`. Specs of type `R` (reports) are rendered through their corresponding `generate_*` tool.

| Spec | Type | Main entities |
|------|------|---------------|
| `aging-receivable` | R | (report) |
| `amortization` | W | `header`, `lines`, `accounting` |
| `assets` | W | `assets`, `amortizationLine`, `assetAcct` |
| `bank-statements` | R | (report) |
| `contacts` | W | `businessPartner`, `customer`, `vendorCreditor`, `employee`, `contact`, `bankAccount`, `locationAddress`, `documentType`, `basicDiscount`, `customerAccounting`, `vendorAccounting`, `employeeAccounting`, `costSalaryCategory`, `intrastatShipments`, `intrastatAdquisitions`, `bp-stats`, `bp-trend` |
| `conversion-rates` | W | `conversionRate` |
| `dashboard` | W | `kpis`, `trends`, `pending-tasks`, `activity`, `recent-invoices`, `best-products`, `best-sellers`, `pending-amounts`, `top-clients` |
| `financial-account` | W | `account`, `transaction`, `accounting`, `accountingHistory`, `accountingConfiguration`, `paymentMethod`, `importedBankStatements`, `bankStatementLines`, `reconciliations`, `clearedItems`, `bankConnections`, `exchangeRates` |
| `financial-account-transactions` | R | (report) |
| `financial-accounts-page` | R | (report) |
| `goods-movements` | W | `movement`, `movementLine`, `accounting` |
| `goods-receipt` | W | `goodsReceipt`, `goodsReceiptLine`, `intrastat`, `accounting`, `landedCost` |
| `goods-shipment` | W | `goodsShipment`, `goodsShipmentLine`, `intrastat`, `accounting` |
| `internal-consumption` | W | `internalConsumption`, `internalConsumptionLine`, `accounting` |
| `inventory-stock-report` | R | (report) |
| `match-rule` | W | `etgoMatchRuleHeader` |
| `monitor-verifactu` | W | `cabeceraDeEmisor`, `facturasAceptadas`, `facturasParcialmenteAceptadas`, `facturasRechazadas`, `facturasInválidas` |
| `payment-in` | W | `finPayment`, `finPaymentScheduleDetail`, `executionHistory`, `exchangeRates`, `usedCreditSource`, `accounting` |
| `payment-out` | W | `header`, `lines`, `executionHistory`, `exchangeRates`, `usedCreditSource`, `accounting`, `bankPayments` |
| `payment-term` | W | `header`, `lines`, `translation` |
| `physical-inventory` | W | `inventory`, `inventoryLine`, `accounting` |
| `price-list` | W | `priceList`, `priceListVersion`, `productPrice` |
| `product` | W | `product`, `price`, `priceRuleVersion`, `accounting`, `billOfMaterials`, `costingRule`, `costing`, `averageCostTransactions`, `transactionAdjustments`, `transactions`, `transactionCosts`, `purchasing`, `manufacturing`, `translation`, `productCharacteristic`, `characteristicConfiguration`, `stock`, `unitCost`, `productCategories`, `categoryPriceRuleVersion`, `products`, `productPriceRuleVersion`, `alternateUom`, `modifyTaxesCategories`, `intrastat` |
| `product-category` | W | `productCategory`, `accounting`, `assignedProducts`, `translation` |
| `purchase-invoice` | W | `header`, `lines`, `lineTax`, `intrastat`, `tax`, `basicDiscounts`, `cashVat`, `paymentPlan`, `paymentDetails`, `reversedInvoices`, `exchangeRates`, `accounting`, `siiData`, `batuz` |
| `purchase-order` | W | `header`, `lines`, `lineTax`, `intrastat`, `reservedStock`, `basicDiscounts`, `tax`, `paymentPlan`, `paymentDetails` |
| `return-from-customer` | W | `customerReturn`, `customerReturnLine`, `lineTax`, `relatedProducts`, `relatedServices`, `basicDiscounts`, `tax`, `paymentInPlan`, `paymentInDetails` |
| `return-material-receipt` | W | `returnMaterialReceipt`, `returnMaterialReceiptLine`, `accounting` |
| `return-to-vendor` | W | `header`, `lines`, `lineTax`, `basicDiscounts`, `tax`, `paymentOutPlan`, `paymentOutDetails` |
| `return-to-vendor-shipment` | W | `returnToVendorShipment`, `returnToVendorShipmentLine` |
| `sales-invoice` | W | `header`, `lines`, `lineTax`, `intrastat`, `tax`, `cashVat`, `basicDiscounts`, `paymentPlan`, `paymentDetails`, `reversedInvoices`, `exchangeRates`, `accounting`, `siiData`, `verifactu`, `ticketbai`, `resultadoValidación` |
| `sales-order` | W | `header`, `lines`, `lineTax`, `intrastat`, `reservedStock`, `relatedProducts`, `relatedServices`, `basicDiscounts`, `tax`, `paymentPlan`, `paymentDetails`, `replacementOrders` |
| `sales-quotation` | W | `quotation`, `quotationLine`, `lineTax`, `basicDiscounts`, `tax` |
| `sii-config` | W | `siiConfiguration`, `logHash` |
| `sii-monitor` | W | `organizations`, `issuedInvoices`, `issuedInvoicesSiiData`, `receivedInvoices`, `receivedInvoicesSiiData`, `cashCriterionPayments`, `paymentsSiiData`, and the `previousPeriod` variants |
| `tax` | W | `tax`, `taxZone`, `translation`, `accounting`, `taxParameter` |
| `tax-report` | R | (report) |
| `tbai-config` | W | `header` |
| `tbai-facturas-enviadas` | W | `sincronización`, `resultadoValidación` |
| `transaction-type` | W | `transactionType` |
| `user` | W | `user`, `rxServicesAccess`, `userRoles`, `token`, `emailConfiguration` |
| `verifactu-config` | W | `cabeceraDeConfiguraciónVerifactu` |
| `warehouse` | W | `warehouse`, `storageBin`, `productTransactions`, `binContents`, `accounting` |

## End-to-end usage example

**Goal**: An agent locates an existing customer and product, inspects the sales-order schema, resolves the foreign keys it needs, creates a draft sales order with one line, and then confirms (processes) the order.

### Step 1 — Discover what is available

Tool call:

```json
{
  "tool": "etendo_discover",
  "arguments": {}
}
```

The response is the `specs` array shown above. Confirm that `sales-order`, `product`, and `contacts` are present.

### Step 2 — Inspect the sales-order header schema

Before creating any record, read the schema for the target entity so the agent knows which fields exist, which are required, and which are read-only:

```json
{
  "tool": "etendo_schema",
  "arguments": {
    "spec": "sales-order",
    "entity": "header",
    "view": "create"
  }
}
```

`view` is required. `"create"` returns only the fields you may send to `etendo_create`, split into `required` and `optional`, each with its `name`, `type` and selector information (use `"full"` only when you need every column, including read-only and system ones). For `sales-order/header` the required, writable fields the agent typically must supply include `transactionDocument`, `businessPartner`, `orderDate`, `scheduledDeliveryDate`, `accountingDate`, `partnerAddress`, `invoiceAddress`, `priceList`, `paymentTerms`, `warehouse`, `currency`, `invoiceTerms`, `deliveryTerms`, `deliveryMethod`, `freightCostRule`, `formOfPayment`, and `priority`. Read-only fields (such as `documentNo` and `id`) are auto-generated, are not listed in the `create` view, and must be omitted from `etendo_create`. Buttons (`type:"button"`, with `invokeVia:"etendo_action"`) are not regular fields — list them with `view: "actions"` and fire them through `etendo_action` once the record exists.

### Step 3 — Resolve the business partner foreign key

The `businessPartner` field uses a selector. Find a valid customer ID by querying the selector:

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

The response contains rows of `(id, identifier, …)` pairs. Pick the row that matches the user's intent.

### Step 4 — Resolve dependent selectors

Selectors that depend on other field values (for example, `partnerAddress` depends on `businessPartner`, and line-level selectors such as `tax` depend on `orderDate` and `priceList`) require a `recordContext` so the server can evaluate the selector with the correct scope:

```json
{
  "tool": "etendo_selectors",
  "arguments": {
    "spec": "sales-order",
    "entity": "header",
    "column": "partnerAddress",
    "recordContext": {
      "businessPartner": "<bp-id-from-step-3>"
    }
  }
}
```

Repeat for `invoiceAddress`, `priceList`, `paymentTerms`, `warehouse`, `currency`, and `transactionDocument` as needed.

### Step 5 — (Optional) Inspect defaults

`etendo_create` auto-fills server-side defaults, so this step is optional. If the agent wants to preview which fields will be auto-filled, call:

```json
{
  "tool": "etendo_defaults",
  "arguments": {
    "spec": "sales-order",
    "entity": "header"
  }
}
```

### Step 6 — Create the order header

Send only the fields confirmed in step 2 and resolved in steps 3–4:

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

The response returns the created header, including its server-assigned `id` and `documentNo`. Keep the `id` for the next step.

### Step 7 — Create one order line

Inspect the line schema, then resolve the line-level selectors that depend on the header context:

```json
{
  "tool": "etendo_schema",
  "arguments": { "spec": "sales-order", "entity": "lines", "view": "create" }
}
```

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

Create the line:

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

### Step 8 — Process (confirm) the order

`sales-order/header` exposes a `documentAction` button (column `DocAction`, `invokeVia:"etendo_action"`). Confirm the order by firing it with the document action `CO` (Complete/Process):

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

The response carries `processResult` (`success` | `error` | `warning`) and `processMessage`. Read both: a `warning` result means the document was processed but the agent should surface the message to the user.

### Step 9 — (Alternative) Create the whole order in one call

When the agent needs to create the header and its lines in a single transaction (so that a failure in the line rolls back the header), use `etendo_batch` and chain ops with `parentRef` / `$ref:`:

```json
{
  "tool": "etendo_batch",
  "arguments": {
    "operations": [
      {
        "id": "h1",
        "spec": "sales-order",
        "entity": "header",
        "body": {
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
      },
      {
        "id": "l1",
        "spec": "sales-order",
        "entity": "lines",
        "parentRef": "h1",
        "body": {
          "product": "<product-id>",
          "orderedQuantity": 5,
          "unitPrice": 12.50,
          "tax": "<tax-id>"
        }
      }
    ]
  }
}
```

A successful response has `committed: true` and an `operations` array with the resolved `recordId` for every op. A failure returns `committed: false` and a `failedAt` pointer with the underlying error.

> **A failed batch is rolled back as a unit — check `atomic` before retrying.** `etendo_batch` runs
> its operations in a single transaction: when one fails, every operation before `failedAt` is undone
> too, the response carries `atomic: true` and an empty `persisted` array, and the fix is to correct
> the reported operation and retry the **whole** batch.
>
> There is one exception, and the response states it explicitly. If an operation triggers an Etendo
> process, that process commits internally and the rollback cannot undo it. The failure response
> then carries `atomic: false` plus a non-empty `persisted` array listing the `recordId`s that
> survived, and a `hint` saying so. Those records exist: `etendo_delete` them, or reuse them and
> retry only the remaining operations — retrying the whole batch as-is creates duplicates.
>
> ```json
> {
>   "committed": false,
>   "atomic": true,
>   "failedAt": { "id": "l1", "index": 1 },
>   "persisted": [],
>   "hint": "Nothing was persisted: the batch was rolled back as a unit, so no partial records were left behind. Fix the operation reported in 'failedAt' and retry the whole batch.",
>   "error": { "status": 422, "error": "validation_error", "detail": "<what to fix>" }
> }
> ```
>
> Always branch on `atomic`, never on `committed` alone: `committed: false` only says the batch did
> not complete.

## Error handling

> The error payload shapes below describe how the server signals failure today. Codes other than the ones explicitly verified (`processResult: "error"` and `processResult: "warning"` from `etendo_action`, plus the underlying Etendo API HTTP errors propagated by the server) **need to be confirmed against the running MCP server** before being treated as load-bearing in agent logic.

Tool calls fail in one of two ways:

1. **Transport / protocol error.** The MCP client surfaces an error before the call returns. Inspect the client error message; the most common causes are an unreachable `ETENDO_BASE_URL`, invalid credentials, or a missing role on the API user.
2. **API-level error.** The call returns a structured payload describing the failure from the Etendo API. The shape depends on the underlying endpoint — typically an HTTP status, a `message`, and an optional `detail` field. For batch calls (`etendo_batch`), the wrapper is normalised to `{ committed: false, atomic, failedAt: { id, index }, persisted: [], hint, error: { status, error, detail, seeAlso } }`, where `error.error` is a stable code (`validation_error`, `not_found`, `method_not_allowed`, `server_error`) and `persisted` is non-empty only when a process underneath the batch committed (`atomic: false`).

For `etendo_action`, success is signalled inside the response body, not by an exception: read `processResult` and `processMessage`.

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| Transport error on first call of a session | `ETENDO_BASE_URL` unreachable or credentials wrong | Re-read `etendo://status`; verify `ETENDO_BASE_URL`, `ETENDO_USERNAME`, `ETENDO_PASSWORD` |
| `etendo_discover` returns an empty `specs` array | API user has no role granting access to any exposed window | Assign the appropriate role in **Configuration → Users and permissions** |
| `etendo_create` rejects a field as required | A field with `required: true` was omitted, or a field with `readOnly: true` was sent | Re-run `etendo_schema`; submit only writable fields; resolve FK fields via `etendo_selectors` |
| `etendo_create` / `etendo_update` returns `status: 422` with an `invalidDates` array | A date or datetime value could not be read — wrong format, or ISO-shaped but impossible (e.g. `2026-02-30`) | Resend using `yyyy-MM-dd` for dates or `yyyy-MM-dd'T'HH:mm:ss` for datetimes. Each entry in `invalidDates` names the field (`name`), echoes what you sent (`received`), and gives `expectedFormat` and an `example` — on a multi-date payload, check every entry, not just the first |
| `etendo_action` returns `processResult: "error"` | The button's underlying Etendo process raised an error (validation, state machine, or business rule) | Read `processMessage` and report it verbatim; do not retry blindly |
| `etendo_action` returns `processResult: "warning"` | The process completed with a warning Etendo wants surfaced | Treat the document as processed but surface `processMessage` to the user |
| `etendo_batch` returns `committed: false`, `atomic: true` | One op failed; the whole transaction was rolled back and nothing was persisted | Use `failedAt.index` to locate the offending op and `error` / `error.detail` to diagnose; fix it and retry the whole batch |
| `etendo_batch` returns `committed: false`, `atomic: false` | One op triggered an Etendo process that committed internally, so the rollback could not undo it | Read `persisted` for the surviving `recordId`s; `etendo_delete` them or reuse them and retry only the remaining ops — never retry the whole batch as-is (it duplicates them) |
