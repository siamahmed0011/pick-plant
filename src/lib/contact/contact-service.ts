import { prisma } from "@/lib/prisma";
import { contactFormSchema, type ContactFormInput } from "./contact-validation";

export async function submitContactMessage(data: ContactFormInput) {
  const validated = contactFormSchema.parse(data);

  const submission = await prisma.contactMessage.create({
    data: {
      name: validated.name.trim(),
      email: validated.email.trim().toLowerCase(),
      phone: validated.phone ? validated.phone.trim() : null,
      subject: validated.subject.trim(),
      inquiryType: validated.inquiryType,
      message: validated.message.trim(),
      status: "NEW",
    },
  });

  return {
    success: true,
    messageId: submission.id,
    message: "Thank you! Your message has been sent successfully. Our team will get back to you shortly.",
  };
}

export async function getAdminContactMessages(status?: string) {
  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  return prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminContactMessageById(id: string) {
  return prisma.contactMessage.findUnique({
    where: { id },
  });
}

export async function updateContactMessageStatus(id: string, status: string, adminNote?: string) {
  return prisma.contactMessage.update({
    where: { id },
    data: {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });
}

export async function deleteContactMessage(id: string) {
  return prisma.contactMessage.delete({
    where: { id },
  });
}
