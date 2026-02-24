Bitespeed Backend Task – Identity Reconciliation
🚀 Overview

This project implements the Identity Reconciliation Service described in the Bitespeed Backend Assignment.

The service consolidates multiple contact records belonging to the same customer based on shared email addresses or phone numbers.

It exposes a single REST endpoint:

POST /identify

The system ensures:

Contacts sharing either email OR phone are linked

The oldest contact remains primary

New linked contacts become secondary

Multiple primary records are merged correctly

Response format strictly follows the specification

🧠 Problem Statement

Customers may place orders using different combinations of:

Email addresses

Phone numbers

Over time, multiple contact entries may exist for the same person.

The system must:

Identify whether a contact already exists

Link related contacts

Maintain a single primary contact

Convert newer primaries into secondaries if needed

Return a consolidated response

🏗 Tech Stack

Node.js

Express

TypeScript

Prisma ORM

PostgreSQL (Cloud – Render)

🗄 Database Schema
model Contact {
  id             Int      @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence LinkPrecedence
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
}

enum LinkPrecedence {
  primary
  secondary
}
🔗 Identity Reconciliation Logic
1️⃣ New Contact

If no existing contact matches the provided email or phone:

Create a new primary contact.

2️⃣ Matching Contact with New Information

If an existing contact matches (via email or phone) but new information is provided:

Create a new secondary contact

Link it to the primary using linkedId

3️⃣ Merging Multiple Primaries

If a request connects two previously separate primary contacts:

The oldest contact remains primary

The newer primary becomes secondary

All related contacts are consolidated

4️⃣ Transaction Safety

All reconciliation logic runs inside a database transaction to ensure:

Data consistency

No partial merges

No duplicate linking

📡 API Documentation
Endpoint
POST /identify
Request Body (JSON)
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}

At least one field must be provided.

✅ Response Format
{
  "contact": {
    "primaryContatctId": number,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": [number]
  }
}

Note: The key primaryContatctId matches the assignment specification exactly.

🧪 Example Scenarios
Example 1 – New Contact

Request

{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}

Response

{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
Example 2 – Same Phone, New Email

Request

{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}

Response

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
Example 3 – Merge Two Primaries

If two separate primaries exist:

Primary A: george@hillvalley.edu
 – 919191

Primary B: biffsucks@hillvalley.edu
 – 717171

Request

{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}

Result

Oldest remains primary

Newer primary becomes secondary

Consolidated response returned

🌍 Live Deployment

Backend Hosted URL:

(To be added after deployment)
🛠 How to Run Locally

Clone repository

Install dependencies

npm install

Create .env file

DATABASE_URL=your_postgresql_connection_string
PORT=3000

Sync database

npx prisma db push

Start server

npm run dev

Server runs at:

http://localhost:3000
📌 Design Considerations

Uses transactional logic to prevent inconsistent merges

Ensures oldest contact remains primary

Prevents duplicate emails and phone numbers

Fully compatible with cloud deployment

Clean commit history maintained as per instructions

👨‍💻 Author

Amol Raut
Bitespeed Backend Task Submission
