"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import { countries } from "countries-list";
import { CheckoutModal } from "../components/shared/CheckoutModal";
import agentsData from "../dummies/agents.json";
import supabase from "../lib/supabase";
import { MessageClientService, ClientMessageData } from "../service/MessageClientService";
import { ROLES } from "../constants/roles";

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
}

export default function PerfilUsuarioPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

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

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("SV");

  // Tab State: "datos", "proceso", "asesor", "pagos"
  const [activeTab, setActiveTab] = useState("datos");

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
        const { data: memberData, error: memberErr } = await supabase
          .from("agency_members")
          .select("agency_id")
          .eq("member_id", user.id)
          .maybeSingle();

        if (memberErr) {
          console.error("Error loading agency membership:", memberErr.message);
          return;
        }

        if (memberData && memberData.agency_id) {
          const { data: agencyProfile, error: agencyErr } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, photo_url, phone, bio, location, staff_size")
            .eq("id", memberData.agency_id)
            .maybeSingle();

          if (agencyErr) {
            if (agencyErr.message && (agencyErr.message.includes("column") || agencyErr.code === "P0002")) {
              const { data: fallbackProfile, error: fallbackErr } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, email")
                .eq("id", memberData.agency_id)
                .maybeSingle();

              if (fallbackErr) {
                console.error("Error loading agency details (fallback):", fallbackErr.message);
              } else if (fallbackProfile) {
                setMyAgency(fallbackProfile);
              }
            } else {
              console.error("Error loading agency details:", agencyErr.message);
            }
          } else if (agencyProfile) {
            setMyAgency(agencyProfile);
          }
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
        let invitationData = null;
        const { data, error } = await supabase
          .from("agency_invitations")
          .select("*, agency:profiles!agency_id(id, first_name, last_name, email, photo_url, phone, bio, location, staff_size)")
          .eq("email", user.email.trim().toLowerCase())
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (error) {
          if (error.message && (error.message.includes("column") || error.code === "P0002")) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("agency_invitations")
              .select("*, agency:profiles!agency_id(id, first_name, last_name, email)")
              .eq("email", user.email.trim().toLowerCase())
              .eq("status", "pending")
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (fallbackError) {
              console.error("Error loading B2B invitation (fallback):", fallbackError.message);
            } else if (fallbackData) {
              invitationData = fallbackData;
            }
          } else {
            console.error("Error loading B2B invitation:", error.message);
          }
        } else if (data) {
          invitationData = data;
        }

        if (invitationData) {
          setRealInvitation(invitationData);
        }
      } catch (err) {
        console.error("Unexpected error loading invitation:", err);
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
  const [viproEvaluations, setViproEvaluations] = useState<{ id: string; destination_country: string; score?: number; created_at: string }[]>([]);
  const [preformMetadata, setPreformMetadata] = useState<{ intake_type?: string; interview_waiver_eligible?: boolean | null } | null>(null);

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
        const { data, error } = await supabase
          .from("preformularios")
          .select("intake_type, interview_waiver_eligible")
          .eq("user_id", user.id)
          .eq("destination_country", dest)
          .maybeSingle();

        if (!error && data) {
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

  const handleFileUpload = (docType: "passport" | "dui" | "workCert" | "bankStatements", fileName: string) => {
    setClientDocs(prev => ({
      ...prev,
      [docType]: fileName
    }));
    showToast(`Archivo "${fileName}" cargado con éxito.`, "success");
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

  const handleCropAndUpload = async () => {
    if (!canvasRef.current || !cropImageObj || !user?.id || !currentUploadFile) return;

    setIsUploadingAvatar(true);

    try {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      let changesThisMonth = user?.avatarChangesThisMonth || 0;
      const lastChangeMonth = user?.lastAvatarChangeMonth || "";

      if (lastChangeMonth === currentMonthStr) {
        changesThisMonth += 1;
      } else {
        changesThisMonth = 1;
      }

      const canvas = canvasRef.current;

      // Crop canvas into a blob and upload it (optimizing to JPEG at 85% quality)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("Error al procesar la imagen.", "error");
          setIsUploadingAvatar(false);
          return;
        }

        const fileExt = "jpg";
        const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

        // Upload cropped JPEG blob directly to 'todovisa' storage bucket
        const { error: uploadError } = await supabase.storage
          .from("todovisa")
          .upload(filePath, blob, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading avatar to Supabase storage:", uploadError.message);
          showToast("Error al subir la imagen al almacenamiento. Inténtalo de nuevo.", "error");
          setIsUploadingAvatar(false);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("todovisa")
          .getPublicUrl(filePath);

        const updatedUser = {
          ...user,
          photoUrl: publicUrl,
          avatarChangesThisMonth: changesThisMonth,
          lastAvatarChangeMonth: currentMonthStr,
        };

        setUser(updatedUser);

        const { error } = await supabase.auth.updateUser({
          data: {
            photo_url: publicUrl,
            avatar_changes_this_month: changesThisMonth,
            last_avatar_change_month: currentMonthStr,
          }
        });

        setIsUploadingAvatar(false);
        setIsCropModalOpen(false);
        setCropImageObj(null);

        if (error) {
          console.warn("Could not save avatar URL to Supabase auth:", error.message);
          showToast("Se subió el archivo pero no se pudo actualizar tu perfil en la sesión.", "error");
        } else {
          showToast(`Foto de perfil actualizada. Cambios este mes: ${changesThisMonth}/3`, "success");
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

  // Sync user profile state with Supabase Auth on page load
  useEffect(() => {
    let isSubscribed = true;
    const syncWithSupabase = async () => {
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("Could not fetch user from Supabase, operating in local/offline mode:", error.message);
          return;
        }

        if (supabaseUser && isSubscribed) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", supabaseUser.id)
            .maybeSingle();

          const metadata = supabaseUser.user_metadata || {};

          const googleFullName = metadata.full_name || metadata.name || '';
          const fallbackFirstName = googleFullName.split(' ')[0] || '';
          const fallbackLastName = googleFullName.split(' ').slice(1).join(' ') || '';

          const updatedUser = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
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
            photoUrl: metadata.photo_url || metadata.avatar_url || null,
            avatarChangesThisMonth: metadata.avatar_changes_this_month || 0,
            lastAvatarChangeMonth: metadata.last_avatar_change_month || '',
            ds160FullName: metadata.ds160_full_name || null,
            ds160PassportNum: metadata.ds160_passport_num || null,
            ds160BirthDate: metadata.ds160_birth_date || null,
            ds160PurposeOfTrip: metadata.ds160_purpose_of_trip || null,
            ds160HasAssets: metadata.ds160_has_assets ?? true,
            ds160Confirmed: metadata.ds160_confirmed || false,
            expedienteStatus: metadata.expediente_status || 'draft',
            role: (profileData?.role as typeof ROLES[keyof typeof ROLES]) || metadata.role || ROLES.USER,
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
            console.log("Syncing auth store state with Supabase Auth user metadata.");
            setTimeout(() => {
              setUser(updatedUser);
              // Hydrate local DS-160 state from remote metadata
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
        console.error("Failed to sync user session with Supabase:", err);
      }
    };

    syncWithSupabase();
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
        if (user.role === ROLES.AGENT) {
          const { data: memberData } = await supabase
            .from("agency_members")
            .select("agency_id")
            .eq("member_id", user.id)
            .maybeSingle();
          if (memberData) {
            agencyId = memberData.agency_id;
          }
        }

        const targetUserId = agencyId || user.id;

        // Query partner application (by user_id first, then by email fallback if no agencyId)
        let data = null;
        const { data: idData, error: idError } = await supabase
          .from("agent_applications")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (idData) {
          data = idData;
        }

        if ((!data || idError) && !agencyId && user.email) {
          const { data: emailData } = await supabase
            .from("agent_applications")
            .select("*")
            .eq("email", user.email)
            .maybeSingle();
          if (emailData) {
            data = emailData;
          }
        }

        if (data) {
          setPartnerApp(data);
        }

        // If current user is admin/moderator, fetch all applications
        const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR;
        if (isAdmin) {
          const { data: allData, error: allErr } = await supabase
            .from("agent_applications")
            .select("*")
            .order("created_at", { ascending: false });

          if (allData) {
            setAllApplications(allData);
          } else if (allErr) {
            console.error("Error loading all agent applications:", allErr.message);
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

  // Admin action handlers: approve, reject, save comments
  const handleAdminAction = async (appId: string, action: "approved" | "rejected" | "comment_only") => {
    if (!user || !selectedApp) return;
    setIsSavingAdmin(true);

    const newStatus = action === "comment_only" ? selectedApp.status : action;
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
      const { error } = await supabase
        .from("agent_applications")
        .update(updatePayload)
        .eq("id", appId);

      if (error) {
        console.error("Error in admin action:", error.message);
        showToast("Error al guardar los cambios en la base de datos.", "error");
      } else {
        showToast(
          action === "approved"
            ? "¡Solicitud aprobada con éxito!"
            : action === "rejected"
              ? "Solicitud rechazada/devuelta."
              : "Comentarios guardados con éxito.",
          "success"
        );

        // When approved, upgrade the applicant's role based on application type
        if (action === "approved" && selectedApp?.user_id) {
          const applicantType = selectedApp.application_type || "individual";
          const newRole = applicantType === "agency" ? ROLES.AGENCY : ROLES.AGENT;
          await supabase
            .from("profiles")
            .update({ role: newRole })
            .eq("id", selectedApp.user_id);
        }

        // Update selected app locally
        setSelectedApp((prev: AgentApplicationData | null) => prev ? ({
          ...prev,
          ...updatePayload,
        }) : null);

        // Refresh entire application list from DB to reflect latest state
        const { data: refreshedApps } = await supabase
          .from("agent_applications")
          .select("*")
          .order("created_at", { ascending: false });
        if (refreshedApps) setAllApplications(refreshedApps);

        // Update partnerApp if the admin is reviewing their own application
        if (partnerApp && partnerApp.id === appId) {
          setPartnerApp((prev: AgentApplicationData | null) => prev ? ({
            ...prev,
            ...updatePayload,
          }) : null);
        }
      }
    } catch (err) {
      console.error("Unexpected error saving admin changes:", err);
      showToast("Error inesperado al guardar los cambios.", "error");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Auto-switch to agent portal tab when user role is agent/agency
  useEffect(() => {
    if (user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY)) {
      const t = setTimeout(() => setActiveTab("portal_agente"), 0);
      return () => clearTimeout(t);
    }
  }, [user?.role]);

  // Fetch agent commissions from Supabase
  const loadCommissions = async () => {
    if (!user) return;
    setIsLoadingCommissions(true);
    try {
      const { data, error } = await supabase
        .from("agent_commissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("agency_members")
        .select("*, profile:member_id(first_name, last_name, email)")
        .eq("agency_id", user.id);
      if (error) throw error;
      setAgencyMembers(data || []);
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
      const { data, error } = await supabase
        .from("agency_invitations")
        .select("*")
        .eq("agency_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAgencyInvitations(data || []);
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
      // Generate a simple hex token of 32 characters
      const randomArr = new Uint8Array(16);
      crypto.getRandomValues(randomArr);
      const token = Array.from(randomArr).map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from("agency_invitations")
        .insert({
          agency_id: user.id,
          email: inviteEmail.trim().toLowerCase(),
          token,
          status: "pending"
        });

      if (error) throw error;

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

  // Trigger loads when activeTab changes
  useEffect(() => {
    if (activeTab === "portal_agente" && user) {
      const timer = setTimeout(() => {
        loadCommissions();
        if (user.role === ROLES.AGENCY) {
          loadAgencyMembers();
          loadAgencyInvitations();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, user?.id, user?.role]);

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

  // Fetch real physical purchases and VIPRO evaluations from SQL tables
  useEffect(() => {
    if (!user) return;
    const fetchDbRecords = async () => {
      try {
        const { data: purchases, error: purchaseError } = await supabase
          .from("user_purchases")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!purchaseError && purchases) {
          setDbPurchases(purchases);
        }

        const { data: evaluations, error: evalError } = await supabase
          .from("vipro_evaluations")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .order("created_at", { ascending: false });

        if (!evalError && evaluations && evaluations.length > 0) {
          setViproEvaluations(evaluations);
        } else if (user.viproCompleted) {
          setViproEvaluations([
            {
              id: "vipro-fallback",
              destination_country: user.viproDestination || "US",
              score: user.viproScore || 85,
              created_at: new Date().toISOString(),
            }
          ]);
        }

        // If records exist, dynamically sync store flags too
        if (purchases && purchases.length > 0) {
          const hasViproPaid = purchases.some(p => p.product_type === "vipro" && p.status === "completed");
          const hasAdvisorPaid = purchases.some(p => p.product_type === "advisor" && p.status === "completed");
          const activeAdvisor = purchases.find(p => p.product_type === "advisor" && p.status === "completed");

          if (hasViproPaid !== user.hasPaidVipro || hasAdvisorPaid !== user.hasPaidAdvisor) {
            setUser({
              ...user,
              hasPaidVipro: hasViproPaid || hasAdvisorPaid,
              hasPaidAdvisor: hasAdvisorPaid,
              assignedAgentId: activeAdvisor?.agent_id || user.assignedAgentId
            });
          }
        }
      } catch (err) {
        console.error("Failed to load user purchases from DB:", err);
      }
    };
    fetchDbRecords();
  }, [user?.id, activeTab]);

  // Load messages from Supabase (or use default mock if database is not configured)
  const [isSupabaseDbAvailable, setIsSupabaseDbAvailable] = useState<boolean | null>(null);

  const prepopulateMockMessages = () => {
    if (!user) return;
    const agentName = assignedAgent?.name || "Sofía Rodríguez";
    const localKey = `mock_messages_${user.id}`;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMessages(parsed.map((m: { id: string; text: string; sender: string; timestamp: string }) => ({ ...m, timestamp: new Date(m.timestamp) })));
          return;
        } catch (e) {
          console.error("Failed to parse stored mock messages:", e);
        }
      }
    }

    let initialMsgs = [];
    if (user?.hasCompletedVipro) {
      initialMsgs = [
        {
          id: "msg-1",
          sender: "agent",
          text: `¡Hola, ${firstName || user?.firstName || "cliente"}! Soy ${agentName}, tu asesora certificada asignada para tu trámite de visa a Estados Unidos. (Modo Simulado)`,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "msg-2",
          sender: "agent",
          text: `He revisado el resultado de tu Evaluación Diagnóstica VIPRO y contamos con un perfil muy sólido. Nuestro chat de soporte estará activo a lo largo de todo tu trámite y hasta después de tu decisión consular.\n\n¿Qué día y hora te vendría bien para que programemos nuestra primera llamada por Zoom?`,
          timestamp: new Date(Date.now() - 3500000),
        }
      ];
    } else {
      initialMsgs = [
        {
          id: "msg-1",
          sender: "agent",
          text: `¡Hola, ${firstName || user?.firstName || "cliente"}! Soy ${agentName}, tu asesora certificada asignada para tu trámite de visa a Estados Unidos. (Modo Simulado)`,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "msg-2",
          sender: "agent",
          text: `Veo que ya has contratado la asesoría, pero aún no has completado la Evaluación Diagnóstica VIPRO. \n\nPor favor, completa la evaluación en la pestaña "Seguimiento de Trámite" para que pueda analizar tu caso con precisión y preparemos nuestra primera sesión por Zoom. ¡Nuestro chat de soporte estará disponible durante todo el proceso y hasta después de tu decisión consular!`,
          timestamp: new Date(Date.now() - 3500000),
        }
      ];
    }
    setMessages(initialMsgs);
    if (typeof window !== "undefined") {
      localStorage.setItem(localKey, JSON.stringify(initialMsgs));
    }
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
          // Prepopulate initial greeting message in DB
          try {
            const initialText = user.hasCompletedVipro
              ? `¡Hola, ${firstName || user?.firstName || "cliente"}! Soy ${assignedAgent?.name || "Sofía Rodríguez"}, tu asesora asignada. He revisado tu Evaluación VIPRO. Nuestro chat y soporte estarán disponibles en todo momento, desde el armado del expediente hasta después de tu entrevista consular para acompañarte en la resolución final.`
              : `¡Hola, ${firstName || user?.firstName || "cliente"}! Soy ${assignedAgent?.name || "Sofía Rodríguez"}, tu asesora asignada. Veo que ya contrataste la asesoría pero aún no has completado la Evaluación Diagnóstica VIPRO. Por favor, complétala en la pestaña "Seguimiento de Trámite" para poder analizar tu caso. ¡Nuestro chat y soporte estarán disponibles en todo momento, desde el armado del expediente hasta después de tu decisión consular!`;

            const initialMsg = await MessageClientService.createMessage({
              sender: "agent",
              text: initialText,
              user_id: user.id,
              agent_id: assignedAgent?.id || "sofia",
            });
            setMessages([
              {
                id: initialMsg.id,
                sender: initialMsg.sender,
                text: initialMsg.text,
                timestamp: initialMsg.timestamp ? new Date(initialMsg.timestamp) : new Date(),
              }
            ]);
          } catch (insertError) {
            console.error("Failed to insert initial message:", insertError);
            prepopulateMockMessages();
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("API messages fetch error. Falling back to simulated chat:", msg);
        setIsSupabaseDbAvailable(false);
        prepopulateMockMessages();
      }
    };

    fetchMessages();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`room:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => {
          const newMsg = payload.new;
          // Filter messages belonging to this user
          if (newMsg.user_id !== user.id) return;

          // Avoid duplicate messages
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                sender: newMsg.sender,
                text: newMsg.text,
                timestamp: newMsg.timestamp ? new Date(newMsg.timestamp) : new Date(),
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.hasPaidAdvisor, user?.assignedAgentId]);

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
      <div className="min-h-screen w-full flex flex-col bg-background-main">
        <Header headerRef={headerRef} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
        </div>
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
      const { error } = await supabase
        .from("agency_invitations")
        .update({ status: "expired" })
        .eq("id", realInvitation.id);

      if (error) throw error;

      setRealInvitation(null);
      showToast("Invitación rechazada.", "info");
    } catch (err: any) {
      console.error("Error declining invitation:", err);
      showToast("Error al rechazar invitación: " + err.message, "error");
    }
  };

  const handleAcceptInvitation = async () => {
    if (user && realInvitation) {
      try {
        const agencyName = `${realInvitation.agency.first_name} ${realInvitation.agency.last_name}`.trim();
        
        // 1. Update status to accepted
        const { data: updatedInv, error: invErr } = await supabase
          .from("agency_invitations")
          .update({ status: "accepted" })
          .eq("id", realInvitation.id)
          .select();

        if (invErr) throw invErr;

        if (!updatedInv || updatedInv.length === 0) {
          throw new Error("No se pudo actualizar el estado de la invitación en la base de datos (0 filas afectadas). Esto suele suceder debido a las políticas de Row Level Security (RLS) en la tabla 'agency_invitations'. Por favor, asegúrate de aplicar las políticas correspondientes.");
        }

        // 2. Insert into agency_members
        const { error: memberErr } = await supabase
          .from("agency_members")
          .insert({
            agency_id: realInvitation.agency_id,
            member_id: user.id,
            member_role: "consultant"
          });
        
        if (memberErr) {
          if (memberErr.message && memberErr.message.includes("violates row-level security policy")) {
            throw new Error("No tienes permisos para unirte a la agencia en la base de datos. Por favor, asegúrate de aplicar la política de RLS correspondiente en la tabla 'agency_members'.");
          }
          throw memberErr;
        }

        // 3. Update local auth state
        const updated = {
          ...user,
          role: "agent",
          assignedAgencyName: agencyName
        };
        setUser(updated);
        setRealInvitation(null);

        // 4. Update Supabase auth user metadata & profiles table
        await supabase.auth.updateUser({
          data: {
            role: "agent",
            assigned_agency_name: agencyName
          }
        });

        const { error: dbProfileErr } = await supabase
          .from("profiles")
          .update({
            role: "agent"
          })
          .eq("id", user.id);
        if (dbProfileErr) throw dbProfileErr;
        
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
        
        await supabase.auth.updateUser({
          data: {
            assigned_agent_id: "agent-7",
            assigned_agency_name: "Agency with Agent"
          }
        });

        // Assignment is successfully persisted in auth user metadata & local state above

        const text = `🏢 Sistema Agency with Agent: Se ha asignado oficialmente al asesor experto Lic. Roberto Castaneda para liderar tu proceso de visado. ¡Hola! Estaré a cargo de tu expediente desde este momento.`;
        const welcomeMsg = {
          id: `sys-${Date.now()}`,
          sender: "agent" as const,
          text,
          timestamp: new Date()
        };

        // Persist message via Supabase message client service if enabled
        const localKey = `mock_messages_${user.id}`;
        if (isSupabaseDbAvailable) {
          try {
            await MessageClientService.createMessage({
              sender: "agent",
              text,
              user_id: user.id,
              agent_id: "agent-7"
            });
          } catch (msgErr) {
            console.error("Failed to persist welcome message to Supabase chat:", msgErr);
          }
        }
        
        // Always write to local storage backup for offline consistency
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
      
      const { error } = await supabase
        .from("agency_invitations")
        .insert({
          agency_id: user.id,
          email: email,
          token: token,
          status: "pending"
        });

      if (error) throw error;

      showToast(`¡Invitación enviada con éxito a ${email}!`, "success");
      setInviteEmailInput("");
      setInviteNameInput("");
      
      // If we invited ourselves (e.g. for testing purposes), reload invitations
      if (user && user.email.trim().toLowerCase() === email) {
        let invitationData = null;
        const { data, error } = await supabase
          .from("agency_invitations")
          .select("*, agency:profiles!agency_id(id, first_name, last_name, email, photo_url, phone, bio, location, staff_size)")
          .eq("email", user.email.trim().toLowerCase())
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (error) {
          if (error.message && (error.message.includes("column") || error.code === "P0002")) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("agency_invitations")
              .select("*, agency:profiles!agency_id(id, first_name, last_name, email)")
              .eq("email", user.email.trim().toLowerCase())
              .eq("status", "pending")
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (fallbackError) {
              console.error("Error loading B2B invitation (fallback):", fallbackError.message);
            } else if (fallbackData) {
              invitationData = fallbackData;
            }
          }
        } else if (data) {
          invitationData = data;
        }

        if (invitationData) {
          setRealInvitation(invitationData);
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
      // Also update the database profiles table
      const profileDataToSave: any = {
        id: user!.id,
        email: user!.email,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      };

      // Attempt upsert with all details
      let { error: dbProfileErr } = await supabase
        .from("profiles")
        .upsert({
          ...profileDataToSave,
          photo_url: user?.photoUrl || null,
          phone: phone || null
        });

      if (dbProfileErr && (dbProfileErr.message.includes("column") || dbProfileErr.code === "P0002")) {
        // Fallback upsert if columns do not exist yet in SQL schema
        const { error: fallbackErr } = await supabase
          .from("profiles")
          .upsert(profileDataToSave);
        dbProfileErr = fallbackErr;
      }

      if (dbProfileErr) {
        console.warn("Could not save profile details to public.profiles table:", dbProfileErr.message);
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          country: countryCode,
        }
      });
      if (error) {
        console.warn("Could not save profile metadata to Supabase auth:", error.message);
        showToast("¡Cambios guardados localmente! No se pudo sincronizar en la nube.", "info");
      } else {
        showToast("¡Cambios guardados con éxito!", "success");
      }
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
          agent_id: assignedAgent?.id || "sofia",
        });
      } catch (err: any) {
        console.error("Failed to send message via API:", err.message);
        // Save to local backup in case of server failures
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

    setIsTyping(true);

    // Dynamic, high-fidelity simulated typing from the advisor
    setTimeout(async () => {
      let responseText = "";
      const userText = textToSend.toLowerCase();

      if (userText.includes("hola") || userText.includes("buenas") || userText.includes("buen")) {
        responseText = `¡Hola de nuevo, ${firstName}! Estoy atenta a tus mensajes. ¿Te gustaría que programemos nuestra primera llamada por Zoom para revisar tus documentos?`;
      } else if (userText.includes("documento") || userText.includes("requisito") || userText.includes("papel") || userText.includes("solvencia")) {
        responseText = "Para tu visa de turismo (B1/B2), necesitaremos preparar: Pasaporte vigente, confirmación del formulario DS-160, comprobante de pago de arancel consular ($185 USD) y pruebas de arraigo en El Salvador (como constancia de trabajo, estados de cuenta bancarios o títulos de propiedad). En nuestra primera sesión analizaremos cómo presentarlos de la mejor manera.";
      } else if (userText.includes("fecha") || userText.includes("cuando") || userText.includes("cita") || userText.includes("tiempo")) {
        responseText = "Las citas en la embajada se programan una vez que paguemos el arancel consular. Actualmente hay cierta lista de espera, pero monitoreo el sistema a diario para pescar citas adelantadas en el CAS. En nuestra reunión definiremos las mejores fechas posibles.";
      } else if (userText.includes("ds160") || userText.includes("ds-160") || userText.includes("formulario")) {
        responseText = "Yo me encargaré de auditar y rellenar tu formulario DS-160 con la información que recolectemos. Es de vital importancia que coincida exactamente con lo que diremos en la entrevista para evitar contradicciones.";
      } else if (userText.includes("pregunta") || userText.includes("duda") || userText.includes("hacerle") || userText.includes("responder") || userText.includes("consult")) {
        responseText = `¡Claro que sí, ${firstName}! Puedes hacerme todas las preguntas y consultas que necesites por este chat en cualquier momento. Estoy aquí para resolver cualquier duda sobre tu DS-160, tu documentación de soporte o el simulacro de entrevista.`;
      } else if (userText.includes("hasta") || userText.includes("duracion") || userText.includes("embajada") || userText.includes("consular") || userText.includes("despues")) {
        responseText = "Nuestro chat y soporte de asesoría estarán completamente disponibles a lo largo de todo tu trámite: el armado de tu expediente, la preparación de la carpeta, los simulacros de entrevista, e incluso después de tu cita consular para dar seguimiento a la resolución final y entrega de pasaporte.";
      } else if (userText.includes("gracias") || userText.includes("excelente") || userText.includes("perfecto")) {
        responseText = "¡Con gusto! Mi meta es que vayas al consulado con 100% de confianza. Avísame cuando estés listo para agendar la llamada.";
      } else {
        responseText = `Entendido, ${firstName}. Tomo nota de lo que me comentas. Voy a analizarlo para diseñar la estrategia ideal para tu perfil. ¿Prefieres que agendemos nuestra llamada de diagnóstico inicial para mañana en la tarde o prefieres el fin de semana?`;
      }

      if (isSupabaseDbAvailable) {
        try {
          await MessageClientService.createMessage({
            sender: "agent",
            text: responseText,
            user_id: user.id,
            agent_id: assignedAgent?.id || "sofia",
          });
        } catch (err: any) {
          console.error("Failed to insert agent reply via API:", err.message);
          const newAgentMsg = {
            id: `msg-${Date.now() + 1}`,
            sender: "agent",
            text: responseText,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const updated = [...prev, newAgentMsg];
            if (typeof window !== "undefined") {
              localStorage.setItem(localKey, JSON.stringify(updated));
            }
            return updated;
          });
        }
      } else {
        const newAgentMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: "agent",
          text: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const updated = [...prev, newAgentMsg];
          if (typeof window !== "undefined") {
            localStorage.setItem(localKey, JSON.stringify(updated));
          }
          return updated;
        });
      }
      setIsTyping(false);
    }, 1500);
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
            {user?.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.photoUrl}
                alt="Foto de Perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-3xl">{firstName.charAt(0).toUpperCase()}</span>
            )}
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 mb-1.5">Panel del Aplicante</p>
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

                // --- Tabs for approved agents / agencies ---
                if (isAgent) {
                  return [
                    { id: "datos", label: "Mis Datos", icon: "👤" },
                    { id: "portal_agente", label: user.role === ROLES.AGENCY ? "Portal Empresa" : "Portal Agente", icon: "🏢" },
                    { id: "solicitud", label: "Mi Acreditación", icon: "🏅" },
                  ];
                }

                // --- Tabs for admin / moderator ---
                if (isStaff) {
                  return [
                    { id: "datos", label: "Mis Datos Personales", icon: "👤" },
                    { id: "admin_socios", label: user.role === ROLES.MODERATOR ? "Moderador de Socios 🛡️" : "Administrar Socios 🛠️", icon: "⚙️" },
                  ];
                }

                // --- Default tabs for regular users ---
                return [
                  { id: "datos", label: "Mis Datos Personales", icon: "👤" },
                  { id: "proceso", label: "Seguimiento de Trámite", icon: "✈️" },
                  { id: "vipro", label: "Evaluación VIPRO", icon: "📊" },
                  { id: "asesor", label: "Mi Asesor Asignado", icon: "🤝" },
                  { id: "pagos", label: "Pagos y Comprobantes", icon: "💳" },
                  ...(partnerApp ? [{ id: "solicitud", label: "Mi Solicitud de Socio", icon: "💼" }] : []),
                ];
              })().map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm text-left transition-colors focus:outline-none ${activeTab === tab.id
                      ? "bg-brand-light text-brand-primary font-semibold"
                      : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
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
                {realInvitation && user?.role !== "agent" && (
                  <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/80 rounded-[1.5rem] p-6 md:p-8 mb-8 shadow-sm animate-in fade-in duration-300 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping"></span>
                      <span className="text-[10px] font-extrabold tracking-widest text-blue-700 bg-blue-100/60 border border-blue-200/50 px-2 py-0.5 rounded uppercase">Invitación Corporativa Recibida</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          {realInvitation.agency.photo_url || realInvitation.agency.avatar_url ? (
                            <img
                              src={realInvitation.agency.photo_url || realInvitation.agency.avatar_url}
                              alt={`${realInvitation.agency.first_name} ${realInvitation.agency.last_name}`}
                              className="w-14 h-14 rounded-xl object-cover shadow-md border border-blue-200"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-md border border-blue-500 font-serif">
                              {((realInvitation.agency.first_name?.[0] || "") + (realInvitation.agency.last_name?.[0] || "")).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-serif font-bold text-text-primary text-xl">
                              {realInvitation.agency.first_name} {realInvitation.agency.last_name}
                            </h4>
                            <p className="text-[11px] font-semibold text-text-secondary">🏢 Agencia de Viajes y Asesoría Consular B2B</p>
                          </div>
                        </div>

                        <div className="bg-white/60 border border-blue-100 rounded-xl p-4 text-xs space-y-3">
                          {realInvitation.agency.bio && (
                            <p className="text-text-secondary leading-relaxed">
                              <strong>Acerca de la empresa:</strong> {realInvitation.agency.bio}
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-secondary pt-2 border-t border-blue-100/60">
                            <div><strong>✉️ Correo:</strong> {realInvitation.agency.email}</div>
                            {realInvitation.agency.phone && (
                              <div><strong>📞 Teléfono:</strong> {realInvitation.agency.phone}</div>
                            )}
                            {realInvitation.agency.location && (
                              <div><strong>📍 Ubicación:</strong> {realInvitation.agency.location}</div>
                            )}
                            {realInvitation.agency.staff_size && (
                              <div><strong>👥 Staff:</strong> {realInvitation.agency.staff_size} asesores certificados</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Beneficios de unirte a su equipo:</p>
                          <ul className="text-xs text-text-secondary space-y-1 pl-1">
                            <li className="flex items-center gap-2">🔹 <span>Aparecerás en el buscador público de asesores respaldado por su firma.</span></li>
                            <li className="flex items-center gap-2">🔹 <span>Acceso a los expedientes consulares asignados por la empresa.</span></li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto md:min-w-[140px] pt-4 md:pt-0">
                        <button
                          onClick={handleAcceptInvitation}
                          className="flex-1 md:w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer text-center"
                        >
                          Aceptar Invitación
                        </button>
                        <button
                          onClick={handleDeclineInvitation}
                          className="flex-1 md:w-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-center"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Simulator Form for sending invitations */}
                <div className="mt-12 pt-8 border-t border-border-light max-w-xl">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Simulador B2B: Invitar a un Asesor</h3>
                  <p className="text-xs text-text-secondary mb-4">
                    Envía una invitación formal de parte de <strong>Agency with Agent</strong> a cualquier usuario por su correo electrónico. Si ese usuario entra a su panel, verá la invitación para unirse como asesor certificado de la empresa.
                  </p>
                  
                  <form onSubmit={handleSendInvitation} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nombre del Asesor</label>
                        <input
                          type="text"
                          value={inviteNameInput}
                          onChange={(e) => setInviteNameInput(e.target.value)}
                          placeholder="Ej. Daniel Hernández"
                          className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Correo del Asesor</label>
                        <input
                          type="email"
                          value={inviteEmailInput}
                          onChange={(e) => setInviteEmailInput(e.target.value)}
                          placeholder="Ej. danielhrndz38@gmail.com"
                          className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                    >
                      ✉️ Enviar Invitación Corporativa
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: SEGUIMIENTO DE TRÁMITE */}
            {activeTab === "proceso" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Seguimiento de Trámite de Visa</h2>
                  <p className="text-xs text-text-secondary mt-1">Monitorea el avance de tu expediente consular paso a paso.</p>
                </div>

                {/* Banner de Oferta de Servicios (si no hay nada comprado) */}
                {!user.hasPaidVipro && !user.hasPaidAdvisor && (
                  <div className="mb-8 bg-brand-light/40 border border-brand-primary/10 rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full">
                        Comienza tu Trámite Hoy
                      </span>
                      <h3 className="text-xl font-bold text-text-primary">
                        Habilita tu seguimiento de visa
                      </h3>
                      <p className="text-xs text-text-secondary max-w-md leading-relaxed">
                        Para desbloquear los pasos del seguimiento, el llenado del formulario DS-160 y los simulacros, debes adquirir uno de nuestros servicios profesionales.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <button
                        onClick={() => router.push("/vipro-form")}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all focus:outline-none shadow-sm text-center cursor-pointer font-sans"
                      >
                        Evaluación Express ($19.99 USD)
                      </button>
                      <button
                        onClick={() => router.push("/agents")}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-brand-primary text-brand-primary hover:bg-brand-light text-xs font-bold rounded-sm transition-all focus:outline-none text-center cursor-pointer font-sans"
                      >
                        Asesoría Premium ($150.00 USD)
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:right-auto before:w-0.5 before:bg-gray-200 mt-4">
                  {/* Paso 1 */}
                  <div className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 bg-background-main/30 border border-border-light rounded-md p-4">
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-text-primary">Paso 1: Creación de perfil y verificación</h4>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">COMPLETADO</span>
                      </div>
                      <p className="text-xs text-text-secondary">Tu cuenta ha sido creada exitosamente en TodoVisa y tu perfil está verificado.</p>
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div className="flex gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${(user.hasPaidAdvisor ? isPreformularioCompleted : user.viproCompleted) ? "bg-brand-primary text-white" : "bg-amber-500 text-white animate-pulse"
                      }`}>
                      {(user.hasPaidAdvisor ? isPreformularioCompleted : user.viproCompleted) ? "✓" : "2"}
                    </div>
                    <div className={`flex-1 rounded-md p-4 border ${(user.hasPaidAdvisor ? isPreformularioCompleted : user.viproCompleted) ? "bg-background-main/30 border-border-light" : "bg-white border-amber-200 shadow-sm"
                      }`}>
                      {user.hasPaidAdvisor ? (
                        /* Preformulario for Servicio Completo */
                        <>
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-text-primary">Paso 2: Preformulario</h4>
                            {isPreformularioCompleted ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">COMPLETADO</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">PENDIENTE DE COMPLETAR</span>
                            )}
                          </div>
                          {isPreformularioCompleted ? (
                            <p className="text-xs text-text-secondary">
                              Preformulario completado con éxito. Tu asesor ya cuenta con tus datos para el llenado oficial de tu solicitud de visa.
                            </p>
                          ) : (
                            <>
                              <p className="text-xs text-text-secondary mb-3">
                                Completa tu preformulario con tus datos personales, de contacto, laborales y familiares para que tu asesor pueda iniciar el llenado oficial de tu formulario DS-160.
                              </p>
                              <button
                                onClick={() => router.push("/preformulario")}
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none cursor-pointer"
                              >
                                Completar Preformulario
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        /* VIPRO Evaluation for Autonomía / Express */
                        <>
                          <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                            <h4 className="text-sm font-bold text-text-primary">Paso 2: Evaluación Diagnóstica VIPRO</h4>
                            {user.viproCompleted ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">CALIFICADO</span>
                            ) : user.hasPaidVipro ? (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">PENDIENTE DE COMPLETAR</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">PENDIENTE DE PAGO</span>
                            )}
                          </div>
                          {user.viproCompleted ? (
                            <>
                              <p className="text-xs text-text-secondary">
                                Evaluación realizada con éxito para destino: <span className="font-semibold text-text-primary">{user.viproDestination === "UK" ? "🇬🇧 Inglaterra" : "🇺🇸 Estados Unidos"}</span>.
                              </p>
                              <div className="mt-3 flex items-center gap-3 bg-brand-light/50 border border-blue-100 rounded p-2.5 w-max">
                                <span className="text-lg">📊</span>
                                <div>
                                  <p className="text-xs font-bold text-brand-primary">Puntaje Obtenido: {user.viproScore || 85}/100 ({(user.viproScore || 85) >= 80 ? "Favorable" : "Revisión Recomendada"})</p>
                                  <p className="text-[10px] text-text-secondary">Tu perfil cuenta con alta probabilidad. Recomendado continuar con llenado de DS-160.</p>
                                </div>
                              </div>
                              <div className="mt-3">
                                <button
                                  onClick={() => router.push(`/vipro-form/evaluation?country=${user.viproDestination || "US"}`)}
                                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none cursor-pointer"
                                >
                                  Ver Respuestas y Recomendaciones
                                </button>
                              </div>
                            </>
                          ) : user.hasPaidVipro ? (
                            <>
                              <p className="text-xs text-text-secondary mb-3">Has habilitado tu Evaluación VIPRO. Complétala ahora para conocer tu puntaje de perfilamiento consular.</p>
                              <button
                                onClick={() => router.push("/vipro-form")}
                                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none cursor-pointer"
                              >
                                Comenzar Evaluación VIPRO
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-text-secondary mb-3">La Evaluación VIPRO no es gratuita. Realiza el pago de $19.99 USD (o adquiere el Servicio Completo con Asesor) para habilitar tu cuestionario y conocer tus probabilidades.</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push("/vipro-form")}
                                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none cursor-pointer"
                                >
                                  Adquirir VIPRO ($19.99 USD)
                                </button>
                                <button
                                  onClick={() => router.push("/agents")}
                                  className="px-4 py-2 bg-white border border-brand-primary text-brand-primary text-xs font-bold rounded-sm hover:bg-brand-light transition-all focus:outline-none cursor-pointer"
                                >
                                  Ver Asesores
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="flex gap-4 relative transition-all">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${user.hasPaidAdvisor
                        ? "bg-brand-primary text-white"
                        : "bg-amber-500 text-white animate-pulse"
                      }`}>
                      {user.hasPaidAdvisor ? "✓" : "3"}
                    </div>
                    <div className={`flex-1 rounded-md p-4 border ${user.hasPaidAdvisor
                        ? "bg-background-main/30 border-border-light"
                        : "bg-white border-amber-200 shadow-sm"
                      }`}>
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-text-primary">Paso 3: Asignación de Agente Consular</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.hasPaidAdvisor
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                          {user.hasPaidAdvisor ? "COMPLETADO" : "ACCION REQUERIDA"}
                        </span>
                      </div>

                      {user.hasPaidAdvisor ? (
                        <div>
                          <p className="text-xs text-text-secondary">
                            Has asignado correctamente a tu asesor: <span className="font-semibold text-text-primary">{assignedAgent.name}</span>.
                          </p>
                          <button
                            onClick={() => setActiveTab("asesor")}
                            className="mt-3 text-xs text-brand-primary font-bold hover:underline"
                          >
                            Ir a mi Chat de Soporte &rarr;
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-text-secondary mb-3">
                            Selecciona un asesor consular de nuestra red certificada para guiar el armado de tu expediente.
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${expedienteStatus === 'approved'
                        ? "bg-emerald-500 text-white animate-none"
                        : user.hasPaidAdvisor
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-gray-200 text-text-muted"
                      }`}>
                      {expedienteStatus === 'approved' ? "✓" : "4"}
                    </div>
                    <div className={`flex-1 border rounded-md p-4 ${expedienteStatus === 'approved'
                        ? "bg-white border-emerald-200 shadow-sm"
                        : user.hasPaidAdvisor
                          ? "bg-white border-amber-200 shadow-sm"
                          : "bg-background-main/50 border-border-light"
                      }`}>
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className={`text-sm font-bold ${user.hasPaidAdvisor ? "text-text-primary" : "text-text-secondary"}`}>
                          Paso 4: Armado de Expediente y Formulario Consular
                        </h4>
                        {user.hasPaidAdvisor && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${expedienteStatus === 'approved'
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 animate-none"
                              : expedienteStatus === 'submitted'
                                ? "bg-blue-50 text-blue-800 border-blue-200 animate-pulse"
                                : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                            }`}>
                            {expedienteStatus === 'approved'
                              ? "COMPLETADO"
                              : expedienteStatus === 'submitted'
                                ? "EN AUDITORÍA"
                                : "EN PROGRESO"}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${user.hasPaidAdvisor ? "text-text-secondary" : "text-text-muted"}`}>
                        Llenado digital del formulario de visa y preparación de documentos de solvencia económica. Tu asesor te dará pautas por chat.
                      </p>

                      {user.hasPaidAdvisor && (
                        <div className="mt-4 pt-4 border-t border-border-light space-y-4">
                          <div>
                            <span className="text-xs font-bold text-text-primary uppercase tracking-wider block mb-1">
                              📂 Expediente Digital Consular
                            </span>
                            <span className="text-[11px] text-text-secondary block mb-3 leading-relaxed">
                              Carga los archivos requeridos para que tu asesora {assignedAgent.name} los audite antes de programar tu cita:
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
                                        if (file) handleFileUpload('passport', file.name);
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
                                        if (file) handleFileUpload('dui', file.name);
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
                                        if (file) handleFileUpload('workCert', file.name);
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
                                        if (file) handleFileUpload('bankStatements', file.name);
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
                                📝 Formulario Consular DS-160
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${ds160Confirmed ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-amber-100 border-amber-200 text-amber-800"
                                }`}>
                                {ds160Confirmed ? "Confirmado" : "Pendiente de Revisión"}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-900/90 leading-relaxed mb-3">
                              Debes auditar y ratificar tu información de solicitud consular para que tu asesor procese el llenado final en la plataforma del Departamento de Estado.
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
                              className={`w-full py-3 text-xs font-bold rounded-sm transition-all shadow-sm ${expedienteStatus === 'submitted'
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                                  : expedienteStatus === 'approved'
                                    ? "bg-emerald-600 text-white cursor-not-allowed"
                                    : "bg-brand-primary hover:bg-brand-hover text-white cursor-pointer"
                                }`}
                            >
                              {expedienteStatus === 'submitted'
                                ? "⏳ Expediente en Auditoría por tu Asesor"
                                : expedienteStatus === 'approved'
                                  ? "✅ Expediente Aprobado y DS-160 Cerrado"
                                  : "🚀 Enviar Expediente Completo a Auditoría"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Paso 5 */}
                  {preformMetadata?.interview_waiver_eligible === true ? (
                    /* Paso 5 para Exención de Entrevista */
                    <div className={`flex gap-4 relative transition-all ${expedienteStatus === 'approved' ? "" : "opacity-60"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${expedienteStatus === 'approved' ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-text-muted"
                        }`}>
                        5
                      </div>
                      <div className={`flex-1 rounded-md p-4 border ${expedienteStatus === 'approved' ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"
                        }`}>
                        <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                          <h4 className={`text-sm font-bold ${expedienteStatus === 'approved' ? "text-text-primary" : "text-text-secondary"}`}>
                            Paso 5: Programación de Entrega y Preparación de Carpeta
                          </h4>
                          {expedienteStatus === 'approved' && (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                              LISTO PARA AGENDAR
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${expedienteStatus === 'approved' ? "text-text-secondary" : "text-text-muted"}`}>
                          Obtención de confirmación de exención (Waiver Letter) y programación para depositar tu expediente en la oficina autorizada (CAS o sucursal de Courier autorizada). Ponte en contacto con tu asesor por el chat para coordinar este paso.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Paso 5 Estándar */
                    <div className={`flex gap-4 relative transition-all ${expedienteStatus === 'approved' ? "" : "opacity-60"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${expedienteStatus === 'approved' ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-text-muted"
                        }`}>
                        5
                      </div>
                      <div className={`flex-1 rounded-md p-4 border ${expedienteStatus === 'approved' ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"
                        }`}>
                        <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                          <h4 className={`text-sm font-bold ${expedienteStatus === 'approved' ? "text-text-primary" : "text-text-secondary"}`}>
                            Paso 5: Programación de Cita y Simulacro Consular
                          </h4>
                          {expedienteStatus === 'approved' && (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                              LISTO PARA AGENDAR
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${expedienteStatus === 'approved' ? "text-text-secondary" : "text-text-muted"}`}>
                          Obtención de fechas en el CAS / Embajada y entrenamiento intensivo con tu asesor. Ponte en contacto con tu asesor por el chat para coordinar los horarios de simulación en Zoom.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Paso 6 */}
                  {preformMetadata?.interview_waiver_eligible === true ? (
                    /* Paso 6 para Exención de Entrevista */
                    <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                        6
                      </div>
                      <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4">
                        <h4 className="text-sm font-bold text-text-secondary mb-1">Paso 6: Depósito de Documentos (CAS / Buzón Courier)</h4>
                        <p className="text-xs text-text-muted">Entrega física de tu pasaporte actual, visa anterior, fotografía 5x5 cm fondo blanco y confirmación de exención en la oficina autorizada.</p>
                      </div>
                    </div>
                  ) : (
                    /* Paso 6 Estándar */
                    <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                        6
                      </div>
                      <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4">
                        <h4 className="text-sm font-bold text-text-secondary mb-1">Paso 6: Entrevista Consular (Presentación y Decisión)</h4>
                        <p className="text-xs text-text-muted">Asistencia a la Embajada para la entrevista formal con el oficial consular.</p>
                      </div>
                    </div>
                  )}

                  {/* Paso 7 */}
                  {preformMetadata?.interview_waiver_eligible === true ? (
                    /* Paso 7 para Exención de Entrevista */
                    <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                        7
                      </div>
                      <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4">
                        <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                          <h4 className="text-sm font-bold text-text-secondary">Paso 7: Retorno de Pasaporte y Monitoreo de Visa</h4>
                          {user?.hasPaidAdvisor && (
                            <span className="bg-brand-light text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                              SIEMPRE ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">Seguimiento de la emisión de tu visa renovada y monitoreo de la devolución de tu pasaporte físico a la sucursal de envío seleccionada.</p>
                      </div>
                    </div>
                  ) : (
                    /* Paso 7 Estándar */
                    <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                        7
                      </div>
                      <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4">
                        <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                          <h4 className="text-sm font-bold text-text-secondary">Paso 7: Soporte Post-Entrevista y Siguientes Pasos</h4>
                          {user?.hasPaidAdvisor && (
                            <span className="bg-brand-light text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                              SIEMPRE ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">Seguimiento tras la resolución de tu visa. Tu asesor certificado seguirá disponible por chat para orientarte en la logística o siguientes trámites.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: EVALUACION VIPRO */}
            {activeTab === "vipro" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light text-left">
                  <h2 className="text-lg font-bold text-text-primary">Evaluación de Viabilidad VIPRO</h2>
                  <p className="text-xs text-text-secondary mt-1">Análisis automatizado de probabilidad y recomendaciones de perfilamiento consular.</p>
                </div>

                {user.viproCompleted ? (
                  <div className="space-y-6 text-left">
                    <div className="bg-gradient-to-r from-emerald-50/50 to-white rounded-2xl border border-emerald-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold shadow-inner">
                          📊
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary text-base">Evaluación Calificada</h3>
                          <p className="text-xs text-text-secondary mt-0.5">Destino: <span className="font-semibold text-text-primary">{user.viproDestination === "UK" ? "🇬🇧 Inglaterra" : "🇺🇸 Estados Unidos"}</span></p>
                        </div>
                      </div>
                      <div className="bg-white px-5 py-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Puntaje</p>
                          <p className="text-2xl font-black text-emerald-600">{user.viproScore || 85}/100</p>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase border ${(user.viproScore || 85) >= 80
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                          {(user.viproScore || 85) >= 80 ? "Favorable" : "Revisión"}
                        </span>
                      </div>
                    </div>



                    {/* Evaluations history table */}
                    {viproEvaluations.length > 0 && (
                      <div className="pt-4">
                        <h4 className="font-bold text-text-primary text-sm uppercase tracking-wider mb-4">Historial de Intentos</h4>
                        <div className="overflow-x-auto border border-border-light rounded-xl bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border-light text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#FAF9F6]">
                                <th className="py-3 px-4">Destino</th>
                                <th className="py-3 px-4">Fecha</th>
                                <th className="py-3 px-4">Calificación</th>
                                <th className="py-3 px-4 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light text-xs">
                              {viproEvaluations.map((evaluation) => {
                                const countryEmoji = evaluation.destination_country === "UK" ? "🇬🇧" : "🇺🇸";
                                const countryName = evaluation.destination_country === "UK" ? "Reino Unido" : "Estados Unidos";
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
                                      {evaluation.score || 85} / 100
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                      <button
                                        onClick={() => router.push(`/vipro-form/evaluation?country=${evaluation.destination_country}`)}
                                        className="text-brand-primary hover:underline hover:text-brand-hover font-semibold transition-colors font-sans"
                                      >
                                        Ver
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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
                  <div className="bg-white rounded-3xl border border-border-light p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center text-center gap-5 max-w-xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center text-2xl font-bold border border-brand-primary/10">
                      🔒
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-base mb-1">Evaluación VIPRO Bloqueada</h3>
                      <p className="text-xs text-text-secondary leading-relaxed mb-6">
                        La evaluación de viabilidad pre-consular VIPRO analiza a profundidad tu lazo familiar, laboral y solvencia con recomendaciones personalizadas. Habilítala ahora adquiriendo tu acceso.
                      </p>
                      <button
                        onClick={() => router.push("/vipro-form")}
                        className="bg-brand-primary hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-lg transition-all focus:outline-none shadow-md cursor-pointer text-xs"
                      >
                        Adquirir Evaluación Express ($19.99 USD)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* TAB: MI ASESOR */}
            {activeTab === "asesor" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Tu Asesor Consular Asignado</h2>
                  <p className="text-xs text-text-secondary mt-1">Aquí verás al experto que guiará todo tu proceso de visado.</p>
                </div>

                {user.hasPaidAdvisor ? (
                  false ? (
                    // Cuestionario VIPRO no completado todavía (puenteado para permitir hablar con el asesor en todo el proceso)
                    <div className="bg-white rounded-[2rem] border border-amber-200 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center text-center gap-5 max-w-xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom duration-300">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl font-bold border border-amber-200 animate-pulse">
                        📊
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-base mb-1">Evaluación VIPRO Requerida</h3>
                        <p className="text-xs text-text-secondary leading-relaxed mb-6">
                          Para iniciar la asesoría y chatear con <strong>{assignedAgent.name}</strong>, primero debes completar la Evaluación Diagnóstica VIPRO. Tu asesor necesita analizar tus respuestas y tu puntaje de viabilidad para guiar tu caso de forma personalizada.
                        </p>
                        <button
                          onClick={() => router.push("/vipro-form")}
                          className="bg-brand-primary hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors text-xs focus:outline-none shadow-sm cursor-pointer"
                        >
                          Realizar Evaluación VIPRO Ahora
                        </button>
                      </div>
                    </div>
                  ) : assignedAgent.partnerType === "b2b_agency_entity" || !user.assignedAgentId ? (
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

                      {/* Advisor Info Bar */}
                      <div className="bg-gradient-to-r from-white to-[#FAF9F6] rounded-2xl border border-border-light p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-brand-primary/20 transition-all duration-300 flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative">
                          <img
                            src={assignedAgent.photo}
                            alt={assignedAgent.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                          />
                          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white bg-emerald-400"></span>
                        </div>
                        <div className="text-center sm:text-left flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                            <h5 className="font-bold text-text-primary text-base tracking-tight">{assignedAgent.name}</h5>
                            <span className="bg-[#FAF0E6] text-[#A0522D] text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-[#EEDC82]">ASESOR ASIGNADO</span>
                            {assignedAgent.partnerType === "b2b_agency" ? (
                              <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-blue-200" title={`Afiliado a ${assignedAgent.agencyName || user?.assignedAgencyName}`}>
                                🏢 AGENCIA B2B: {assignedAgent.agencyName || user?.assignedAgencyName}
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                                💼 ASESOR INDEPENDIENTE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-primary font-bold">{assignedAgent.title}</p>
                          <div className="flex items-center gap-3 justify-center sm:justify-start text-xs text-text-secondary">
                            <span className="flex items-center gap-1">⭐ <span className="font-semibold text-text-primary">{assignedAgent.rating.toFixed(1)}</span> ({assignedAgent.reviewsCount} reseñas)</span>
                            <span className="text-gray-300">•</span>
                            <span>Soporte 24/7 Activo</span>
                          </div>
                          {assignedAgent.partnerType === "b2b_agency" && (
                             <p className="text-[10px] text-blue-800 bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-1.5 mt-2 max-w-xl text-left leading-normal">
                               🛡️ <strong>Garantía de Doble Auditoría B2B:</strong> Tu expediente está respaldado institucionalmente. Antes de tu cita, un supervisor senior de <strong>{assignedAgent.agencyName || user?.assignedAgencyName}</strong> co-auditará tu formulario DS-160 y tu perfil.
                             </p>
                           )}
                        </div>
                      </div>

                      {/* Chat Window */}
                      <div className="border border-border-light rounded-2xl overflow-hidden flex flex-col h-[550px] bg-[#FAF9F6] shadow-sm relative">
                        {/* Chat Header */}
                        <div className="bg-white px-6 py-4 border-b border-border-light flex items-center justify-between shadow-sm z-10">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={assignedAgent.photo}
                                alt={assignedAgent.name}
                                className="w-10 h-10 rounded-full object-cover border border-border-light shadow-sm"
                              />
                              <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-text-primary text-sm leading-tight">{assignedAgent.name}</h4>
                              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                En línea • Especialista Consular
                              </p>
                            </div>
                          </div>
                          <div className="text-right hidden sm:flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#2C4A75] bg-blue-50 border border-blue-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Contrato Activo
                              </span>
                            </div>
                            {assignedAgent.partnerType === "b2b_agency" && (
                              <span className="text-[8px] text-blue-700 font-extrabold tracking-wide uppercase">
                                🏢 {assignedAgent.agencyName || user?.assignedAgencyName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Messages Box */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-gradient-to-b from-[#FAF9F6]/60 to-white/40">
                          {messages.map((msg) => {
                            const isSelf = msg.sender === "user";
                            return (
                              <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-fade-in`}>
                                <div className={`flex gap-3 max-w-[75%] ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                                  {!isSelf && (
                                    <img
                                      src={assignedAgent.photo}
                                      alt={assignedAgent.name}
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
                          })}

                          {isTyping && (
                            <div className="flex justify-start animate-pulse">
                              <div className="flex gap-3 max-w-[75%]">
                                <img
                                  src={assignedAgent.photo}
                                  alt={assignedAgent.name}
                                  className="w-9 h-9 rounded-full object-cover border border-border-light flex-shrink-0 shadow-sm"
                                />
                                <div className="bg-white border border-border-light rounded-2xl rounded-tl-none px-4 py-3.5 shadow-sm flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                  <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-border-light flex gap-3 items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.01)]">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder={`Escribe un mensaje para ${assignedAgent.name.split(" ")[1]}...`}
                              disabled={isTyping}
                              className="w-full bg-[#FAF9F6] border border-border-light rounded-full pl-5 pr-12 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary text-text-primary placeholder:text-text-muted disabled:opacity-60 transition-all shadow-inner"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
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
                          <p className="text-[11px] font-semibold text-text-secondary">🏢 Agencia de Viajes y Asesoría Consular B2B</p>
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
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="text-xs text-text-secondary font-medium">Cargando detalles de tu acreditación...</span>
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
                          <p><span className="text-text-secondary font-semibold">Tipo de Socio:</span> {partnerApp.documents?.partner_type === "b2b_agency" ? "Agencia B2B Partner" : "Asesor Consultor Independiente"}</p>
                          <p><span className="text-text-secondary font-semibold">Nombre/Razón Social:</span> {partnerApp.full_name}</p>
                          <p><span className="text-text-secondary font-semibold">Correo de Contacto:</span> {partnerApp.email}</p>
                          <p><span className="text-text-secondary font-semibold">Teléfono:</span> {partnerApp.phone}</p>
                          <p><span className="text-text-secondary font-semibold">País de Residencia:</span> {partnerApp.country_residence}</p>
                          <p><span className="text-text-secondary font-semibold">Años de Experiencia:</span> {partnerApp.experience_years} años</p>
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
                    <p className="text-xs text-text-secondary mt-1">Revisa y evalúa las postulaciones de consultores independientes y agencias de viaje B2B.</p>
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
                            .map((app) => (
                              <tr key={app.id} className="hover:bg-background-main/10 transition-colors">
                                <td className="py-4 px-4 font-mono font-medium text-text-primary">{app.application_id}</td>
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-bold text-text-primary">{app.full_name}</p>
                                    <p className="text-[10px] text-text-secondary">{app.email}</p>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-text-secondary">
                                  {app.documents?.partner_type === "b2b_agency" ? "🏢 Agencia B2B" : "👤 Consultor Ind."}
                                </td>
                                <td className="py-4 px-4 text-text-secondary">
                                  {new Date(app.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
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
                            ))
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
                          onClick={() => handleAdminAction(selectedApp.id, "approved")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          ✓ Aprobar Socio
                        </button>
                        <button
                          disabled={isSavingAdmin}
                          onClick={() => handleAdminAction(selectedApp.id, "rejected")}
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
                            <p><span className="text-text-secondary font-semibold">Años de Experiencia:</span> {selectedApp.experience_years} años</p>
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
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline flex items-center gap-1 mt-0.5">
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
                              onClick={() => handleAdminAction(selectedApp.id, "comment_only")}
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
              </div>
            )}
            {/* TAB: PORTAL AGENTE / EMPRESA */}
            {activeTab === "portal_agente" && user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY) && (
              <div className="animate-fadeIn">
                {/* Header */}
                <div className="mb-6 pb-4 border-b border-border-light flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {user.role === ROLES.AGENCY ? "Portal Empresa" : "Portal Agente"}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                      {user.role === ROLES.AGENCY
                        ? "Agencia acreditada en la red TodoVisa."
                        : "Consultor independiente acreditado en la red TodoVisa."}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-brand-light border border-border-light text-brand-primary text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block animate-pulse" />
                    Cuenta Activa
                  </span>
                </div>

                {/* Welcome note */}
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Bienvenido, <span className="font-semibold text-text-primary">{user.firstName}</span>. Tu cuenta ha sido activada como{" "}
                  <span className="font-semibold text-text-primary">
                    {user.role === ROLES.AGENCY ? "empresa socia" : "agente consultor"}
                  </span>
                  {" "}de la red TodoVisa. Desde aquí puedes gestionar tus clientes, revisar comisiones y acceder a herramientas exclusivas.
                </p>

                {/* Quick Access Cards */}
                {user.role === ROLES.AGENCY ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => router.push("/agents/portal")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F5A5;&#xFE0F;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Panel de Empresa
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Gestiona tus casos, clientes asignados y comisiones.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("datos")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F3A8;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Personalizar Perfil
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Actualiza el nombre, logo, y datos de tu empresa.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/team")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F465;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Invitar Agentes
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Env&#237;a invitaciones para que asesores se unan a tu equipo.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/accreditation")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F3C5;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Mi Acreditaci&#243;n
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Revisa tu postulaci&#243;n y documentaci&#243;n de socio aprobada.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/commissions")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F4B0;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Comisiones Realizadas
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Historial y balance de comisiones completadas por tus asesores.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/payouts")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x2699;&#xFE0F;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            M&#233;todos de Cobro
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Registra tu cuenta de PayPal o transferencia para recibir comisiones.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => router.push("/agents/portal")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F5A5;&#xFE0F;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Panel de Agente
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Gestiona tus casos, clientes asignados y comisiones semanales.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/accreditation")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F3C5;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Mi Acreditaci&#243;n
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Revisa tu expediente de postulaci&#243;n y documentos aprobados.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/commissions")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x1F4B0;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            Comisiones Realizadas
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Historial y desglose de comisiones devengadas de tus asesor&#237;as.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/profile/payouts")}
                      className="group text-left p-4 rounded-sm border border-border-light bg-background-main hover:border-brand-primary hover:bg-brand-light transition-all duration-150 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">&#x2699;&#xFE0F;</span>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                            M&#233;todos de Cobro
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            Configura tu cuenta de PayPal o transferencia para recibir comisiones.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Info note */}
                <div className="flex items-start gap-3 bg-brand-light border border-border-light rounded-sm p-4 text-left mb-6">
                  <span className="text-sm flex-shrink-0 mt-0.5">ℹ️</span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Como {user.role === ROLES.AGENCY ? "empresa socia" : "agente consultor"} acreditado(a),
                    ya no necesitas contratar servicios de visa individuales. En su lugar, gestionas casos de
                    clientes directamente desde el{" "}
                    <button
                      onClick={() => router.push("/agents/portal")}
                      className="text-brand-primary font-semibold hover:underline focus:outline-none"
                    >
                      Panel de {user.role === ROLES.AGENCY ? "Empresa" : "Agente"}
                    </button>
                    {" "}y recibes comisiones por cada caso completado exitosamente.
                  </p>
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
                    const { error } = await supabase.auth.updateUser({
                      data: {
                        ds160_full_name: ds160Data.fullName,
                        ds160_passport_num: ds160Data.passportNum,
                        ds160_birth_date: ds160Data.birthDate,
                        ds160_purpose_of_trip: ds160Data.purposeOfTrip,
                        ds160_has_assets: ds160Data.hasAssets,
                        ds160_confirmed: true,
                        expediente_status: expedienteStatus,
                      }
                    });
                    if (error) console.warn('Could not persist DS-160 to Supabase:', error.message);
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
                onClick={handleCropAndUpload}
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
