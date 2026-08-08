import supabase, { getScopedSupabaseClient } from "@/app/lib/supabase";

// Signed URL expiry: 10 years in seconds (effectively permanent for practical use)
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 * 10;

export class StorageRepository {
  static async ensureBucketExists(bucket: string) {
    // Try to create the bucket; ignore error if it already exists
    const { error } = await supabase.storage.createBucket(bucket, {
      public: false,
      allowedMimeTypes: ["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      fileSizeLimit: 20971520, // 20MB
    });
    if (error && !error.message.includes("already exists") && !error.message.includes("duplicate")) {
      console.warn(`[StorageRepository] Could not create bucket "${bucket}":`, error.message);
    }
  }

  /**
   * Generate a signed URL for a private bucket file.
   * Falls back to a public URL if signed URL creation fails.
   */
  static async getSignedUrl(bucket: string, filePath: string, token?: string | null): Promise<string | null> {
    const client = token ? getScopedSupabaseClient(token) : supabase;
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error || !data?.signedUrl) {
      console.warn(`[StorageRepository] createSignedUrl failed for ${bucket}/${filePath}:`, error?.message);
      const { data: pubData } = client.storage.from(bucket).getPublicUrl(filePath);
      return pubData?.publicUrl || null;
    }

    return data.signedUrl;
  }

  static async uploadFile(
    bucket: string = "todovisa",
    filePath: string,
    fileBuffer: Buffer | File | ArrayBuffer,
    contentType?: string,
    token?: string | null
  ) {
    const options: any = { upsert: true };
    if (contentType) options.contentType = contentType;

    // Use scoped client with user token so RLS policies apply correctly
    const client = token ? getScopedSupabaseClient(token) : supabase;

    // Bucket priority: todovisa → avatars (fallback)
    const bucketsToTry = Array.from(new Set([bucket, "todovisa", "avatars"]));

    let lastError: string | null = null;

    for (const b of bucketsToTry) {
      const uploadResult = await client.storage.from(b).upload(filePath, fileBuffer, options);
      if (!uploadResult.error) {
        const signedUrl = await this.getSignedUrl(b, filePath, token);
        return {
          error: null,
          publicUrl: signedUrl,
          bucket: b,
          filePath,
        };
      }
      lastError = uploadResult.error.message;
      console.warn(`[StorageRepository] Upload to "${b}" failed:`, lastError);
    }

    return {
      error: lastError,
      publicUrl: null,
      bucket: bucketsToTry[0],
      filePath,
    };
  }

  // Upload document for Client / Applicant
  static async uploadClientDoc(
    userId: string,
    category: string,
    fileBuffer: Buffer | File | ArrayBuffer,
    fileName: string,
    contentType?: string
  ) {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `clientes/${userId}/solicitudes/${category}/${Date.now()}_${cleanFileName}`;
    return this.uploadFile("todovisa", filePath, fileBuffer, contentType);
  }

  // Upload document for Agent or Agency Accreditation
  static async uploadAgentDoc(
    identifier: string,
    docType: string,
    fileBuffer: Buffer | File | ArrayBuffer,
    fileName: string,
    contentType?: string,
    isAgency: boolean = false
  ) {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const folder = isAgency ? "agencias" : "asesores";
    const filePath = `${folder}/${identifier}/acreditaciones/${docType}/${Date.now()}_${cleanFileName}`;
    return this.uploadFile("todovisa", filePath, fileBuffer, contentType);
  }

  // Upload profile photo / avatar
  static async uploadAvatar(
    userId: string,
    fileBuffer: Buffer | File | ArrayBuffer,
    fileName: string,
    contentType?: string
  ) {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `avatares/${userId}/${Date.now()}_${cleanFileName}`;
    return this.uploadFile("todovisa", filePath, fileBuffer, contentType);
  }

  static async getSignedUrlForPath(bucket: string, filePath: string) {
    return this.getSignedUrl(bucket, filePath);
  }

  /** @deprecated Use getSignedUrl for private buckets */
  static getPublicUrl(bucket: string, filePath: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || null;
  }
}
