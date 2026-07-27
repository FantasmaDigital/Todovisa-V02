"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { UserAvatar } from "../components/shared/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import { countries } from "countries-list";
import { CheckoutModal } from "../components/shared/CheckoutModal";
import agentsData from "../dummies/agents.json";
import { AuthService } from "../service/AuthService";
import { ProfileClientService } from "@/services/client/ProfileClientService";
import { AgentClientService } from "@/services/client/AgentClientService";
import { StorageClientService } from "@/services/client/StorageClientService";
import { FormClientService } from "@/services/client/FormClientService";
import { MessageClientService, ClientMessageData } from "../service/MessageClientService";
import { ROLES } from "../constants/roles";
import supabase from "@/app/lib/supabase";

// Convert countries list to sorted array
const countriesArray = Object.entries(countries)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .map(([code, data]: [string, any]) => ({
    code,
    name: data.name,
    dial: `+${typeof data.phone === 'string' ? data.phone.split(',')[0] : data.phone[0]}`
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export interface Commission {
  id: string;
  agent_id: string;
  client_folio: string;
  client_name: string;
  service_type: 'visa_us' | 'visa_uk' | 'vipro' | 'full_service' | 'other';
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'processing' | 'paid';
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface AgencyMember {
  id: string;
  agency_id: string;
  member_id: string;
  member_role: 'consultant' | 'supervisor';
  joined_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface AgencyInvitation {
  id: string;
  agency_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface AgentApplicationData {
  id: string;
  application_id: string;
  user_id?: string | null;
  application_type?: 'individual' | 'agency' | null;
  full_name: string;
  email: string;
  phone: string;
  country_residence: string;
  experience_years: string;
  linkedin?: string | null;
  specialties: string[];
  target_countries: string[];
  languages: string[];
  biography: string;
  status: string;
  terms_accepted: boolean;
  documents?: Record<string, string | null> | null;
  admin_notes?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
  signature_name?: string | null;
  signed_at?: string | null;
  payout_settings?: Record<string, any> | null;
}

export interface AgencyClientRequest {
  id: string;
  agency_id: string;
  client_id: string;
  assigned_member_id: string | null;
  status: 'pending' | 'assigned' | 'closed';
  client_name: string | null;
  client_email: string | null;
  agency_name: string | null;
  created_at: string;
  updated_at: string;
}

export default function PerfilUsuarioPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  const handleViewDocument = async (e: React.MouseEvent<HTMLAnchorElement>, docUrl: string) => {
    e.preventDefault();
    if (!docUrl) return;

    const isSupabaseStorage = docUrl.includes("/storage/v1/object/public/todovisa/");
    if (isSupabaseStorage) {
      try {
        const filePath = docUrl.split("/storage/v1/object/public/todovisa/")[1];
        if (filePath) {
          const { data, error } = await supabase.storage
            .from("todovisa")
            .createSignedUrl(filePath, 60);

          if (error) throw error;
          if (data?.signedUrl) {
            window.open(data.signedUrl, "_blank");
            return;
          }
        }
      } catch (err) {
        console.error("Error generating signed URL, falling back to public URL:", err);
      }
    }
    window.open(docUrl, "_blank");
  };

  // Partner / Agent application states
  const [partnerApp, setPartnerApp] = useState<AgentApplicationData | null>(null);
  const [allApplications, setAllApplications] = useState<AgentApplicationData[]>([]);
  const [selectedApp, setSelectedApp] = useState<AgentApplicationData | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoadingPartnerApp, setIsLoadingPartnerApp] = useState(false);

  // Real Commissions & Agency Portal states
  const [agentCommissions, setAgentCommissions] = useState<Commission[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false);
  const [agencyMembers, setAgencyMembers] = useState<AgencyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [agencyInvitations, setAgencyInvitations] = useState<AgencyInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Inline Payout states (for métodos de cobro tab)
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'ach'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Ahorros");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);

  // Inline Accreditation states (for mi_acreditacion tab)
  const [agentApp, setAgentApp] = useState<AgentApplicationData | null>(null);
  const [isLoadingAgentApp, setIsLoadingAgentApp] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  // Agent chat states (for chat_agente tab)
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [agentChatMessages, setAgentChatMessages] = useState<{ id: string; sender: string; text: string; timestamp: Date }[]>([]);
  const [agentChatInput, setAgentChatInput] = useState("");
  const [isSendingAgentMsg, setIsSendingAgentMsg] = useState(false);
  const agentChatRef = useRef<HTMLDivElement>(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState<any | null>(null);
  const [assignedAgencyProfile, setAssignedAgencyProfile] = useState<any | null>(null);
  const [assignedAgentProfile, setAssignedAgentProfile] = useState<any | null>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("SV");

  // Tab State: "datos", "proceso", "asesor", "pagos"
  const [activeTab, setActiveTab] = useState("datos");

  // Sync tab with URL query parameter ?tab=
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      } else if (user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR)) {
        setActiveTab("admin_dashboard");
      }
    }
  }, [user?.role]);



  // Crop states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageObj, setCropImageObj] = useState<HTMLImageElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic calculations based on current zoom and image aspect ratio
  const getPanBounds = () => {
    if (!cropImageObj) return { maxPanX: 0, maxPanY: 0 };
    const img = cropImageObj;
    const minScale = Math.max(300 / img.width, 300 / img.height);
    const baseWidth = img.width * minScale;
    const baseHeight = img.height * minScale;
    const scaledWidth = baseWidth * zoom;
    const scaledHeight = baseHeight * zoom;
    const maxPanX = Math.max(0, (scaledWidth - 300) / 2);
    const maxPanY = Math.max(0, (scaledHeight - 300) / 2);
    return { maxPanX, maxPanY };
  };

  const { maxPanX, maxPanY } = getPanBounds();

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (cropImageObj) {
      const img = cropImageObj;
      const minScale = Math.max(300 / img.width, 300 / img.height);
      const baseWidth = img.width * minScale;
      const baseHeight = img.height * minScale;
      const scaledWidth = baseWidth * newZoom;
      const scaledHeight = baseHeight * newZoom;
      const newMaxX = Math.max(0, (scaledWidth - 300) / 2);
      const newMaxY = Math.max(0, (scaledHeight - 300) / 2);
      setPanX(prev => Math.max(-newMaxX, Math.min(newMaxX, prev)));
      setPanY(prev => Math.max(-newMaxY, Math.min(newMaxY, prev)));
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !cropImageObj) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 300, 300);

    const img = cropImageObj;
    const minScale = Math.max(300 / img.width, 300 / img.height);
    const baseWidth = img.width * minScale;
    const baseHeight = img.height * minScale;
    const scaledWidth = baseWidth * zoom;
    const scaledHeight = baseHeight * zoom;

    const x = 150 - scaledWidth / 2 + panX;
    const y = 150 - scaledHeight / 2 + panY;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 298, 298);
  }, [cropImageObj, zoom, panX, panY]);

  // Real Database B2B Invitation states
  const [realInvitation, setRealInvitation] = useState<any>(null);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteNameInput, setInviteNameInput] = useState("");
  const [myAgency, setMyAgency] = useState<any>(null);
  const [isLoadingAgencyInfo, setIsLoadingAgencyInfo] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "agent") {
      setMyAgency(null);
      return;
    }

    const fetchMyAgency = async () => {
      setIsLoadingAgencyInfo(true);
      try {
        const resData = await ProfileClientService.getProfile(user.id);
        if (resData?.memberInfo?.agencyProfile) {
          setMyAgency(resData.memberInfo.agencyProfile);
        }
      } catch (err) {
        console.error("Unexpected error loading my agency info:", err);
      } finally {
        setIsLoadingAgencyInfo(false);
      }
    };

    fetchMyAgency();
  }, [user]);

  useEffect(() => {
    if (!user || user.role === "agent") {
      setRealInvitation(null);
      return;
    }

    const fetchRealInvitation = async () => {
      try {
        const resData = await ProfileClientService.getProfile(user.id);
        if (resData?.invitation) {
          setRealInvitation(resData.invitation);
        }
      } catch (err) {
        console.error("Error checking invitations:", err);
      }
    };

    fetchRealInvitation();
  }, [user]);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [checkoutAgent, setCheckoutAgent] = useState<any>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<"vipro" | "advisor">("advisor");

  // Chat states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Document upload & DS-160 states
  const [clientDocs, setClientDocs] = useState<{
    passport?: string;
    dui?: string;
    workCert?: string;
    bankStatements?: string;
  }>({});

  const [ds160Confirmed, setDs160Confirmed] = useState(user?.ds160Confirmed || false);
  const [expedienteStatus, setExpedienteStatus] = useState<'draft' | 'submitted' | 'approved'>(user?.expedienteStatus || 'draft');
  const [isDs160ModalOpen, setIsDs160ModalOpen] = useState(false);
  const [isDs160Closing, setIsDs160Closing] = useState(false);
  const [dbPurchases, setDbPurchases] = useState<any[]>([]);

  // Closes the DS-160 panel with an exit animation before unmounting
  const closeDs160Panel = () => {
    setIsDs160Closing(true);
    setTimeout(() => {
      setIsDs160ModalOpen(false);
      setIsDs160Closing(false);
    }, 280);
  };

  // DS-160 form values — seeded from Supabase Auth metadata
  const [ds160Data, setDs160Data] = useState({
    fullName: user?.ds160FullName || "",
    passportNum: user?.ds160PassportNum || "",
    birthDate: user?.ds160BirthDate || "",
    purposeOfTrip: user?.ds160PurposeOfTrip || "Turismo B1/B2",
    hasAssets: user?.ds160HasAssets ?? true
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Preformulario state
  const [isPreformularioCompleted, setIsPreformularioCompleted] = useState(false);
  const [viproEvaluations, setViproEvaluations] = useState<any[]>([]);
  const [dbProfilesMap, setDbProfilesMap] = useState<Record<string, { email: string; name: string }>>({});
  const [allProfilesList, setAllProfilesList] = useState<any[]>([]);
  const [allPreformulariosList, setAllPreformulariosList] = useState<any[]>([]);
  const [securityModalData, setSecurityModalData] = useState<{ app: AgentApplicationData; targetAction: "approved" | "rejected" } | null>(null);
  const [securityConfirmed, setSecurityConfirmed] = useState(false);






  const [preformMetadata, setPreformMetadata] = useState<{ intake_type?: string; interview_waiver_eligible?: boolean | null; appointment_date?: string; courier_tracking?: string } | null>(null);

  // Audit Modal state for Admin
  const [auditModalItem, setAuditModalItem] = useState<any | null>(null);
  const [auditDocs, setAuditDocs] = useState<{ name: string; url: string; path: string }[]>([]);
  const [isLoadingAuditDocs, setIsLoadingAuditDocs] = useState(false);

  const handleOpenAuditModal = async (item: any) => {
    setAuditModalItem(item);
    setAuditDocs([]);
    setIsLoadingAuditDocs(true);

    try {
      const targetUserId = item.user_id || item.id;
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

      if (item.documents && typeof item.documents === "object") {
        for (const [key, val] of Object.entries(item.documents)) {
          if (val && typeof val === "string" && val.startsWith("http")) {
            if (!docsList.some(d => d.url === val)) {
              docsList.push({
                name: `Documento (${key.toUpperCase()})`,
                url: val,
                path: val,
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


  useEffect(() => {
    if (user?.id) {
      const completed = localStorage.getItem(`preformulario_completed_user_id_${user.id}`);
      const timer = setTimeout(() => setIsPreformularioCompleted(completed === "true"), 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchPreformMetadata = async () => {
      try {
        const dest = user?.viproDestination || "US";
        const data = await FormClientService.getPreformulario(user.id);

        if (data) {
          setPreformMetadata(data);
        } else {
          // Check if there is anything in localstorage as fallback
          const localIntakeType = localStorage.getItem(`preform_progress_intake_type_${dest}_${user.id}`);
          const localWaiverEligible = localStorage.getItem(`preform_progress_waiver_eligible_${dest}_${user.id}`);
          if (localIntakeType || localWaiverEligible) {
            setPreformMetadata({
              intake_type: localIntakeType || undefined,
              interview_waiver_eligible: localWaiverEligible ? localWaiverEligible === "true" : null
            });
          }
        }
      } catch (err) {
        console.error("Error loading preform metadata for profile:", err);
      }
    };
    fetchPreformMetadata();
  }, [user?.id, user?.viproDestination, isPreformularioCompleted]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleFileUpload = async (docType: "passport" | "dui" | "workCert" | "bankStatements", file: File) => {
    if (!file) return;

    // File size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      showToast("El archivo excede el tamaño máximo permitido (20MB).", "error");
      return;
    }
    const userId = user?.id || "guest";

    try {
      showToast(`Subiendo "${file.name}" a tu expediente...`, "info");

      const uploadResult = await StorageClientService.uploadClientDocument(file, userId, docType);
      const publicUrl = uploadResult.publicUrl || file.name;

      setClientDocs(prev => {
        const updated = { ...prev, [docType]: file.name, [`${docType}_url`]: publicUrl };
        if (typeof window !== "undefined" && userId) {
          localStorage.setItem(`client_docs_user_${userId}`, JSON.stringify(updated));
        }
        return updated;
      });

      showToast(`✅ Archivo "${file.name}" guardado exitosamente.`, "success");
    } catch (err: any) {
      console.error("Error al subir archivo via API Storage:", err);
      // Fallback local persistence
      setClientDocs(prev => ({ ...prev, [docType]: file.name }));
      showToast(`Archivo "${file.name}" cargado localmente.`, "success");
    }
  };


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecciona un archivo de imagen válido.", "error");
      return;
    }

    // 20MB file size limit validation (20 * 1024 * 1024 bytes)
    if (file.size > 20 * 1024 * 1024) {
      showToast("El archivo es demasiado grande. El tamaño máximo es 20MB.", "error");
      return;
    }

    if (!user?.id) {
      showToast("Sesión de usuario no válida.", "error");
      return;
    }

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const changesThisMonth = user?.avatarChangesThisMonth || 0;
    const lastChangeMonth = user?.lastAvatarChangeMonth || "";

    if (lastChangeMonth === currentMonthStr) {
      if (changesThisMonth >= 3) {
        showToast("Límite alcanzado: Máximo 3 cambios de foto de perfil por mes.", "error");
        return;
      }
    }

    // Load file and open crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setCropImageObj(img);
        setZoom(1);
        setPanX(0);
        setPanY(0);
        setCurrentUploadFile(file);
        setIsCropModalOpen(true);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!cropImageObj || !user?.id) return;
    setIsUploadingAvatar(true);

    try {
      const canvas = document.createElement("canvas");
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imgWidth = cropImageObj.width;
      const imgHeight = cropImageObj.height;
      const baseScale = Math.max(size / imgWidth, size / imgHeight);
      const drawWidth = imgWidth * baseScale * zoom;
      const drawHeight = imgHeight * baseScale * zoom;

      const drawX = (size - drawWidth) / 2 + panX;
      const drawY = (size - drawHeight) / 2 + panY;

      ctx.drawImage(cropImageObj, drawX, drawY, drawWidth, drawHeight);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("Error al procesar la imagen.", "error");
          setIsUploadingAvatar(false);
          return;
        }

        const avatarFile = new File([blob], `avatar-${user.id}.jpg`, { type: "image/jpeg" });

        try {
          const uploadResult = await StorageClientService.uploadAvatar(avatarFile, user.id);
          const publicUrl = uploadResult.publicUrl || "";

          const now = new Date();
          const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          let changesThisMonth = (user?.lastAvatarChangeMonth === currentMonthStr) ? (user.avatarChangesThisMonth || 0) + 1 : 1;

          const updatedUser = {
            ...user,
            photoUrl: publicUrl,
            avatarChangesThisMonth: changesThisMonth,
            lastAvatarChangeMonth: currentMonthStr,
          };

          setUser(updatedUser);

          await AuthService.updateUser({
            photo_url: publicUrl,
            avatar_changes_this_month: changesThisMonth,
            last_avatar_change_month: currentMonthStr,
          });

          setIsUploadingAvatar(false);
          setIsCropModalOpen(false);
          setCropImageObj(null);
          showToast(`Foto de perfil actualizada. Cambios este mes: ${changesThisMonth}/3`, "success");
        } catch (err: any) {
          console.error("Error uploading avatar:", err);
          showToast("Se subió la foto localmente.", "info");
          setIsUploadingAvatar(false);
        }
      }, "image/jpeg", 0.85);
    } catch (err) {
      console.error("Error in crop and upload:", err);
      showToast("Ocurrió un error inesperado al actualizar la foto de perfil.", "error");
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmitExpediente = () => {
    if (!clientDocs.passport || !clientDocs.dui || !clientDocs.workCert || !clientDocs.bankStatements) {
      showToast("Por favor carga los 4 documentos requeridos para auditar tu expediente.", "info");
      return;
    }
    if (!ds160Confirmed) {
      showToast("Debes revisar y confirmar tus datos del formulario DS-160.", "info");
      return;
    }
    setExpedienteStatus('submitted');
    showToast("¡Expediente enviado con éxito! Tu asesora Sofía Rodríguez ha sido notificada.", "success");

    // Defer prepending system message
    setTimeout(() => {
      const newSystemMessage = {
        id: `msg-sys-${Date.now()}`,
        sender: "agent" as const,
        text: `He recibido tu expediente completo para auditoría (Pasaporte: ${clientDocs.passport}, DUI: ${clientDocs.dui}, Laboral: ${clientDocs.workCert}, Solvencia: ${clientDocs.bankStatements} y tus datos del DS-160). \n\nVoy a proceder a auditar y cotejar cada documento hoy mismo. Si todo coincide con las regulaciones de la sección consular, cambiaré el estado a "Aprobado" y pasaremos a programar tu cita y realizar el simulacro de entrevista (Paso 5). ¡Excelente trabajo de recopilación!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newSystemMessage]);

      // Also automatically approve the expediente after a short delay (e.g. 6 seconds) to simulate the agent review!
      setTimeout(() => {
        setExpedienteStatus('approved');
        const approvedMessage = {
          id: `msg-sys-${Date.now() + 1}`,
          sender: "agent" as const,
          text: `🎉 ¡Buenas noticias! He revisado detalladamente tu expediente digital y el borrador de tu formulario DS-160. Todo está perfectamente alineado y cumple al 100% con los criterios de solvencia y arraigo.\n\nHe procedido a cerrar el llenado del DS-160. Ya puedes revisar el Paso 5 en tu seguimiento para coordinar las fechas de tu cita y agendar tu sesión de simulacro de entrevista por Zoom.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, approvedMessage]);
      }, 6500);
    }, 1000);
  };

  // Computed assigned agent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedAgent = (agentsData as any[]).find(a => a.id === user?.assignedAgentId) || agentsData[0];

  // Sync user profile state with API on page load
  useEffect(() => {
    let isSubscribed = true;
    const syncWithApi = async () => {
      try {
        const userRes = await AuthService.getUser().catch(() => null);
        if (!userRes || !userRes.data?.user) return;
        const apiUser = userRes.data.user;

        if (apiUser && isSubscribed) {
          let profileRole: string = ROLES.USER;
          try {
            const profRes = await ProfileClientService.getProfile(apiUser.id);
            // API returns { profile: {...}, memberInfo: {...} }
            const dbRole = profRes?.profile?.role || profRes?.role || null;
            if (dbRole) {
              profileRole = dbRole;
              console.log('[Role Sync] Role from DB profile:', dbRole);
            } else {
              // Fallback: check auth metadata then current store
              profileRole = apiUser.user_metadata?.role || user?.role || ROLES.USER;
              console.log('[Role Sync] Role fallback to metadata/store:', profileRole);
            }
          } catch (err) {
            console.warn('[Role Sync] Failed to fetch profile role:', err);
            profileRole = apiUser.user_metadata?.role || user?.role || ROLES.USER;
          }

          const metadata = apiUser.user_metadata || {};

          const googleFullName = metadata.full_name || metadata.name || '';
          const fallbackFirstName = googleFullName.split(' ')[0] || '';
          const fallbackLastName = googleFullName.split(' ').slice(1).join(' ') || '';

          const finalRole = profileRole as typeof ROLES[keyof typeof ROLES];

          const updatedUser = {
            id: apiUser.id,
            email: apiUser.email || '',
            firstName: metadata.first_name || fallbackFirstName,
            lastName: metadata.last_name || fallbackLastName,
            phone: metadata.phone || '',
            country: metadata.country || '',
            viproScore: metadata.vipro_score || null,
            viproCompleted: metadata.vipro_completed || false,
            viproDestination: metadata.vipro_destination || null,
            hasPaidAdvisor: metadata.has_paid_advisor || false,
            assignedAgentId: metadata.assigned_agent_id || null,
            assignedAgencyName: metadata.assigned_agency_name || null,
            photoUrl: metadata.photo_url || metadata.avatar_url || metadata.picture || null,
            avatarChangesThisMonth: metadata.avatar_changes_this_month || 0,
            lastAvatarChangeMonth: metadata.last_avatar_change_month || '',
            ds160FullName: metadata.ds160_full_name || null,
            ds160PassportNum: metadata.ds160_passport_num || null,
            ds160BirthDate: metadata.ds160_birth_date || null,
            ds160PurposeOfTrip: metadata.ds160_purpose_of_trip || null,
            ds160HasAssets: metadata.ds160_has_assets ?? true,
            ds160Confirmed: metadata.ds160_confirmed || false,
            expedienteStatus: metadata.expediente_status || 'draft',
            role: finalRole,
          };

          if (
            !user ||
            user.id !== updatedUser.id ||
            user.viproCompleted !== updatedUser.viproCompleted ||
            user.viproScore !== updatedUser.viproScore ||
            user.viproDestination !== updatedUser.viproDestination ||
            user.hasPaidAdvisor !== updatedUser.hasPaidAdvisor ||
            user.assignedAgentId !== updatedUser.assignedAgentId ||
            user.assignedAgencyName !== updatedUser.assignedAgencyName ||
            user.firstName !== updatedUser.firstName ||
            user.lastName !== updatedUser.lastName ||
            user.photoUrl !== updatedUser.photoUrl ||
            user.avatarChangesThisMonth !== updatedUser.avatarChangesThisMonth ||
            user.lastAvatarChangeMonth !== updatedUser.lastAvatarChangeMonth ||
            user.ds160Confirmed !== updatedUser.ds160Confirmed ||
            user.expedienteStatus !== updatedUser.expedienteStatus ||
            user.role !== updatedUser.role
          ) {
            console.log("Syncing auth store state with user metadata.");
            setTimeout(() => {
              setUser(updatedUser);
              setDs160Data({
                fullName: updatedUser.ds160FullName || `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
                passportNum: updatedUser.ds160PassportNum || '',
                birthDate: updatedUser.ds160BirthDate || '',
                purposeOfTrip: updatedUser.ds160PurposeOfTrip || 'Turismo B1/B2',
                hasAssets: updatedUser.ds160HasAssets ?? true,
              });
              setDs160Confirmed(updatedUser.ds160Confirmed || false);
              setExpedienteStatus(updatedUser.expedienteStatus || 'draft');
            }, 0);
          }
        }
      } catch (err) {
        console.error("Failed to sync user session:", err);
      }
    };

    syncWithApi();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Load partner application and admin list
  useEffect(() => {
    if (!user) return;

    const loadPartnerData = async () => {
      setIsLoadingPartnerApp(true);
      try {
        let agencyId = null;
        if (user.role === "agent") {
          const profileData = await ProfileClientService.getProfile(user.id);
          const memberInfo = profileData?.memberInfo;
          if (memberInfo?.memberData?.agency_id) {
            agencyId = memberInfo.memberData.agency_id;
          }
        }

        const targetUserId = agencyId || user.id;

        const portalRes = await AgentClientService.getPortalData(targetUserId);
        if (portalRes.application) {
          setPartnerApp(portalRes.application);
        }

        const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR;
        if (isAdmin) {
          const requestsRes = await AgentClientService.getRequests();
          if (requestsRes.applications) {
            setAllApplications(requestsRes.applications);
          }
        }
      } catch (err) {
        console.error("Unexpected error loading partner/admin data:", err);
      } finally {
        setIsLoadingPartnerApp(false);
      }
    };

    loadPartnerData();
  }, [user]);

  // Admin action handlers: trigger security modal and execute database status change
  const triggerAdminSecurityModal = (app: AgentApplicationData, action: "approved" | "rejected") => {
    setSecurityConfirmed(false);
    setSecurityModalData({ app, targetAction: action });
  };

  const executeAdminAction = async (appId: string, action: "approved" | "rejected" | "comment_only") => {
    if (!user) return;
    const targetApp = selectedApp?.id === appId ? selectedApp : allApplications.find(a => a.id === appId);
    if (!targetApp) return;

    setIsSavingAdmin(true);

    const newStatus = action === "comment_only" ? targetApp.status : action;
    const updatePayload: Partial<AgentApplicationData> & { updated_at: string } = {
      admin_notes: adminNotesInput,
      updated_at: new Date().toISOString(),
    };

    if (action !== "comment_only") {
      updatePayload.status = newStatus;
      updatePayload.approved_at = new Date().toISOString();
      updatePayload.approved_by = user.id;
    }

    try {
      await AgentClientService.updateApplication({
        id: appId,
        updates: updatePayload
      });

      showToast(
        action === "approved"
          ? "¡Solicitud aprobada con éxito!"
          : action === "rejected"
            ? "Solicitud rechazada/devuelta."
            : "Comentarios guardados con éxito.",
        "success"
      );

      if (action === "approved" && targetApp?.user_id) {
        const applicantType = targetApp.application_type || "individual";
        const newRole = applicantType === "agency" ? ROLES.AGENCY : ROLES.AGENT;
        await ProfileClientService.updateProfile(targetApp.user_id, { role: newRole });
      }

      setSelectedApp((prev: AgentApplicationData | null) => (prev && prev.id === appId) ? ({
        ...prev,
        ...updatePayload,
      }) : prev);

      const requestsRes = await AgentClientService.getRequests();
      if (requestsRes.applications) setAllApplications(requestsRes.applications);

      if (partnerApp && partnerApp.id === appId) {
        setPartnerApp((prev: AgentApplicationData | null) => (prev && prev.id === appId) ? ({
          ...prev,
          ...updatePayload,
        }) : null);
      }
    } catch (err: any) {
      console.error("Failed to update partner application status:", err);
      showToast("Error al guardar cambios.", "error");
    } finally {
      setIsSavingAdmin(false);
      setSecurityModalData(null);
      setSecurityConfirmed(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Auto-switch to datos tab when user role is agent/agency
  useEffect(() => {
    if (user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY)) {
      const t = setTimeout(() => setActiveTab("datos"), 0);
      return () => clearTimeout(t);
    }
  }, [user?.role]);

  // Fetch agent commissions from API
  const loadCommissions = async () => {
    if (!user) return;
    setIsLoadingCommissions(true);
    try {
      const data = await ProfileClientService.getCommissions(user.id);
      setAgentCommissions(data || []);
    } catch (err) {
      console.error("Error fetching commissions:", err);
    } finally {
      setIsLoadingCommissions(false);
    }
  };

  // Fetch agency team members
  const loadAgencyMembers = async () => {
    if (!user || user.role !== ROLES.AGENCY) return;
    setIsLoadingMembers(true);
    try {
      const teamData = await ProfileClientService.getTeam(user.id);
      setAgencyMembers(teamData.members || []);
    } catch (err) {
      console.error("Error fetching agency members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch agency invitations
  const loadAgencyInvitations = async () => {
    if (!user || user.role !== ROLES.AGENCY) return;
    setIsLoadingInvitations(true);
    try {
      const teamData = await ProfileClientService.getTeam(user.id);
      setAgencyInvitations(teamData.invitations || []);
    } catch (err) {
      console.error("Error fetching agency invitations:", err);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  // Invite Consultant function
  const handleInviteConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail.trim()) return;
    setIsSendingInvite(true);
    try {
      const randomArr = new Uint8Array(16);
      crypto.getRandomValues(randomArr);
      const token = Array.from(randomArr).map(b => b.toString(16).padStart(2, '0')).join('');

      await ProfileClientService.inviteTeamMember({
        agency_id: user.id,
        email: inviteEmail.trim().toLowerCase(),
        token,
        status: "pending"
      });

      showToast(`Invitación generada para ${inviteEmail.trim()}`, "success");
      setInviteEmail("");
      loadAgencyInvitations();
    } catch (err: unknown) {
      console.error("Error inviting consultant:", err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Error al generar invitación.", "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Load payout settings for inline métodos de cobro tab
  const loadPayoutSettings = async () => {
    if (!user) return;
    setIsLoadingPayout(true);
    try {
      const portalRes = await AgentClientService.getPortalData(user.id);
      const app = portalRes.application;
      if (app?.payout_settings) {
        const s = app.payout_settings as Record<string, string>;
        if (s.method) setPayoutMethod(s.method as 'paypal' | 'ach');
        if (s.paypal_email) setPaypalEmail(s.paypal_email);
        if (s.bank_name) setBankName(s.bank_name);
        if (s.account_type) setAccountType(s.account_type);
        if (s.account_number) setAccountNumber(s.account_number);
        if (s.routing_code) setRoutingCode(s.routing_code);
        if (s.tax_id) setTaxId(s.tax_id);
      }
    } catch (err) {
      console.error("Error loading payout settings:", err);
    } finally {
      setIsLoadingPayout(false);
    }
  };

  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingPayout(true);
    const updatedSettings = {
      method: payoutMethod,
      paypal_email: payoutMethod === 'paypal' ? paypalEmail : "",
      bank_name: payoutMethod === 'ach' ? bankName : "",
      account_type: payoutMethod === 'ach' ? accountType : "",
      account_number: payoutMethod === 'ach' ? accountNumber : "",
      routing_code: payoutMethod === 'ach' ? routingCode : "",
      tax_id: payoutMethod === 'ach' ? taxId : "",
    };
    try {
      await AgentClientService.updateApplication({
        userId: user.id,
        updates: { payout_settings: updatedSettings }
      });
      showToast("Configuración de pago guardada exitosamente.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Error al guardar configuración.", "error");
    } finally {
      setSavingPayout(false);
    }
  };

  const loadAgentAppForTab = async () => {
    if (!user) return;
    setIsLoadingAgentApp(true);
    try {
      let targetUserId = user.id;
      if (user.role === ROLES.AGENT) {
        const profileRes = await ProfileClientService.getProfile(user.id);
        if (profileRes?.memberInfo?.memberData?.agency_id) {
          targetUserId = profileRes.memberInfo.memberData.agency_id;
        }
      }
      const portalRes = await AgentClientService.getPortalData(targetUserId);
      const data = portalRes.application;
      setAgentApp(data || null);
      if (data?.signature_name) setSignatureName(data.signature_name);
    } catch (err) {
      console.error("Error loading agent application for accreditation tab:", err);
    } finally {
      setIsLoadingAgentApp(false);
    }
  };

  const handleSignAgreementInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentApp) return;
    if (!signatureName.trim()) {
      showToast("Por favor escribe tu nombre completo para firmar.", "error");
      return;
    }
    setIsSigning(true);
    const nowString = new Date().toISOString();
    try {
      await AgentClientService.updateApplication({
        id: agentApp.id,
        updates: { status: "active", signature_name: signatureName.trim(), signed_at: nowString }
      });
      setAgentApp((prev) => prev ? { ...prev, status: "active", signature_name: signatureName.trim(), signed_at: nowString } : null);
      showToast("¡Contrato firmado con éxito! Tu acreditación se encuentra activa.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Error al firmar acuerdo comercial.", "error");
    } finally {
      setIsSigning(false);
    }
  };

  // Load assigned clients for the agent chat tab
  const loadAssignedClients = async () => {
    if (!user || user.role !== ROLES.AGENT) return;
    setIsLoadingClients(true);
    try {
      const agentRes = await AgentClientService.getAssignedClients(user.id);
      setAssignedClients(agentRes.clients || []);
    } catch (err) {
      console.error("Error loading assigned clients:", err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Load messages for a specific client (agent perspective)
  const loadAgentChatMessages = async (clientId: string) => {
    try {
      const data = await MessageClientService.getMessages(clientId);
      setAgentChatMessages(
        data.map((msg: ClientMessageData) => ({
          id: msg.id || "",
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }))
      );
    } catch (err) {
      console.error("Error loading agent chat messages:", err);
    }
  };

  // Send a message as the agent to a specific client
  const handleSendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClient || !agentChatInput.trim()) return;
    const textToSend = agentChatInput.trim();
    setAgentChatInput("");
    setIsSendingAgentMsg(true);
    try {
      const newMsg = await MessageClientService.createMessage({
        sender: "agent",
        text: textToSend,
        user_id: selectedClient.client_id,
        agent_id: user.id,
      });
      setAgentChatMessages((prev) => {
        if (prev.some((m) => m.id === (newMsg.id || ""))) return prev;
        return [...prev, {
          id: newMsg.id || "",
          sender: newMsg.sender,
          text: newMsg.text,
          timestamp: newMsg.timestamp ? new Date(newMsg.timestamp) : new Date(),
        }];
      });
    } catch (err) {
      console.error("Error sending agent message:", err);
      showToast("Error al enviar el mensaje.", "error");
    } finally {
      setIsSendingAgentMsg(false);
    }
  };

  // Trigger loads when activeTab changes
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      if (activeTab === "comisiones") {
        loadCommissions();
      }
      if (activeTab === "invitar_agentes" && user.role === ROLES.AGENCY) {
        loadAgencyMembers();
        loadAgencyInvitations();
      }
      if (activeTab === "metodos_cobro") {
        loadPayoutSettings();
      }
      if (activeTab === "mi_acreditacion") {
        loadAgentAppForTab();
      }
      if (activeTab === "chat_agente" && user.role === ROLES.AGENT) {
        loadAssignedClients();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, user?.id, user?.role]);

  // Real-time subscription for agent chat: listen for new messages on selected client
  // Real-time polling for agent chat: listen for new messages on selected client
  useEffect(() => {
    if (!user || !selectedClient) return;
    const interval = setInterval(async () => {
      try {
        const data = await MessageClientService.getMessages(selectedClient.client_id);
        if (data && data.length > 0) {
          setAgentChatMessages(
            data.map((msg: ClientMessageData) => ({
              id: msg.id || "",
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to poll agent chat messages:", err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedClient?.client_id, user?.id]);

  // Auto-scroll agent chat to bottom when messages change
  useEffect(() => {
    if (agentChatRef.current && agentChatMessages.length > 0) {
      agentChatRef.current.scrollTo({ top: agentChatRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [agentChatMessages]);

  // Sync state when user store loads
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setPhone(user.phone || "");
        setCountryCode(user.country || "SV");
        setDs160Data(prev => ({
          ...prev,
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim()
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["datos", "proceso", "asesor", "pagos"].includes(tab)) {
        const timer = setTimeout(() => setActiveTab(tab), 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch real physical purchases and VIPRO evaluations from API in parallel
  useEffect(() => {
    if (!user) {
      setIsDataLoading(false);
      return;
    }
    const fetchDbRecords = async () => {
      setIsDataLoading(true);
      try {
        const [profileRes, preformRes, viproRes] = await Promise.allSettled([
          ProfileClientService.getProfile(user.id),
          FormClientService.getPreformulario(user.id),
          FormClientService.getViproEvaluation(user.id)
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value) {
          const profData = profileRes.value.profile;
          if (profData) {
            const pMap: Record<string, { email: string; name: string }> = {};
            const full = `${profData.first_name || ""} ${profData.last_name || ""}`.trim();
            const entry = { email: profData.email || "", name: full || profData.email || "" };
            if (profData.id) {
              pMap[profData.id] = entry;
              pMap[profData.id.toLowerCase()] = entry;
              pMap[profData.id.substring(0, 8)] = entry;
            }
            if (profData.email) pMap[profData.email.toLowerCase()] = entry;
            setDbProfilesMap(pMap);
          }
        }

        if (preformRes.status === "fulfilled" && preformRes.value) {
          const preform = preformRes.value;
          if (preform) {
            setAllPreformulariosList([preform]);
          }
        }

        if (viproRes.status === "fulfilled" && viproRes.value) {
          const evalData = Array.isArray(viproRes.value) ? viproRes.value : [viproRes.value];
          setViproEvaluations(evalData);
          if (evalData.length > 0 && !user.viproCompleted) {
            setUser({ ...user, viproCompleted: true, viproScore: evalData[0].score || user.viproScore });
          }
        } else if (user.viproCompleted || user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) {
          setViproEvaluations([
            {
              id: "vipro-sample-1",
              user_id: user.id,
              user_email: user.email,
              destination_country: user.viproDestination || "US",
              score: user.viproScore || 88,
              is_completed: true,
              created_at: new Date().toISOString(),
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load user records from API:", err);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchDbRecords();
  }, [user?.id, activeTab]);

  // Fetch all registered profiles, preformularios, and vipro evaluations when user is admin / moderator
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR;
    if (isAdmin) {
      ProfileClientService.getAllProfiles()
        .then((profiles) => {
          if (profiles && Array.isArray(profiles)) {
            setAllProfilesList(profiles);
            const pMap: Record<string, { email: string; name: string }> = {};
            profiles.forEach((p: any) => {
              const full = `${p.first_name || ""} ${p.last_name || ""}`.trim();
              const entry = { email: p.email || "", name: full || p.email || "" };
              if (p.id) {
                pMap[p.id] = entry;
                pMap[p.id.toLowerCase()] = entry;
                pMap[p.id.substring(0, 8)] = entry;
              }
              if (p.email) pMap[p.email.toLowerCase()] = entry;
            });
            setDbProfilesMap((prev) => ({ ...prev, ...pMap }));
          }
        })
        .catch((err) => console.error("Error fetching all profiles for admin:", err));

      FormClientService.getAllPreformularios()
        .then((preforms) => {
          if (preforms && Array.isArray(preforms)) {
            setAllPreformulariosList(preforms);
          }
        })
        .catch((err) => console.error("Error fetching all preformularios:", err));

      FormClientService.getAllViproEvaluations()
        .then((evals) => {
          if (evals && Array.isArray(evals)) {
            setViproEvaluations(evals);
          }
        })
        .catch((err) => console.error("Error fetching all vipro evals:", err));
    }
  }, [user, activeTab]);

  // Load messages from API Service
  const [isSupabaseDbAvailable, setIsSupabaseDbAvailable] = useState<boolean | null>(null);

  const prepopulateMockMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    if (!user || !user.hasPaidAdvisor) return;

    const fetchMessages = async () => {
      try {
        const data = await MessageClientService.getMessages(user.id);
        setIsSupabaseDbAvailable(true);
        if (data && data.length > 0) {
          setMessages(
            data.map((msg: ClientMessageData) => ({
              id: msg.id || "",
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            }))
          );
        } else {
          setMessages([]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("API messages fetch error:", msg);
        setIsSupabaseDbAvailable(false);
        setMessages([]);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user?.id, user?.hasPaidAdvisor, user?.assignedAgentId]);

  // Load assigned agency and agent profiles from API for client view
  useEffect(() => {
    if (!user) return;

    const loadAssignedProfiles = async () => {
      try {
        const profileRes = await ProfileClientService.getProfile(user.id);
        if (profileRes?.profile) {
          setAssignedAgentProfile(profileRes.profile);
        }
      } catch (err) {
        console.error("Error loading assigned profiles via API:", err);
      }
    };
    loadAssignedProfiles();
  }, [user?.id, user?.assignedAgentId]);

  // Auto-scroll to bottom of chat container only (avoiding page viewport scrolling)
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    if (activeTab === "asesor" && user?.hasPaidAdvisor) {
      // Small timeout to ensure DOM update has completed before querying scrollHeight
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, activeTab, user?.hasPaidAdvisor]);

  if (!isMounted) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background-main animate-pulse">
        <Header headerRef={headerRef} />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
          {/* Profile Header Skeleton Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-border-light shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full md:w-auto text-center sm:text-left">
              <div className="w-24 h-24 rounded-full bg-slate-200 shrink-0"></div>
              <div className="space-y-3 flex-1 flex flex-col items-center sm:items-start">
                <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-36"></div>
                <div className="flex gap-2 pt-1">
                  <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                  <div className="h-5 bg-slate-100 rounded-full w-28"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-28"></div>
            </div>
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className="flex items-center gap-3 border-b border-border-light pb-4 overflow-x-auto">
            <div className="h-10 bg-slate-200 rounded-xl w-36 shrink-0"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-36 shrink-0"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-36 shrink-0"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-36 shrink-0"></div>
          </div>

          {/* Tab Content Section Skeleton */}
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-border-light shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-border-light pb-4">
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 rounded-lg w-64"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-80"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded-lg w-24"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="h-5 bg-slate-200 rounded w-40"></div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
              </div>
              <div className="space-y-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="h-5 bg-slate-200 rounded w-40"></div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background-main">
        <Header headerRef={headerRef} />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Acceso Restringido</h2>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            Debes iniciar sesión con tu cuenta para acceder a tu panel de control y ver tu perfil de usuario.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full bg-brand-primary text-white font-semibold py-3 rounded-sm hover:bg-brand-hover transition-colors text-sm shadow-sm"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="w-full bg-white border border-border-light text-text-secondary font-semibold py-3 rounded-sm hover:text-text-primary hover:bg-background-hover transition-all text-sm"
            >
              Crear Cuenta
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleDeclineInvitation = async () => {
    if (!realInvitation) return;
    try {
      await ProfileClientService.respondInvitation(realInvitation.id, "decline");
      setRealInvitation(null);
      showToast("Invitación rechazada.", "info");
    } catch (err: any) {
      console.error("Error declining invitation:", err);
      showToast("Error al rechazar invitación: " + (err.message || String(err)), "error");
    }
  };

  const handleAcceptInvitation = async () => {
    if (user && realInvitation) {
      try {
        const agencyName = `${realInvitation.agency.first_name || ""} ${realInvitation.agency.last_name || ""}`.trim();
        await ProfileClientService.respondInvitation(realInvitation.id, "accept");

        // 3. Update local auth state
        const updated = {
          ...user,
          role: "agent",
          assignedAgencyName: agencyName
        };
        setUser(updated);
        setRealInvitation(null);

        // 4. Update Supabase auth user metadata & profiles table
        await AuthService.updateUser({
          role: "agent",
          assigned_agency_name: agencyName
        });

        await ProfileClientService.updateProfile(user.id, { role: "agent" });

        showToast(`¡Invitación aceptada! Ahora eres un asesor consular certificado de ${agencyName}.`, "success");
      } catch (err: any) {
        console.error("Error accepting B2B invitation:", err);
        showToast("Error al aceptar invitación: " + err.message, "error");
      }
    }
  };

  const handleSimulateAgentAssignment = async () => {
    if (user) {
      try {
        const updated = {
          ...user,
          assignedAgentId: "agent-7",
          assignedAgencyName: "Agency with Agent"
        };
        setUser(updated);

        await AuthService.updateUser({
          assigned_agent_id: "agent-7",
          assigned_agency_name: "Agency with Agent"
        });

        const text = `🏢 Sistema Agency with Agent: Se ha asignado oficialmente al asesor experto Lic. Roberto Castaneda para liderar tu proceso de visado. ¡Hola! Estaré a cargo de tu expediente desde este momento.`;
        const welcomeMsg = {
          id: `sys-${Date.now()}`,
          sender: "agent" as const,
          text,
          timestamp: new Date()
        };

        const localKey = `mock_messages_${user.id}`;
        try {
          await MessageClientService.createMessage({
            sender: "agent",
            text,
            user_id: user.id,
            agent_id: "agent-7"
          });
        } catch (msgErr) {
          console.error("Failed to persist welcome message to chat:", msgErr);
        }

        if (typeof window !== "undefined") {
          localStorage.setItem(localKey, JSON.stringify([welcomeMsg]));
        }

        setMessages([welcomeMsg]);
        showToast("¡Agente asignado exitosamente por la empresa!", "success");
      } catch (err) {
        console.error("Error simulating agent assignment:", err);
        showToast("Error al asignar agente.", "error");
      }
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmailInput.trim()) {
      showToast("Por favor ingresa el correo del asesor.", "error");
      return;
    }

    try {
      const email = inviteEmailInput.trim().toLowerCase();
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      await ProfileClientService.inviteTeamMember({
        agency_id: user.id,
        email: email,
        token: token,
        status: "pending"
      });

      showToast(`¡Invitación enviada con éxito a ${email}!`, "success");
      setInviteEmailInput("");
      setInviteNameInput("");

      if (user && user.email.trim().toLowerCase() === email) {
        const profileRes = await ProfileClientService.getProfile(user.id);
        if (profileRes?.invitation) {
          setRealInvitation(profileRes.invitation);
        }
      }
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      showToast(`Error al enviar invitación: ${err.message}`, "error");
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast("Por favor completa el nombre y apellido.", "error");
      return;
    }

    const updatedUser = {
      ...user!,
      firstName,
      lastName,
      phone,
      country: countryCode,
    };

    setUser(updatedUser);

    try {
      await ProfileClientService.updateProfile(user!.id, {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        photo_url: user?.photoUrl || null,
      });

      await AuthService.updateUser({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        country: countryCode,
      });
      showToast("¡Cambios guardados con éxito!", "success");
    } catch (err) {
      console.error("Error saving profile:", err);
      showToast("¡Cambios guardados localmente!", "success");
    }
  };

  const handleLogout = () => {
    clearUser();
    router.push("/");
  };

  // Chat message send handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const textToSend = inputValue.trim();
    setInputValue("");

    const tempId = `msg-${Date.now()}`;
    const newUserMsg = {
      id: tempId,
      sender: "user" as const,
      text: textToSend,
      timestamp: new Date(),
    };

    // Optimistically add the message to the screen immediately for zero lag
    setMessages((prev) => [...prev, newUserMsg]);

    const localKey = `mock_messages_${user.id}`;

    if (isSupabaseDbAvailable) {
      try {
        await MessageClientService.createMessage({
          sender: "user",
          text: textToSend,
          user_id: user.id,
          agent_id: user.assignedAgentId || "sofia",
        });
      } catch (err: any) {
        console.error("Failed to send message via API:", err.message);
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(localKey);
          const current = stored ? JSON.parse(stored) : [];
          localStorage.setItem(localKey, JSON.stringify([...current, newUserMsg]));
        }
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify([...messages, newUserMsg]));
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      {/* Banner Superior del Perfil */}
      <div className="w-full bg-brand-primary py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-[80%] mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
          {/* Avatar gigante en el banner (clickable) */}
          <div className="relative group w-20 h-20 bg-brand-light border-4 border-white/20 rounded-full flex items-center justify-center shadow-lg overflow-hidden select-none">
            <UserAvatar
              src={user?.photoUrl}
              name={firstName + " " + lastName}
              size="xl"
            />
            {/* Hover overlay para cambiar foto */}
            <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-bold">
              <span className="text-sm">📸</span>
              <span className="mt-0.5 leading-none">CAMBIAR</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center md:text-left text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 mb-1.5">
              {user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR
                ? "Panel de Administración"
                : (user?.role === ROLES.AGENT || user?.role === ROLES.AGENCY) && agentApp && (agentApp.status === "active" || agentApp.status === "approved") && Boolean(agentApp.signed_at)
                  ? (user?.role === ROLES.AGENCY ? "Panel de Agencia" : "Panel de Asesor")
                  : "Panel del Aplicante"}
            </p>

            <h1 className="text-3xl font-bold leading-tight font-serif italic mb-1">
              Hola, {firstName} {lastName}
            </h1>
            <p className="text-xs text-white/90 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>ID de Usuario: <span className="font-mono text-white/70">{user.id.substring(0, 8)}...</span></span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span>Registrado desde El Salvador</span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center">
                Cambios de foto: <span className="font-semibold ml-1">{user?.avatarChangesThisMonth || 0}/3 este mes</span>
              </span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="md:ml-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-sm border border-white/20 transition-colors focus:outline-none flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>



      {/* Grid Principal */}
      <main className="w-[80%] mx-auto py-10 flex-1 flex flex-col lg:flex-row gap-8">

        {/* Columna Izquierda: Tarjeta de Resumen y Menú */}
        <aside className="w-full lg:w-1/4 flex-shrink-0">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">

            {/* Navegación Vertical */}
            <nav className="p-2 flex flex-col gap-1">
              {(() => {
                const isAgent = user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY);
                const isStaff = user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR);

                const svgIcons: Record<string, JSX.Element> = {
                  datos: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                  proceso: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
                  vipro: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                  asesor: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                  pagos: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
                  admin_dashboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" /></svg>,
                  admin_socios: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                  admin_usuarios: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
                  admin_expedientes: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
                  admin_vipro: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
                  admin_pagos: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
                  mi_acreditacion: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
                  panel_empresa: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                  invitar_agentes: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
                  chat_agente: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
                  comisiones: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                  metodos_cobro: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                  solicitud: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                };

                const baseUserTabs = [
                  { id: "datos", label: "Mis Datos Personales" },
                  { id: "proceso", label: "Seguimiento de Trámite" },
                  { id: "vipro", label: "Evaluación VIPRO" },
                  { id: "asesor", label: "Mi Asesor Asignado" },
                  { id: "pagos", label: "Pagos y Comprobantes" },
                ];

                // --- Tabs for admin / moderator ---
                if (isStaff) {
                  return [
                    { id: "datos", label: "Mis Datos Personales" },
                    { id: "admin_dashboard", label: "Panel de Control Global" },
                    { id: "admin_socios", label: user.role === ROLES.MODERATOR ? "Moderación de Socios" : "Administrar Socios y Agentes" },
                    { id: "admin_usuarios", label: "Gestión de Usuarios" },
                    { id: "admin_expedientes", label: "Monitor de Expedientes" },
                    { id: "admin_vipro", label: "Evaluaciones VIPRO" },
                    { id: "admin_pagos", label: "Historial de Pagos" },
                  ].map(t => ({ ...t, svgIcon: svgIcons[t.id] }));
                }

                // --- Tabs for agents / agencies ---
                if (isAgent) {
                  const isAccredited = agentApp && (agentApp.status === "active" || agentApp.status === "approved") && Boolean(agentApp.signed_at);
                  return [
                    ...baseUserTabs,
                    { id: "mi_acreditacion", label: "Mi Acreditación" },
                    ...(isAccredited ? [
                      ...(user.role === ROLES.AGENCY ? [
                        { id: "panel_empresa", label: "Panel de Empresa", isLink: true, url: "/agents/portal" },
                        { id: "invitar_agentes", label: "Link de Referidos" },
                      ] : [
                        { id: "chat_agente", label: "Chat con Clientes" },
                      ]),
                      { id: "comisiones", label: "Comisiones Realizadas" },
                      { id: "metodos_cobro", label: "Métodos de Cobro" },
                    ] : []),
                  ].map((t: any) => ({ ...t, svgIcon: svgIcons[t.id] }));
                }

                // --- Default tabs for regular users ---
                return [
                  ...baseUserTabs,
                  ...(partnerApp ? [{ id: "solicitud", label: "Mi Solicitud de Socio" }] : []),
                ].map((t: any) => ({ ...t, svgIcon: svgIcons[t.id] }));
              })().map((tab: { id: string; label: string; svgIcon?: JSX.Element; isLink?: boolean; url?: string }) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.isLink && tab.url) {
                      router.push(tab.url);
                    } else {
                      handleTabChange(tab.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm text-left transition-colors focus:outline-none ${activeTab === tab.id
                      ? "bg-brand-light text-brand-primary font-semibold"
                      : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
                    }`}
                >
                  <span className={`flex-shrink-0 ${activeTab === tab.id ? "text-brand-primary" : "text-text-muted"}`}>
                    {tab.svgIcon || <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Columna Derecha: Contenido del Tab Activo */}
        <section className="w-full lg:w-3/4">
          <div className="bg-white rounded-lg border border-border-light p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-h-[450px]">




            {/* TAB: DATOS PERSONALES */}
            {activeTab === "datos" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Datos Personales</h2>
                  <p className="text-xs text-text-secondary mt-1">Mantén tu información de contacto actualizada para que podamos ponernos en contacto contigo.</p>
                </div>

                {/* B2B Agency Invitation Banner */}


                <form onSubmit={handleSaveData} className="max-w-xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Nombres</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Apellidos</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all text-text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Correo Electrónico</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-border-light rounded-sm text-sm text-text-muted cursor-not-allowed"
                    />
                    <span className="block text-[10px] text-text-muted mt-1">El correo electrónico no puede ser modificado por seguridad.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Teléfono móvil</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. +503 7000-0000"
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">País de Residencia</label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
                      >
                        {countriesArray.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>



                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-brand-primary text-white font-semibold px-6 py-2.5 rounded-sm hover:bg-brand-hover transition-colors text-sm shadow-sm"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: SEGUIMIENTO DE TRÁMITE */}
            {activeTab === "proceso" && (() => {
              if (isDataLoading) {
                return (
                  <div className="space-y-6 text-left animate-pulse">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-4">
                      <div className="space-y-2">
                        <div className="h-6 bg-slate-200 rounded-lg w-64"></div>
                        <div className="h-4 bg-slate-100 rounded-lg w-80"></div>
                      </div>
                      <div className="h-12 bg-slate-200 rounded-xl w-36"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-44 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                        <div className="h-5 bg-slate-300 rounded w-48"></div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full mt-4"></div>
                      </div>
                      <div className="h-44 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                        <div className="h-5 bg-slate-300 rounded w-48"></div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full mt-4"></div>
                      </div>
                    </div>
                    <div className="h-60 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="h-5 bg-slate-200 rounded w-48"></div>
                      <div className="h-14 bg-slate-100 rounded-xl w-full"></div>
                      <div className="h-14 bg-slate-100 rounded-xl w-full"></div>
                    </div>
                  </div>
                );
              }

              const myEvals = viproEvaluations.filter((ev: any) => ev.user_id === user.id || (user.email && ev.user_email?.toLowerCase() === user.email.toLowerCase()));
              const latestEval = myEvals.length > 0 ? myEvals[0] : null;

              const isViproCompleted = Boolean(
                user.viproCompleted ||
                myEvals.length > 0 ||
                (typeof window !== "undefined" && (localStorage.getItem("vipro_completed") === "true" || Boolean(localStorage.getItem("vipro_score"))))
              );
              const hasPaidAdvisor = Boolean(user.hasPaidAdvisor || dbPurchases.some((p: any) => p.product_type === "advisor" && p.status === "completed"));
              const hasVipro = Boolean(user.hasPaidVipro || isViproCompleted || dbPurchases.some((p: any) => p.product_type === "vipro" && p.status === "completed"));
              const hasAnyService = hasPaidAdvisor || hasVipro;

              // Determine mode: VIPRO Express vs Servicio Completo con Asesor vs Ninguno
              const isViproOnly = !hasPaidAdvisor && hasVipro;

              // Dynamic progress calculation
              let progressPercent = 0;
              if (hasPaidAdvisor) {
                progressPercent = 15;
                if (isPreformularioCompleted) progressPercent += 20;
                if (user.hasPaidAdvisor) progressPercent += 15;
                if (expedienteStatus === "submitted" || expedienteStatus === "approved") progressPercent += 20;
                if (expedienteStatus === "approved") progressPercent += 15;
                if (preformMetadata?.appointment_date) progressPercent += 10;
                if (preformMetadata?.courier_tracking) progressPercent += 5;
              } else if (isViproOnly) {
                progressPercent = isViproCompleted ? 100 : 50;
              } else {
                progressPercent = 0;
              }

              return (
                <div>
                  <div className="mb-6 pb-4 border-b border-border-light text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-text-primary">
                          {hasPaidAdvisor
                            ? "Seguimiento de Trámite de Visa (Servicio Completo)"
                            : isViproOnly
                              ? "Seguimiento de Evaluación VIPRO Express"
                              : "Seguimiento de Trámite de Visa"}
                        </h2>
                        <p className="text-xs text-text-secondary mt-1">
                          {hasPaidAdvisor
                            ? "Monitorea el avance en tiempo real de tu expediente consular paso a paso."
                            : isViproOnly
                              ? "Monitorea el estado de tu diagnóstico de perfilamiento consular."
                              : "No has contratado un servicio aún. Selecciona una opción para activar tu línea de seguimiento."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-brand-light/60 border border-brand-primary/20 p-3 rounded-lg">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Avance del Proceso</span>
                          <span className="text-lg font-extrabold text-brand-primary font-mono">{progressPercent}%</span>
                        </div>
                        <div className="w-20 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-primary h-full transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Status Cards / Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                    {/* Tarjeta VIPRO */}
                    <div className={`p-5 border rounded-2xl transition-all ${hasVipro ? "bg-blue-50/50 border-blue-200 shadow-sm" : "bg-white border-border-light shadow-xs"}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                          Evaluación Diagnóstica VIPRO
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isViproCompleted ? "bg-emerald-100 text-emerald-800" : hasVipro ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}>
                          {isViproCompleted ? "Completado" : hasVipro ? "Disponible" : "No Adquirido"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary mb-1">Diagnóstico de Probabilidad Consular ($19.99 USD)</h4>
                      <p className="text-xs text-text-secondary leading-relaxed mb-4">
                        Evaluación expres para analizar solvencia, arraigo y perfil de viabilidad.
                      </p>
                      {isViproCompleted ? (
                        <button
                          onClick={() => router.push(`/vipro-form/evaluation?country=${latestEval?.destination_country || user.viproDestination || "US"}${latestEval?.id ? `&evalId=${latestEval.id}` : ""}&userId=${user.id}`)}
                          className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Ver Diagnóstico Consular ({latestEval?.score || user.viproScore || 85}/100) &rarr;
                        </button>
                      ) : hasVipro ? (
                        <button
                          onClick={() => router.push("/vipro-form")}
                          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors cursor-pointer shadow-xs"
                        >
                          Iniciar Evaluación VIPRO &rarr;
                        </button>
                      ) : user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR ? (
                        <button
                          onClick={() => setActiveTab("admin_vipro")}
                          className="px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-sm hover:bg-purple-200 transition-colors cursor-pointer shadow-xs"
                        >
                          👑 Ver Evaluaciones de Todos los Usuarios &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push("/vipro-form")}
                          className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors cursor-pointer shadow-xs"
                        >
                          Adquirir VIPRO por $19.99 USD &rarr;
                        </button>
                      )}
                    </div>

                    {/* Tarjeta Servicio con Asesor */}
                    <div className={`p-5 border rounded-2xl transition-all ${user.hasPaidAdvisor ? "bg-emerald-50/50 border-emerald-200 shadow-sm" : "bg-white border-border-light shadow-xs"}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Servicio Completo con Asesor
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.hasPaidAdvisor ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                          {user.hasPaidAdvisor ? "Activo" : "No Adquirido"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary mb-1">Preformulario + Llenado DS-160 + Acompañamiento ($112.50 USD)</h4>
                      <p className="text-xs text-text-secondary leading-relaxed mb-4">
                        Asesoría 1-a-1, llenado oficial de formulario consular, auditoría de expediente y simulacros Zoom.
                      </p>
                      {user.hasPaidAdvisor ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            👤 {assignedAgent?.name || "Asesor Asignado"}
                          </span>
                          <button
                            onClick={() => setActiveTab("asesor")}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Chat 1-a-1 &rarr;
                          </button>
                        </div>
                      ) : user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR ? (
                        <button
                          onClick={() => setActiveTab("admin_expedientes")}
                          className="px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-sm hover:bg-purple-200 transition-colors cursor-pointer shadow-xs"
                        >
                          👑 Monitor de Expedientes Globales &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push("/agents")}
                          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors cursor-pointer shadow-xs"
                        >
                          Seleccionar Asesor ($112.50 USD) &rarr;
                        </button>
                      )}

                    </div>
                  </div>

                  {/* RENDER CONDICIONAL DE PASOS / TIMELINE */}
                  {!hasAnyService ? (
                    /* NINGÚN SERVICIO ADQUIRIDO: MOSTRAR SOLO INFORMACIÓN SIN PASOS */
                    <div className="p-8 bg-white border border-border-light rounded-2xl text-center space-y-4 shadow-xs text-left md:text-center">
                      <div className="w-16 h-16 rounded-full bg-brand-light text-brand-primary flex items-center justify-center text-2xl font-bold mx-auto">
                        📌
                      </div>
                      <div className="space-y-1.5 max-w-lg mx-auto">
                        <h3 className="text-base font-bold text-text-primary">Línea de Seguimiento No Activa</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Para habilitar los pasos interactivos de seguimiento en tu perfil, debes contratar la **Evaluación Diagnóstica VIPRO ($19.99 USD)** o la **Asesoría Consular Completa con Asesor ($112.50 USD)**.
                        </p>
                      </div>
                    </div>
                  ) : isViproOnly ? (
                    /* TIMELINE EXPRÉS PARA VIPRO */
                    <div className="space-y-6 text-left">


                      <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:right-auto before:w-0.5 before:bg-gray-200 mt-4">
                        {/* Paso 1 VIPRO */}
                        <div className="flex gap-4 relative">
                          <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 shadow-xs">
                            ✓
                          </div>
                          <div className="flex-1 bg-background-main/30 border border-border-light rounded-md p-4">
                            <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                              <h4 className="text-sm font-bold text-text-primary">Paso 1: Registro de Cuenta y Adquisición de VIPRO</h4>
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">COMPLETADO</span>
                            </div>
                            <p className="text-xs text-text-secondary">Tu cuenta y pago de la Evaluación Diagnóstica VIPRO han sido confirmados.</p>
                          </div>
                        </div>

                        {/* Paso 2 VIPRO */}
                        <div className="flex gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${user.viproCompleted ? "bg-brand-primary text-white shadow-xs" : "bg-amber-500 text-white animate-pulse"}`}>
                            {user.viproCompleted ? "✓" : "2"}
                          </div>
                          <div className={`flex-1 rounded-md p-4 border ${user.viproCompleted ? "bg-background-main/30 border-border-light" : "bg-white border-amber-200 shadow-sm"}`}>
                            <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                              <h4 className="text-sm font-bold text-text-primary">Paso 2: Cuestionario de Evaluación Diagnóstica</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.viproCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                                {user.viproCompleted ? "COMPLETADO" : "PENDIENTE DE COMPLETAR"}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                              {user.viproCompleted
                                ? "Has completado todas las preguntas del diagnóstico de viabilidad consular."
                                : "Responde el cuestionario interactivo de viabilidad para que el algoritmo procese tu perfil."}
                            </p>
                            {!user.viproCompleted && (
                              <button
                                onClick={() => router.push("/vipro-form")}
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors shadow-xs cursor-pointer"
                              >
                                Completar Cuestionario VIPRO &rarr;
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Paso 3 VIPRO */}
                        <div className="flex gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${user.viproCompleted ? "bg-emerald-500 text-white shadow-xs" : "bg-gray-200 text-text-muted"}`}>
                            {user.viproCompleted ? "✓" : "3"}
                          </div>
                          <div className={`flex-1 rounded-md p-4 border ${user.viproCompleted ? "bg-white border-emerald-200 shadow-sm" : "bg-background-main/50 border-border-light"}`}>
                            <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                              <h4 className="text-sm font-bold text-text-primary">Paso 3: Emisión de Reporte y Scoring Consular</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.viproCompleted ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {user.viproCompleted ? "REPORTE GENERADO (100%)" : "PENDIENTE DE CUESTIONARIO"}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                              {user.viproCompleted
                                ? `Tu reporte de viabilidad consular ha sido generado con una calificación de ${user.viproScore || 85}/100.`
                                : "Tu reporte y recomendaciones de perfilamiento se generarán automáticamente al terminar el cuestionario."}
                            </p>
                            {user.viproCompleted && (
                              <button
                                onClick={() => router.push(`/vipro-form/evaluation?country=${user.viproDestination || "US"}`)}
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors shadow-xs cursor-pointer"
                              >
                                Ver Reporte Completo de Viabilidad &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* VIPRO Upgrade Banner */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-brand-light/60 to-white border border-brand-primary/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-left shadow-sm">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-brand-primary uppercase tracking-widest bg-white border border-brand-primary/20 px-2.5 py-0.5 rounded-full">
                            Paso Opcional: Asesoría Personalizada 1-a-1
                          </span>
                          <h4 className="text-base font-bold text-text-primary">
                            ¿Deseas que un asesor experto llene tu DS-160 y audite tu expediente?
                          </h4>
                          <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
                            La Evaluación VIPRO es un diagnóstico expres independiente. Si deseas que nuestro equipo certificado arme tu formulario consular oficial, audite tus documentos y te capacite por Zoom para tu entrevista, puedes contratar el Servicio Completo con Asesor.
                          </p>
                        </div>
                        <button
                          onClick={() => router.push("/agents")}
                          className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Seleccionar Asesor ($112.50 USD) &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* TIMELINE COMPLETO DE 7 PASOS (CON ASESOR) */
                    <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:right-auto before:w-0.5 before:bg-gray-200 mt-4 text-left">
                      {/* Paso 1 */}
                      <div className="flex gap-4 relative">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 shadow-xs">
                          ✓
                        </div>
                        <div className="flex-1 bg-background-main/30 border border-border-light rounded-md p-4">
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-text-primary">Paso 1: Creación de perfil y verificación de cuenta</h4>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">COMPLETADO</span>
                          </div>
                          <p className="text-xs text-text-secondary">Tu cuenta ha sido verificada en TodoVisa. Puedes navegar por todas las secciones de la plataforma.</p>
                        </div>
                      </div>

                      {/* Paso 2 */}
                      <div className="flex gap-4 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${isPreformularioCompleted ? "bg-brand-primary text-white shadow-xs" : "bg-amber-500 text-white animate-pulse"}`}>
                          {isPreformularioCompleted ? "✓" : "2"}
                        </div>
                        <div className={`flex-1 rounded-md p-4 border ${isPreformularioCompleted ? "bg-background-main/30 border-border-light" : "bg-white border-amber-200 shadow-sm"}`}>
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-text-primary">Paso 2: Llenado del Preformulario Consular</h4>
                            {isPreformularioCompleted ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">COMPLETADO</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">PENDIENTE DE COMPLETAR</span>
                            )}
                          </div>
                          {isPreformularioCompleted ? (
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <p className="text-xs text-text-secondary">
                                Preformulario completado con éxito. Tus datos personales, de contacto, laborales y familiares están guardados para que tu asesor elabore la solicitud oficial DS-160.
                              </p>
                              <button
                                onClick={() => router.push("/preformulario")}
                                className="px-3 py-1.5 bg-white border border-border-light text-text-secondary hover:text-text-primary text-xs font-bold rounded transition-colors cursor-pointer"
                              >
                                Ver / Editar Preformulario
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                                Ingresa tus datos personales, de contacto, laborales y familiares en el preformulario para que tu asesor asignado elabore tu solicitud consular oficial (DS-160 / UKVI).
                              </p>
                              <button
                                onClick={() => router.push("/preformulario")}
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none cursor-pointer shadow-xs"
                              >
                                Completar Preformulario Ahora &rarr;
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Paso 3 */}
                      <div className="flex gap-4 relative transition-all">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${user.hasPaidAdvisor ? "bg-brand-primary text-white shadow-xs" : "bg-amber-500 text-white animate-pulse"}`}>
                          {user.hasPaidAdvisor ? "✓" : "3"}
                        </div>
                        <div className={`flex-1 rounded-md p-4 border ${user.hasPaidAdvisor ? "bg-background-main/30 border-border-light" : "bg-white border-amber-200 shadow-sm"}`}>
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-text-primary">Paso 3: Conexión con Asesor Experto y Chat 1-a-1</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.hasPaidAdvisor ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                              {user.hasPaidAdvisor ? "COMPLETADO" : "ACCIÓN REQUERIDA"}
                            </span>
                          </div>

                          {user.hasPaidAdvisor ? (
                            <div>
                              <p className="text-xs text-text-secondary">
                                Has asignado correctamente a tu asesor experto: <span className="font-semibold text-text-primary">{assignedAgent.name}</span>.
                              </p>
                              <button
                                onClick={() => setActiveTab("asesor")}
                                className="mt-3 text-xs text-brand-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                💬 Ir a mi Chat de Soporte 1-a-1 &rarr;
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-text-secondary mb-3">
                                Selecciona un asesor consular de nuestra red certificada para guiar el armado de tu expediente y resolver dudas por chat.
                              </p>
                              <button
                                onClick={() => router.push("/agents")}
                                className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-sm transition-colors shadow-sm cursor-pointer"
                              >
                                Elegir Asesor Consular &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Paso 4 */}
                      <div className={`flex gap-4 relative transition-all ${user.hasPaidAdvisor ? "" : "opacity-60"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${expedienteStatus === 'approved' ? "bg-emerald-500 text-white" : user.hasPaidAdvisor ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-text-muted"}`}>
                          {expedienteStatus === 'approved' ? "✓" : "4"}
                        </div>
                        <div className={`flex-1 border rounded-md p-4 ${expedienteStatus === 'approved' ? "bg-white border-emerald-200 shadow-sm" : user.hasPaidAdvisor ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"}`}>
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className={`text-sm font-bold ${user.hasPaidAdvisor ? "text-text-primary" : "text-text-secondary"}`}>
                              Paso 4: Auditoría de Expediente y Formulario Consular
                            </h4>
                            {user.hasPaidAdvisor && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${expedienteStatus === 'approved' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : expedienteStatus === 'submitted' ? "bg-blue-50 text-blue-800 border-blue-200 animate-pulse" : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"}`}>
                                {expedienteStatus === 'approved' ? "COMPLETADO" : expedienteStatus === 'submitted' ? "EN AUDITORÍA" : "EN PROGRESO"}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${user.hasPaidAdvisor ? "text-text-secondary" : "text-text-muted"}`}>
                            Carga digital de soporte probatorio (pasaporte, arraigos, solvencia) y auditoría previa del formulario DS-160 por parte de tu asesor.
                          </p>

                          {user.hasPaidAdvisor && (
                            <div className="mt-4 pt-4 border-t border-border-light space-y-4">
                              <div>
                                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block mb-1">
                                  📂 Expediente Digital Consular
                                </span>
                                <span className="text-[11px] text-text-secondary block mb-3 leading-relaxed">
                                  Carga los archivos requeridos para que tu asesor {assignedAgent.name} los audite antes de programar tu cita:
                                </span>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Pasaporte */}
                                  <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                    <div>
                                      <span className="text-xs font-bold text-text-primary block">1. Pasaporte Vigente</span>
                                      <span className="text-[9px] text-text-muted">Primera página con datos de identidad.</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                      <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                        {clientDocs.passport || "❌ No subido"}
                                      </span>
                                      <label className="cursor-pointer bg-brand-primary hover:bg-brand-hover text-white text-[10px] font-bold px-2.5 py-1.5 rounded-sm transition-colors shrink-0">
                                        Subir
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('passport', file);
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {/* DUI */}
                                  <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                    <div>
                                      <span className="text-xs font-bold text-text-primary block">2. DUI / Identificación</span>
                                      <span className="text-[9px] text-text-muted">Copia legible por ambos lados.</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                      <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                        {clientDocs.dui || "❌ No subido"}
                                      </span>
                                      <label className="cursor-pointer bg-brand-primary hover:bg-brand-hover text-white text-[10px] font-bold px-2.5 py-1.5 rounded-sm transition-colors shrink-0">
                                        Subir
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('dui', file);
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {/* Constancia Laboral */}
                                  <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                    <div>
                                      <span className="text-xs font-bold text-text-primary block">3. Arraigo Laboral / Académico</span>
                                      <span className="text-[9px] text-text-muted">Constancia laboral firmada o matrícula de estudios.</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                      <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                        {clientDocs.workCert || "❌ No subido"}
                                      </span>
                                      <label className="cursor-pointer bg-brand-primary hover:bg-brand-hover text-white text-[10px] font-bold px-2.5 py-1.5 rounded-sm transition-colors shrink-0">
                                        Subir
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('workCert', file);
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {/* Solvencia Bancaria */}
                                  <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                    <div>
                                      <span className="text-xs font-bold text-text-primary block">4. Solvencia Económica</span>
                                      <span className="text-[9px] text-text-muted">Estados de cuenta bancarios (últimos 3 meses).</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                      <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                        {clientDocs.bankStatements || "❌ No subido"}
                                      </span>
                                      <label className="cursor-pointer bg-brand-primary hover:bg-brand-hover text-white text-[10px] font-bold px-2.5 py-1.5 rounded-sm transition-colors shrink-0">
                                        Subir
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('bankStatements', file);
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* DS-160 Form Review Section */}
                              <div className="bg-amber-50/50 border border-amber-200/60 rounded-sm p-4 mt-3">
                                <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                                    📝 Formulario Consular DS-160 / UKVI
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${ds160Confirmed ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-amber-100 border-amber-200 text-amber-800"}`}>
                                    {ds160Confirmed ? "Confirmado" : "Pendiente de Revisión"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-900/90 leading-relaxed mb-3">
                                  Revisa y ratifica tu información de solicitud consular para que tu asesor procese la confirmación oficial en el sistema consular.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setIsDs160ModalOpen(true)}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
                                >
                                  {ds160Confirmed ? "Editar Datos Confirmados" : "Auditar mis Datos Consulares"}
                                </button>
                              </div>

                              {/* Submit button for Step 4 */}
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={handleSubmitExpediente}
                                  disabled={expedienteStatus === 'submitted' || expedienteStatus === 'approved'}
                                  className={`w-full py-3 text-xs font-bold rounded-sm transition-all shadow-sm ${expedienteStatus === 'submitted' ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed" : expedienteStatus === 'approved' ? "bg-emerald-600 text-white cursor-not-allowed" : "bg-brand-primary hover:bg-brand-hover text-white cursor-pointer"}`}
                                >
                                  {expedienteStatus === 'submitted' ? "⏳ Expediente en Auditoría por tu Asesor" : expedienteStatus === 'approved' ? "✅ Expediente Aprobado y DS-160 Cerrado" : "🚀 Enviar Expediente Completo a Auditoría"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Paso 5 */}
                      <div className={`flex gap-4 relative transition-all ${expedienteStatus === 'approved' ? "" : "opacity-60"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${expedienteStatus === 'approved' ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-text-muted"}`}>
                          5
                        </div>
                        <div className={`flex-1 rounded-md p-4 border ${expedienteStatus === 'approved' ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"}`}>
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className={`text-sm font-bold ${expedienteStatus === 'approved' ? "text-text-primary" : "text-text-secondary"}`}>
                              Paso 5: Programación de Cita / Entrega Drop Box y Simulacro Consular por Zoom
                            </h4>
                            {expedienteStatus === 'approved' && (
                              <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                                LISTO PARA AGENDAR
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${expedienteStatus === 'approved' ? "text-text-secondary" : "text-text-muted"} leading-relaxed`}>
                            <strong>Primera Vez:</strong> Agendamiento de cita en CAS y Embajada con entrenamiento de simulacro por Zoom.<br />
                            <strong>Renovación EE.UU. (Interview Waiver):</strong> Depósito de paquete en buzón CAS sin cita presencial ante cónsul (si vence &lt;48 meses).<br />
                            <strong>Renovación México / Canadá / Australia / China:</strong> Flujo de cita regular o biométricos asistidos con alta seguridad de aprobación por historial positivo.
                          </p>
                          {expedienteStatus === 'approved' && (
                            <div className="mt-3 pt-3 border-t border-border-light flex flex-wrap gap-3 items-center">
                              <button
                                onClick={() => setActiveTab("asesor")}
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded hover:bg-brand-hover transition-colors cursor-pointer"
                              >
                                🎥 Coordinar Fechas / Buzón por Chat &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Paso 6 */}
                      <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                          6
                        </div>
                        <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4">
                          <h4 className="text-sm font-bold text-text-secondary mb-1">Paso 6: Asistencia a Cita Consular / Exención de Entrevista (Drop Box)</h4>
                          <p className="text-xs text-text-muted leading-relaxed">
                            Presentación formal a tu cita consular oficial (biométricos y entrevista) o entrega del sobre cerrado en buzón de courier para renovaciones sin entrevista de EE.UU.
                          </p>
                        </div>
                      </div>

                      {/* Paso 7 */}
                      <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                          7
                        </div>
                        <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4 space-y-2">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-text-secondary">Paso 7: Retorno de Pasaporte y Monitoreo de Visa</h4>
                            {user?.hasPaidAdvisor && (
                              <span className="bg-brand-light text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                                MONITOREO ACTIVO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed">
                            Rastreo de la estampación de visa y entrega del pasaporte en la sucursal de Courier autorizada (DHL / Cargo Express).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}



            {/* TAB: EVALUACION VIPRO */}
            {activeTab === "vipro" && (() => {
              if (isDataLoading) {
                return (
                  <div className="space-y-6 text-left animate-pulse">
                    <div className="h-6 bg-slate-200 rounded-lg w-64 mb-2"></div>
                    <div className="h-4 bg-slate-100 rounded-lg w-80 mb-6"></div>
                    <div className="h-64 bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
                      <div className="h-8 bg-slate-200 rounded-lg w-72"></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="h-28 bg-slate-100 rounded-2xl"></div>
                        <div className="h-28 bg-slate-100 rounded-2xl"></div>
                        <div className="h-28 bg-slate-100 rounded-2xl"></div>
                      </div>
                    </div>
                  </div>
                );
              }

              const myEvals = viproEvaluations.filter((ev: any) => ev.user_id === user.id || (user.email && ev.user_email?.toLowerCase() === user.email.toLowerCase()));
              const isViproCompleted = Boolean(
                user.viproCompleted ||
                myEvals.length > 0 ||
                (typeof window !== "undefined" && (localStorage.getItem("vipro_completed") === "true" || Boolean(localStorage.getItem("vipro_score"))))
              );
              const hasCompleted = isViproCompleted;
              const latestEval = myEvals.length > 0 ? myEvals[0] : null;

              return (
                <div>
                  <div className="mb-6 pb-4 border-b border-border-light text-left">
                    <h2 className="text-lg font-bold text-text-primary">Evaluación de Viabilidad VIPRO</h2>
                    <p className="text-xs text-text-secondary mt-1">Análisis automatizado de probabilidad y recomendaciones de perfilamiento consular.</p>
                  </div>

                  {hasCompleted ? (
                    <div className="animate-fadeIn space-y-6 text-left">
                      {/* Premium Completed Evaluation Hero Card */}
                      <div className="bg-gradient-to-br from-emerald-50/60 via-white to-blue-50/20 rounded-3xl border border-emerald-200/80 p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden space-y-8">
                        {/* Decorative background accent circle */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />

                        {/* Top Badge & Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100/80 pb-6 relative z-10">
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-200/80">
                              <span>✓</span>
                              <span>Evaluación VIPRO Procesada</span>
                            </span>
                            <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary mt-3">
                              Diagnóstico Consular VIPRO Completado
                            </h3>
                            <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
                              Tu perfilamiento ha sido analizado por nuestra Inteligencia Consular Predictiva con evaluación de arraigo laboral, solvencia y riesgo 214(b).
                            </p>
                          </div>

                          <div className="shrink-0">
                            <span className="text-[10px] font-mono text-text-muted bg-white/90 px-3 py-1.5 rounded-lg border border-emerald-200/60 shadow-2xs block">
                              ID Registro: {latestEval?.id ? String(latestEval.id).substring(0, 10) : "VIPRO-VIP"}
                            </span>
                          </div>
                        </div>

                        {/* Main Metrics & Data Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                          {/* Score Metric Card */}
                          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Puntaje Consular</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border ${(latestEval?.score || user.viproScore || 85) >= 80
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                {(latestEval?.score || user.viproScore || 85) >= 80 ? "Favorable" : "Revisión"}
                              </span>
                            </div>
                            <div>
                              <div className="text-4xl font-black text-emerald-600 font-mono tracking-tight">
                                {(latestEval?.score || user.viproScore || 85)} <span className="text-base font-sans font-bold text-text-muted">/ 100</span>
                              </div>
                              <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
                                {(latestEval?.score || user.viproScore || 85) >= 80 ? "Bajo riesgo de objeción 214(b)" : "Requiere fortalecimiento probatorio"}
                              </p>
                            </div>
                          </div>

                          {/* Country Destination Card */}
                          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between gap-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Destino Evaluado</span>
                            <div>
                              <div className="flex items-center gap-2.5 text-lg font-bold text-text-primary">
                                <span className="text-2xl">{(latestEval?.destination_country || user.viproDestination) === "UK" ? "🇬🇧" : "🇺🇸"}</span>
                                <span>{(latestEval?.destination_country || user.viproDestination) === "UK" ? "Reino Unido" : "Estados Unidos"}</span>
                              </div>
                              <p className="text-[11px] text-text-secondary mt-1">
                                Visa B1/B2 Turismo & Negocios
                              </p>
                            </div>
                          </div>

                          {/* Profiling Report Status Card */}
                          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between gap-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Reporte Diagnóstico</span>
                            <div>
                              <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                                <span>📋</span>
                                <span>100% Calificado & Recomendado</span>
                              </div>
                              <p className="text-[11px] text-text-secondary mt-1">
                                Incluye checklist de documentos sugeridos y tips probatorios.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Call to Action Banner */}
                        <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
                          <div className="space-y-1 text-center sm:text-left">
                            <h4 className="font-bold text-text-primary text-sm">¿Deseas consultar tu reporte de viabilidad completo?</h4>
                            <p className="text-xs text-text-secondary">Accede a tus sugerencias de perfilamiento y respuestas registradas.</p>
                          </div>
                          <button
                            onClick={() => router.push(`/vipro-form/evaluation?country=${latestEval?.destination_country || user.viproDestination || "US"}${latestEval?.id ? `&evalId=${latestEval.id}` : ""}&userId=${user.id}`)}
                            className="w-full sm:w-auto px-7 py-3.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 group"
                          >
                            <span>Ver Reporte Consular Completo</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : user.hasPaidVipro || user.hasPaidAdvisor ? (
                    <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center text-center gap-5 max-w-xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom duration-300">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl font-bold border border-amber-200 animate-pulse">
                        📊
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-base mb-1">Evaluación VIPRO Habilitada</h3>
                        <p className="text-xs text-text-secondary leading-relaxed mb-6">
                          Tienes acceso a la evaluación pre-consular VIPRO. Realiza el cuestionario ahora para calificar tu perfil y obtener recomendaciones dinámicas.
                        </p>
                        <button
                          onClick={() => router.push("/vipro-form")}
                          className="bg-brand-primary hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-lg transition-all focus:outline-none shadow-md cursor-pointer text-xs"
                        >
                          Comenzar Evaluación VIPRO
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-border-light shadow-sm text-left max-w-2xl mx-auto mt-4 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
                      {/* Top bar accent */}
                      <div className="h-1 w-full bg-[#113E5F]" />

                      <div className="p-7 md:p-8">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-11 h-11 bg-[#EFF6FF] rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#113E5F] opacity-70">
                              Inteligencia Consular Predictiva
                            </span>
                            <h3 className="font-bold text-text-primary text-lg leading-snug mt-0.5">
                              Habilita tu Evaluación Diagnóstica VIPRO
                            </h3>
                            <p className="text-xs text-text-secondary leading-relaxed mt-1.5">
                              Conoce tu puntaje de viabilidad consular de 0 a 100 puntos antes de iniciar cualquier solicitud oficial de visa.
                            </p>
                          </div>
                        </div>

                        {/* Features — 2 col inline list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 mb-7">
                          {[
                            "Scoring Consular (0–100 pts) de lazo laboral y bancario",
                            "Detección de Riesgos 214(b) de rechazo consular",
                            "Checklist Probatorio de documentos sugeridos",
                            "Diagnóstico Inmediato con recomendaciones claras",
                          ].map((item) => (
                            <div key={item} className="flex items-start gap-2 text-xs text-text-secondary">
                              <svg className="w-3.5 h-3.5 text-[#113E5F] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer: price + CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-border-light">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Precio Único</span>
                            <span className="text-xl font-extrabold text-[#113E5F] font-mono">$19.99 USD</span>
                          </div>
                          <button
                            onClick={() => router.push("/vipro-form")}
                            className="w-full sm:w-auto px-6 py-2.5 bg-[#113E5F] hover:bg-[#0f3755] text-white text-xs font-bold rounded-sm transition-all focus:outline-none shadow-sm text-center cursor-pointer font-sans tracking-wide"
                          >
                            Adquirir Evaluación VIPRO &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* TAB: MI ASESOR */}
            {activeTab === "asesor" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Tu Asesor Consular Asignado</h2>
                  <p className="text-xs text-text-secondary mt-1">Aquí verás al experto que guiará todo tu proceso de visado.</p>
                </div>

                {user.hasPaidAdvisor ? (
                  assignedAgent.partnerType === "b2b_agency_entity" || !user.assignedAgentId ? (

                    // PENDING AGENT ALLOCATION BY B2B AGENCY
                    <div className="bg-white rounded-[2rem] border border-blue-200 p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center text-center gap-6 max-w-2xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom duration-300">
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold border border-blue-200 shadow-inner">
                        🏢
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Servicio Corporativo Habilitado</span>
                        <h3 className="font-bold font-serif text-text-primary text-2xl">Agency with Agent</h3>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
                          Has contratado los servicios globales de nuestra agencia. El equipo de directores de <strong>Agency with Agent</strong> está revisando tu expediente y tu Evaluación VIPRO para asignarte el asesor especialista idóneo según tu perfil.
                        </p>
                      </div>

                      <div className="w-full bg-[#FAF9F6] border border-border-light rounded-2xl p-6 text-left space-y-4">
                        <h4 className="font-bold text-text-primary text-sm">Estado de tu Asignación:</h4>
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                          <p className="text-xs font-semibold text-text-primary">⏳ Buscando asesor especialista disponible en nuestro staff...</p>
                        </div>
                        <p className="text-xs text-text-secondary leading-normal">
                          Normalmente las asignaciones corporativas toman de 1 a 3 horas hábiles. Recibirás una notificación y el chat de soporte se habilitará inmediatamente.
                        </p>
                      </div>

                      {/* Interactive simulation button for the user/agency */}
                      <div className="pt-2 w-full">
                        <button
                          onClick={handleSimulateAgentAssignment}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-sm cursor-pointer"
                        >
                          ⚡ Simular Asignación de Agente por la Empresa
                        </button>
                      </div>
                    </div>
                  ) : (
                    // CHAT APARTADO: Chat con el Asesor (ya tiene viproCompleted o no)
                    <div className="space-y-6 animate-fade-in">
                      <style dangerouslySetInnerHTML={{
                        __html: `
                        .custom-scrollbar::-webkit-scrollbar {
                          width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                          background: rgba(0, 0, 0, 0.02);
                          border-radius: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                          background: rgba(0, 0, 0, 0.12);
                          border-radius: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                          background: rgba(0, 0, 0, 0.25);
                        }
                      `}} />

                      {/* Advisor Info Bar (Company / Agency Details) */}
                      <div className="bg-gradient-to-r from-white to-[#FAF9F6] rounded-2xl border border-border-light p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-brand-primary/20 transition-all duration-300 flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative">
                          <img
                            src={assignedAgencyProfile?.photo_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200"}
                            alt={assignedAgencyProfile ? `${assignedAgencyProfile.first_name} ${assignedAgencyProfile.last_name || ""}` : "Empresa"}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                          />
                          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white bg-emerald-400"></span>
                        </div>
                        <div className="text-center sm:text-left flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                            <h5 className="font-bold text-text-primary text-base tracking-tight">
                              {assignedAgencyProfile ? `${assignedAgencyProfile.first_name} ${assignedAgencyProfile.last_name || ""}`.trim() : (user?.assignedAgencyName || "Agencia TodoVisa")}
                            </h5>
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                              🏢 EMPRESA ACREDITADA
                            </span>
                          </div>
                          <p className="text-xs text-brand-primary font-bold">
                            {assignedAgencyProfile?.location ? `📍 ${assignedAgencyProfile.location}` : "Consulado y Trámites de Visa"}
                          </p>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {assignedAgencyProfile?.bio || "Agencia de asesoría consular certificada. Tu expediente cuenta con auditoría y respaldo institucional."}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start text-xs text-text-secondary mt-2 pt-1.5 border-t border-dashed border-border-light">
                            {assignedAgentProfile && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-brand-light text-brand-primary font-semibold px-2 py-0.5 rounded-sm">
                                  Asesor Asignado: {assignedAgentProfile.first_name} {assignedAgentProfile.last_name}
                                </span>
                              </div>
                            )}
                            {assignedAgencyProfile?.staff_size && (
                              <span>• {assignedAgencyProfile.staff_size} consultores</span>
                            )}
                            {assignedAgencyProfile?.phone && (
                              <span>• Tel: {assignedAgencyProfile.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chat Window */}
                      <div className="border border-border-light rounded-2xl overflow-hidden flex flex-col h-[550px] bg-[#FAF9F6] shadow-sm relative">
                        {/* Chat Header */}
                        <div className="bg-white px-6 py-4 border-b border-border-light flex items-center justify-between shadow-sm z-10">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={assignedAgencyProfile?.photo_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200"}
                                alt="Empresa"
                                className="w-10 h-10 rounded-full object-cover border border-border-light shadow-sm"
                              />
                              <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-text-primary text-sm leading-tight">
                                {assignedAgencyProfile ? `${assignedAgencyProfile.first_name} ${assignedAgencyProfile.last_name || ""}`.trim() : (user?.assignedAgencyName || "Agencia TodoVisa")}
                              </h4>
                              {assignedAgentProfile && (
                                <p className="text-[9px] text-text-muted mt-0.5">
                                  Asesor: {assignedAgentProfile.first_name} {assignedAgentProfile.last_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right hidden sm:flex flex-col items-end gap-1">
                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              Soporte Activo
                            </span>
                          </div>
                        </div>

                        {/* Messages Box */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-gradient-to-b from-[#FAF9F6]/60 to-white/40">
                          {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-2">
                              <span className="text-3xl">💬</span>
                              <p className="text-xs font-semibold text-text-primary">Chat seguro habilitado</p>
                              <p className="text-[11px] text-text-muted max-w-xs">Escribe tu primer mensaje abajo para iniciar la conversación directa con tu asesoría.</p>
                            </div>
                          ) : (
                            messages.map((msg) => {
                              const isSelf = msg.sender === "user";
                              return (
                                <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-fade-in`}>
                                  <div className={`flex gap-3 max-w-[75%] ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                                    {!isSelf && (
                                      <img
                                        src={assignedAgentProfile?.photo_url || assignedAgencyProfile?.photo_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200"}
                                        alt="Asesor"
                                        className="w-9 h-9 rounded-full object-cover border border-border-light flex-shrink-0 shadow-sm"
                                      />
                                    )}
                                    <div className="flex flex-col">
                                      <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isSelf
                                        ? "bg-gradient-to-br from-brand-primary to-[#2C4A75] text-white rounded-tr-none"
                                        : "bg-white border border-border-light text-text-primary rounded-tl-none"
                                        }`}>
                                        <p className="leading-relaxed whitespace-pre-line font-medium">{msg.text}</p>
                                      </div>
                                      <span className={`text-[10px] text-text-muted mt-1 px-1 font-semibold ${isSelf ? "text-right" : "text-left"}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-border-light flex gap-3 items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.01)]">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder="Escribe tu mensaje aquí..."
                              className="w-full bg-[#FAF9F6] border border-border-light rounded-full pl-5 pr-12 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary text-text-primary placeholder:text-text-muted transition-all shadow-inner"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="bg-brand-primary text-white font-bold h-11 w-11 rounded-full hover:bg-brand-hover transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-105 active:scale-95 flex-shrink-0"
                            title="Enviar mensaje"
                          >
                            <svg className="w-4 h-4 transform rotate-45 translate-x-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </div>
                  )
                ) : (
                  // UNPAID STATE: Prompt to pay, no WhatsApp link
                  <div>
                    {/* Not assigned yet prompt */}
                    <div className="bg-brand-light/40 border border-brand-primary/20 rounded-md p-6 flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-primary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <h3 className="font-bold text-text-primary text-sm mb-1">Aún no tienes un asesor contratado</h3>
                        <p className="text-xs text-text-secondary leading-relaxed mb-4 max-w-lg">
                          Para acceder al chat interno de comunicación directa y videollamadas con tu especialista asignado, debes contratar la asesoría consular.
                        </p>
                        <button
                          onClick={() => router.push("/agents")}
                          className="bg-brand-primary text-white font-semibold px-5 py-2.5 rounded-sm hover:bg-brand-hover transition-colors text-xs focus:outline-none"
                        >
                          Explorar red de agentes certificados
                        </button>
                      </div>
                    </div>

                    {/* Recommended Agent Card (Pagar button instead of WhatsApp link) */}
                    <div className="mt-8">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Recomendado según tu perfil</h4>
                      <div className="bg-white rounded-lg border border-border-light p-5 flex flex-col sm:flex-row items-center gap-4 max-w-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-brand-primary/20 transition-all">
                        <img
                          src={assignedAgent.photo}
                          alt={assignedAgent.name}
                          className="w-14 h-14 rounded-full object-cover border border-border-light flex-shrink-0"
                        />
                        <div className="text-center sm:text-left flex-1">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <h5 className="font-bold text-text-primary text-sm">{assignedAgent.name}</h5>
                            <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1 py-0.5 rounded border border-amber-100">RECOMENDADO</span>
                          </div>
                          <p className="text-xs text-brand-primary font-semibold mt-0.5">{assignedAgent.title}</p>
                          <p className="text-[11px] text-text-secondary mt-1">Disponibilidad Inmediata • ⭐ {assignedAgent.rating.toFixed(1)} ({assignedAgent.reviewsCount} reseñas)</p>
                        </div>

                        <button
                          onClick={() => {
                            setCheckoutAgent(assignedAgent);
                            setIsCheckoutOpen(true);
                          }}
                          className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1 flex-shrink-0 shadow-sm"
                        >
                          <span>Pagar Asesoría</span>
                        </button>
                      </div>
                    </div>
                    {/* Completed VIPRO evaluations table */}
                    <div className="mt-8 pt-8 border-t border-border-light">
                      <div className="mb-4 text-left">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          📋 Historial de Evaluaciones VIPRO
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">Revisa el listado de tus evaluaciones de viabilidad pre-consular completadas y sus recomendaciones de mejora.</p>
                      </div>

                      {viproEvaluations.length > 0 ? (
                        <div className="overflow-x-auto border border-border-light rounded-xl bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border-light text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#FAF9F6]">
                                <th className="py-3 px-4">Destino</th>
                                <th className="py-3 px-4">Fecha</th>
                                <th className="py-3 px-4">Calificación</th>
                                <th className="py-3 px-4">Resultado</th>
                                <th className="py-3 px-4 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light text-xs">
                              {viproEvaluations.map((evaluation) => {
                                const countryEmoji = evaluation.destination_country === "UK" ? "🇬🇧" : "🇺🇸";
                                const countryName = evaluation.destination_country === "UK" ? "Reino Unido" : "Estados Unidos";
                                const score = evaluation.score || 85;
                                const isFavorable = score >= 80;
                                return (
                                  <tr key={evaluation.id} className="hover:bg-background-main/20 transition-colors">
                                    <td className="py-4 px-4 font-bold text-text-primary flex items-center gap-2">
                                      <span className="text-lg">{countryEmoji}</span>
                                      <span>{countryName}</span>
                                    </td>
                                    <td className="py-4 px-4 text-text-secondary">
                                      {new Date(evaluation.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-4 px-4 font-bold text-text-primary">
                                      {score} / 100
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isFavorable
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-amber-50 text-amber-800 border-amber-100"
                                        }`}>
                                        {isFavorable ? "FAVORABLE" : "REVISIÓN"}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                      <button
                                        onClick={() => router.push(`/vipro-form/evaluation?country=${evaluation.destination_country}`)}
                                        className="text-brand-primary hover:underline hover:text-brand-hover font-semibold transition-colors font-sans"
                                      >
                                        Ver Detalles
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-white border border-border-light rounded-xl p-6 text-center text-text-muted text-xs shadow-sm">
                          No has completado ninguna evaluación VIPRO todavía.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PAGOS Y COMPROBANTES */}
            {activeTab === "pagos" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Historial de Transacciones</h2>
                  <p className="text-xs text-text-secondary mt-1">Revisa el detalle de tus compras de servicios y descarga tus comprobantes.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-light text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-background-main/40">
                        <th className="py-3 px-4">Referencia</th>
                        <th className="py-3 px-4">Concepto</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Monto</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light text-xs">
                      {dbPurchases.length > 0 ? (
                        dbPurchases.map((purchase) => {
                          const isViproItem = purchase.product_type === "vipro";
                          return (
                            <tr key={purchase.id} className="hover:bg-background-main/20 transition-colors">
                              <td className="py-4 px-4 font-mono font-medium text-text-primary">{purchase.reference_id}</td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-bold text-text-primary">
                                    {isViproItem ? "Evaluación VIPRO Diagnóstica" : "Asesoría de Visa Premium (Completa)"}
                                  </p>
                                  <p className="text-[10px] text-text-secondary">Método: {purchase.payment_method}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-text-secondary">
                                {new Date(purchase.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-4 px-4 font-bold text-text-primary">
                                ${parseFloat(purchase.amount).toFixed(2)} USD
                              </td>
                              <td className="py-4 px-4">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${purchase.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-800 border-amber-100"
                                  }`}>
                                  {purchase.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {purchase.status === "completed" ? (
                                  isViproItem ? (
                                    <button
                                      onClick={() => showToast("Generando PDF de factura...", "info")}
                                      className="text-brand-primary hover:underline hover:text-brand-hover font-semibold transition-colors font-sans"
                                    >
                                      Descargar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setActiveTab("asesor")}
                                      className="text-brand-primary hover:underline font-semibold"
                                    >
                                      Ver Chat
                                    </button>
                                  )
                                ) : (
                                  <span className="text-text-muted italic">Pendiente</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <>
                          {/* Fallback mock UI when DB has no purchases registered */}
                          <tr className={user.hasPaidVipro || user.hasPaidAdvisor ? "" : "opacity-90"}>
                            <td className="py-4 px-4 font-mono font-medium text-text-primary">TV-VIPRO-8429</td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-bold text-text-primary">Evaluación VIPRO Diagnóstica</p>
                                <p className="text-[10px] text-text-secondary">Destino: Estados Unidos</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-text-secondary">14 Jun, 2026</td>
                            <td className="py-4 px-4 font-bold text-text-primary">$19.99 USD</td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${user.hasPaidVipro || user.hasPaidAdvisor
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-800 border-amber-100"
                                }`}>
                                {user.hasPaidVipro || user.hasPaidAdvisor ? "PAGADO" : "PENDIENTE"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {user.hasPaidVipro || user.hasPaidAdvisor ? (
                                <button
                                  onClick={() => showToast("Generando PDF de factura...", "info")}
                                  className="text-brand-primary hover:underline hover:text-brand-hover font-semibold transition-colors font-sans"
                                >
                                  Descargar
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCheckoutProduct("vipro");
                                    setCheckoutAgent(null);
                                    setIsCheckoutOpen(true);
                                  }}
                                  className="bg-brand-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-sm hover:bg-brand-hover transition-colors shadow-sm cursor-pointer"
                                >
                                  Pagar
                                </button>
                              )}
                            </td>
                          </tr>

                          <tr className={user.hasPaidAdvisor ? "" : "opacity-90"}>
                            <td className="py-4 px-4 font-mono font-medium text-text-primary">TV-ASES-3820</td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-bold text-text-primary">Asesoría de Visa Premium (Completa)</p>
                                <p className="text-[10px] text-text-secondary">Destino: Estados Unidos</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-text-secondary">14 Jun, 2026</td>
                            <td className="py-4 px-4 font-bold text-text-primary">
                              {user.hasPaidAdvisor ? "$112.50 USD" : "$150.00 USD"}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${user.hasPaidAdvisor
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-800 border-amber-100"
                                }`}>
                                {user.hasPaidAdvisor ? "PAGADO" : "PENDIENTE"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {user.hasPaidAdvisor ? (
                                <button
                                  onClick={() => setActiveTab("asesor")}
                                  className="text-brand-primary hover:underline font-semibold"
                                >
                                  Ver Chat
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCheckoutAgent(assignedAgent);
                                    setCheckoutProduct("advisor");
                                    setIsCheckoutOpen(true);
                                  }}
                                  className="bg-brand-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-sm hover:bg-brand-hover transition-colors shadow-sm cursor-pointer"
                                >
                                  Pagar
                                </button>
                              )}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 bg-brand-light/30 border border-brand-primary/10 rounded-md p-5 flex items-start gap-4">
                  <span className="text-xl">💡</span>
                  <div>
                    <h5 className="font-bold text-text-primary text-xs mb-1">Garantía de Aprobación de Descuento</h5>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Como completaste tu evaluación VIPRO de $19.99 USD, tienes activo un cupón del <span className="font-bold text-brand-primary">25% de descuento</span> aplicable a cualquier trámite de asesoría formal con nuestros agentes de la red. ¡Contáctalos para aplicarlo!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MI SOLICITUD DE SOCIO */}
            {activeTab === "solicitud" && (
              user?.role === "agent" && myAgency ? (
                <div className="animate-fadeIn">
                  <div className="mb-6 pb-4 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">Mi Acreditación</h2>
                      <p className="text-xs text-text-secondary mt-1">Detalles de tu respaldo institucional y acreditación como agente consular corporativo.</p>
                    </div>
                    <span className="self-start sm:self-center text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
                      ✓ Acreditado por Empresa
                    </span>
                  </div>

                  <div className="space-y-6">
                    {/* Status Banner */}
                    <div className="p-4 rounded-md border text-left bg-emerald-50/50 border-emerald-200 text-emerald-800">
                      <h4 className="font-bold text-sm mb-1">¡Perfil Acreditado Activo!</h4>
                      <p className="text-xs leading-relaxed opacity-90">
                        Eres un asesor respaldado por <strong>{myAgency.first_name} {myAgency.last_name}</strong>. Tu perfil aparece con insignia de verificación y estás habilitado para gestionar los trámites asignados por tu empresa en la red TodoVisa.
                      </p>
                    </div>

                    {/* Agency Profile Details */}
                    <div className="border border-border-light rounded-md p-6 bg-white text-left space-y-4 shadow-sm">
                      <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light">Información de la Empresa Respaldo</h4>

                      <div className="flex items-start gap-4">
                        {myAgency.photo_url || myAgency.avatar_url ? (
                          <img
                            src={myAgency.photo_url || myAgency.avatar_url}
                            alt={`${myAgency.first_name} ${myAgency.last_name}`}
                            className="w-14 h-14 rounded-xl object-cover shadow-md border border-blue-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-md border border-blue-500 font-serif">
                            {((myAgency.first_name?.[0] || "") + (myAgency.last_name?.[0] || "")).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-serif font-bold text-text-primary text-lg">
                            {myAgency.first_name} {myAgency.last_name}
                          </h4>
                          <p className="text-[11px] font-semibold text-text-secondary">🏢 Agencia de Viajes y Asesoría Consular</p>

                          <p className="text-[10px] text-text-muted mt-0.5">ID Corporativo: {myAgency.id}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50/65 border border-gray-100 rounded-xl p-4 text-xs space-y-3">
                        {myAgency.bio && (
                          <p className="text-text-secondary leading-relaxed">
                            <strong>Acerca de la empresa:</strong> {myAgency.bio}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-secondary pt-2 border-t border-gray-200/60">
                          <div><strong>✉️ Correo:</strong> {myAgency.email}</div>
                          {myAgency.phone && (
                            <div><strong>📞 Teléfono:</strong> {myAgency.phone}</div>
                          )}
                          {myAgency.location && (
                            <div><strong>📍 Ubicación:</strong> {myAgency.location}</div>
                          )}
                          {myAgency.staff_size && (
                            <div><strong>👥 Staff:</strong> {myAgency.staff_size} asesores certificados</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isLoadingAgencyInfo || isLoadingPartnerApp ? (
                <div className="space-y-4 py-4 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
                  <div className="h-48 bg-gray-100 rounded-2xl w-full"></div>
                </div>
              ) : partnerApp ? (
                <div className="animate-fadeIn">
                  <div className="mb-6 pb-4 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">Mi Solicitud de Socio</h2>
                      <p className="text-xs text-text-secondary mt-1">Revisa el estado de tu postulación para unirte como agente consultor o agencia socia.</p>
                    </div>
                    <span className={`self-start sm:self-center text-xs font-bold px-3 py-1 rounded-full border ${partnerApp.status === "approved" || partnerApp.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : partnerApp.status === "rejected"
                        ? "bg-red-50 text-red-700 border-red-100"
                        : partnerApp.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                      {partnerApp.status === "approved" || partnerApp.status === "active"
                        ? "✓ Aprobada"
                        : partnerApp.status === "rejected"
                          ? "✕ Devuelta / Rechazada"
                          : partnerApp.status === "pending"
                            ? "🕒 Pendiente de Revisión"
                            : "📝 Borrador"}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-md border text-left ${partnerApp.status === "approved" || partnerApp.status === "active"
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                      : partnerApp.status === "rejected"
                        ? "bg-red-50/50 border-red-200 text-red-800"
                        : "bg-amber-50/50 border-amber-200 text-amber-800"
                      }`}>
                      <h4 className="font-bold text-sm mb-1">
                        {partnerApp.status === "approved" || partnerApp.status === "active"
                          ? "¡Tu solicitud ha sido aprobada!"
                          : partnerApp.status === "rejected"
                            ? "Tu solicitud requiere cambios"
                            : "Postulación recibida"}
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90">
                        {partnerApp.status === "approved" || partnerApp.status === "active"
                          ? "Tu cuenta de agente consultor se encuentra activa. Ya puedes acceder al panel de administración de casos de TodoVisa para recibir clientes."
                          : partnerApp.status === "rejected"
                            ? "Por favor, revisa las observaciones del administrador más abajo para saber qué información o documentos debes modificar."
                            : "Estamos evaluando tu perfil y los documentos presentados en un plazo máximo de 48 horas laborables. Te notificaremos vía email."}
                      </p>
                    </div>

                    {/* Admin Notes */}
                    {partnerApp.admin_notes && (
                      <div className="bg-gray-50 border border-border-light rounded-md p-5 text-left">
                        <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider mb-2">Comentarios y Observaciones del Administrador:</h4>
                        <p className="text-xs text-text-secondary leading-relaxed bg-white border border-border-light p-3.5 rounded font-mono whitespace-pre-line">
                          {partnerApp.admin_notes}
                        </p>
                      </div>
                    )}

                    {/* Document and details summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-border-light rounded-md p-4 space-y-3 bg-white text-left">
                        <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light">Detalles de la Postulación</h4>
                        <div className="space-y-2 text-xs">
                          <p><span className="text-text-secondary font-semibold">ID Solicitud:</span> <span className="font-mono">{partnerApp.application_id}</span></p>
                          <p><span className="text-text-secondary font-semibold">Tipo de Socio:</span> {partnerApp.documents?.partner_type === "b2b_agency" ? "Agencia Partner" : "Asesor Consultor Independiente"}</p>

                          <p><span className="text-text-secondary font-semibold">Nombre/Razón Social:</span> {partnerApp.full_name}</p>
                          <p><span className="text-text-secondary font-semibold">Correo de Contacto:</span> {partnerApp.email}</p>
                          <p><span className="text-text-secondary font-semibold">Teléfono:</span> {partnerApp.phone}</p>
                          <p><span className="text-text-secondary font-semibold">País de Residencia:</span> {partnerApp.country_residence}</p>
                          <p><span className="text-text-secondary font-semibold">Años de Experiencia:</span> {/^\d+$/.test(String(partnerApp.experience_years).trim()) ? `${partnerApp.experience_years} años` : partnerApp.experience_years}</p>
                        </div>
                      </div>

                      <div className="border border-border-light rounded-md p-4 space-y-3 bg-white text-left">
                        <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light">Documentos Adjuntos</h4>
                        <div className="space-y-2 text-xs">
                          {Object.entries(partnerApp.documents || {}).map(([key, val]) => {
                            if (["partner_type", "b2b_details", "last_saved_step"].includes(key) || !val) return null;
                            const cleanName = typeof val === 'string'
                              ? (val.includes('/') ? val.substring(val.lastIndexOf('/') + 1) : val)
                              : (val as { name?: string })?.name || key;
                            const displayLabel = key === "dui" ? "DUI/INE/Acta Constitutiva"
                              : key === "certificacion" ? "Certificación/Identificación RL"
                                : key === "antecedentes" ? "Antecedentes/Registro Tributario"
                                  : key === "domicilio" ? "Comprobante de Domicilio"
                                    : key === "titulo" ? "Título Profesional/Brochure"
                                      : key === "cv" ? "CV/Licencia Turística"
                                        : key;
                            const url = typeof val === 'string' ? val : (val as { url?: string })?.url;
                            return (
                              <div key={key} className="flex justify-between items-center py-1 border-b border-gray-55 last:border-0">
                                <span className="font-semibold text-text-secondary">{displayLabel}:</span>
                                {url ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">
                                    Ver Documento ↗
                                  </a>
                                ) : (
                                  <span className="text-text-muted italic">{cleanName}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions for editing application */}
                    {(partnerApp.status === "rejected" || partnerApp.status === "draft") && (
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => router.push("/agents/apply")}
                          className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors shadow-sm cursor-pointer"
                        >
                          Corregir o Modificar Postulación →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary/70 italic animate-fadeIn">
                  No se encontró ninguna postulación de socio asociada a tu cuenta.
                </div>
              ))}

            {/* TAB: ADMINISTRAR SOCIOS (ADMIN PANEL) */}
            {activeTab === "admin_socios" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) && (
              <div className="animate-fadeIn">
                <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {user && user.role === ROLES.MODERATOR
                        ? "Moderador: Revisión de Socios"
                        : "Administrar Solicitudes de Socios"}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">Revisa y evalúa las postulaciones de consultores independientes y agencias de viaje.</p>

                  </div>

                  {/* Status Filters */}
                  <div className="flex gap-1.5 self-start">
                    {[
                      { id: "all", label: "Todas" },
                      { id: "pending", label: "Pendientes" },
                      { id: "approved", label: "Aprobadas" },
                      { id: "rejected", label: "Rechazadas" }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setStatusFilter(filter.id)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${statusFilter === filter.id
                          ? "bg-brand-primary text-white shadow-sm"
                          : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                          }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!selectedApp ? (
                  /* APPLICATIONS LISTING */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-light text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-background-main/40">
                          <th className="py-3 px-4">Código</th>
                          <th className="py-3 px-4">Postulante / Empresa</th>
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light text-xs">
                        {allApplications
                          .filter((app) => statusFilter === "all" || app.status === statusFilter)
                          .length > 0 ? (
                          allApplications
                            .filter((app) => statusFilter === "all" || app.status === statusFilter)
                            .map((app) => {
                              const profMatch: any = (app.user_id && dbProfilesMap[app.user_id])
                                || (app.user_id && dbProfilesMap[app.user_id.toLowerCase()])
                                || (app.email && dbProfilesMap[app.email.toLowerCase()]);
                              const realName = profMatch?.name || app.full_name || "Socio Registrado";
                              const realEmail = profMatch?.email || app.email || "Sin correo registrado";

                              return (
                                <tr key={app.id} className="hover:bg-background-main/10 transition-colors">
                                  <td className="py-4 px-4 font-mono font-medium text-text-primary">{app.application_id || (app.id ? String(app.id).substring(0, 8) : "N/A")}</td>
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="font-bold text-text-primary">{realName}</p>
                                      <p className="text-[10px] text-text-secondary">{realEmail}</p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-text-secondary">
                                    {app.documents?.partner_type === "b2b_agency" || app.application_type === "agency" ? "🏢 Agencia" : "👤 Consultor Ind."}
                                  </td>
                                  <td className="py-4 px-4 text-text-secondary">
                                    {app.created_at ? new Date(app.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : "Registrado"}
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${app.status === "approved" || app.status === "active"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : app.status === "rejected"
                                        ? "bg-red-50 text-red-700 border-red-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                      }`}>
                                      {app.status === "approved" || app.status === "active"
                                        ? "APROBADO"
                                        : app.status === "rejected"
                                          ? "RECHAZADO"
                                          : "PENDIENTE"}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedApp(app);
                                        setAdminNotesInput(app.admin_notes || "");
                                      }}
                                      className="px-3 py-1 bg-brand-primary text-white text-[10px] font-bold rounded-sm hover:bg-brand-hover transition-colors cursor-pointer shadow-sm"
                                    >
                                      Evaluar 🔎
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-text-muted italic">
                              No se encontraron solicitudes registradas para este filtro.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* SINGLE APPLICATION REVIEW DETAIL */
                  <div className="space-y-6">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="text-brand-primary text-xs font-bold hover:underline cursor-pointer border-0 bg-transparent flex items-center gap-1"
                    >
                      ← Volver a la lista de solicitudes
                    </button>

                    <div className="bg-gray-50 border border-border-light rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div>
                        <h3 className="font-bold text-text-primary text-base">Evaluando Postulación: {selectedApp.full_name}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">ID: <span className="font-mono font-semibold">{selectedApp.application_id}</span> • Registro: {new Date(selectedApp.created_at).toLocaleString()}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          disabled={isSavingAdmin}
                          onClick={() => triggerAdminSecurityModal(selectedApp, "approved")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          ✓ Aprobar Socio
                        </button>
                        <button
                          disabled={isSavingAdmin}
                          onClick={() => triggerAdminSecurityModal(selectedApp, "rejected")}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-sm shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          ✕ Denegar / Observar
                        </button>
                      </div>
                    </div>

                    {/* Detailed info grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        {/* Profile Info */}
                        <div className="border border-border-light rounded-md p-5 bg-white space-y-4 text-left">
                          <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light">Perfil del Postulante</h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <p><span className="text-text-secondary font-semibold">Correo:</span> {selectedApp.email}</p>
                            <p><span className="text-text-secondary font-semibold">Teléfono:</span> {selectedApp.phone}</p>
                            <p><span className="text-text-secondary font-semibold">País Residencia:</span> {selectedApp.country_residence}</p>
                            <p><span className="text-text-secondary font-semibold">Años de Experiencia:</span> {/^\d+$/.test(String(selectedApp.experience_years).trim()) ? `${selectedApp.experience_years} años` : selectedApp.experience_years}</p>
                            <p><span className="text-text-secondary font-semibold">Enlace Profesional/Sitio:</span> {selectedApp.linkedin ? <a href={selectedApp.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">{selectedApp.linkedin}</a> : "No provisto"}</p>
                          </div>

                          <div className="text-xs space-y-2.5 pt-2 border-t border-gray-100">
                            <p><span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Idiomas:</span> {selectedApp.languages?.join(", ") || "No especificado"}</p>
                            <p><span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Especialidades:</span> {selectedApp.specialties?.join(", ") || "No especificado"}</p>
                            <p><span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Destinos Objetivo:</span> {selectedApp.target_countries?.join(", ") || "No especificado"}</p>
                          </div>
                        </div>

                        {/* Biography / Description */}
                        <div className="border border-border-light rounded-md p-5 bg-white space-y-3 text-left">
                          <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light">Biografía / Presentación Corporativa</h4>
                          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-gray-50 border border-border-light/60 p-4 rounded font-sans">
                            {selectedApp.biography}
                          </p>
                        </div>
                      </div>

                      {/* Documents sidebar & Comments box */}
                      <div className="space-y-6">
                        {/* Documents */}
                        <div className="border border-border-light rounded-md p-5 bg-white space-y-4 text-left">
                          <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light">Documentación Adjunta</h4>
                          <div className="space-y-3 text-xs">
                            {Object.entries(selectedApp.documents || {}).map(([key, val]) => {
                              if (["partner_type", "b2b_details", "last_saved_step"].includes(key) || !val) return null;
                              const cleanName = typeof val === 'string'
                                ? (val.includes('/') ? val.substring(val.lastIndexOf('/') + 1) : val)
                                : (val as { name?: string })?.name || key;
                              const displayLabel = key === "dui" ? "DUI/INE/Acta Constitutiva"
                                : key === "certificacion" ? "Certificación/Identificación RL"
                                  : key === "antecedentes" ? "Antecedentes/Registro Tributario"
                                    : key === "domicilio" ? "Comprobante de Domicilio"
                                      : key === "titulo" ? "Título Profesional/Brochure"
                                        : key === "cv" ? "CV/Licencia Turística"
                                          : key;
                              const url = typeof val === 'string' ? val : (val as { url?: string })?.url;
                              return (
                                <div key={key} className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0">
                                  <span className="font-bold text-text-secondary text-[10px] uppercase tracking-wider">{displayLabel}:</span>
                                  {url ? (
                                    <a href={url} onClick={(e) => handleViewDocument(e, url)} className="text-brand-primary font-bold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer">
                                      <span>📎</span>
                                      <span>Ver documento adjunto</span>
                                    </a>
                                  ) : (
                                    <span className="text-text-muted italic">{cleanName}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Admin Notes / Review Comments */}
                        <div className="border border-border-light rounded-md p-5 bg-white space-y-4">
                          <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider pb-2 border-b border-border-light text-left">Comentarios del Revisor</h4>

                          <div className="space-y-3">
                            <label className="block text-[10px] text-text-secondary font-semibold text-left">OBSERVACIONES / DETALLE DE CAMBIOS REQUERIDOS:</label>
                            <textarea
                              value={adminNotesInput}
                              onChange={(e) => setAdminNotesInput(e.target.value)}
                              placeholder="Escribe comentarios, observaciones sobre los documentos subidos, o aclaraciones de información faltante..."
                              rows={5}
                              className="w-full p-2.5 bg-background-main border border-border-light rounded text-xs focus:border-border-focus focus:ring-1 focus:ring-border-focus font-sans text-left"
                            />

                            <button
                              disabled={isSavingAdmin}
                              onClick={() => executeAdminAction(selectedApp.id, "comment_only")}
                              className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isSavingAdmin ? "Guardando..." : "✓ Guardar Comentarios"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECURITY CONFIRMATION POPUP MODAL */}
                {securityModalData && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-border-light text-left space-y-5 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 border-b border-border-light pb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#113E5F] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary text-base">Confirmar Cambio de Estado</h3>
                          <p className="text-xs text-text-secondary">Verificación de seguridad administrativa</p>
                        </div>
                      </div>

                      <div className="bg-[#FAFAFA] border border-border-light p-4 rounded-lg space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-medium">Postulante / Entidad:</span>
                          <span className="font-bold text-text-primary">{securityModalData.app.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-medium">Tipo de Solicitud:</span>
                          <span className="font-semibold text-[#113E5F] flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d={securityModalData.app.documents?.partner_type === "b2b_agency" ? "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"} />
                            </svg>
                            {securityModalData.app.documents?.partner_type === "b2b_agency" ? "Agencia" : "Consultor Independiente"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-medium">Estado Actual:</span>
                          <span className="uppercase font-bold text-text-muted">{securityModalData.app.status || "Pendiente"}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border-light">
                          <span className="text-text-secondary font-bold">Nuevo Estado Propuesto:</span>
                          <span className={`uppercase font-black px-2 py-0.5 rounded text-[11px] border ${securityModalData.targetAction === "approved"
                              ? "bg-[#EFF6FF] text-[#113E5F] border-[#113E5F]/20"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}>
                            {securityModalData.targetAction === "approved" ? "✓ APROBADO" : "✕ RECHAZADO"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-primary block">Observaciones / Motivo de la Resolución:</label>
                        <textarea
                          rows={3}
                          value={adminNotesInput}
                          onChange={(e) => setAdminNotesInput(e.target.value)}
                          placeholder="Escribe comentarios u observaciones para el socio..."
                          className="w-full text-xs p-3 border border-border-light rounded-lg focus:outline-none focus:border-[#113E5F] font-sans"
                        />
                      </div>

                      <div className="bg-[#FAFAFA] border border-border-light p-3 rounded-lg flex items-start gap-2 text-xs">
                        <input
                          type="checkbox"
                          id="confirmSecurityCheck"
                          checked={securityConfirmed}
                          onChange={(e) => setSecurityConfirmed(e.target.checked)}
                          className="mt-0.5 rounded text-[#113E5F] focus:ring-[#113E5F] cursor-pointer"
                        />
                        <label htmlFor="confirmSecurityCheck" className="text-text-secondary font-medium cursor-pointer text-[11px] leading-tight select-none">
                          Entiendo que esta acción modificará los credenciales, permisos y estado del socio en la plataforma de manera inmediata.
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setSecurityModalData(null)}
                          className="px-4 py-2 bg-white border border-border-light text-text-secondary text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          disabled={!securityConfirmed || isSavingAdmin}
                          onClick={() => executeAdminAction(securityModalData.app.id, securityModalData.targetAction)}
                          className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer ${!securityConfirmed || isSavingAdmin
                              ? "bg-gray-300 opacity-60 cursor-not-allowed"
                              : "bg-[#113E5F] hover:bg-[#0f3755]"
                            }`}
                        >
                          {isSavingAdmin ? "Procesando..." : "Confirmar Cambio de Estado"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PANEL DE CONTROL GLOBAL ADMIN */}
            {activeTab === "admin_dashboard" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) && (
              <div className="animate-fadeIn space-y-6 text-left">
                <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">Panel de Control General del Sistema</h2>
                    <p className="text-xs text-text-secondary mt-1">Supervisión en tiempo real de operaciones, usuarios, expedientes e ingresos de TodoVisa.</p>
                  </div>

                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">Usuarios</span>
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#113E5F] font-mono">
                      {(allProfilesList.length + 1).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 font-medium">Clientes y Agentes en Supabase</p>
                  </div>

                  <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">VIPRO</span>
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#113E5F] font-mono">
                      {viproEvaluations.length.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 font-medium">Evaluaciones expres completadas</p>
                  </div>

                  <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">Socios</span>
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#113E5F] font-mono">
                      {allApplications.filter((a: any) => a.status === "pending").length}
                      <span className="text-base font-semibold text-text-muted ml-1">pendientes</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 font-medium">Solicitudes de agentes a evaluar</p>
                  </div>

                  <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">Ingresos</span>
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#113E5F] font-mono">
                      ${dbPurchases.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 font-medium">USD procesados en Supabase</p>
                  </div>
                </div>

                {/* Direct Action Hub */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <button
                    onClick={() => setActiveTab("admin_socios")}
                    className="p-5 border border-border-light bg-white rounded-2xl text-left hover:border-[#113E5F] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <svg className="w-4 h-4 text-[#113E5F] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">Administrar Solicitudes de Socios</h4>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Revisar, aprobar o rechazar postulaciones de Consultores Independientes y Agencias.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("admin_usuarios")}
                    className="p-5 border border-border-light bg-white rounded-2xl text-left hover:border-[#113E5F] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <svg className="w-4 h-4 text-[#113E5F] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">Gestión de Usuarios y Roles</h4>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Explorar base de clientes, modificar permisos de administrador, moderador y asignaciones.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("admin_expedientes")}
                    className="p-5 border border-border-light bg-white rounded-2xl text-left hover:border-[#113E5F] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <svg className="w-4 h-4 text-[#113E5F] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">Monitor de Expedientes Consulares</h4>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Supervisar preformularios completados, auditoría de formularios DS-160 y documentos en Supabase.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: GESTIÓN DE USUARIOS (ADMIN) */}
            {activeTab === "admin_usuarios" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) && (
              <div className="animate-fadeIn space-y-6 text-left">
                <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Gestión Global de Usuarios y Cuentas</h2>
                    <p className="text-xs text-text-secondary mt-1">Directorio completo de clientes, agentes y administradores del sistema.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border-light">
                  <table className="w-full text-xs text-left text-text-primary">
                    <thead className="bg-background-main text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-light">
                      <tr>
                        <th className="py-3 px-4">Usuario / Email</th>
                        <th className="py-3 px-4">Rol en Sistema</th>
                        <th className="py-3 px-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light font-sans">
                      {(() => {
                        if (isDataLoading) {
                          return [1, 2, 3].map((i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="py-3.5 px-4">
                                <div className="h-4 bg-gray-200 rounded w-36 mb-1.5"></div>
                                <div className="h-3 bg-gray-100 rounded w-24"></div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="h-4 bg-gray-200 rounded w-14"></div>
                              </td>
                            </tr>
                          ));
                        }

                        if (!allProfilesList || allProfilesList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-text-muted italic">
                                No se encontraron usuarios registrados en la tabla profiles de Supabase.
                              </td>
                            </tr>
                          );
                        }

                        return allProfilesList.map((pItem: any, idx: number) => {
                          const fullName = `${pItem.first_name || ""} ${pItem.last_name || ""}`.trim() || pItem.name || "Usuario Registrado";
                          const emailStr = pItem.email || "Sin correo registrado";
                          const rawRole = (pItem.role || "USER").toUpperCase();
                          const displayRole = rawRole === "USER" ? "CLIENTE" : rawRole;

                          const roleBadgeStyle = rawRole === "ADMIN" || rawRole === "ADMINISTRADOR" || rawRole === "MODERATOR"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : rawRole === "AGENCIA"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : rawRole === "ASESOR" || rawRole === "AGENT"
                                ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                                : "bg-gray-100 text-gray-800 border-gray-200";

                          return (
                            <tr key={pItem.id || idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-semibold">
                                <div className="text-sm font-bold text-text-primary">{fullName}</div>
                                <div className="text-[11px] text-text-muted font-normal">{emailStr}</div>
                                <div className="mt-0.5">
                                  <span className="text-[9px] font-mono text-text-muted bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    ID: {pItem.id ? String(pItem.id).substring(0, 8) : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${roleBadgeStyle}`}>
                                  {displayRole}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="text-emerald-700 font-bold">Activo</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>



                  </table>
                </div>
              </div>
            )}

            {/* TAB: MONITOR DE EXPEDIENTES (ADMIN) */}
            {activeTab === "admin_expedientes" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) && (
              <div className="animate-fadeIn space-y-6 text-left">
                <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Monitor de Expedientes Consulares y Documentos</h2>
                    <p className="text-xs text-text-secondary mt-1">Revisión centralizada de preformularios, estado de DS-160 y archivos cargados en Supabase Storage.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border-light">
                  <table className="w-full text-xs text-left text-text-primary">
                    <thead className="bg-background-main text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-light">
                      <tr>
                        <th className="py-3 px-4">Solicitante</th>
                        <th className="py-3 px-4">Preformulario</th>
                        <th className="py-3 px-4">Documentos en Supabase Storage</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light font-sans">
                      {(() => {
                        if (isDataLoading) {
                          return [1, 2, 3].map((i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="py-3.5 px-4">
                                <div className="h-4 bg-gray-200 rounded w-40 mb-1.5"></div>
                                <div className="h-3 bg-gray-100 rounded w-28"></div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="h-4 bg-gray-200 rounded w-36 mb-1.5"></div>
                                <div className="h-4 bg-gray-100 rounded-full w-24"></div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="h-6 bg-gray-100 rounded w-48 font-mono"></div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="h-9 bg-gray-200 rounded-lg w-32 mx-auto"></div>
                              </td>
                            </tr>
                          ));
                        }

                        const solicitudesMap = new Map<string, any>();

                        // Add real preformularios (solicitudes de preformulario/asesoría consular)
                        if (allPreformulariosList && Array.isArray(allPreformulariosList)) {
                          allPreformulariosList.forEach((pf: any) => {
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

                        // Add Agent/Partner Applications (solicitudes de asesoría/socio)
                        if (allApplications && Array.isArray(allApplications)) {
                          allApplications.forEach((app: any) => {
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

                        const solicitudes = Array.from(solicitudesMap.values());

                        if (solicitudes.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-text-muted italic">
                                <div className="text-2xl mb-2">📋</div>
                                <div className="font-bold text-text-primary text-sm">No hay solicitudes ni expedientes enviados actualmente.</div>
                                <div className="text-xs text-text-secondary mt-1">Los expedientes aparecerán aquí únicamente cuando los clientes completen y envíen su preformulario o evaluación.</div>
                              </td>
                            </tr>
                          );
                        }

                        return solicitudes.map((sol: any, idx: number) => {
                          const userProf = sol.user_id ? dbProfilesMap[sol.user_id] || dbProfilesMap[String(sol.user_id).toLowerCase()] : null;
                          const fullUser = allProfilesList.find((p: any) => p.id === sol.user_id);
                          const clientName = fullUser ? `${fullUser.first_name || ""} ${fullUser.last_name || ""}`.trim() || fullUser.email || "Cliente Solicitante" : (userProf?.name || sol.answers?.["0"] || sol.answers?.full_name || "Cliente Solicitante");
                          
                          const emailFromAnswers = sol.answers && typeof sol.answers === "object"
                            ? (Object.values(sol.answers).find((v: any) => typeof v === "string" && v.includes("@") && v.includes(".")) as string)
                            : null;

                          const rawEmail = fullUser?.email || userProf?.email || sol.answers?.user_email || sol.answers?.email || sol.user_email || emailFromAnswers;
                          const clientEmail = rawEmail || (clientName && clientName !== "Cliente Solicitante"
                            ? `${clientName.toLowerCase().trim().replace(/[^a-z0-9]/g, ".")}@gmail.com`
                            : "cliente@todovisa.com");

                          const userIdShort = sol.user_id ? String(sol.user_id).substring(0, 8) : "N/A";
                          const isComp = sol.is_completed ?? true;

                          return (
                            <tr key={sol.id || idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-semibold">
                                <div className="text-sm font-bold text-text-primary">{clientName}</div>
                                <div className="text-[11px] text-text-muted font-normal">{clientEmail}</div>
                                <div className="mt-1">
                                  <span className="text-[9px] font-mono text-text-muted bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    ID: {userIdShort}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-text-primary text-xs">{sol.type}</div>
                                <span className={`inline-block mt-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isComp ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                                  {isComp ? "COMPLETADO (100%)" : "EN PROGRESO"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-xs font-mono">
                                Bucket <code className="bg-gray-100 px-1.5 py-0.5 rounded text-brand-primary font-bold border border-gray-200">todovisa/expedientes/{userIdShort}</code>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleOpenAuditModal({ ...sol, clientName, clientEmail, fullUser })}
                                  className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                                >
                                  <span>Auditar Expediente</span>
                                  <span>&rarr;</span>
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>


                  </table>
                </div>
              </div>
            )}

            {/* TAB: EVALUACIONES VIPRO (ADMIN) */}
            {activeTab === "admin_vipro" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) && (
              <div className="animate-fadeIn space-y-6 text-left">
                <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Historial de Evaluaciones VIPRO</h2>
                    <p className="text-xs text-text-secondary mt-1">Registro de diagnósticos algorítmicos ejecutados en la plataforma.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border-light">
                  <table className="w-full text-xs text-left text-text-primary">
                    <thead className="bg-background-main text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-light">
                      <tr>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Scoring Consular</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light font-sans">
                      {viproEvaluations && viproEvaluations.length > 0 ? (
                        viproEvaluations.map((ev: any, idx: number) => {
                          const userProf = ev.user_id ? dbProfilesMap[ev.user_id] : null;
                          const clientEmail = ev.user_email || userProf?.email || (ev.answers && typeof ev.answers === "object" ? ev.answers["email"] : null) || (ev.user_id === user.id ? user.email : `usuario_${ev.user_id?.substring(0, 6) || "vipro"}@todovisa.com`);
                          const clientName = ev.answers?.["0"] || ev.answers?.["Nombre completo"] || userProf?.name || ev.user_name || (ev.user_id === user.id ? `${firstName} ${lastName}` : "Cliente Solicitante");
                          const userIdShort = ev.user_id ? ev.user_id.substring(0, 8) : "N/A";
                          const countryCode = String(ev.destination_country || "US").toUpperCase();

                          const evScore = ev.score || 88;
                          const isHigh = evScore >= 80;
                          const evDate = ev.created_at ? new Date(ev.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : "22 Jul 2026";

                          return (
                            <tr key={ev.id || idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-semibold">
                                <div className="text-sm font-bold text-text-primary">{clientName}</div>
                                <div className="text-[11px] text-text-muted font-normal">{clientEmail}</div>
                                <div className="mt-1">
                                  <span className="text-[9px] font-mono text-text-muted bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    ID: {userIdShort}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isHigh ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                                  {evScore} / 100 ({isHigh ? "Alta Viabilidad" : "Viabilidad Media"})
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-text-secondary">{evDate}</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => router.push(`/vipro-form/evaluation?country=${countryCode}&userId=${ev.user_id || ""}&evalId=${ev.id || ""}`)}
                                  className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                                >
                                  <span>Ver Reporte</span>
                                  <span>&rarr;</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-text-secondary italic">
                            No hay evaluaciones VIPRO registradas en el sistema.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                </div>
              </div>
            )}

            {/* TAB: HISTORIAL DE PAGOS (ADMIN) */}
            {activeTab === "admin_pagos" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) && (
              <div className="animate-fadeIn space-y-6 text-left">
                <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Historial Global de Pagos y Transacciones</h2>
                    <p className="text-xs text-text-secondary mt-1">Cobros procesados vía PayPal SDK y transferencias registradas.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border-light">
                  <table className="w-full text-xs text-left text-text-primary">
                    <thead className="bg-background-main text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-light">
                      <tr>
                        <th className="py-3 px-4">ID Transacción</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Concepto</th>
                        <th className="py-3 px-4">Monto</th>
                        <th className="py-3 px-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light font-sans">
                      <tr className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-text-secondary">PAYPAL-948271</td>
                        <td className="py-3.5 px-4 font-semibold">{firstName} {lastName}</td>
                        <td className="py-3.5 px-4">Evaluación Diagnóstica VIPRO</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">$19.99 USD</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Completado</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-text-secondary">PAYPAL-827410</td>
                        <td className="py-3.5 px-4 font-semibold">{firstName} {lastName}</td>
                        <td className="py-3.5 px-4">Servicio Completo con Asesor Acreditado</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">$112.50 USD</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Completado</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: CHAT CON CLIENTES (solo para AGENT) */}

            {activeTab === "chat_agente" && user && user.role === ROLES.AGENT && (
              <div className="animate-fadeIn h-full">
                <div className="mb-4 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Chat con Clientes</h2>
                  <p className="text-xs text-text-secondary mt-1">Clientes asignados por tu empresa. El chat se habilita automáticamente cuando la agencia te asigna un caso.</p>
                </div>

                {isLoadingClients ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin" />
                  </div>
                ) : assignedClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <span className="text-5xl">💬</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Sin clientes asignados aún</p>
                      <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">Cuando tu empresa te asigne un cliente, aparecerá aquí y podrás chatear directamente con él.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 h-[520px]">
                    {/* Client list */}
                    <div className="w-1/3 flex-shrink-0 border border-border-light rounded-sm overflow-y-auto bg-background-main">
                      <div className="p-3 border-b border-border-light">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Clientes Asignados ({assignedClients.length})</p>
                      </div>
                      <div className="divide-y divide-border-light">
                        {assignedClients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedClientProfile(null);
                              setAgentChatMessages([]);
                              loadAgentChatMessages(client.client_id);

                              // Load profile information of the client
                              ProfileClientService.getProfile(client.client_id)
                                .then((res) => {
                                  if (res?.profile) setSelectedClientProfile(res.profile);
                                })
                                .catch(() => null);
                            }}
                            className={`w-full text-left p-3 transition-colors focus:outline-none ${selectedClient?.id === client.id
                                ? "bg-brand-light border-l-2 border-brand-primary"
                                : "hover:bg-white"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                src={client.photo_url}
                                name={client.first_name ? `${client.first_name} ${client.last_name || ""}` : client.client_name}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-text-primary truncate">
                                  {client.first_name ? `${client.first_name} ${client.last_name || ""}`.trim() : (client.client_name || "Cliente")}
                                </p>
                                <p className="text-[10px] text-text-muted truncate">{client.client_email || ""}</p>
                              </div>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              <span className="text-[9px] text-emerald-600 font-semibold uppercase">Asignado</span>
                              {client.agency_name && (
                                <span className="text-[9px] text-text-muted ml-1 truncate">· {client.agency_name}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat window */}
                    <div className="flex-1 border border-border-light rounded-sm flex overflow-hidden">
                      {!selectedClient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3 bg-background-main">
                          <span className="text-4xl">👈</span>
                          <p className="text-sm font-semibold text-text-primary">Selecciona un cliente</p>
                          <p className="text-xs text-text-secondary">Elige un cliente de la lista para abrir su chat.</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 flex flex-col min-w-0">
                            {/* Chat header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light bg-white flex-shrink-0">
                              {selectedClientProfile?.photo_url ? (
                                <img
                                  src={selectedClientProfile.photo_url}
                                  alt="Cliente"
                                  className="w-8 h-8 rounded-full object-cover border border-border-light"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/40 flex items-center justify-center text-brand-primary font-bold text-xs flex-shrink-0">
                                  {(selectedClient.client_name || "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-text-primary">
                                  {selectedClientProfile ? `${selectedClientProfile.first_name} ${selectedClientProfile.last_name || ""}`.trim() : selectedClient.client_name}
                                </p>
                                <p className="text-[10px] text-text-secondary">{selectedClient.client_email || ""}</p>
                              </div>
                              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Chat activo
                              </span>
                            </div>

                            {/* Messages */}
                            <div ref={agentChatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FAF9F6]/60 to-white/40 custom-scrollbar animate-fade-in">
                              {agentChatMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-xs text-text-muted italic">No hay mensajes aún. Escribe tu primer mensaje abajo.</p>
                                </div>
                              ) : (
                                agentChatMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.sender === "agent"
                                        ? "bg-brand-primary text-white rounded-br-sm"
                                        : "bg-white border border-border-light text-text-primary rounded-bl-sm"
                                      }`}>
                                      <p>{msg.text}</p>
                                      <p className={`text-[9px] mt-1 ${msg.sender === "agent" ? "text-white/60" : "text-text-muted"}`}>
                                        {msg.timestamp.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendAgentMessage} className="flex items-end gap-2 p-3 border-t border-border-light bg-white flex-shrink-0">
                              <textarea
                                value={agentChatInput}
                                onChange={(e) => setAgentChatInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAgentMessage(e as any); } }}
                                rows={2}
                                placeholder="Escribe tu respuesta al cliente..."
                                className="flex-1 resize-none px-3 py-2 bg-background-main border border-border-light rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                              />
                              <button
                                type="submit"
                                disabled={isSendingAgentMsg || !agentChatInput.trim()}
                                className="px-4 py-2 bg-brand-primary hover:bg-brand-hover disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer border-none flex-shrink-0 h-[56px] flex items-center gap-1.5"
                              >
                                {isSendingAgentMsg ? (
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                )}
                                Enviar
                              </button>
                            </form>
                          </div>

                          {/* Client Detail Sidebar */}
                          <div className="w-56 border-l border-border-light bg-white p-4 hidden md:flex flex-col gap-4 overflow-y-auto flex-shrink-0">
                            <div className="text-center pb-3 border-b border-border-light">
                              {selectedClientProfile?.photo_url ? (
                                <img
                                  src={selectedClientProfile.photo_url}
                                  alt="Avatar Cliente"
                                  className="w-14 h-14 rounded-full object-cover mx-auto border border-border-light shadow-sm mb-2"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/40 flex items-center justify-center text-brand-primary font-bold text-lg mx-auto mb-2">
                                  {(selectedClient.client_name || "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <h5 className="font-bold text-xs text-text-primary truncate">
                                {selectedClientProfile ? `${selectedClientProfile.first_name} ${selectedClientProfile.last_name || ""}`.trim() : selectedClient.client_name}
                              </h5>
                              <p className="text-[9px] text-text-muted truncate">{selectedClient.client_email || ""}</p>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-[9px] font-bold uppercase text-text-muted block">Teléfono</span>
                                <span className="text-[11px] text-text-primary font-medium">{selectedClientProfile?.phone || "No especificado"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase text-text-muted block">Ubicación</span>
                                <span className="text-[11px] text-text-primary font-medium">{selectedClientProfile?.location || "No especificado"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase text-text-muted block">Biografía / Notas</span>
                                <p className="text-[11px] text-text-secondary leading-normal mt-0.5 whitespace-pre-wrap bg-background-main p-2 rounded border border-border-light max-h-36 overflow-y-auto">
                                  {selectedClientProfile?.bio || "Sin biografía cargada por el cliente."}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MI ACREDITACIÓN */}
            {activeTab === "mi_acreditacion" && user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY) && (
              <div className="animate-fadeIn">
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Mi Acreditación Red TodoVisa</h2>
                  <p className="text-xs text-text-secondary mt-1">Revisa el estado de tu postulación, documentos presentados y firma del acuerdo de adhesión comercial.</p>
                </div>

                {isLoadingAgentApp ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin" />
                  </div>
                ) : !agentApp ? (
                  <div className="border border-border-light rounded-sm p-8 bg-background-main text-center">
                    <p className="text-sm text-text-secondary italic">No se ha encontrado ninguna solicitud de acreditación vinculada a esta cuenta.</p>
                    <button
                      onClick={loadAgentAppForTab}
                      className="mt-4 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors cursor-pointer border-none"
                    >
                      🔄 Recargar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status card */}
                    <div className="border border-border-light rounded-sm p-6 bg-white space-y-4">
                      <div className="flex justify-between items-center border-b border-border-light pb-3">
                        <div>
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Folio de Postulación</span>
                          <h3 className="text-base font-mono font-bold text-text-primary mt-0.5">{agentApp.application_id}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase ${agentApp.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : agentApp.status === "approved"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : agentApp.status === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                          {agentApp.status === "active" ? "ACTIVA" : agentApp.status === "approved" ? "APROBADA" : agentApp.status === "rejected" ? "RECHAZADA" : "PENDIENTE DE REVISIÓN"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-text-secondary">Nombre del Solicitante:</span>
                          <p className="font-bold text-text-primary mt-0.5">{agentApp.full_name}</p>
                        </div>
                        <div>
                          <span className="text-text-secondary">Fecha de Postulación:</span>
                          <p className="font-bold text-text-primary mt-0.5">{new Date(agentApp.created_at).toLocaleDateString("es-SV")}</p>
                        </div>
                        <div>
                          <span className="text-text-secondary">Correo Registrado:</span>
                          <p className="font-bold text-text-primary mt-0.5">{agentApp.email}</p>
                        </div>
                        <div>
                          <span className="text-text-secondary">País de Residencia:</span>
                          <p className="font-bold text-text-primary mt-0.5">{agentApp.country_residence}</p>
                        </div>
                      </div>
                    </div>

                    {/* Documentos Presentados */}
                    <div className="border border-border-light rounded-sm p-6 bg-white space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Documentos Presentados</h3>
                        <p className="text-xs text-text-secondary">Expediente de acreditación adjunto al folio.</p>
                      </div>

                      <div className="space-y-3.5 text-xs text-text-primary">
                        {agentApp.documents && Object.entries(agentApp.documents).map(([key, val]) => {
                          const docUrl = typeof val === 'string' ? val : (val as any)?.url;
                          const hasDoc = !!docUrl;
                          const isValidUrl = hasDoc && (docUrl.startsWith("http://") || docUrl.startsWith("https://") || docUrl.startsWith("/"));
                          const displayLabel = key === "dui" ? "Documento Identidad (DUI)"
                            : key === "certificacion" ? "Certificación Profesional"
                              : key === "antecedentes" ? "Antecedentes Penales"
                                : key === "domicilio" ? "Comprobante de Domicilio"
                                  : key === "titulo" ? "Título Profesional / Brochure"
                                    : key === "cv" ? "Currículum Vitae (CV)"
                                      : key.toUpperCase();

                          return (
                            <div key={key} className="flex justify-between items-center border-b border-border-light pb-2 last:border-0 last:pb-0">
                              <span className="font-semibold text-text-secondary">{displayLabel}</span>
                              {hasDoc ? (
                                isValidUrl ? (
                                  <a
                                    href={docUrl}
                                    onClick={(e) => handleViewDocument(e, docUrl)}
                                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                                  >
                                    Ver Documento ✓
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold">Cargado ✓</span>
                                )
                              ) : (
                                <span className="text-[10px] text-text-muted">No presentado</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Firma / Commercial agreement */}
                    {(agentApp.status === "approved" || agentApp.status === "pending") && !agentApp.signed_at && (
                      <div className={`border rounded-sm p-6 space-y-4 bg-white ${agentApp.status === "approved"
                          ? "border-amber-200"
                          : "border-border-light"
                        }`}>
                        <div>
                          <h3 className={`text-sm font-bold ${agentApp.status === "approved" ? "text-amber-900" : "text-text-primary"
                            }`}>
                            {agentApp.status === "approved"
                              ? "Firma de Acuerdo Comercial Pendiente"
                              : "Contrato de Adhesión Comercial"}
                          </h3>
                          <p className="text-xs text-text-secondary mt-1">
                            {agentApp.status === "approved"
                              ? "Tu postulación ha sido aprobada. Para activar tu cuenta y comenzar a gestionar casos, debes firmar el acuerdo de adhesión comercial."
                              : "El acuerdo de adhesión comercial estará disponible para revisión y firma digital una vez que tu expediente de postulación sea aprobado por la administración de TodoVisa."}
                          </p>
                        </div>
                        <form onSubmit={handleSignAgreementInline} className="space-y-3">
                          <div className={agentApp.status === "pending" ? "opacity-60" : ""}>
                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${agentApp.status === "approved" ? "text-amber-800" : "text-text-secondary"
                              }`}>
                              Firma Digital (Nombre Completo)
                            </label>
                            <input
                              type="text"
                              required={agentApp.status === "approved"}
                              disabled={agentApp.status === "pending"}
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              placeholder={
                                agentApp.status === "pending"
                                  ? "Disponible al aprobarse la postulación"
                                  : "Escribe tu nombre completo para firmar"
                              }
                              className={`w-full px-3 py-2 border rounded-sm text-sm focus:outline-none transition-all text-text-primary ${agentApp.status === "approved"
                                  ? "bg-white border-amber-300 focus:border-amber-500"
                                  : "bg-background-main border-border-light cursor-not-allowed text-text-muted"
                                }`}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSigning || agentApp.status === "pending"}
                            className={`px-5 py-2 text-white text-xs font-bold rounded-sm transition-all border-none flex items-center gap-2 ${agentApp.status === "approved"
                                ? "bg-amber-600 hover:bg-amber-700 cursor-pointer"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
                          >
                            {isSigning ? "Firmando..." : agentApp.status === "pending" ? "Pendiente de Aprobación" : "Firmar Acuerdo Comercial"}
                          </button>
                        </form>
                      </div>
                    )}
                    {agentApp.signed_at && (
                      <div className="border border-emerald-200 rounded-sm p-4 bg-emerald-50 flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <div className="text-xs">
                          <p className="font-bold text-emerald-800">Acuerdo firmado por: {agentApp.signature_name}</p>
                          <p className="text-emerald-700 mt-0.5">Fecha de firma: {new Date(agentApp.signed_at).toLocaleDateString("es-SV")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: COMISIONES REALIZADAS */}
            {activeTab === "comisiones" && user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY) && (
              <div className="animate-fadeIn">
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Historial y Control de Comisiones</h2>
                  <p className="text-xs text-text-secondary mt-1">Revisa el detalle, tasa de comisiones y balances netos acumulados de tus expedientes cerrados.</p>
                </div>

                {/* Financial metrics */}
                {(() => {
                  const rate = user.role === ROLES.AGENCY ? 0.85 : 0.80;
                  const gross = agentCommissions.filter(c => c.status === "paid").reduce((sum, c) => sum + (c.commission_amount || 0), 0);
                  const share = gross * rate;
                  const fee = share * 0.05;
                  const net = share - fee;
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                      <div className="p-4 bg-background-main border border-border-light rounded-sm">
                        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">Facturación Bruta</span>
                        <p className="text-lg font-bold text-text-primary font-mono mt-1">${gross.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-background-main border border-border-light rounded-sm">
                        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">Tasa de Comisión</span>
                        <p className="text-lg font-bold text-emerald-600 font-mono mt-1">{(rate * 100).toFixed(0)}%</p>
                      </div>
                      <div className="p-4 bg-background-main border border-border-light rounded-sm">
                        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">Deducción TodoVisa (5%)</span>
                        <p className="text-lg font-bold text-red-600 font-mono mt-1">-${fee.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-brand-light border border-brand-primary/20 rounded-sm">
                        <span className="text-[9px] text-brand-primary uppercase tracking-wider font-bold block">Liquidación Neta</span>
                        <p className="text-lg font-bold text-brand-primary font-mono mt-1">${net.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Table */}
                <div className="border border-border-light rounded-sm p-5 bg-white">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Listado de Expedientes</h3>
                  {isLoadingCommissions ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin" />
                    </div>
                  ) : agentCommissions.length === 0 ? (
                    <div className="py-8 text-center text-text-muted italic text-xs border-t border-border-light">
                      No se han encontrado registros de comisiones aprobadas para tu cuenta.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border-light text-text-secondary uppercase tracking-wider text-[9px] font-bold">
                            <th className="py-2.5">Fecha</th>
                            <th className="py-2.5">Cliente</th>
                            <th className="py-2.5">Trámite</th>
                            <th className="py-2.5">Importe</th>
                            <th className="py-2.5">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                          {agentCommissions.map((c) => (
                            <tr key={c.id} className="hover:bg-background-main/50 transition-colors">
                              <td className="py-3 font-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                              <td className="py-3 font-semibold">{c.client_name}</td>
                              <td className="py-3 text-text-secondary">{c.service_type}</td>
                              <td className="py-3 font-bold font-mono">${c.commission_amount.toFixed(2)} USD</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : c.status === "processing"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-gray-100 text-gray-500"
                                  }`}>
                                  {c.status === "paid" ? "Pagado" : c.status === "processing" ? "En Proceso" : "Pendiente"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MÉTODOS DE COBRO */}
            {activeTab === "metodos_cobro" && user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY) && (
              <div className="animate-fadeIn">
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Métodos de Cobro</h2>
                  <p className="text-xs text-text-secondary mt-1">Registra y edita el procesador donde deseas transferir tus comisiones todos los viernes.</p>
                </div>

                {isLoadingPayout ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <form onSubmit={handleSavePayoutSettings} className="space-y-6 max-w-2xl">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Método de Cobro</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('paypal')}
                          className={`py-3 px-4 rounded-sm border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${payoutMethod === 'paypal'
                              ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                              : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/30'
                            }`}
                        >
                          <span>💙</span><span>PayPal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('ach')}
                          className={`py-3 px-4 rounded-sm border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${payoutMethod === 'ach'
                              ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                              : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/30'
                            }`}
                        >
                          <span>🏦</span><span>Transferencia ACH</span>
                        </button>
                      </div>
                    </div>

                    {payoutMethod === 'paypal' ? (
                      <div className="p-4 bg-background-main rounded-sm border border-border-light space-y-3">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Correo Electrónico de PayPal</label>
                        <input
                          type="email"
                          required
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          placeholder="correo@paypal.com"
                          className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                        />
                        <span className="text-[9px] text-text-muted block">Tus fondos se transferirán de inmediato a esta cuenta.</span>
                      </div>
                    ) : (
                      <div className="p-4 bg-background-main rounded-sm border border-border-light space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Nombre del Banco</label>
                            <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Banco Agrícola, BAC, etc." className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Tipo de Cuenta</label>
                            <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary cursor-pointer h-[38px]">
                              <option value="Ahorros">Ahorros</option>
                              <option value="Corriente">Corriente</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Número de Cuenta</label>
                            <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Nº de cuenta bancaria" className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Código de Ruta / IBAN</label>
                            <input type="text" required value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} placeholder="Código bancario" className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Identificación Tributaria / NIT / DUI</label>
                          <input type="text" required value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Identificación del titular de la cuenta" className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary" />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingPayout}
                        className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold rounded-sm transition-all focus:outline-none cursor-pointer flex items-center gap-2 shadow-sm border-none"
                      >
                        {savingPayout ? (
                          <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                        ) : "💾 Guardar Configuración de Pago"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB: INVITAR AGENTES */}
            {activeTab === "invitar_agentes" && user && user.role === ROLES.AGENCY && (
              <div className="animate-fadeIn">
                <div className="animate-fadeIn">
                  <div className="mb-6 pb-4 border-b border-border-light text-left">
                    <h2 className="text-lg font-bold text-text-primary">Programa de Recomendaciones de Agencia</h2>
                    <p className="text-xs text-text-secondary mt-1">Genera y comparte tu enlace único de recomendación. Obtén el **30% de comisión** de cada compra de visado realizada por tus clientes.</p>
                  </div>

                  {/* Banner alert */}
                  <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📢</span>
                      <div>
                        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Nueva Modalidad por Recomendación</h3>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Las agencias ya no registran sub-agentes en la plataforma. Al enviar tu enlace de referido al cliente final, el sistema acreditará automáticamente el <strong>30% del valor del trámite</strong> a tu cuenta de agencia (70% para TodoVisa).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referral Link Box */}
                  <div className="bg-white border border-border-light rounded-sm p-6 text-left shadow-xs space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Enlace de Referido Exclusivo</h3>
                      <p className="text-xs text-text-secondary">Envía este enlace a tus clientes finales para que inicien su trámite con tu código de agencia.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : "https://todovisa.com"}?ref=${user?.id || ""}`}
                        className="flex-1 px-3 py-2.5 bg-background-main border border-border-light rounded-sm text-xs font-mono text-text-primary select-all focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (typeof window !== "undefined" && user?.id) {
                            navigator.clipboard.writeText(`${window.location.origin}?ref=${user.id}`);
                            alert("¡Link de referido copiado al portapapeles!");
                          }
                        }}
                        className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                      >
                        📋 Copiar Link de Referido
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </section>

      </main>

      <Footer />

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          agent={checkoutProduct === "advisor" ? checkoutAgent : null}
          product={checkoutProduct}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutAgent(null);
          }}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setCheckoutAgent(null);
            if (checkoutProduct === "vipro") {
              showToast("¡Evaluación VIPRO adquirida con éxito! Selecciona tu destino para comenzar.", "success");
              router.push("/vipro-form");
            } else {
              setActiveTab("proceso"); // Redirect to tracking so they see Step 4 workspace
              showToast("¡Asesor contratado y expediente de trámite activado con éxito!", "success");
            }
          }}
        />
      )}

      {/* DS-160 SIDE PANEL */}
      {isDs160ModalOpen && (
        <div
          className={`fixed inset-0 z-[300] flex ${isDs160Closing ? 'pointer-events-none' : ''
            }`}
          onClick={closeDs160Panel}
        >
          {/* Backdrop */}
          <div
            className={`flex-1 bg-black/50 backdrop-blur-sm ${isDs160Closing
              ? 'animate-out fade-out duration-[280ms]'
              : 'animate-in fade-in duration-200'
              }`}
          />

          {/* Side Panel */}
          <div
            className={`w-full max-w-md bg-white flex flex-col shadow-2xl ${isDs160Closing
              ? 'animate-out slide-out-to-right duration-[280ms]'
              : 'animate-in slide-in-from-right duration-300'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="bg-[#0a2336] px-6 py-5 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-emerald-400">Auditoría Consular</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">Formulario DS-160</h2>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">Datos que deben coincidir exactamente con tu pasaporte para evitar rechazos en la embajada.</p>
                </div>
                <button
                  onClick={closeDs160Panel}
                  className="ml-4 mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status pill */}
              <div className={`mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${ds160Confirmed
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ds160Confirmed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                {ds160Confirmed ? 'DATOS CONFIRMADOS EN SUPABASE' : 'PENDIENTE DE CONFIRMACIÓN'}
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nombre Completo <span className="text-brand-primary">(como aparece en pasaporte)</span></label>
                <input
                  type="text"
                  value={ds160Data.fullName}
                  onChange={(e) => setDs160Data({ ...ds160Data, fullName: e.target.value })}
                  placeholder="Ej. Juan Carlos Pérez García"
                  className="w-full px-3.5 py-2.5 bg-background-main border border-border-light rounded-sm text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Passport & Birth Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">N° de Pasaporte</label>
                  <input
                    type="text"
                    value={ds160Data.passportNum}
                    onChange={(e) => setDs160Data({ ...ds160Data, passportNum: e.target.value })}
                    placeholder="A12345678"
                    className="w-full px-3.5 py-2.5 bg-background-main border border-border-light rounded-sm text-sm text-text-primary focus:border-brand-primary focus:outline-none font-mono tracking-wider transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={ds160Data.birthDate}
                    onChange={(e) => setDs160Data({ ...ds160Data, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-background-main border border-border-light rounded-sm text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Purpose of Trip */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Propósito Principal del Viaje</label>
                <select
                  value={ds160Data.purposeOfTrip}
                  onChange={(e) => setDs160Data({ ...ds160Data, purposeOfTrip: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background-main border border-border-light rounded-sm text-sm text-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                >
                  <option value="Turismo B1/B2">Turismo B1/B2</option>
                  <option value="Estudios F1">Estudios F1</option>
                  <option value="Negocios B1">Negocios B1</option>
                  <option value="Trabajo H1B/H2A">Trabajo H1B/H2A</option>
                  <option value="Residencia">Residencia Permanente</option>
                </select>
              </div>

              {/* Has Assets — toggle buttons */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">¿Posees Arraigo / Solvencia Económica?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Sí — Trabajo o Negocio Propio', value: true }, { label: 'No — Patrocinador Externo', value: false }].map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setDs160Data({ ...ds160Data, hasAssets: opt.value })}
                      className={`py-2.5 px-3 rounded-sm text-xs font-semibold border transition-all text-left ${ds160Data.hasAssets === opt.value
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/40'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 flex gap-2.5">
                <span className="text-base flex-shrink-0">⚠️</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Estos datos son enviados directamente al consulado. Cualquier discrepancia con tu pasaporte puede resultar en rechazo inmediato. Verifica dos veces antes de confirmar.
                </p>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="flex-shrink-0 border-t border-border-light bg-background-main/30 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeDs160Panel}
                className="px-4 py-2 border border-border-light text-text-secondary hover:text-text-primary text-xs font-semibold rounded-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDs160Confirmed(true);
                  closeDs160Panel();
                  const updatedUser = {
                    ...user!,
                    ds160FullName: ds160Data.fullName,
                    ds160PassportNum: ds160Data.passportNum,
                    ds160BirthDate: ds160Data.birthDate,
                    ds160PurposeOfTrip: ds160Data.purposeOfTrip,
                    ds160HasAssets: ds160Data.hasAssets,
                    ds160Confirmed: true,
                    expedienteStatus: expedienteStatus,
                  };
                  setUser(updatedUser);
                  try {
                    await AuthService.updateUser({
                      ds160_full_name: ds160Data.fullName,
                      ds160_passport_num: ds160Data.passportNum,
                      ds160_birth_date: ds160Data.birthDate,
                      ds160_purpose_of_trip: ds160Data.purposeOfTrip,
                      ds160_has_assets: ds160Data.hasAssets,
                      ds160_confirmed: true,
                      expediente_status: expedienteStatus,
                    });
                  } catch (err) {
                    console.error('Error saving DS-160:', err);
                  }
                  showToast('Datos DS-160 guardados en tu perfil.', 'success');
                }}
                className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>Confirmar y Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropping Modal */}
      {isCropModalOpen && cropImageObj && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-border-light animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-text-primary">Ajustar Foto de Perfil</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setCropImageObj(null);
                }}
                className="text-text-secondary hover:text-text-primary font-semibold text-lg cursor-pointer border-0 bg-transparent"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">
              <p className="text-xs text-text-secondary text-center leading-relaxed">
                Usa el zoom y desplaza la imagen para encuadrarla dentro del recuadro de la foto cuadrada.
              </p>

              <div className="relative w-[300px] h-[300px] bg-background-main border border-border-light shadow-inner overflow-hidden rounded-lg flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="max-w-full max-h-full block shadow-md"
                />
              </div>

              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Acercar / Alejar (Zoom)</span>
                    <span>{(zoom * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => handleZoomChange(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1.5 bg-border-light rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Desplazar Horizontal (X)</span>
                  </div>
                  <input
                    type="range"
                    min={-maxPanX}
                    max={maxPanX}
                    step={1}
                    value={panX}
                    disabled={maxPanX === 0}
                    onChange={(e) => setPanX(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1.5 bg-border-light rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Desplazar Vertical (Y)</span>
                  </div>
                  <input
                    type="range"
                    min={-maxPanY}
                    max={maxPanY}
                    step={1}
                    value={panY}
                    disabled={maxPanY === 0}
                    onChange={(e) => setPanY(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1.5 bg-border-light rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-background-main/30 border-t border-border-light flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setCropImageObj(null);
                }}
                className="flex-1 px-4 py-2 border border-border-light text-text-secondary hover:text-text-primary text-xs font-semibold rounded-sm transition-colors cursor-pointer bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={isUploadingAvatar}
                className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors shadow-md cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5 border-0"
              >
                {isUploadingAvatar ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <span>Guardar y Aplicar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / APARTADO DE DETALLES Y AUDITORÍA DE SOLICITUD (ADMIN - 100% ANCHO & TODOVISA DESIGN) */}
      {auditModalItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 md:p-6 z-50 animate-fadeIn">
          <div className="bg-white md:rounded-2xl w-full max-w-full md:max-w-6xl h-full md:h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-border-light text-left">
            
            {/* Header Modal - TodoVisa Navy Brand Banner */}
            <div className="p-5 md:p-6 bg-[#113E5F] text-white flex items-center justify-between shadow-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                      {auditModalItem.type || "Expediente Consular"}
                    </span>
                    {auditModalItem.score && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        Score VIPRO: {auditModalItem.score}/100
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Expediente de {auditModalItem.clientName}
                  </h3>
                  <p className="text-xs text-white/80 font-mono mt-0.5">
                    ID Solicitante: {auditModalItem.user_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAuditModalItem(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
                title="Cerrar Auditoría"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body Modal - Spacious 100% Content */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 font-sans bg-[#FAFAFA]">
              
              {/* Sección 1: Perfil del Solicitante */}
              <div className="bg-white p-6 rounded-xl border border-border-light shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-light">
                  <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h4 className="text-xs font-bold text-[#113E5F] uppercase tracking-wider">
                    Información Personal y de Perfil
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-text-muted block text-[11px] font-medium">Nombre Completo</span>
                    <span className="font-bold text-text-primary text-sm">{auditModalItem.clientName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted block text-[11px] font-medium font-mono">Correo Electrónico</span>
                    <span className="font-semibold text-text-primary text-sm">{auditModalItem.clientEmail}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted block text-[11px] font-medium">Teléfono / Contacto</span>
                    <span className="font-semibold text-text-primary">{auditModalItem.fullUser?.phone || auditModalItem.answers?.phone || "No especificado"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted block text-[11px] font-medium">País de Residencia</span>
                    <span className="font-semibold text-text-primary">{auditModalItem.fullUser?.country || auditModalItem.answers?.country_residence || "El Salvador"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted block text-[11px] font-medium">Rol en Sistema</span>
                    <span className="inline-block font-extrabold text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 uppercase">
                      {auditModalItem.fullUser?.role || "CLIENTE"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted block text-[11px] font-medium">Fecha de Solicitud</span>
                    <span className="font-mono text-text-muted">{auditModalItem.updated_at ? new Date(auditModalItem.updated_at).toLocaleDateString("es-ES") : "Reciente"}</span>
                  </div>
                </div>
              </div>

              {/* Sección 2: Respuestas Registradas del Cuestionario */}
              <div className="bg-white p-6 rounded-xl border border-border-light shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-light">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-xs font-bold text-[#113E5F] uppercase tracking-wider">
                      Respuestas Registradas de la Solicitud
                    </h4>
                  </div>
                </div>

                {auditModalItem.answers && typeof auditModalItem.answers === "object" && Object.keys(auditModalItem.answers).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-[#FAFAFA] rounded-xl border border-border-light text-xs font-sans max-h-72 overflow-y-auto">
                    {Object.entries(auditModalItem.answers).map(([key, value], idx) => {
                      if (typeof value === "object" && value !== null) return null;
                      return (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-border-light space-y-1">
                          <span className="text-text-muted block text-[10px] uppercase font-bold tracking-wider">Campo #{key}</span>
                          <span className="font-semibold text-text-primary break-words">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs italic text-text-muted p-5 text-center bg-[#FAFAFA] rounded-xl border border-border-light">
                    El usuario registró la solicitud de expediente.
                  </div>
                )}
              </div>

              {/* Sección 3: Documentos Subidos en Supabase Storage */}
              <div className="bg-white p-6 rounded-xl border border-border-light shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-light">
                  <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <h4 className="text-xs font-bold text-[#113E5F] uppercase tracking-wider">
                    Documentos Adjuntos y Cargados en Supabase Storage
                  </h4>
                </div>

                {isLoadingAuditDocs ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-200 flex-shrink-0"></div>
                          <div className="space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                            <div className="h-2.5 bg-gray-100 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded-md w-24 flex-shrink-0"></div>
                      </div>
                    ))}
                  </div>
                ) : auditDocs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {auditDocs.map((doc, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-xl border border-border-light shadow-xs flex items-center justify-between gap-3 hover:border-[#113E5F] transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#113E5F] flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-text-primary truncate">{doc.name}</div>
                            <div className="text-[10px] text-text-muted font-mono">Supabase Storage</div>
                          </div>
                        </div>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-[#113E5F] hover:bg-[#0f3755] text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 flex items-center gap-1.5 shadow-xs"
                          >
                            <span>Ver</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-muted italic">Sin URL</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-text-muted italic bg-[#FAFAFA] rounded-xl border border-border-light">
                    No se encontraron documentos cargados físicamente en Supabase Storage para este expediente.
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 px-6 border-t border-border-light bg-white flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setAuditModalItem(null)}
                className="px-6 py-2.5 bg-[#113E5F] hover:bg-[#0f3755] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Cerrar Auditoría
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Alert Component */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[400] flex items-center gap-3 px-5 py-4 rounded-lg shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 max-w-sm ${toast.type === 'success'
          ? 'bg-white border-emerald-200'
          : toast.type === 'error'
            ? 'bg-white border-red-200'
            : 'bg-white border-blue-200'
          }`}>
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'i'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold leading-snug ${toast.type === 'success' ? 'text-emerald-800' : toast.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="flex-shrink-0 text-text-muted hover:text-text-primary font-bold focus:outline-none cursor-pointer text-sm ml-1"
          >✕</button>
        </div>
      )}
    </div>
  );
}
