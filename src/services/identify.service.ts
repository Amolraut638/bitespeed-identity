import { PrismaClient, LinkPrecedence } from "@prisma/client";

const prisma = new PrismaClient();

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {
  return prisma.$transaction(async (tx) => {

    // build search conditions only for provided fields
    const conditions: any[] = [];
    if (email) conditions.push({ email });
    if (phoneNumber) conditions.push({ phoneNumber });

    // try finding existing contacts
    const matchedContacts =
      conditions.length > 0
        ? await tx.contact.findMany({
            where: { OR: conditions },
          })
        : [];

    
     //Case 1:
     //if no existing contact then create a new primary contact

    if (matchedContacts.length === 0) {
      const created = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: LinkPrecedence.primary,
        },
      });

      return {
        contact: {
          primaryContatctId: created.id,
          emails: created.email ? [created.email] : [],
          phoneNumbers: created.phoneNumber
            ? [created.phoneNumber]
            : [],
          secondaryContactIds: [],
        },
      };
    }


    //collect all primary ids involved in this identity group

    const primaryIds = new Set<number>();

    matchedContacts.forEach((c) => {
      if (c.linkPrecedence === "primary") {
        primaryIds.add(c.id);
      } else if (c.linkedId) {
        primaryIds.add(c.linkedId);
      }
    });

    // fetch entire related contact chain
    const relatedContacts = await tx.contact.findMany({
      where: {
        OR: [
          { id: { in: [...primaryIds] } },
          { linkedId: { in: [...primaryIds] } },
        ],
      },
    });

   
    //find oldest primary contact
    // this will remain the main identity
     
    const primaryContacts = relatedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

    const mainPrimary = primaryContacts[0];

   
    // If multiple primaries exist,
    // convert newer ones into secondary contacts
     
    for (let i = 1; i < primaryContacts.length; i++) {
      await tx.contact.update({
        where: { id: primaryContacts[i].id },
        data: {
          linkPrecedence: LinkPrecedence.secondary,
          linkedId: mainPrimary.id,
        },
      });
    }

    // Gather existing emails & phone numbers
    const existingEmails = new Set(
      relatedContacts.map((c) => c.email).filter(Boolean)
    );

    const existingPhones = new Set(
      relatedContacts.map((c) => c.phoneNumber).filter(Boolean)
    );

    
    //Create secondary contact only if
    //new information is introduced
    
    let createSecondary = false;

    if (email && !existingEmails.has(email)) createSecondary = true;
    if (phoneNumber && !existingPhones.has(phoneNumber))
      createSecondary = true;

    if (createSecondary) {
      await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: mainPrimary.id,
          linkPrecedence: LinkPrecedence.secondary,
        },
      });
    }

    // Fetch updated identity group
    const finalContacts = await tx.contact.findMany({
      where: {
        OR: [
          { id: mainPrimary.id },
          { linkedId: mainPrimary.id },
        ],
      },
    });

    // Prepare response (primary values first)
    const emails = [
      mainPrimary.email,
      ...finalContacts
        .filter((c) => c.id !== mainPrimary.id)
        .map((c) => c.email),
    ].filter(
      (e, i, arr) => e && arr.indexOf(e) === i
    ) as string[];

    const phoneNumbers = [
      mainPrimary.phoneNumber,
      ...finalContacts
        .filter((c) => c.id !== mainPrimary.id)
        .map((c) => c.phoneNumber),
    ].filter(
      (p, i, arr) => p && arr.indexOf(p) === i
    ) as string[];

    const secondaryContactIds = finalContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => c.id);

    return {
      contact: {
        primaryContatctId: mainPrimary.id, // i have keep PDF typo intentionally here
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    };
  });
};