import { mkdir, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeFileName } from "@/lib/validation";
import { privateStorageRoot, requireSameOrigin, resolveInside } from "@/lib/security";

const allowedReceiptTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("utf8") === "%PDF-";
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const admin = await requireUser(UserRole.ADMIN);
  const form = await request.formData();
  const file = form.get("receipt");
  const investorId = String(form.get("investorId") ?? "");
  const investorEnquiryId = String(form.get("investorEnquiryId") ?? "") || null;
  const amountValue = String(form.get("amount") ?? "");
  const currency = String(form.get("currency") ?? "GBP").toUpperCase().slice(0, 3);
  const transactionDateValue = String(form.get("transactionDate") ?? "");
  const notes = String(form.get("notes") ?? "").slice(0, 1000);

  if (!(file instanceof File) || !investorId) {
    return NextResponse.json({ error: "Receipt file and investor are required" }, { status: 400 });
  }
  if (!allowedReceiptTypes.includes(file.type)) {
    return NextResponse.json({ error: "Receipt must be PDF, JPG, PNG, or WebP" }, { status: 400 });
  }
  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Receipt file is too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedSignature(buffer, file.type)) {
    return NextResponse.json({ error: "Receipt file content does not match its declared type" }, { status: 400 });
  }

  await prisma.investor.findUniqueOrThrow({ where: { id: investorId } });
  const receiptRoot = resolveInside(privateStorageRoot(), "investor-receipts");
  await mkdir(receiptRoot, { recursive: true });
  const safeName = sanitizeFileName(file.name);
  const extension = safeName.includes(".") ? safeName.split(".").pop() : file.type === "application/pdf" ? "pdf" : "bin";
  const storedFileName = `${crypto.randomUUID()}-${safeName.replace(/\.[^.]+$/, "")}.${extension}`;
  const storedPath = resolveInside(receiptRoot, storedFileName);
  await writeFile(storedPath, buffer);

  const receiptId = crypto.randomUUID();
  const receipt = await prisma.investorTransactionReceipt.create({
    data: {
      id: receiptId,
      investorId,
      investorEnquiryId,
      amount: amountValue ? amountValue : null,
      currency,
      transactionDate: transactionDateValue ? new Date(transactionDateValue) : null,
      originalFileName: safeName,
      storedFileName,
      fileUrl: `/api/admin/investor-receipts/${receiptId}`,
      mimeType: file.type,
      fileSize: file.size,
      notes: notes || null,
      uploadedByAdminId: admin.id
    }
  });

  if (amountValue) {
    const receipts = await prisma.investorTransactionReceipt.findMany({ where: { investorId }, select: { amount: true } });
    const total = receipts.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    await prisma.investor.update({ where: { id: investorId }, data: { totalCommitted: total } });
  }

  await audit(request, {
    actorUserId: admin.id,
    action: "INVESTOR_RECEIPT_UPLOADED",
    entityType: "InvestorTransactionReceipt",
    entityId: receipt.id,
    newValues: receipt
  });

  return NextResponse.redirect(new URL("/admin/investor-enquiries", request.url), 303);
}
