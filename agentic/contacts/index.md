# Contacts — customers and vendors

## Overview

This guide covers the MCP operations on **contacts**: the customers and vendors a company sells to and buys from (Etendo classic calls them *business partners*). It answers the questions an agent meets when a user says "add this customer", "change their email" or "find the vendor with this tax ID".

Everything lives in one spec, `contacts`. Its main record is the **contact itself** (entity `businessPartner`); the other entities hang from it:

| Entity | What it holds | Parent |
|--------|---------------|--------|
| `businessPartner` | The contact itself: name, tax ID, **email**, phone, website, customer / vendor flags | — (main record) |
| `locationAddress` | The contact's addresses (billing, shipping) | `businessPartner` |
| `contact` | The **people** who work for the contact (a buyer, an accountant), each with their own name and email | `businessPartner` |
| `bankAccount` | The contact's own bank accounts (not the company's: those are `financial-account`) | `businessPartner` |
| `customer`, `vendorCreditor` | Sales and purchase settings: price list, payment terms, payment method | `businessPartner` |

The main record needs no `entity` argument: `etendo_list(spec: "contacts")` lists contacts and `etendo_create(spec: "contacts", fields: {...})` creates one. Name the entity only for the child records.

## Prerequisites

- The Etendo MCP server is reachable and authenticated (see [MCP setup](../mcp/index.md)).
- The role can access the Contacts window, and the token has write scope for creating and updating.

## Where each piece of data goes

| The user says | Field | Entity |
|---------------|-------|--------|
| the customer's / vendor's / company's name | `name` | `businessPartner` |
| their tax ID (NIF, CIF, VAT) | `taxID` | `businessPartner` |
| **their email**, the address documents are sent to | **`etgoEmail`** | **`businessPartner`** |
| their phone, their website | `etgoPhone`, `etgoWeb` | `businessPartner` |
| it is a customer / a vendor | `customer: true` / `vendor: true` | `businessPartner` |
| their address | `addressLine1`, `cityName`, `postalCode`, `country` | `locationAddress` (child) |
| the email or phone **of a person** who works there | `email`, `phone`, `firstName`, `lastName` | `contact` (child) |

The contact's email is `etgoEmail` on the contact itself. The `contact` entity is only for named people: do not create a `contact` row to store the customer's own email.

## Common tasks

### Add a customer with an email

One call creates the contact. `searchKey` (the contact number) is assigned automatically: do not send it.

```json
{
  "tool": "etendo_create",
  "arguments": {
    "spec": "contacts",
    "fields": { "name": "Distribuciones García SL", "taxID": "B12345674", "etgoEmail": "compras@garcia.es", "customer": true }
  }
}
```

A new contact is a customer by default (its category is "Cliente"). Send `vendor: true` for a vendor.

### Give it an address

Sales and purchase documents need an address. Create it as a child of the contact; `country` is an id (`"106"` is Spain: resolve others with `etendo_selectors` on `country`).

```json
{
  "tool": "etendo_create",
  "arguments": {
    "spec": "contacts", "entity": "locationAddress", "parentId": "<contact id>",
    "fields": { "country": "106", "addressLine1": "Calle Mayor 1", "cityName": "Madrid", "postalCode": "28001" }
  }
}
```

### Find a contact

Filter the main record by name (partial text) or by exact tax ID:

```json
{ "tool": "etendo_list", "arguments": { "spec": "contacts", "filters": { "name": { "contains": "García" } } } }
{ "tool": "etendo_list", "arguments": { "spec": "contacts", "filters": { "taxID": "B12345674" } } }
```

Child entities (`contact`, `locationAddress`, `bankAccount`) are listed through one contact: pass its `parentId`.

### Change their email or phone

`etendo_update` needs the record's current `updated` value (read it with `etendo_get`): it refuses the change if someone else modified the contact in between.

```json
{ "tool": "etendo_get", "arguments": { "spec": "contacts", "id": "<contact id>", "fields": ["updated"] } }
{ "tool": "etendo_update", "arguments": { "spec": "contacts", "id": "<contact id>", "updated": "<updated from etendo_get>", "fields": { "etgoEmail": "facturas@garcia.es" } } }
```

## Pitfalls

- **Email in the wrong place.** The customer's email is `businessPartner.etgoEmail`. A `contact` row is a person; putting the customer's email there leaves `etgoEmail` empty, and documents sent "to the customer" find no address.
- **Two contacts with the same name.** When a name matches more than one contact, ask the user which one before creating anything for it.
- **Length limits.** `name` holds 60 characters.
