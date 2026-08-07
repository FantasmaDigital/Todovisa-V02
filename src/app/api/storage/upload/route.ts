import { StorageRepository } from "@/lib/repositories/storage.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "todovisa";
    const filePath = formData.get("filePath") as string;

    if (!file || !filePath) {
      return NextResponse.json({ error: "file and filePath are required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await StorageRepository.uploadFile(bucket, filePath, buffer, file.type);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, publicUrl: result.publicUrl }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/storage/upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}
