"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/app/components/shared/Header";
import { Footer } from "@/app/components/shared/Footer";
import { useAuthStore } from "@/app/store/authStore";
import { ProfileClientService } from "@/services/client/ProfileClientService";
import { AgentClientService } from "@/services/client/AgentClientService";
import { FormClientService } from "@/services/client/FormClientService";
import { ROLES } from "@/app/constants/roles";
import supabase from "@/app/lib/supabase";

const getSafeText = (value: any) => {
  if (value === null || value === undefined) return "No especificado";
  if (typeof value === "string" && value.trim() === "") return "No especificado";
  return String(value);
};

const getEmailFromAnswers = (answers: any) => {
  if (!answers || typeof answers !== "object") return null;
  return Object.values(answers).find(
    (value) => typeof value === "string" && value.includes("@") && value.includes(".")
  ) as string | undefined;
};

const buildSolicitudes = (preformularios: any[], applications: any[], profiles: any[]) => {
  const solicitudesMap = new Map<string, any>();
  const profileMap: Record<string, { email: string; name: string }> = {};

  profiles.forEach((profile: any) => {
    const full = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    const entry = { email: profile.email || "", name: full || profile.email || "Cliente Solicitante" };
    if (profile.id) {
      profileMap[profile.id] = entry;
      profileMap[profile.id.toLowerCase()] = entry;
      profileMap[profile.id.substring(0, 8)] = entry;
    }
    if (profile.email) profileMap[profile.email.toLowerCase()] = entry;
  });

  if (Array.isArray(preformularios)) {
    preformularios.forEach((pf: any) => {
      if (pf.user_id) {
        solicitudesMap.set(pf.user_id, {
          id: pf.id,
          user_id: pf.user_id,
          type: "Preformulario Consular DS-160",
          is_completed: pf.is_completed ?? true,
          answers: pf.answers || pf.form_data || {},
          updated_at: pf.updated_at || pf.created_at,
          raw: pf,
        });
      }
    });
  }

  if (Array.isArray(applications)) {
    applications.forEach((app: any) => {
      const uid = app.user_id || app.id;
      if (uid && !solicitudesMap.has(uid)) {
        solicitudesMap.set(uid, {
          id: app.id,
          user_id: uid,
          type: app.application_type === "agency" ? "Acreditación de Agencia" : "Solicitud de Asesor",
          status: app.status,
          is_completed: true,
          answers: app,
          documents: app.documents,
          updated_at: app.updated_at || app.created_at,
          raw: app,
        });
      }
    });
  }

  return Array.from(solicitudesMap.values()).map((sol) => {
    const fullUser = profiles.find((profile: any) => profile.id === sol.user_id);
    const userProf = sol.user_id ? profileMap[sol.user_id] || profileMap[String(sol.user_id).toLowerCase()] : null;
    const clientName = fullUser
      ? `${fullUser.first_name || ""} ${fullUser.last_name || ""}`.trim() || fullUser.email || "Cliente Solicitante"
      : userProf?.name || sol.answers?.["0"] || sol.answers?.full_name || "Cliente Solicitante";
    const rawEmail = fullUser?.email || userProf?.email || sol.answers?.user_email || sol.answers?.email || sol.user_email || getEmailFromAnswers(sol.answers);
    const clientEmail = rawEmail || (clientName && clientName !== "Cliente Solicitante"
      ? `${clientName.toLowerCase().trim().replace(/[^a-z0-9]/g, ".")}@gmail.com`
      : "cliente@todovisa.com");
    return {
      ...sol,
      clientName,
      clientEmail,
      fullUser,
    };
  });
};

export default function ExpedienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<any | null>(null);
  const [auditDocs, setAuditDocs] = useState<{ name: string; url: string; path: string }[]>([]);
  const [isLoadingAuditDocs, setIsLoadingAuditDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) {
      setError("El expediente no fue especificado.");
      setIsLoading(false);
      return;
    }

    const idParam = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    if (!idParam) {
      setError("El expediente no fue especificado.");
      setIsLoading(false);
      return;
    }

    if (!user) {
      return;
    }

    const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR;
    if (!isAdmin) {
      router.replace("/profile");
      return;
    }

    const loadAuditDocs = async (itemToLoad: any) => {
      setAuditDocs([]);
      setIsLoadingAuditDocs(true);
      try {
        const targetUserId = itemToLoad.user_id || itemToLoad.id;
        const docsList: { name: string; url: string; path: string }[] = [];

        try {
          const { data: storageFiles } = await supabase.storage
            .from("todovisa")
            .list(`expedientes/${targetUserId}`);

          if (storageFiles && storageFiles.length > 0) {
            for (const f of storageFiles) {
              if (f.name && !f.name.startsWith(".")) {
                const filePath = `expedientes/${targetUserId}/${f.name}`;
                const { data: signedData } = await supabase.storage
                  .from("todovisa")
                  .createSignedUrl(filePath, 3600);
                docsList.push({
                  name: f.name,
                  url: signedData?.signedUrl || "",
                  path: filePath,
                });
              }
            }
          }
        } catch (err) {
          console.warn("Storage check for expedientes error:", err);
        }

        if (itemToLoad.documents && typeof itemToLoad.documents === "object") {
          for (const [key, val] of Object.entries(itemToLoad.documents)) {
            if (val && typeof val === "string" && val.startsWith("http")) {
              if (!docsList.some((d) => d.url === val)) {
                docsList.push({
                  name: `Documento (${key.toUpperCase()})`,
                  url: val,
                  path: val,
                });
              }
            }
          }
        }

        const clientDocsObj = itemToLoad.fullUser?.client_docs || itemToLoad.raw?.client_docs || itemToLoad.answers?.client_docs;
        if (clientDocsObj && typeof clientDocsObj === "object") {
          const docLabels: Record<string, string> = {
            passport: "Pasaporte Vigente",
            dui: "DUI / Identificación",
            workCert: "Arraigo Laboral / Académico",
            bankStatements: "Solvencia Económica"
          };
          for (const [key, label] of Object.entries(docLabels)) {
            const fileName = clientDocsObj[key];
            const fileUrl = clientDocsObj[`${key}_url`];
            if (fileUrl && typeof fileUrl === "string") {
              if (!docsList.some((d) => d.url === fileUrl)) {
                docsList.push({
                  name: `${label} (${fileName || key})`,
                  url: fileUrl,
                  path: fileUrl,
                });
              }
            }
          }
        }

        setAuditDocs(docsList);
      } catch (err) {
        console.error("Error loading audit docs:", err);
      } finally {
        setIsLoadingAuditDocs(false);
      }
    };

    const fetchData = async () => {
      try {
        const [profiles, preformularios, requestsRes] = await Promise.all([
          ProfileClientService.getAllProfiles(),
          FormClientService.getAllPreformularios(),
          AgentClientService.getRequests(),
        ]);

        const applications = requestsRes?.applications || [];
        const solicitudes = buildSolicitudes(preformularios || [], applications || [], profiles || []);
        const found = solicitudes.find((sol: any) =>
          sol.user_id === idParam || sol.id === idParam || String(sol.user_id).startsWith(idParam) || String(sol.id).startsWith(idParam)
        );

        if (!found) {
          setError("No se encontró el expediente solicitado.");
          setIsLoading(false);
          return;
        }

        setItem(found);
        await loadAuditDocs(found);
      } catch (err: any) {
        console.error("Error cargando el expediente:", err);
        setError(err?.message || "Ocurrió un error al cargar el expediente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, params?.id, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-text-primary">
      <Header />
      <main className="w-[92%] mx-auto py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/profile?tab=admin_expedientes"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-brand-primary hover:text-brand-hover"
            >
              ← Volver al Monitor de Expedientes
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Auditoría de Expediente</h1>
              <p className="text-xs text-text-secondary max-w-2xl mt-1">
                Consulta y revisa el expediente completo con el estilo visual de TodoVisa.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary shadow-sm">
            {item?.type || "Expediente Consular"}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-xl w-3/5"></div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-gray-100"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : item ? (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-border-light shadow-xs overflow-hidden">
              <div className="bg-[#113E5F] px-6 py-5 text-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/70">Solicitud de auditoría</p>
                    <h2 className="text-xl font-bold">Expediente de {getSafeText(item.clientName)}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-white/70">ID Solicitante</p>
                    <p className="font-mono text-sm">{getSafeText(item.user_id || item.id)}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-text-secondary uppercase tracking-wider font-bold">
                    <span>Información Personal y de Perfil</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-1">
                      <span className="text-text-muted block text-[11px] font-medium">Nombre Completo</span>
                      <span className="font-bold text-text-primary text-sm">{getSafeText(item.clientName)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-muted block text-[11px] font-medium">Correo Electrónico</span>
                      <span className="font-semibold text-text-primary text-sm">{getSafeText(item.clientEmail)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-muted block text-[11px] font-medium">Teléfono / Contacto</span>
                      <span className="font-semibold text-text-primary">{getSafeText(item.fullUser?.phone || item.answers?.phone)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-muted block text-[11px] font-medium">País de Residencia</span>
                      <span className="font-semibold text-text-primary">{getSafeText(item.fullUser?.country || item.answers?.country_residence)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-muted block text-[11px] font-medium">Rol en Sistema</span>
                      <span className="inline-block font-extrabold text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 uppercase">
                        {getSafeText(item.fullUser?.role || "CLIENTE")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-muted block text-[11px] font-medium">Fecha de Solicitud</span>
                      <span className="font-mono text-text-muted">{item.updated_at ? new Date(item.updated_at).toLocaleDateString("es-ES") : "Reciente"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-light mb-4">
                    <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#113E5F]">Respuestas Registradas de la Solicitud</h3>
                  </div>
                  {item.answers && typeof item.answers === "object" && Object.keys(item.answers).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                      {Object.entries(item.answers).map(([key, value], idx) => {
                        if (typeof value === "object" && value !== null) return null;
                        return (
                          <div key={idx} className="p-3 bg-[#FAFAFA] rounded-2xl border border-border-light space-y-1">
                            <span className="text-text-muted block text-[10px] uppercase font-bold tracking-wider">Campo #{key}</span>
                            <span className="font-semibold text-text-primary break-words">{getSafeText(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs italic text-text-muted p-5 text-center">
                      El usuario registró la solicitud de expediente.
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-light mb-4">
                    <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#113E5F]">Documentos Adjuntos y Cargados</h3>
                  </div>

                  {isLoadingAuditDocs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-3xl border border-gray-200 h-28"></div>
                      ))}
                    </div>
                  ) : auditDocs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {auditDocs.map((doc, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-3xl border border-border-light shadow-sm flex items-center justify-between gap-3 hover:border-[#113E5F] transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#113E5F] flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-text-primary truncate">{doc.name}</div>
                              <div className="text-[10px] text-text-muted font-mono">Archivo digital</div>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="px-3.5 py-2 bg-[#113E5F] hover:bg-[#0f3755] text-white text-xs font-bold rounded-2xl transition-colors"
                          >
                            Ver
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-text-muted italic bg-[#FAFAFA] rounded-3xl border border-border-light">
                      No se encontraron documentos cargados para este expediente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
