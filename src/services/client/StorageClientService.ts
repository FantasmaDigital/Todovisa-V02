import supabase from "@/app/lib/supabase";

// Signed URL expiry: 10 years in seconds
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 * 10;

async function getSessionToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: `Server upload response error (${res.status})` };
  }
  if (!res.ok) throw new Error(result.error || `HTTP error ${res.status}`);
  return result;
}

/**
 * Generate a signed URL client-side using the authenticated Supabase session.
 * This works reliably because the browser client has the user's JWT.
 */
async function createClientSignedUrl(bucket: string, filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    console.warn("[StorageClientService] createSignedUrl failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}

export class StorageClientService {
  static async uploadFile(file: File, filePath: string, bucket: string = "todovisa") {
    const token = await getSessionToken();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("filePath", filePath);

    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      headers,
      body: formData,
    });
    const result = await handleResponse(res);

    // Server returns { bucket, filePath } — generate signed URL client-side
    if (result.bucket && result.filePath) {
      const signedUrl = await createClientSignedUrl(result.bucket, result.filePath);
      return {
        ...result,
        publicUrl: signedUrl,
      };
    }

    return result;
  }

  // Upload applicant / client document
  static async uploadClientDocument(file: File, userId: string, category: string) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `clientes/${userId}/solicitudes/${category}/${Date.now()}_${cleanFileName}`;
    return this.uploadFile(file, filePath, "todovisa");
  }

  // Upload agent / agency accreditation document
  static async uploadAgentDocument(file: File, identifier: string, docType: string, isAgency: boolean = false) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const folder = isAgency ? "agencias" : "asesores";
    const filePath = `${folder}/${identifier}/acreditaciones/${docType}/${Date.now()}_${cleanFileName}`;
    return this.uploadFile(file, filePath, "todovisa");
  }

  // Upload user / profile avatar
  static async uploadAvatar(file: File, userId: string) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `avatares/${userId}/${Date.now()}_${cleanFileName}`;
    return this.uploadFile(file, filePath, "todovisa");
  }
}
