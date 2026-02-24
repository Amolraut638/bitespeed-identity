# 🔗 Bitespeed Backend Task – Identity Reconciliation

A backend service that consolidates multiple customer contact records based on shared email addresses or phone numbers. Built as part of the **Bitespeed Backend Assignment**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Reconciliation Logic](#reconciliation-logic)
- [Example Scenarios](#example-scenarios)
- [Getting Started](#getting-started)
- [Design Considerations](#design-considerations)

---

## Overview

Customers may place orders using different combinations of email addresses and phone numbers. Over time, multiple contact entries can exist for the same person.

This service exposes a single REST endpoint — `POST /identify` — that:

- Identifies whether a contact already exists
- Links related contacts together
- Maintains a single primary contact per customer
- Converts newer primaries into secondaries when needed
- Returns a clean, consolidated response

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (Cloud – Render) |

---

## Database Schema

```prisma
model Contact {
  id             Int            @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence LinkPrecedence
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  deletedAt      DateTime?
}

enum LinkPrecedence {
  primary
  secondary
}
```

---

## API Documentation

### `POST /identify`

Identifies and consolidates a contact based on the provided email and/or phone number.

#### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

> ⚠️ At least one of `email` or `phoneNumber` must be provided.

#### Response

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": [2, 3]
  }
}
```

> **Note:** The key `primaryContatctId` matches the assignment specification exactly (intentional typo preserved).

---

## Reconciliation Logic

### 1. New Contact
If no existing contact matches the provided email or phone, a **new primary contact** is created.

### 2. Matching Contact with New Information
If an existing contact matches but new information is provided (e.g., a new email with an existing phone number), a **new secondary contact** is created and linked to the primary via `linkedId`.

### 3. Merging Multiple Primaries
If a request connects two previously separate primary contacts:
- The **oldest contact** remains primary
- The **newer primary** is demoted to secondary
- All related contacts are consolidated under the single primary

### 4. Transaction Safety
All reconciliation logic runs inside a **database transaction** to ensure:
- Data consistency
- No partial merges
- No duplicate linking

---

## Example Scenarios

### Example 1 – New Contact

**Request**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

### Example 2 – Same Phone, New Email

**Request**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

### Example 3 – Merging Two Primaries

Given two separate primary contacts:

| Contact | Email | Phone |
|---------|-------|-------|
| Primary A | george@hillvalley.edu | 919191 |
| Primary B | biffsucks@hillvalley.edu | 717171 |

**Request**
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

**Result:** The oldest contact remains primary. The newer primary is demoted to secondary, and a fully consolidated response is returned.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Amolraut638/bitespeed-identity.git
   cd bitespeed-identity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   PORT=3000
   ```

4. **Sync the database schema**
   ```bash
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will be running at **http://localhost:3000**

---

## Design Considerations

- **Transactional Logic** — All reconciliation operations run in a single database transaction to prevent inconsistent or partial merges.
- **Primary Preservation** — The oldest contact is always retained as primary; newer duplicates are demoted.
- **Deduplication** — Emails and phone numbers in the response are always unique.
- **Cloud Ready** — Fully compatible with cloud PostgreSQL deployments (e.g., Render).
- **Spec Compliant** — Response format strictly follows the Bitespeed assignment specification.

---

## 🌍 Live Deployment

> Backend Hosted URL: *(https://bitespeed-identity-z3uu.onrender.com)*

---

---
## 🌍 Live API

Base URL:

https://bitespeed-identity-z3uu.onrender.com

### Health Check

GET https://bitespeed-identity-z3uu.onrender.com/health

### Identify Endpoint

POST https://bitespeed-identity-z3uu.onrender.com/identify

---

## 👨‍💻 Author

**Amol Raut**

Bitespeed Backend Task Submission






