import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { privateStorageRoot, resolveInside } from "@/lib/security";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireUser(UserRole.ADMIN);
  const { id } = await context.params;
  const receipt = await prisma.investorTransactionReceipt.findUniqueOrThrow({ where: { id } });
  const receiptPath = resolveInside(privateStorageRoot(), "investor-receipts", receipt.storedFileName);
  const data = await readFile(receiptPath);

  return new NextResponse(data, {
    headers: {
      "Content-Type": receipt.mimeType,
      "Content-Disposition": `attachment; filename="${receipt.originalFileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
