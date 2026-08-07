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

export class StorageClientService {
  static async uploadFile(file: File, filePath: string, bucket: string = "todovisa") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("filePath", filePath);

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });
    return handleResponse(res);
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
