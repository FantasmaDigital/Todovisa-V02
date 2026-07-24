import supabase from "@/app/lib/supabase";

export class StorageRepository {
  static async uploadFile(
    bucket: string = "todovisa",
    filePath: string,
    fileBuffer: Buffer | File | ArrayBuffer,
    contentType?: string
  ) {
    const options: any = { upsert: true };
    if (contentType) options.contentType = contentType;

    let targetBucket = bucket;
    let uploadResult = await supabase.storage.from(targetBucket).upload(filePath, fileBuffer, options);

    // Fallback to alternative buckets if target bucket is restricted/missing
    if (uploadResult.error && targetBucket !== "client-documents") {
      targetBucket = "client-documents";
      uploadResult = await supabase.storage.from(targetBucket).upload(filePath, fileBuffer, options);
    }

    if (uploadResult.error && targetBucket !== "avatars") {
      targetBucket = "avatars";
      uploadResult = await supabase.storage.from(targetBucket).upload(filePath, fileBuffer, options);
    }

    const { data: urlData } = supabase.storage.from(targetBucket).getPublicUrl(filePath);

    return {
      error: uploadResult.error ? uploadResult.error.message : null,
      publicUrl: urlData?.publicUrl || null,
      bucket: targetBucket,
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

  static getPublicUrl(bucket: string, filePath: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || null;
  }
}
