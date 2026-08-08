import { StorageRepository } from "@/lib/repositories/storage.repository";
import { getScopedSupabaseClient } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "todovisa";
    const filePath = formData.get("filePath") as string;

    if (!file || !filePath) {
      return NextResponse.json({ error: "file and filePath are required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await StorageRepository.uploadFile(bucket, filePath, buffer, file.type, token);

    if (result.error) {
      console.error("[/api/storage/upload] Upload error:", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return the bucket + filePath so the client can generate its own signed URL
    return NextResponse.json({
      success: true,
      bucket: result.bucket,
      filePath: result.filePath,
    }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/storage/upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}
