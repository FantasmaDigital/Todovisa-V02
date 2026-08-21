"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { AgencyClientService } from "@/services/client/AgencyClientService";

import { StorageClientService } from "@/services/client/StorageClientService";
import { FormClientService } from "@/services/client/FormClientService";
import { SettingsClientService } from "@/services/client/SettingsClientService";
import { MessageClientService, ClientMessageData } from "../service/MessageClientService";
import { ROLES } from "../constants/roles";
import { getSystemConfig } from "../constants/config";
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
  status: 'pending' | 'processing' | 'paid' | 'completed' | string;

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
  const [fullServicePrice, setFullServicePrice] = useState(() => getSystemConfig().fullServicePrice);
  const [viproPrice, setViproPrice] = useState(() => getSystemConfig().viproPrice);

  useEffect(() => {
    const sysConfig = getSystemConfig();
    setFullServicePrice(sysConfig.fullServicePrice);
    setViproPrice(sysConfig.viproPrice);

    async function fetchDBPrices() {
      try {
        const settings = await SettingsClientService.getSettings();
        if (settings) {
          if (settings.vipro_price) {
            setViproPrice(Number(settings.vipro_price));
            localStorage.setItem("viproPrice", settings.vipro_price);
          }
          if (settings.full_service_price) {
            setFullServicePrice(Number(settings.full_service_price));
            localStorage.setItem("fullServicePrice", settings.full_service_price);
          }
        }
      } catch (err) {
        console.error("Error fetching db prices in profile page:", err);
      }
    }
    fetchDBPrices();
  }, []);

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [partnerApp, setPartnerApp] = useState<AgentApplicationData | null>(null);
  const [allApplications, setAllApplications] = useState<AgentApplicationData[]>([]);
  const [selectedApp, setSelectedApp] = useState<AgentApplicationData | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoadingPartnerApp, setIsLoadingPartnerApp] = useState(true);

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
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Manual Admin Commission Assignment states
  const [isAdminCommissionModalOpen, setIsAdminCommissionModalOpen] = useState(false);
  const [selectedTxForCommission, setSelectedTxForCommission] = useState<any | null>(null);
  const [adminTargetAgencyId, setAdminTargetAgencyId] = useState("");
  const [adminCommissionAmount, setAdminCommissionAmount] = useState("");
  const [adminCommissionGross, setAdminCommissionGross] = useState("");
  const [adminCommissionClientName, setAdminCommissionClientName] = useState("");
  const [adminCommissionRate, setAdminCommissionRate] = useState("20");
  const [isAssigningCommission, setIsAssigningCommission] = useState(false);

  // Dedicated Admin B2B Referral Leads states
  const [referralLeadsList, setReferralLeadsList] = useState<any[]>([]);
  const [isLoadingReferralLeads, setIsLoadingReferralLeads] = useState(false);
  const [referralLeadSearch, setReferralLeadSearch] = useState("");

  // User's own application state (for B2B agency or independent agent application tracking)


  const [userApplication, setUserApplication] = useState<AgentApplicationData | null>(null);
  const [isLoadingUserApp, setIsLoadingUserApp] = useState(true);

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
  const [advisorSubTab, setAdvisorSubTab] = useState<'chat' | 'audit'>('chat');
  const [docReviews, setDocReviews] = useState<Record<string, { status: 'approved' | 'observed' | 'rejected' | 'pending'; comment: string }>>({});
  const [auditExpedienteStatus, setAuditExpedienteStatus] = useState<'draft' | 'submitted' | 'approved'>('submitted');
  const [isSavingAudit, setIsSavingAudit] = useState(false);
  const [isAgentProposingCita, setIsAgentProposingCita] = useState(false);
  const [agentCitaProposal, setAgentCitaProposal] = useState({
    proposedDate: "",
    proposedTime: "10:00",
    agentNotes: "",
    meetingLink: "",
  });
  const [userAppointmentRequest, setUserAppointmentRequest] = useState<any>(user?.appointmentRequest || null);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReviewComment, setUserReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [agentReviewSubmitted, setAgentReviewSubmitted] = useState<boolean>(false);

  const handleSaveAgentReview = async () => {
    if (!user?.id) return;
    if (userRating === 0) {
      showToast("Selecciona una calificación de 1 a 5 estrellas para continuar.", "error");
      return;
    }
    try {
      setIsSubmittingReview(true);
      const reviewData = {
        rating: userRating,
        comment: userReviewComment,
        created_at: new Date().toISOString(),
        user_id: user.id,
        user_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        agent_id: assignedAgentProfile?.id || null,
      };

      await ProfileClientService.updateProfile(user.id, {
        agent_review: reviewData,
      });

      setAgentReviewSubmitted(true);
      showToast("¡Muchas gracias por calificar el servicio de tu asesor!", "success");
    } catch (err: any) {
      console.error("Error al guardar calificación:", err);
      showToast("Error al guardar reseña: " + (err.message || String(err)), "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (user?.appointmentRequest) {
      setUserAppointmentRequest(user.appointmentRequest);
    }
  }, [user?.appointmentRequest]);

  useEffect(() => {
    if (!selectedClientProfile) return;
    const keys = ["passport", "dui", "workCert", "bankStatements", "ds160"];
    const allApproved = keys.every(key => docReviews[key]?.status === "approved");
    const anyObservedOrRejected = keys.some(key => docReviews[key]?.status === "observed" || docReviews[key]?.status === "rejected");

    if (allApproved) {
      setAuditExpedienteStatus("approved");
    } else if (anyObservedOrRejected) {
      setAuditExpedienteStatus("draft");
    }

    const appt = selectedClientProfile.appointment_request || selectedClientProfile.cita_details || selectedClientProfile.document_reviews?.appointment_request;
    if (appt) {
      setAgentCitaProposal(prev => ({
        ...prev,
        proposedDate: appt.agent_proposed_date || appt.requested_date || appt.confirmed_date || "",
        proposedTime: appt.agent_proposed_time || appt.requested_time || appt.confirmed_time || "10:00",
        agentNotes: appt.agent_notes || "",
        meetingLink: appt.meeting_link || "",
      }));
    }
  }, [docReviews, selectedClientProfile]);

  const handleAgentAcceptCita = async (agentNotes?: string, meetingLink?: string) => {
    if (!selectedClientProfile) return;
    try {
      const currentAppt = selectedClientProfile.appointment_request || selectedClientProfile.cita_details || selectedClientProfile.document_reviews?.appointment_request;
      const linkToUse = meetingLink !== undefined ? meetingLink : (agentCitaProposal.meetingLink || currentAppt?.meeting_link || "");

      if (!linkToUse || !linkToUse.trim()) {
        showToast("⚠️ Para confirmar la cita es OBLIGATORIO ingresar el enlace a la reunión virtual (Zoom / Google Meet).", "error");
        return;
      }

      const notesToUse = agentNotes !== undefined ? agentNotes : (agentCitaProposal.agentNotes || "Cita admitida y confirmada por el asesor.");

      const updatedAppt = {
        ...(currentAppt || {}),
        status: "confirmed" as const,
        confirmed_date: currentAppt?.requested_date || currentAppt?.confirmed_date || new Date().toISOString().split("T")[0],
        confirmed_time: currentAppt?.requested_time || currentAppt?.confirmed_time || "10:00",
        agent_notes: notesToUse,
        meeting_link: linkToUse,
      };

      await ProfileClientService.updateProfile(selectedClientProfile.id, {
        appointment_request: updatedAppt,
      });

      setSelectedClientProfile((prev: any) => ({ ...prev, appointment_request: updatedAppt }));

      const msgText = `🎉 ¡Buenas noticias! Tu asesor ha ADMITIDO y CONFIRMADO tu cita para el ${updatedAppt.confirmed_date} a las ${updatedAppt.confirmed_time} hrs.${linkToUse ? `\n\n🎥 Enlace de Videollamada (Zoom / Meet):\n${linkToUse}` : ""}${notesToUse ? `\n\n💬 Nota del Asesor: "${notesToUse}"` : ""}`;
      
      await MessageClientService.createMessage({
        sender: "agent",
        text: msgText,
        user_id: selectedClientProfile.id,
        agent_id: user?.id || "",
      });

      showToast("Cita confirmada exitosamente con enlace de videollamada.", "success");
    } catch (err: any) {
      console.error("Error al admitir cita:", err);
      showToast("Error al admitir cita: " + (err.message || String(err)), "error");
    }
  };

  const handleAgentRejectCita = async (agentNotes?: string) => {
    if (!selectedClientProfile) return;
    try {
      const currentAppt = selectedClientProfile.appointment_request || selectedClientProfile.cita_details || selectedClientProfile.document_reviews?.appointment_request;
      const updatedAppt = {
        ...(currentAppt || {}),
        status: "rejected" as const,
        agent_notes: agentNotes || "La cita ha sido rechazada por el asesor.",
      };

      await ProfileClientService.updateProfile(selectedClientProfile.id, {
        appointment_request: updatedAppt,
      });

      setSelectedClientProfile((prev: any) => ({ ...prev, appointment_request: updatedAppt }));

      const msgText = `❌ Tu solicitud de cita ha sido rechazada por el asesor. ${agentNotes ? `\n\n💬 Motivo/Observación: "${agentNotes}"` : ""}\n\nPuedes ingresar al apartado de Citas y reagendar en un nuevo horario.`;
      await MessageClientService.createMessage({
        sender: "agent",
        text: msgText,
        user_id: selectedClientProfile.id,
        agent_id: user?.id || "",
      });

      showToast("Cita rechazada. Se notificó al cliente.", "info");
    } catch (err: any) {
      console.error("Error al rechazar cita:", err);
      showToast("Error al rechazar cita: " + (err.message || String(err)), "error");
    }
  };

  const handleCitaStatusChange = async (newStatus: string) => {
    if (!selectedClientProfile) return;
    try {
      const currentAppt = selectedClientProfile.appointment_request || selectedClientProfile.cita_details || selectedClientProfile.document_reviews?.appointment_request;
      const linkToUse = agentCitaProposal.meetingLink || currentAppt?.meeting_link || "";

      if (newStatus === "confirmed" && (!linkToUse || !linkToUse.trim())) {
        showToast("⚠️ Para confirmar la cita es OBLIGATORIO ingresar el enlace a la reunión virtual (Zoom / Google Meet).", "error");
        return;
      }

      const updatedAppt = {
        ...(currentAppt || {}),
        status: newStatus as any,
        confirmed_date: currentAppt?.requested_date || currentAppt?.confirmed_date || new Date().toISOString().split("T")[0],
        confirmed_time: currentAppt?.requested_time || currentAppt?.confirmed_time || "10:00",
        meeting_link: linkToUse,
      };

      const updates: any = {
        appointment_request: updatedAppt,
      };

      await ProfileClientService.updateProfile(selectedClientProfile.id, updates);

      setSelectedClientProfile((prev: any) => ({
        ...prev,
        appointment_request: updatedAppt,
      }));

      let msgText = "";
      if (newStatus === "confirmed") {
        msgText = `🎉 ¡Buenas noticias! Tu asesor ha ADMITIDO y CONFIRMADO tu cita para el ${updatedAppt.confirmed_date} a las ${updatedAppt.confirmed_time} hrs.${updatedAppt.meeting_link ? `\n\n🎥 Enlace Zoom/Meet: ${updatedAppt.meeting_link}` : ""}`;
      } else if (newStatus === "rejected") {
        msgText = `❌ Tu solicitud de cita ha sido rechazada por el asesor. Puedes ingresar al apartado de Citas y reagendar en un nuevo horario.`;
      } else if (newStatus === "proposed") {
        msgText = `⚡ Tu asesor ha propuesto un nuevo horario para tu cita/simulacro: ${updatedAppt.confirmed_date} a las ${updatedAppt.confirmed_time} hrs.`;
      } else {
        msgText = `⏳ El estado de tu cita/simulacro ha sido cambiado a pendiente de revisión.`;
      }

      await MessageClientService.createMessage({
        sender: "agent",
        text: msgText,
        user_id: selectedClientProfile.id,
        agent_id: user?.id || "",
      });

      showToast(`Estado de cita actualizado a: ${newStatus}`, "success");
    } catch (err: any) {
      console.error("Error al actualizar estado de cita:", err);
      showToast("Error al cambiar estado: " + (err.message || String(err)), "error");
    }
  };

  const handleAgentProposeCita = async () => {
    if (!selectedClientProfile || !agentCitaProposal.proposedDate) {
      showToast("Selecciona una fecha válida para proponer al cliente.", "error");
      return;
    }
    try {
      const currentAppt = selectedClientProfile.appointment_request || selectedClientProfile.cita_details || selectedClientProfile.document_reviews?.appointment_request;
      const updatedAppt = {
        ...(currentAppt || {}),
        status: "proposed" as const,
        agent_proposed_date: agentCitaProposal.proposedDate,
        agent_proposed_time: agentCitaProposal.proposedTime,
        agent_notes: agentCitaProposal.agentNotes || "El asesor propone este nuevo horario.",
        meeting_link: agentCitaProposal.meetingLink || currentAppt?.meeting_link || "",
      };

      await ProfileClientService.updateProfile(selectedClientProfile.id, {
        appointment_request: updatedAppt,
      });

      setSelectedClientProfile((prev: any) => ({ ...prev, appointment_request: updatedAppt }));
      setIsAgentProposingCita(false);

      const msgText = `📅 El asesor ha propuesto un NUEVO HORARIO para la cita:\n- Fecha propuesta: ${agentCitaProposal.proposedDate}\n- Hora propuesta: ${agentCitaProposal.proposedTime} hrs${agentCitaProposal.meetingLink ? `\n- Enlace de reunión: ${agentCitaProposal.meetingLink}` : ""}${agentCitaProposal.agentNotes ? `\n- Nota: ${agentCitaProposal.agentNotes}` : ""}\n\nIngresa al apartado de Citas para Aceptar la propuesta.`;
      await MessageClientService.createMessage({
        sender: "agent",
        text: msgText,
        user_id: selectedClientProfile.id,
        agent_id: user?.id || "",
      });

      showToast("Propuesta de cita enviada al cliente.", "success");
    } catch (err: any) {
      console.error("Error al proponer cita:", err);
      showToast("Error al proponer cita: " + (err.message || String(err)), "error");
    }
  };
  const [assignedAgencyProfile, setAssignedAgencyProfile] = useState<any | null>(null);
  const [assignedAgentProfile, setAssignedAgentProfile] = useState<any | null>(null);
  const [realAgentsData, setRealAgentsData] = useState<any[]>([]);

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

  useEffect(() => {
    async function loadAdminApplications() {
      if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.MODERATOR)) return;
      try {
        const { data } = await supabase
          .from("agent_applications")
          .select("*")
          .order("created_at", { ascending: false });

        if (data) {
          setAllApplications(data as AgentApplicationData[]);
        }
      } catch (err) {
        console.error("Error fetching all agent applications for admin:", err);
      }
    }

    loadAdminApplications();
  }, [user?.role, activeTab]);



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
  }, [user?.id, user?.role]);  // Only re-run on identity/role changes

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
  }, [user?.id, user?.role]);  // Only re-run on identity/role changes

  useEffect(() => {
    async function fetchUserApplication() {
      if (!user?.email && !user?.id) {
        setIsLoadingUserApp(false);
        return;
      }
      setIsLoadingUserApp(true);
      try {
        let foundData: AgentApplicationData | null = null;

        // 1. Try querying Supabase by user_id or email
        if (user.id) {
          const { data: byUserId } = await supabase
            .from("agent_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (byUserId) foundData = byUserId as AgentApplicationData;
        }

        if (!foundData && user.email) {
          const cleanEmail = user.email.trim().toLowerCase();
          const { data: byEmail } = await supabase
            .from("agent_applications")
            .select("*")
            .ilike("email", cleanEmail)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (byEmail) foundData = byEmail as AgentApplicationData;
        }

        if (foundData) {
          setUserApplication(foundData);
          setPartnerApp(foundData);
        } else {
          setUserApplication(null);
          setPartnerApp(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("user_agent_application");
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("agent_app_")) {
                localStorage.removeItem(key);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading user application:", err);
      } finally {
        setIsLoadingUserApp(false);
      }
    }

    fetchUserApplication();
  }, [user?.id, user?.email]);

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
    passport_url?: string;
    dui?: string;
    dui_url?: string;
    workCert?: string;
    workCert_url?: string;
    bankStatements?: string;
    bankStatements_url?: string;
    [key: string]: string | undefined;
  }>({});

  const [clientDocReviews, setClientDocReviews] = useState<Record<string, { status: 'approved' | 'observed' | 'rejected' | 'pending'; comment: string }>>({});
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

        if (data && Object.keys(data).length > 0) {
          setPreformMetadata(data);
          setIsPreformularioCompleted(true);
        } else {
          // Check if there is anything in localstorage as fallback
          const completed = localStorage.getItem(`preformulario_completed_user_id_${user.id}`);
          if (completed === "true") {
            setIsPreformularioCompleted(true);
          }
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
  }, [user?.id, user?.viproDestination]);

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

      const updated = { ...clientDocs, [docType]: file.name, [`${docType}_url`]: publicUrl };
      setClientDocs(updated);

      if (user) {
        setUser({
          ...user,
          clientDocs: updated
        });
        await AuthService.updateUser({
          client_docs: updated
        });
      }

      showToast(`✅ Archivo "${file.name}" guardado exitosamente en tu expediente consular.`, "success");
    } catch (err: any) {
      console.error("Error al subir archivo via API Storage:", err);
      showToast(`Error al guardar archivo: ${err.message || String(err)}`, "error");
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

          await ProfileClientService.updateProfile(user.id, {
            photo_url: publicUrl,
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
  const handleSaveAudit = async () => {
    if (!selectedClientProfile) return;
    setIsSavingAudit(true);
    console.log("[handleSaveAudit] Saving for client:", selectedClientProfile.id);
    console.log("[handleSaveAudit] docReviews:", JSON.stringify(docReviews));
    console.log("[handleSaveAudit] auditExpedienteStatus:", auditExpedienteStatus);
    try {
      // 1. Save in the profiles table in Supabase via API
      const updateResult = await ProfileClientService.updateProfile(selectedClientProfile.id, {
        document_reviews: docReviews,
        expediente_status: auditExpedienteStatus
      });
      console.log("[handleSaveAudit] updateProfile result:", JSON.stringify(updateResult));

      // Update selectedClientProfile state locally immediately to lock in saved values
      setSelectedClientProfile((prev: any) => prev ? {
        ...prev,
        document_reviews: { ...docReviews },
        expediente_status: auditExpedienteStatus
      } : null);

      // Generate a notification chat message to let the client know
      const countObserved = Object.values(docReviews).filter(r => r.status === 'observed' || r.status === 'rejected').length;
      let text = "";
      if (auditExpedienteStatus === 'approved') {
        text = `🎉 ¡Tu expediente ha sido APROBADO por tu asesor! Todos los documentos y datos del DS-160 son correctos. Procederemos con la programación de tu cita consular (Paso 5).`;
      } else if (countObserved > 0) {
        text = `⚠️ Tu asesor ha revisado tu expediente y tiene observaciones en ${countObserved} ítem(s). Por favor ingresa al Paso 4 de tu panel para revisar las observaciones, corregir los documentos y volver a enviar a auditoría.`;
      } else {
        text = `✍️ Tu asesor ha actualizado las notas de tu expediente consular. Puedes ver las revisiones en tu panel de documentos.`;
      }

      await MessageClientService.createMessage({
        sender: "agent",
        text,
        user_id: selectedClientProfile.id,
        agent_id: user?.id || "",
      });

      showToast("Auditoría del expediente guardada y cliente notificado.", "success");

    } catch (err: any) {
      console.error("[handleSaveAudit] Failed to save audit:", err);
      showToast("Error al guardar la auditoría: " + (err.message || String(err)), "error");
    } finally {
      setIsSavingAudit(false);
    }
  };

  const handleSubmitExpediente = async () => {
    if (!clientDocs.passport || !clientDocs.dui || !clientDocs.workCert || !clientDocs.bankStatements) {
      showToast("Por favor carga los 4 documentos requeridos para auditar tu expediente.", "info");
      return;
    }
    if (!ds160Confirmed) {
      showToast("Debes revisar y confirmar tus datos del formulario DS-160.", "info");
      return;
    }

    setExpedienteStatus('submitted');

    try {
      if (user) {
        const updatedUser = { ...user, expedienteStatus: 'submitted' as const };
        setUser(updatedUser);

        await AuthService.updateUser({
          expediente_status: 'submitted'
        });

        const systemMessageText = `He recibido tu expediente completo para auditoría (Pasaporte: ${clientDocs.passport}, DUI: ${clientDocs.dui}, Laboral: ${clientDocs.workCert}, Solvencia: ${clientDocs.bankStatements} y tus datos del DS-160). \n\nVoy a proceder a auditar y cotejar cada documento hoy mismo. Si todo coincide con las regulaciones de la sección consular, cambiaré el estado a "Aprobado" y pasaremos a programar tu cita y realizar el simulacro de entrevista (Paso 5). ¡Excelente trabajo de recopilación!`;

        await MessageClientService.createMessage({
          sender: "agent",
          text: systemMessageText,
          user_id: user.id,
          agent_id: user.assignedAgentId || "",
        });

        // Add to local chat UI
        const newSystemMessage = {
          id: `msg-sys-${Date.now()}`,
          sender: "agent" as const,
          text: systemMessageText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newSystemMessage]);
      }
      showToast("¡Expediente enviado con éxito! Tu asesor ha sido notificado.", "success");
    } catch (err: any) {
      console.error("Failed to submit expediente to Supabase:", err);
      showToast("Error al enviar expediente: " + (err.message || String(err)), "error");
    }
  };

  // Computed assigned agent — resolves from real Supabase agents by the stored UUID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedAgent = user?.assignedAgentId && realAgentsData.length > 0
    ? realAgentsData.find((a: any) =>
      a.userId === user.assignedAgentId ||
      a.id === user.assignedAgentId ||
      a.id === `agent-${user.assignedAgentId}`
    ) || null
    : null;

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
          let dbProfile: any = null;
          try {
            const profRes = await ProfileClientService.getProfile(apiUser.id);
            dbProfile = profRes?.profile || profRes || null;
            const dbRole = dbProfile?.role || null;
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

          // Self-healing fallback: check messages history to find the agent ID they chatted with
          let fallbackAgentId = null;
          try {
            const { data: clientMsgs } = await supabase
              .from("messages")
              .select("agent_id")
              .eq("user_id", apiUser.id)
              .limit(1);
            if (clientMsgs && clientMsgs.length > 0) {
              const rawAgentId = clientMsgs[0].agent_id;
              fallbackAgentId = rawAgentId.startsWith("agent-") ? rawAgentId.substring(6) : rawAgentId;
            }
          } catch (e) {
            console.warn("Failed to fetch client messages for agent fallback:", e);
          }

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
            hasPaidAdvisor: metadata.has_paid_advisor || dbProfile?.has_paid_advisor || (fallbackAgentId ? true : false),
            assignedAgentId: metadata.assigned_agent_id || dbProfile?.assigned_agent_id || fallbackAgentId || null,
            assignedAgencyName: metadata.assigned_agency_name || dbProfile?.assigned_agency_name || null,
            photoUrl: dbProfile?.photo_url || metadata.photo_url || metadata.avatar_url || metadata.picture || null,
            avatarChangesThisMonth: metadata.avatar_changes_this_month || 0,
            lastAvatarChangeMonth: metadata.last_avatar_change_month || '',
            ds160FullName: metadata.ds160_full_name || null,
            ds160PassportNum: metadata.ds160_passport_num || null,
            ds160BirthDate: metadata.ds160_birth_date || null,
            ds160PurposeOfTrip: metadata.ds160_purpose_of_trip || null,
            ds160HasAssets: metadata.ds160_has_assets ?? true,
            ds160Confirmed: metadata.ds160_confirmed || false,
            expedienteStatus: dbProfile?.expediente_status || metadata.expediente_status || 'draft',
            role: finalRole,
            clientDocs: metadata.client_docs || {},
            documentReviews: dbProfile?.document_reviews || metadata.document_reviews || {},
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
            user.role !== updatedUser.role ||
            JSON.stringify(user.clientDocs) !== JSON.stringify(updatedUser.clientDocs) ||
            JSON.stringify(user.documentReviews) !== JSON.stringify(updatedUser.documentReviews)
          ) {
            console.log("Syncing auth store state with user metadata.");
            setTimeout(() => {
              setUser(updatedUser);
              setClientDocs(updatedUser.clientDocs || {});
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
    if (!user) {
      setIsLoadingPartnerApp(false);
      return;
    }

    const loadPartnerData = async () => {
      setIsLoadingPartnerApp(true);
      try {
        let agencyId = null;
        const profileData = await ProfileClientService.getProfile(user.id);
        if (profileData?.profile) {
          if (!profileData.profile.photo_url && user.photoUrl) {
            console.log("[Profile] Syncing photo_url to database:", user.photoUrl);
            await ProfileClientService.updateProfile(user.id, { photo_url: user.photoUrl });
          }
        }

        if (user.role === "agent") {
          const memberInfo = profileData?.memberInfo;
          if (memberInfo?.memberData?.agency_id) {
            agencyId = memberInfo.memberData.agency_id;
          }
        }

        const targetUserId = agencyId || user.id;

        const portalRes = await AgentClientService.getPortalData(targetUserId);
        if (portalRes?.application) {
          setPartnerApp(portalRes.application);
          setAgentApp(portalRes.application);
          if (portalRes.application.signature_name) {
            setSignatureName(portalRes.application.signature_name);
          }
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
  }, [user?.id, user?.role]);  // Re-run when identity OR role changes (role syncs async), but not on metadata updates

  // Admin action handlers: trigger database status change directly
  const triggerAdminSecurityModal = (app: AgentApplicationData, action: "approved" | "rejected") => {
    setSecurityConfirmed(false);
    setSecurityModalData({ app, targetAction: action });
  };

  const executeAdminAction = async (appId: string, action: "approved" | "rejected" | "comment_only") => {
    if (!user) return;
    const targetApp = selectedApp?.id === appId ? selectedApp : allApplications.find(a => a.id === appId);
    if (!targetApp) return;

    // Enforce comment if changing status from already processed (approved/active/rejected) state
    const isChangingFromResolved = targetApp.status !== "pending" && action !== "comment_only";
    if (isChangingFromResolved && (!adminNotesInput || !adminNotesInput.trim())) {
      showToast("Debes ingresar obligatoriamente un motivo o comentario explicando por qué cambias el estado.", "error");
      return;
    }

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

      if (action === "approved") {
        const applicantType = targetApp.application_type || "individual";
        const newRole = applicantType === "agency" ? ROLES.AGENCY : ROLES.AGENT;

        // Try direct user_id, or email match, or application profile lookup
        let targetUserId = targetApp?.user_id;

        if (!targetUserId && targetApp?.email) {
          try {
            const allProfiles = await ProfileClientService.getAllProfiles();
            const matchingProfile = allProfiles?.find((p: any) =>
              p.email?.toLowerCase() === targetApp.email?.toLowerCase()
            );
            if (matchingProfile?.id) {
              targetUserId = matchingProfile.id;
            }
          } catch (e) {
            console.error("[Admin Approval] Error fetching profiles by email:", e);
          }
        }

        if (targetUserId) {
          console.log(`[Admin Approval] Updating profile ${targetUserId} to role: ${newRole}`);
          await ProfileClientService.updateProfile(targetUserId, { role: newRole });

          // If the admin approved their own agent application, sync current user state
          if (targetUserId === user.id) {
            setUser({ ...user, role: newRole as any });
          }
        } else {
          console.warn("[Admin Approval] Could not match application to any profile ID or email:", targetApp);
          showToast("Aprobado en solicitudes, pero el usuario no tiene una cuenta vinculada aún.", "info");
        }
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

      setIsEditingStatus(false);
      setSecurityModalData(null);
    } catch (err: any) {
      console.error("Failed to update partner application status:", err);
      showToast("Error al guardar cambios.", "error");
    } finally {
      setIsSavingAdmin(false);
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
      const data = portalRes?.application;
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
      setPartnerApp((prev) => prev ? { ...prev, status: "active", signature_name: signatureName.trim(), signed_at: nowString } : null);
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
      setAssignedClients(Array.isArray(agentRes) ? agentRes : (agentRes?.clients || []));
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

  // Cargar automáticamente los datos de acreditación del agente/agencia al cargar el componente
  useEffect(() => {
    if (user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY)) {
      loadAgentAppForTab();
    }
  }, [user?.id, user?.role]);

  // Trigger loads when activeTab changes
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      if (activeTab === "comisiones") {
        loadCommissions();
        loadAssignedClients();
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

  const handleAssignCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTargetAgencyId) {
      showToast("Por favor selecciona o ingresa la empresa a la cual asignar la comisión.", "error");
      return;
    }
    const gross = Number(adminCommissionGross) || 0;
    const rate = Number(adminCommissionRate) || 20;
    const commissionAmt = gross * (rate / 100);

    setIsAssigningCommission(true);
    try {
      const res = await AgentClientService.createCommission({
        agent_id: adminTargetAgencyId,
        client_name: adminCommissionClientName || "Cliente Referido",
        gross_amount: gross,
        commission_rate: rate,
        commission_amount: commissionAmt,
        service_type: "Trámite de Visa (Referido Empresa)",
        status: "pending",
        notes: {
          manual_admin_assignment: true,
          assigned_by: user?.email || "Admin",
          payment_reference: selectedTxForCommission?.id || selectedTxForCommission?.paypal_tx_id || "Manual Admin",
          date: new Date().toISOString()
        }
      });

      setIsAssigningCommission(false);
      if (res && res.success) {
        showToast(`✅ Comisión de $${commissionAmt.toFixed(2)} USD (${rate}%) asignada exitosamente a la empresa.`, "success");
        setIsAdminCommissionModalOpen(false);
        loadCommissions();
      } else {
        showToast(res?.error || "Error al asignar la comisión", "error");
      }
    } catch (err: any) {
      setIsAssigningCommission(false);
      showToast("No se pudo asignar la comisión. Inténtalo nuevamente.", "error");
    }
  };

  const loadReferralLeadsData = async () => {
    setIsLoadingReferralLeads(true);
    try {
      const leads = await AgencyClientService.getReferralLeads();
      setReferralLeadsList(leads || []);
    } catch (err) {
      console.error("Error cargando leads de referidos:", err);
    } finally {
      setIsLoadingReferralLeads(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR || user.role === ROLES.AGENCY)) {
      loadReferralLeadsData();
    }
  }, [user]);


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
            if (profData.expediente_status) {
              setExpedienteStatus(profData.expediente_status);
            }
            if (profData.client_docs) {
              setClientDocs(profData.client_docs);
            }
            if (profData.document_reviews) {
              setClientDocReviews(profData.document_reviews);
            }
            const apptData = profData.appointment_request || profData.cita_details || profData.document_reviews?.appointment_request;
            if (apptData) {
              setUserAppointmentRequest(apptData);
              if (user) {
                setUser({ ...user, appointmentRequest: apptData });
              }
            }
            const revData = profData.agent_review || profData.document_reviews?.agent_review;
            if (revData) {
              setUserRating(revData.rating || 0);
              setUserReviewComment(revData.comment || "");
              setAgentReviewSubmitted(true);
            }
            if (profData.ds160_confirmed !== undefined) {
              setDs160Confirmed(!!profData.ds160_confirmed);
            }
            if (profData.ds160_full_name || profData.ds160_passport_num) {
              setDs160Data({
                fullName: profData.ds160_full_name || "",
                passportNum: profData.ds160_passport_num || "",
                birthDate: profData.ds160_birth_date || "",
                purposeOfTrip: profData.ds160_purpose_of_trip || "Turismo B1/B2",
                hasAssets: profData.ds160_has_assets ?? true,
              });
            }
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
          const evalData = Array.isArray(viproRes.value) ? viproRes.value : (viproRes.value ? [viproRes.value] : []);
          setViproEvaluations(evalData);
          const completedEval = evalData.find((ev: any) => ev && ev.is_completed === true && ev.score !== null && ev.score !== undefined);
          if (completedEval && !user.viproCompleted) {
            setUser({ ...user, viproCompleted: true, viproScore: completedEval.score });
          }
        }
      } catch (err) {
        console.error("Failed to load user records from API:", err);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchDbRecords();
  }, [user?.id || '']);

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
        });
      // Fetch VIPRO evaluations, commissions, user_purchases, and profiles in parallel to compute real stats
      Promise.all([
        FormClientService.getAllViproEvaluations().catch(() => []),
        fetch("/api/agents/commissions").then(r => r.json()).then(res => res.data || []).catch(() => []),
        AgentClientService.getAllPurchases().catch(() => []),
        ProfileClientService.getAllProfiles().catch(() => [])
      ]).then(([evals, commsResult, rawPurchases, profiles]) => {
        const validEvals = Array.isArray(evals) ? evals : [];
        const commissions = Array.isArray(commsResult) ? commsResult : [];
        const userPurchasesList = Array.isArray(rawPurchases) ? rawPurchases : [];
        const allProfs = Array.isArray(profiles) ? profiles : [];

        // Build a profile map by ID & email for quick lookup
        const pMap: Record<string, { email: string; name: string }> = {};
        allProfs.forEach((p: any) => {
          const full = `${p.first_name || ""} ${p.last_name || ""}`.trim();
          const entry = { email: p.email || "", name: full || p.email || "Cliente" };
          if (p.id) {
            pMap[p.id] = entry;
            pMap[p.id.toLowerCase()] = entry;
          }
          if (p.email) pMap[p.email.toLowerCase()] = entry;
        });
        setDbProfilesMap((prev) => ({ ...prev, ...pMap }));

        setViproEvaluations(validEvals);

        // Build purchases array from user_purchases table (primary financial source of truth)
        const directPurchases = userPurchasesList.map((p: any) => {
          const prof = p.user_id ? pMap[p.user_id] : null;
          return {
            id: p.id,
            user_id: p.user_id,
            user_name: prof?.name || "Cliente",
            user_email: prof?.email || "",
            product_type: p.product_type || "vipro",
            amount: Number(p.amount) || (p.product_type === "vipro" ? 19.99 : 150),
            paypal_tx_id: p.reference_id || p.id,
            created_at: p.created_at || new Date().toISOString()
          };
        });

        // Build purchases array from real agent_commissions table
        const advisorPurchases = commissions.map((c: any) => {
          let notesObj: any = {};
          if (c.notes) {
            try {
              notesObj = typeof c.notes === "string" ? JSON.parse(c.notes) : c.notes;
            } catch (e) {}
          }

          const clientId = c.client_id || c.user_id || notesObj.client_id;
          const clientEmail = c.client_email || notesObj.client_email || "";
          const prof = clientId ? pMap[clientId] : (clientEmail ? pMap[clientEmail.toLowerCase()] : null);
          const txId = c.paypal_tx_id || c.transaction_id || notesObj.paypal_transaction_id || c.id;

          return {
            id: c.id,
            user_id: clientId,
            user_name: c.client_name || prof?.name || notesObj.client_name || null,
            user_email: clientEmail || prof?.email || "",
            product_type: c.service_type === "vipro" ? "vipro" : "advisor",
            amount: Number(c.gross_amount) || Number(c.sale_amount) || (c.service_type === "vipro" ? 19.99 : 150),
            paypal_tx_id: txId,
            created_at: c.created_at || new Date().toISOString()
          };
        });

        // Also check profiles table for users who have paid vipro or advisor
        const profilePurchases: any[] = [];
        allProfs.forEach((p: any) => {
          const full = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email;
          if (p.has_paid_vipro) {
            const exists = directPurchases.some(dp => dp.user_id === p.id && dp.product_type === "vipro") || advisorPurchases.some(ap => ap.user_id === p.id && ap.product_type === "vipro");
            if (!exists) {
              profilePurchases.push({
                id: `prof-vipro-${p.id}`,
                user_id: p.id,
                user_name: full,
                user_email: p.email || "",
                product_type: "vipro",
                amount: Number(viproPrice) || 19.99,
                paypal_tx_id: p.last_paypal_tx || `prof-vipro-${p.id}`,
                created_at: p.updated_at || new Date().toISOString()
              });
            }
          }
          if (p.has_paid_advisor) {
            const exists = directPurchases.some(dp => dp.user_id === p.id && dp.product_type === "advisor") || advisorPurchases.some(ap => ap.user_id === p.id && ap.product_type === "advisor");
            if (!exists) {
              profilePurchases.push({
                id: `prof-advisor-${p.id}`,
                user_id: p.id,
                user_name: full,
                user_email: p.email || "",
                product_type: "advisor",
                amount: Number(fullServicePrice) || 150,
                paypal_tx_id: p.last_paypal_tx || `prof-advisor-${p.id}`,
                created_at: p.updated_at || new Date().toISOString()
              });
            }
          }
        });

        // Normalize transaction keys to collapse prefixed & raw PayPal IDs
        const normalizeTxKey = (raw: string | null | undefined, userId?: string, prod?: string): string => {
          if (!raw) return `${userId || "user"}-${prod || "prod"}`;
          const clean = raw.replace(/^PAYPAL-|^TV-VIPRO-|^TV-ADVISOR-|^TV-/gi, "");
          return clean ? clean.toUpperCase() : `${userId || "user"}-${prod || "prod"}`;
        };

        // Merge all purchases uniquely by normalized transaction key
        const uniqueMap = new Map<string, any>();
        [...directPurchases, ...advisorPurchases, ...profilePurchases].forEach(item => {
          const rawId = item.paypal_tx_id || item.last_paypal_tx || item.id;
          const key = normalizeTxKey(rawId, item.user_id, item.product_type);
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });

        setDbPurchases(Array.from(uniqueMap.values()));
      }).catch(err => {
        console.error("Error loading admin stats:", err);
      });
    }
  }, [user, activeTab, viproPrice]);

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
    if (!user || !user.assignedAgentId) return;

    const loadAssignedProfiles = async () => {
      try {
        const rawAgentId = user.assignedAgentId as string;
        const cleanAgentId = rawAgentId.startsWith("agent-") ? rawAgentId.substring(6) : rawAgentId;
        const profileRes = await ProfileClientService.getProfile(cleanAgentId);
        if (profileRes?.profile) {
          setAssignedAgentProfile(profileRes.profile);
        }
      } catch (err) {
        console.error("Error loading assigned profiles via API:", err);
      }
    };
    loadAssignedProfiles();
  }, [user?.id, user?.assignedAgentId]);

  // Load real agents from API so assignedAgent can be resolved by ID
  useEffect(() => {
    if (!user?.hasPaidAdvisor) return;
    import("@/services/client/AgentClientService").then(({ AgentClientService }) => {
      AgentClientService.getAgents().then((data: any) => {
        const activeApps: any[] = data.activeApps || [];
        const mapped = activeApps.map((app: any) => ({
          id: app.user_id || app.application_id,   // real UUID as primary id
          userId: app.user_id,                      // always the Supabase UUID
          name: app.full_name || app.email || "Asesor TodoVisa",
          title: `Asesor Independiente · ${(app.specialties || ["General"])[0]}`,
          photo: app.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.full_name || "Asesor")}&background=0d9488&color=fff&size=200`,
          rating: 4.8,
          reviewsCount: 0,
          languages: app.languages || ["Español"],
          countries: app.target_countries || ["Estados Unidos"],
          specialties: app.specialties || ["Asesoría General"],
          experience: app.experience_years || "—",
          bio: app.biography || "",
          partnerType: "outsourced_agent",
        }));
        setRealAgentsData(mapped);
      }).catch(() => { });
    });
  }, [user?.hasPaidAdvisor]);

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
          // Use the real UUID — assignedAgentId now stores the UUID directly
          agent_id: user.assignedAgentId || "",
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

  const renderDocReview = (docKey: string) => {
    if (!user || !user.documentReviews || !user.documentReviews[docKey]) return null;
    const review = user.documentReviews[docKey];
    if (review.status === 'pending' || !review.status) return null;

    return (
      <div className={`mt-2.5 p-2.5 rounded border text-left text-[10px] leading-relaxed ${review.status === 'approved'
          ? "bg-emerald-50/70 border-emerald-100 text-emerald-800"
          : review.status === 'observed'
            ? "bg-amber-50/70 border-amber-200 text-amber-800"
            : "bg-red-50/70 border-red-200 text-red-800"
        }`}>
        <div className="flex items-center gap-1 font-bold">
          {review.status === 'approved' ? (
            <span>✅ Aprobado por Asesor</span>
          ) : review.status === 'observed' ? (
            <span>⚠️ Observado por Asesor</span>
          ) : (
            <span>❌ Rechazado por Asesor</span>
          )}
        </div>
        {review.comment && (
          <p className="mt-1 text-[10px] font-medium text-slate-700">
            <strong>Comentario:</strong> {review.comment}
          </p>
        )}
      </div>
    );
  };

  const agentsCount = allProfilesList.filter((p: any) => p.role === ROLES.AGENT).length;
  const agenciesCount = allProfilesList.filter((p: any) => p.role === ROLES.AGENCY).length;
  const clientsCount = allProfilesList.filter((p: any) => p.role === ROLES.USER || !p.role).length;
  const pendingAppsCount = allApplications.filter((a: any) => a.status === "pending").length;

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

          <div className="text-center md:text-left text-white flex flex-col items-center md:items-start">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 mb-1.5 flex items-center justify-center md:justify-start gap-2 min-h-[16px]">
              {isLoadingPartnerApp ? (
                <span className="inline-block w-24 h-3 bg-white/20 rounded animate-pulse"></span>
              ) : user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR
                ? "Panel de Administración"
                : (user?.role === ROLES.AGENT || user?.role === ROLES.AGENCY) && agentApp && (agentApp.status === "active" || agentApp.status === "approved") && Boolean(agentApp.signed_at)
                  ? (user?.role === ROLES.AGENCY ? "Panel de Agencia" : "Panel de Asesor")
                  : "Panel del Aplicante"}
            </p>

            <h1 className="text-3xl font-bold leading-tight font-serif italic mb-1 text-center md:text-left">
              Hola, {firstName} {lastName}
            </h1>
            <div className="text-xs text-white/90 font-medium flex flex-col sm:flex-row items-center justify-center md:justify-start gap-x-2 gap-y-1.5 text-center md:text-left">
              <span>ID de Usuario: <span className="font-mono text-white/70">{user.id.substring(0, 8)}...</span></span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span>Registrado desde El Salvador</span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center">
                Cambios de foto: <span className="font-semibold ml-1">{user?.avatarChangesThisMonth || 0}/3 este mes</span>
              </span>
            </div>
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
      <main className="w-[80%] mx-auto py-10 flex-1 flex flex-col lg:flex-row gap-8 transition-all duration-300">

        {/* Columna Izquierda: Tarjeta de Resumen y Menú */}
        <aside className={`w-full ${isSidebarCollapsed ? 'lg:w-[70px]' : 'lg:w-1/4'} flex-shrink-0 transition-all duration-300`}>
          <div className="bg-white rounded-lg border border-border-light overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">

            {/* Sidebar Header with collapse toggle */}
            <div className="p-3 border-b border-border-light flex items-center justify-between">
              {!isSidebarCollapsed && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Menú</span>}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-pointer focus:outline-none transition-colors ${isSidebarCollapsed ? 'mx-auto' : ''}`}
                title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
              >
                {isSidebarCollapsed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg>
                )}
              </button>
            </div>

            {/* Navegación Vertical */}
            <nav className="p-2 flex flex-col gap-1">
              {isLoadingPartnerApp ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`sidebar-skeleton-${index}`}
                    className="w-full flex items-center gap-3 px-4 py-3 animate-pulse"
                  >
                    <div className="w-4 h-4 bg-slate-100 rounded-full shrink-0"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-32"></div>
                  </div>
                ))
              ) : (
                (() => {
                  const isAgent = user && (user.role === ROLES.AGENT || user.role === ROLES.AGENCY);
                  const isStaff = user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR);

                  const svgIcons: Record<string, React.ReactNode> = {
                    datos: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                    proceso: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
                    vipro: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                    asesor: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                    pagos: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
                    admin_dashboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" /></svg>,
                    admin_referidos: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
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
                      { id: "admin_referidos", label: "Leads Referidos de Empresa" },
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

                    if (user.role === ROLES.AGENCY) {
                      const agencyTabs: any[] = [
                        { id: "datos", label: "Mis Datos Personales" },
                        { id: "admin_referidos", label: "Mis Leads Referidos" }
                      ];
                      if (isAccredited) {
                        agencyTabs.push(
                          { id: "invitar_agentes", label: "Link de Referidos" },
                          { id: "comisiones", label: "Comisiones Realizadas" },
                          { id: "metodos_cobro", label: "Métodos de Cobro" }
                        );
                      }
                      agencyTabs.push({ id: "panel_empresa", label: "Mi Acreditación", isLink: true, url: "/agents/portal" });
                      return agencyTabs.map((t: any) => ({ ...t, svgIcon: svgIcons[t.id] }));
                    }

                    // For standard Agent (advisor)
                    const agentTabs: any[] = [
                      { id: "datos", label: "Mis Datos Personales" }
                    ];

                    const isViproCompleted = Boolean(
                      (user.viproCompleted && user.viproScore !== null && user.viproScore !== undefined) ||
                      viproEvaluations.some((ev: any) => 
                        (ev.user_id === user.id || (user.email && ev.user_email?.toLowerCase() === user.email.toLowerCase())) &&
                        ev.is_completed === true &&
                        ev.score !== null &&
                        ev.score !== undefined
                      )
                    );

                    const hasPurchases = dbPurchases.length > 0 || user.hasPaidAdvisor || user.hasPaidVipro || isViproCompleted;

                    if (hasPurchases) {
                      const hasViproPurchase = user.hasPaidVipro || isViproCompleted || dbPurchases.some((p: any) => p.product_type === "vipro");
                      if (hasViproPurchase) {
                        agentTabs.push({ id: "vipro", label: "Evaluación VIPRO" });
                      }
                      agentTabs.push({ id: "pagos", label: "Pagos y Comprobantes" });
                    }

                    if (isAccredited) {
                      agentTabs.push(
                        { id: "chat_agente", label: "Gestión de Casos" },
                        { id: "comisiones", label: "Comisiones Realizadas" },
                        { id: "metodos_cobro", label: "Métodos de Cobro" }
                      );
                    }

                    // "Mi Acreditación" always at the very end
                    agentTabs.push({ id: "mi_acreditacion", label: "Mi Acreditación" });

                    return agentTabs.map((t: any) => ({ ...t, svgIcon: svgIcons[t.id] }));
                  }

                  // --- Default tabs for regular users ---
                  return [
                    ...baseUserTabs,
                    ...((userApplication || partnerApp) ? [{ id: "solicitud", label: "Mi Solicitud de Socio" }] : []),
                  ].map((t: any) => ({ ...t, svgIcon: svgIcons[t.id] }));
                })().map((tab: { id: string; label: string; svgIcon?: React.ReactNode; isLink?: boolean; url?: string }) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.isLink && tab.url) {
                        router.push(tab.url);
                      } else {
                        handleTabChange(tab.id);
                      }
                    }}
                    title={isSidebarCollapsed ? tab.label : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm text-left transition-colors focus:outline-none ${isSidebarCollapsed ? "lg:justify-center lg:px-0" : ""} ${activeTab === tab.id
                      ? "bg-brand-light text-brand-primary font-semibold"
                      : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
                      }`}
                  >
                    <span className={`flex-shrink-0 ${activeTab === tab.id ? "text-brand-primary" : "text-text-muted"} ${isSidebarCollapsed ? "lg:mx-auto" : ""}`}>
                      {tab.svgIcon || <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
                    </span>
                    {!isSidebarCollapsed && <span>{tab.label}</span>}
                    {isSidebarCollapsed && <span className="lg:hidden">{tab.label}</span>}
                  </button>
                ))
              )}
            </nav>
          </div>
        </aside>

        {/* Columna Derecha: Contenido del Tab Activo */}
        <section className={`w-full ${isSidebarCollapsed ? 'lg:flex-grow lg:w-[calc(100%-90px)]' : 'lg:w-3/4'} transition-all duration-300`}>
          <div className="bg-white rounded-lg border border-border-light p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-h-[450px]">
            {isLoadingPartnerApp ? (
              <div className="space-y-6 text-left animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-200 rounded-lg w-64"></div>
                    <div className="h-4 bg-slate-100 rounded-lg w-80"></div>
                  </div>
                  <div className="h-10 bg-slate-200 rounded-lg w-24"></div>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Global Signature Warning banner */}
                {partnerApp && partnerApp.status === "approved" && !partnerApp.signed_at && activeTab !== "solicitud" && (
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-xs animate-fadeIn">
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">✍️</span>
                      <div>
                        <h4 className="font-bold text-amber-800 text-sm">Firma de Acuerdo Comercial Requerida</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed font-sans">
                          Tu postulación de socio ha sido aprobada por la administración. Por favor, firma digitalmente el acuerdo comercial para activar formalmente tu cuenta de especialista y comenzar a recibir clientes.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/agents/portal?id=${partnerApp.application_id}`)}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-sm shadow-sm transition-all focus:outline-none cursor-pointer flex-shrink-0 text-center"
                    >
                      Firmar Acuerdo Ahora &rarr;
                    </button>
                  </div>
                )}

                {/* TAB: ESTADO DE SOLICITUD B2B / ASESOR */}
                {activeTab === "solicitud" && (
                  <div className="space-y-8 animate-fadeIn text-left">
                    <div className="border-b border-border-light pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-text-primary font-serif">
                          Estatus de Solicitud B2B / Asesor
                        </h2>
                        <p className="text-xs text-text-secondary mt-1">
                          Seguimiento en tiempo real del proceso de evaluación de tu postulación como Agencia o Asesor Especializado.
                        </p>
                      </div>
                      {userApplication && (
                        <div className="flex items-center gap-2 bg-brand-light px-3 py-1.5 rounded-full border border-brand-primary/20 text-xs font-semibold text-brand-primary">
                          <span>Folio:</span>
                          <span className="font-mono">{userApplication.application_id || userApplication.id?.substring(0, 8)}</span>
                        </div>
                      )}
                    </div>

                    {isLoadingUserApp ? (
                      <div className="p-8 text-center text-text-muted animate-pulse">
                        Cargando estado de tu solicitud...
                      </div>
                    ) : !userApplication ? (
                      <div className="bg-background-main border border-border-light rounded-xl p-8 text-center space-y-4">
                        <div className="text-4xl">🏢</div>
                        <h3 className="text-lg font-bold text-text-primary">No tienes ninguna solicitud activa en este momento</h3>
                        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                          Si eres una Agencia de Viajes o deseas integrarte a nuestra Red de Asesores Especializados, puedes enviar tu solicitud ahora.
                        </p>
                        <button
                          onClick={() => router.push("/agents/apply")}
                          className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-sm transition-all shadow-sm cursor-pointer"
                        >
                          Enviar Solicitud B2B / Asesor &rarr;
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Status Card Banner */}
                        <div className={`p-6 rounded-xl border transition-all shadow-sm ${
                          userApplication.status === "approved" || userApplication.status === "active"
                            ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                            : userApplication.status === "rejected"
                            ? "bg-rose-50/90 border-rose-200 text-rose-950"
                            : "bg-amber-50/90 border-amber-200/80 text-amber-950"
                        }`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="text-3xl flex-shrink-0 mt-1">
                                {userApplication.status === "approved" || userApplication.status === "active" ? "🎉" : userApplication.status === "rejected" ? "⚠️" : "⏳"}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-extrabold">
                                    {userApplication.status === "approved" || userApplication.status === "active"
                                      ? "¡Solicitud Aprobada!"
                                      : userApplication.status === "rejected"
                                      ? "Solicitud No Aprobada"
                                      : "En Proceso de Evaluación"}
                                  </h3>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                    userApplication.status === "approved" || userApplication.status === "active"
                                      ? "bg-emerald-600 text-white"
                                      : userApplication.status === "rejected"
                                      ? "bg-rose-600 text-white"
                                      : "bg-amber-500 text-white"
                                  }`}>
                                    {userApplication.status === "approved" || userApplication.status === "active"
                                      ? "Aprobado"
                                      : userApplication.status === "rejected"
                                      ? "Rechazado"
                                      : "Pendiente de Revisión"}
                                  </span>
                                </div>
                                <p className="text-xs mt-2 leading-relaxed">
                                  {userApplication.status === "approved" || userApplication.status === "active"
                                    ? "Tu expediente ha sido verificado satisfactoriamente por el equipo directivo de TodoVisa. Ya dispones de acreditación comercial."
                                    : userApplication.status === "rejected"
                                    ? "Tu solicitud fue evaluada por nuestro equipo administrativo pero no cumple con los criterios de admisión requeridos en este momento."
                                    : "Tu postulación ha sido recibida y se encuentra actualmente bajo auditoría por parte del comité de admisiones de TodoVisa."}
                                </p>
                              </div>
                            </div>

                            {(userApplication.status === "approved" || userApplication.status === "active") && (
                              <button
                                onClick={() => router.push(`/agents/portal?id=${userApplication.application_id || userApplication.id}`)}
                                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-sm transition-all flex-shrink-0 cursor-pointer"
                              >
                                Acceder al Portal B2B &rarr;
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Stepper Progress */}
                        <div className="bg-white border border-border-light rounded-xl p-6 shadow-xs">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-6 text-left">
                            Línea de Proceso de Admisión
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                            {/* Step 1 */}
                            <div className="flex flex-col items-start p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
                              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-2">✓</span>
                              <span className="text-xs font-bold text-emerald-950">1. Envió de Solicitud</span>
                              <span className="text-[10px] text-emerald-700 mt-1">
                                {userApplication.created_at ? new Date(userApplication.created_at).toLocaleDateString("es-ES") : "Completado"}
                              </span>
                            </div>

                            {/* Step 2 */}
                            <div className={`flex flex-col items-start p-4 rounded-lg border ${
                              userApplication.status === "approved" || userApplication.status === "active"
                                ? "bg-emerald-50/60 border-emerald-200"
                                : userApplication.status === "rejected"
                                ? "bg-rose-50/60 border-rose-200"
                                : "bg-amber-50/80 border-amber-300 animate-pulse"
                            }`}>
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mb-2 ${
                                userApplication.status === "approved" || userApplication.status === "active"
                                  ? "bg-emerald-600 text-white"
                                  : userApplication.status === "rejected"
                                  ? "bg-rose-600 text-white"
                                  : "bg-amber-500 text-white"
                              }`}>
                                {userApplication.status === "approved" || userApplication.status === "active" ? "✓" : userApplication.status === "rejected" ? "✕" : "2"}
                              </span>
                              <span className="text-xs font-bold text-text-primary">2. Revisión de Documentos</span>
                              <span className="text-[10px] text-text-secondary mt-1">
                                {userApplication.status === "approved" || userApplication.status === "active"
                                  ? "Verificado"
                                  : userApplication.status === "rejected"
                                  ? "No aprobado"
                                  : "En auditoría presencial"}
                              </span>
                            </div>

                            {/* Step 3 */}
                            <div className={`flex flex-col items-start p-4 rounded-lg border ${
                              userApplication.status === "approved" || userApplication.status === "active"
                                ? "bg-emerald-50/60 border-emerald-200"
                                : "bg-gray-50 border-gray-200 opacity-60"
                            }`}>
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mb-2 ${
                                userApplication.status === "approved" || userApplication.status === "active"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-gray-300 text-gray-600"
                              }`}>
                                {userApplication.status === "approved" || userApplication.status === "active" ? "✓" : "3"}
                              </span>
                              <span className="text-xs font-bold text-text-primary">3. Aprobación y Convenio</span>
                              <span className="text-[10px] text-text-secondary mt-1">
                                {userApplication.status === "approved" || userApplication.status === "active" ? "Acreditado" : "Pendiente"}
                              </span>
                            </div>

                            {/* Step 4 */}
                            <div className={`flex flex-col items-start p-4 rounded-lg border ${
                              userApplication.status === "approved" || userApplication.status === "active"
                                ? "bg-emerald-50/60 border-emerald-200"
                                : "bg-gray-50 border-gray-200 opacity-60"
                            }`}>
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mb-2 ${
                                userApplication.status === "approved" || userApplication.status === "active"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-gray-300 text-gray-600"
                              }`}>
                                {userApplication.status === "approved" || userApplication.status === "active" ? "✓" : "4"}
                              </span>
                              <span className="text-xs font-bold text-text-primary">4. Activación de Portal</span>
                              <span className="text-[10px] text-text-secondary mt-1">
                                {userApplication.status === "approved" || userApplication.status === "active" ? "Habilitado" : "Pendiente"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-white border border-border-light rounded-xl p-6 shadow-xs space-y-4">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary border-b border-border-light pb-3 text-left">
                            Resumen del Expediente Registrado
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                            <div>
                              <span className="text-text-muted block font-semibold uppercase text-[10px]">Nombre / Empresa</span>
                              <span className="text-text-primary font-bold text-sm">{userApplication.full_name || user.email}</span>
                            </div>
                            <div>
                              <span className="text-text-muted block font-semibold uppercase text-[10px]">Correo Electrónico</span>
                              <span className="text-text-primary font-bold text-sm">{userApplication.email}</span>
                            </div>
                            <div>
                              <span className="text-text-muted block font-semibold uppercase text-[10px]">Teléfono de Contacto</span>
                              <span className="text-text-primary font-bold">{userApplication.phone || "No especificado"}</span>
                            </div>
                            <div>
                              <span className="text-text-muted block font-semibold uppercase text-[10px]">País de Residencia</span>
                              <span className="text-text-primary font-bold">{userApplication.country_residence || "No especificado"}</span>
                            </div>
                            <div>
                              <span className="text-text-muted block font-semibold uppercase text-[10px]">Años de Experiencia</span>
                              <span className="text-text-primary font-bold">{userApplication.experience_years ? `${userApplication.experience_years} años` : "No especificado"}</span>
                            </div>
                            {userApplication.specialties && userApplication.specialties.length > 0 && (
                              <div className="col-span-2">
                                <span className="text-text-muted block font-semibold uppercase text-[10px] mb-1">Especialidades</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {userApplication.specialties.map((spec: string, idx: number) => (
                                    <span key={idx} className="bg-brand-light text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded border border-brand-primary/20">
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {userApplication.target_countries && userApplication.target_countries.length > 0 && (
                              <div className="col-span-2">
                                <span className="text-text-muted block font-semibold uppercase text-[10px] mb-1">Países Destino que Domina</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {userApplication.target_countries.map((c: string, idx: number) => (
                                    <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

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
                    myEvals.length > 0
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
                          <h4 className="text-sm font-bold text-text-primary mb-1">Diagnóstico de Probabilidad Consular (${viproPrice.toFixed(2)} USD)</h4>
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
                              Adquirir VIPRO por ${viproPrice.toFixed(2)} USD &rarr;
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
                          <h4 className="text-sm font-bold text-text-primary mb-1">Preformulario + Llenado DS-160 + Acompañamiento (${fullServicePrice.toFixed(2)} USD)</h4>
                          <p className="text-xs text-text-secondary leading-relaxed mb-4">
                            Asesoría con Asesores Expertos, llenado oficial de formulario consular, auditoría de expediente y simulacros Zoom.
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
                                Chat con Asesor
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
                              Seleccionar Asesor (${fullServicePrice.toFixed(2)} USD) &rarr;
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
                              Para habilitar los pasos interactivos de seguimiento en tu perfil, debes contratar la **Evaluación Diagnóstica VIPRO ($${viproPrice.toFixed(2)} USD)** o la **Asesoría Consular Completa con Asesor (${(fullServicePrice * 0.75).toFixed(2)} USD)**.
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
                                Paso Opcional: Asesoría Personalizada
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
                              Seleccionar Asesor (${(fullServicePrice * 0.75).toFixed(2)} USD) &rarr;
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* TIMELINE COMPLETO DE 6 PASOS (CON ASESOR) */
                        <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:right-auto before:w-0.5 before:bg-gray-200 mt-4 text-left">

                          {/* BANNER DE SERVICIO COMPLETADO AL 100% */}
                          {(() => {
                            const activeCita = userAppointmentRequest || user?.appointmentRequest;
                            const isCitaConfirmed = activeCita?.status === 'confirmed';
                            const isStep1Done = true;
                            const isStep2Done = isPreformularioCompleted;
                            const isStep3Done = !!user?.hasPaidAdvisor || !!assignedAgentProfile || !!user?.assignedAgencyName;
                            const isStep4Done = expedienteStatus === 'approved';
                            const isStep5Done = isCitaConfirmed;
                            const isStep6Done = agentReviewSubmitted;

                            const isAllComplete = isStep1Done && isStep2Done && isStep3Done && isStep4Done && isStep5Done && isStep6Done;

                            if (!isAllComplete) return null;

                            return (
                              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-md text-left space-y-2 mb-6 shadow-2xs">
                                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">🎉</span>
                                    <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider">
                                      ¡Servicio Consular TodoVisa Completado al 100%!
                                    </h3>
                                  </div>
                                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    6 / 6 PASOS COMPLETADOS
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-900 leading-relaxed">
                                  Has completado exitosamente todos los 6 Pasos del proceso de acompañamiento consular. Tu expediente ha sido auditado por tu asesor, tu cita presencial / simulacro consular ha sido confirmada y has dejado tu reseña oficial. ¡Éxitos en tu trámite consular!
                                </p>
                              </div>
                            );
                          })()}

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
                                <h4 className="text-sm font-bold text-text-primary">Paso 3: Conexión con Asesor Experto y Chat</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.hasPaidAdvisor ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                                  {user.hasPaidAdvisor ? "COMPLETADO" : "ACCIÓN REQUERIDA"}
                                </span>
                              </div>

                              {user.hasPaidAdvisor ? (
                                <div>
                                  <p className="text-xs text-text-secondary">
                                    Has asignado correctamente a tu asesor experto: <span className="font-semibold text-text-primary">{assignedAgent?.name || user.assignedAgencyName || "Tu Asesor Asignado"}</span>.
                                  </p>
                                  <button
                                    onClick={() => setActiveTab("asesor")}
                                    className="mt-3 text-xs text-brand-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    💬 Ir a mi Chat con Asesor
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <p className="text-xs text-text-secondary leading-relaxed">
                                    Selecciona tu asesor certificado preferido para iniciar la atención 1-a-1.
                                  </p>
                                  <button
                                    onClick={() => router.push("/agents")}
                                    className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-sm transition-colors shadow-sm cursor-pointer"
                                  >
                                    Elegir Asesor Consular
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Paso 4 */}
                          <div className={`flex gap-4 relative transition-all ${user?.hasPaidAdvisor ? "" : "opacity-60"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${expedienteStatus === 'approved' ? "bg-brand-primary text-white shadow-xs" : expedienteStatus === 'submitted' ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-text-muted"}`}>
                              {expedienteStatus === 'approved' ? "✓" : "4"}
                            </div>
                            <div className={`flex-1 rounded-md p-4 border ${expedienteStatus === 'approved' ? "bg-white border-emerald-200 shadow-sm" : expedienteStatus === 'submitted' ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"}`}>
                              <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                                <h4 className={`text-sm font-bold ${user?.hasPaidAdvisor ? "text-text-primary" : "text-text-secondary"}`}>
                                  Paso 4: Expediente Probatorio (4 Requisitos) y Formulario Oficial DS-160
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                  expedienteStatus === 'approved'
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
                                    : expedienteStatus === 'submitted'
                                      ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {expedienteStatus === 'approved' ? "✅ EXPEDIENTE APROBADO" : expedienteStatus === 'submitted' ? "⏳ EN AUDITORÍA" : "PENDIENTE DE ENVIAR"}
                                </span>
                              </div>
                              <p className={`text-xs ${user?.hasPaidAdvisor ? "text-text-secondary" : "text-text-muted"} leading-relaxed`}>
                                Sube la documentación probatoria requerida y revisa los datos de tu formulario consular oficial antes de enviarlo a dictamen del asesor.
                              </p>
                              {user?.hasPaidAdvisor && (
                                <div className="mt-4 pt-3 border-t border-border-light space-y-4">
                                  {/* Grid 4 Requisitos */}
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                      📁 Documentos de Arraigo Probatorio:
                                    </span>
                                    {(() => {
                                      const renderDocReviewBadge = (docType: string) => {
                                        const rev = clientDocReviews[docType];
                                        if (!rev || rev.status === 'pending') {
                                          return (
                                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                              Pendiente de Revisión
                                            </span>
                                          );
                                        }
                                        if (rev.status === 'approved') {
                                          return (
                                            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                              ✅ Aprobado
                                            </span>
                                          );
                                        }
                                        if (rev.status === 'observed') {
                                          return (
                                            <div className="space-y-1">
                                              <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                                ⚠️ Observado por Asesor
                                              </span>
                                              {rev.comment && (
                                                <p className="text-[10px] text-amber-950 italic bg-amber-50 p-1.5 rounded border border-amber-200">
                                                  💬 &quot;{rev.comment}&quot;
                                                </p>
                                              )}
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="space-y-1">
                                            <span className="text-[9px] font-extrabold text-red-900 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                                              ❌ Rechazado
                                            </span>
                                            {rev.comment && (
                                              <p className="text-[10px] text-red-950 italic bg-red-50 p-1.5 rounded border border-red-200">
                                                💬 &quot;{rev.comment}&quot;
                                              </p>
                                            )}
                                          </div>
                                        );
                                      };

                                      return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {/* Pasaporte */}
                                          <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                            <div>
                                              <span className="text-xs font-bold text-text-primary block">1. Pasaporte Vigente</span>
                                              <span className="text-[9px] text-text-muted">Primera página con datos de identidad.</span>
                                              <div className="flex items-center justify-between gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                                    {clientDocs.passport || "❌ No subido"}
                                                  </span>
                                                  {clientDocs.passport_url && (
                                                    <a
                                                      href={clientDocs.passport_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-brand-primary hover:text-brand-hover border border-brand-primary/30 hover:border-brand-primary px-1.5 py-0.5 rounded transition-colors no-underline"
                                                    >
                                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                      Ver
                                                    </a>
                                                  )}
                                                </div>
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
                                              {renderDocReviewBadge('passport')}
                                            </div>
                                          </div>

                                          {/* DUI */}
                                          <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                            <div>
                                              <span className="text-xs font-bold text-text-primary block">2. DUI / Identificación</span>
                                              <span className="text-[9px] text-text-muted">Copia legible por ambos lados.</span>
                                              <div className="flex items-center justify-between gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                                    {clientDocs.dui || "❌ No subido"}
                                                  </span>
                                                  {clientDocs.dui_url && (
                                                    <a
                                                      href={clientDocs.dui_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-brand-primary hover:text-brand-hover border border-brand-primary/30 hover:border-brand-primary px-1.5 py-0.5 rounded transition-colors no-underline"
                                                    >
                                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                      Ver
                                                    </a>
                                                  )}
                                                </div>
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
                                              {renderDocReviewBadge('dui')}
                                            </div>
                                          </div>

                                          {/* Constancia Laboral */}
                                          <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                            <div>
                                              <span className="text-xs font-bold text-text-primary block">3. Arraigo Laboral / Académico</span>
                                              <span className="text-[9px] text-text-muted">Constancia laboral firmada o matrícula de estudios.</span>
                                              <div className="flex items-center justify-between gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                                    {clientDocs.workCert || "❌ No subido"}
                                                  </span>
                                                  {clientDocs.workCert_url && (
                                                    <a
                                                      href={clientDocs.workCert_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-brand-primary hover:text-brand-hover border border-brand-primary/30 hover:border-brand-primary px-1.5 py-0.5 rounded transition-colors no-underline"
                                                    >
                                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                      Ver
                                                    </a>
                                                  )}
                                                </div>
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
                                              {renderDocReviewBadge('workCert')}
                                            </div>
                                          </div>

                                          {/* Solvencia Bancaria */}
                                          <div className="bg-background-main/30 border border-border-light rounded-sm p-3 flex flex-col justify-between gap-2.5">
                                            <div>
                                              <span className="text-xs font-bold text-text-primary block">4. Solvencia Económica</span>
                                              <span className="text-[9px] text-text-muted">Estados de cuenta bancarios (últimos 3 meses).</span>
                                              <div className="flex items-center justify-between gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <span className="text-[10px] truncate max-w-[120px] font-mono text-text-secondary">
                                                    {clientDocs.bankStatements || "❌ No subido"}
                                                  </span>
                                                  {clientDocs.bankStatements_url && (
                                                    <a
                                                      href={clientDocs.bankStatements_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-brand-primary hover:text-brand-hover border border-brand-primary/30 hover:border-brand-primary px-1.5 py-0.5 rounded transition-colors no-underline"
                                                    >
                                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                      Ver
                                                    </a>
                                                  )}
                                                </div>
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
                                              {renderDocReviewBadge('bankStatements')}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
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
                          {(() => {
                            const activeCita = userAppointmentRequest || user?.appointmentRequest;
                            const isConfirmed = activeCita?.status === 'confirmed';
                            const isPaso5Enabled = expedienteStatus === 'approved' && isPreformularioCompleted;
                            return (
                              <div className={`flex gap-4 relative transition-all ${isPaso5Enabled ? "" : "opacity-60"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${
                                  isConfirmed
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : isPaso5Enabled
                                      ? "bg-amber-500 text-white animate-pulse"
                                      : "bg-gray-200 text-text-muted"
                                }`}>
                                  {isConfirmed ? "✓" : "5"}
                                </div>
                                <div className={`flex-1 rounded-md p-4 border ${isPaso5Enabled ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"}`}>
                                  <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                                    <h4 className={`text-sm font-bold ${isPaso5Enabled ? "text-text-primary" : "text-text-secondary"}`}>
                                      Paso 5: Programación de Cita / Entrega Drop Box y Simulacro Consular por Zoom
                                    </h4>
                                    {isPaso5Enabled ? (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${
                                        isConfirmed
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
                                          : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                                      }`}>
                                        {isConfirmed ? "✓ CITA CONFIRMADA" : "LISTO PARA AGENDAR"}
                                      </span>
                                    ) : (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${!isPreformularioCompleted ? "bg-red-50 text-red-800 border-red-200 font-bold" : "bg-amber-50 text-amber-800 border-amber-200 font-bold"}`}>
                                        {!isPreformularioCompleted ? "REQUIERE PREFORMULARIO (PASO 2)" : "REQUIERE AUDITORÍA (PASO 4)"}
                                      </span>
                                    )}
                                  </div>
                              <p className={`text-xs ${isPaso5Enabled ? "text-text-secondary" : "text-text-muted"} leading-relaxed`}>
                                <strong>Primera Vez:</strong> Agendamiento de cita en CAS y Embajada con entrenamiento de simulacro por Zoom.<br />
                                <strong>Renovación EE.UU. (Interview Waiver):</strong> Depósito de paquete en buzón CAS sin cita presencial ante cónsul (si vence &lt;48 meses).<br />
                                <strong>Renovación México / Canadá / Australia / China:</strong> Flujo de cita regular o biométricos asistidos con alta seguridad de aprobación por historial positivo.
                              </p>
                              {!isPaso5Enabled && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-950 flex items-center gap-2 font-semibold">
                                  <span>⚠️</span>
                                  <span>
                                    {!isPreformularioCompleted
                                      ? "Debes completar tu Preformulario Consular (Paso 2) antes de agendar tu cita."
                                      : "Tu expediente (Paso 4) debe ser aprobado por tu asesor antes de agendar tu cita."}
                                  </span>
                                </div>
                              )}
                              {isPaso5Enabled && (() => {
                                const activeCita = userAppointmentRequest || user?.appointmentRequest;
                                const isConfirmed = activeCita?.status === 'confirmed';
                                return (
                                  <div className="mt-3 pt-3 border-t border-border-light space-y-3">
                                    {/* Muestra corporativa limpia de los detalles de la cita confirmada */}
                                    {isConfirmed && activeCita && (
                                      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-3">
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-brand-primary">📅</span>
                                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                              Detalles de tu Cita Confirmada
                                            </span>
                                          </div>
                                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                            CONFIRMADA
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-sm border border-slate-200">
                                          <div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Trámite</span>
                                            <span className="font-semibold text-slate-900 block mt-0.5">{activeCita.appointment_type || "Simulacro / Cita Consular"}</span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Fecha Confirmada</span>
                                            <span className="font-bold text-brand-primary text-xs block mt-0.5">{activeCita.confirmed_date || activeCita.requested_date || "Por definir"}</span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Hora Confirmada</span>
                                            <span className="font-bold text-brand-primary text-xs block mt-0.5">{activeCita.confirmed_time || activeCita.requested_time || "10:00"} hrs</span>
                                          </div>
                                        </div>

                                        {activeCita.meeting_link ? (
                                          <div className="bg-white p-3 rounded-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enlace Virtual (Zoom / Meet):</span>
                                              <span className="text-xs font-mono font-medium text-slate-800 block truncate mt-0.5">
                                                {activeCita.meeting_link}
                                              </span>
                                            </div>
                                            <a
                                              href={activeCita.meeting_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all flex items-center gap-1.5 no-underline shrink-0"
                                            >
                                              <span>🎥 Unirse a la Reunión →</span>
                                            </a>
                                          </div>
                                        ) : activeCita.agent_notes && (
                                          <p className="text-xs text-slate-700 italic bg-white p-3 rounded-sm border border-slate-200">
                                            💬 Nota del Asesor: &quot;{activeCita.agent_notes}&quot;
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {!isConfirmed && activeCita?.meeting_link && (
                                      <div className="p-3 bg-white border border-slate-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            🎥 Enlace de Reunión (Zoom / Meet)
                                          </span>
                                          <span className="text-xs text-slate-800 font-mono font-medium block truncate max-w-sm mt-0.5">
                                            {activeCita.meeting_link}
                                          </span>
                                        </div>
                                        <a
                                          href={activeCita.meeting_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all flex items-center gap-1.5 no-underline shrink-0"
                                        >
                                          <span>🎥 Unirse a la Reunión →</span>
                                        </a>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-3 items-center">
                                      <button
                                        onClick={() => {
                                          if (!isConfirmed) {
                                            router.push(`/citas?processId=${user.id}`);
                                          }
                                        }}
                                        disabled={isConfirmed}
                                        className={`px-4 py-2 text-xs font-bold rounded-sm transition-colors ${
                                          isConfirmed
                                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                            : "bg-brand-primary text-white hover:bg-brand-hover cursor-pointer"
                                        }`}
                                      >
                                        {isConfirmed ? "🔒 Cita Confirmada (No Modificable)" : "🎥 Coordinar Fechas / Citas →"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })()}

                        {/* Paso 6: Calificación y Reseña del Servicio del Asesor */}
                          <div className={`flex gap-4 relative transition-all ${user?.appointmentRequest?.status === 'confirmed' || userAppointmentRequest?.status === 'confirmed' || expedienteStatus === 'approved' ? "" : "opacity-60"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${agentReviewSubmitted ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                              6
                            </div>
                            <div className="flex-1 bg-white border border-border-light rounded-md p-4 space-y-3 shadow-2xs">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div>
                                  <h4 className="text-sm font-bold text-text-primary">
                                    Paso 6: Calificación y Reseña del Servicio de tu Asesor
                                  </h4>
                                  <p className="text-xs text-text-muted mt-0.5">
                                    Califica la atención brindada por tu asesor para finalizar el proceso de acompañamiento.
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${
                                  agentReviewSubmitted
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {agentReviewSubmitted ? "✓ RESEÑA COMPLETADA" : "PENDIENTE DE CALIFICAR"}
                                </span>
                              </div>

                              {agentReviewSubmitted ? (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">Tu Calificación:</span>
                                    <div className="flex items-center gap-1 text-amber-500">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className="text-sm">
                                          {star <= userRating ? "★" : "☆"}
                                        </span>
                                      ))}
                                    </div>
                                    <span className="text-xs font-bold text-slate-900">({userRating}/5 estrellas)</span>
                                  </div>
                                  {userReviewComment && (
                                    <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-sm border border-slate-200">
                                      💬 Comentario enviado: &quot;{userReviewComment}&quot;
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3 pt-1">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                      Selecciona tu Calificación (Estrellas):
                                    </label>
                                    <div className="flex items-center gap-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setUserRating(star)}
                                          className={`text-2xl transition-transform cursor-pointer hover:scale-125 focus:outline-none ${
                                            star <= userRating ? "text-amber-400" : "text-slate-300 hover:text-amber-200"
                                          }`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                      {userRating > 0 && (
                                        <span className="text-xs font-bold text-slate-700 ml-2">
                                          {userRating === 5 ? "Excelente" : userRating === 4 ? "Muy Bueno" : userRating === 3 ? "Bueno" : userRating === 2 ? "Regular" : "Malo"}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <label htmlFor="userReviewComment" className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                      Comentario o Reseña sobre tu Asesor:
                                    </label>
                                    <textarea
                                      id="userReviewComment"
                                      rows={3}
                                      value={userReviewComment}
                                      onChange={(e) => setUserReviewComment(e.target.value)}
                                      placeholder="Escribe tu reseña sobre la atención, puntualidad y asesoría recibida..."
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-medium"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleSaveAgentReview}
                                    disabled={isSubmittingReview || userRating === 0}
                                    className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all shadow-xs cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed border-none flex items-center gap-2"
                                  >
                                    {isSubmittingReview ? (
                                      <span>Guardando reseña...</span>
                                    ) : (
                                      <>
                                        <span>⭐</span>
                                        <span>Enviar Calificación y Reseña</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
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

                  const myEvals = viproEvaluations.filter((ev: any) => 
                    ev.user_id === user.id || (user.email && ev.user_email?.toLowerCase() === user.email.toLowerCase())
                  );
                  const completedEvals = myEvals.filter((ev: any) => 
                    ev.is_completed === true &&
                    ev.score !== null &&
                    ev.score !== undefined
                  );
                  const isViproCompleted = Boolean(
                    (user.viproCompleted && user.viproScore !== null && user.viproScore !== undefined) ||
                    completedEvals.length > 0
                  );
                  const hasCompleted = isViproCompleted;
                  const latestEval = completedEvals.length > 0 ? completedEvals[0] : (myEvals.length > 0 ? myEvals[0] : null);

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
                        <div className="bg-brand-light/20 border border-brand-primary/15 rounded-2xl text-left max-w-2xl mx-auto mt-4 animate-in fade-in duration-300 p-6 md:p-8">
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-6">
                            <div className="w-11 h-11 bg-brand-light/50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-primary opacity-80">
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
                                <svg className="w-3.5 h-3.5 text-brand-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
                              <span className="text-xl font-extrabold text-brand-primary font-mono">${viproPrice.toFixed(2)} USD</span>
                            </div>
                            <button
                              onClick={() => router.push("/vipro-form")}
                              className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all focus:outline-none shadow-md text-center cursor-pointer font-sans tracking-wide"
                            >
                              Adquirir Evaluación VIPRO &rarr;
                            </button>
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
                      <div className="space-y-6 animate-fade-in">
                        {/* Advisor Info Bar (Company / Agency Details) */}
                        <div className="bg-gradient-to-r from-white to-[#FAF9F6] rounded-2xl border border-border-light p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-brand-primary/20 transition-all duration-300 flex flex-col sm:flex-row items-center gap-5">
                          <div className="relative">
                            <img
                              src={assignedAgentProfile?.photo_url || assignedAgencyProfile?.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"}
                              alt={assignedAgentProfile ? `${assignedAgentProfile.first_name} ${assignedAgentProfile.last_name || ""}` : "Asesor"}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                            />
                            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white bg-emerald-400"></span>
                          </div>
                          <div className="text-center sm:text-left flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                              <h5 className="font-bold text-text-primary text-base tracking-tight">
                                {assignedAgentProfile ? `${assignedAgentProfile.first_name} ${assignedAgentProfile.last_name || ""}`.trim() : (assignedAgencyProfile ? `${assignedAgencyProfile.first_name} ${assignedAgencyProfile.last_name || ""}`.trim() : (user?.assignedAgencyName || "Asesor TodoVisa"))}
                              </h5>
                              <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                                👤 ASESOR ASIGNADO
                              </span>
                            </div>
                            <p className="text-xs text-brand-primary font-bold">
                              {assignedAgentProfile?.location ? `📍 ${assignedAgentProfile.location}` : (assignedAgencyProfile?.location ? `📍 ${assignedAgencyProfile.location}` : "Consulado y Trámites de Visa")}
                            </p>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {assignedAgentProfile?.bio || assignedAgencyProfile?.bio || "Asesor consular certificado. Tu expediente cuenta con auditoría y respaldo institucional."}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start text-xs text-text-secondary mt-2 pt-1.5 border-t border-dashed border-border-light">
                              {assignedAgencyProfile && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-brand-light text-brand-primary font-semibold px-2 py-0.5 rounded-sm">
                                    Empresa: {assignedAgencyProfile.first_name} {assignedAgencyProfile.last_name}
                                  </span>
                                </div>
                              )}
                              {assignedAgentProfile?.phone && (
                                <span>• Tel: {assignedAgentProfile.phone}</span>
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
                                  src={assignedAgentProfile?.photo_url || assignedAgencyProfile?.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"}
                                  alt="Asesor"
                                  className="w-10 h-10 rounded-full object-cover border border-border-light shadow-sm"
                                />
                                <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-text-primary text-sm leading-tight">
                                  {assignedAgentProfile ? `${assignedAgentProfile.first_name} ${assignedAgentProfile.last_name || ""}`.trim() : (assignedAgencyProfile ? `${assignedAgencyProfile.first_name} ${assignedAgencyProfile.last_name || ""}`.trim() : (user?.assignedAgencyName || "Asesor TodoVisa"))}
                                </h4>
                                <p className="text-[9px] text-text-muted mt-0.5">
                                  {assignedAgentProfile ? "Asesor Consular Acreditado" : "Soporte Técnico Especializado"}
                                </p>
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
                {activeTab === "pagos" && (() => {
                  const actualPurchases: any[] = [];
                  if (user.hasPaidVipro) {
                    actualPurchases.push({
                      id: "purch-vipro",
                      reference_id: "TV-VIPRO-8429",
                      product_type: "vipro",
                      payment_method: "Tarjeta",
                      created_at: new Date().toISOString(),
                      amount: String(viproPrice),
                      status: "completed"
                    });
                  }
                  if (user.hasPaidAdvisor) {
                    actualPurchases.push({
                      id: "purch-advisor",
                      reference_id: "TV-ASES-3820",
                      product_type: "advisor",
                      payment_method: "Tarjeta",
                      created_at: new Date().toISOString(),
                      amount: String(fullServicePrice),
                      status: "completed"
                    });
                  }
                  return (
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
                            {actualPurchases.length > 0 ? (
                              actualPurchases.map((purchase) => {
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
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-100">
                                        PAGADO
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                      {isViproItem ? (
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
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-8 px-4 text-center text-text-muted italic bg-background-main/10">
                                  No has realizado ningún pago todavía.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {actualPurchases.length > 0 && actualPurchases.some(p => p.product_type === "vipro") && (
                        <div className="mt-8 bg-brand-light/30 border border-brand-primary/10 rounded-md p-5 flex items-start gap-4">
                          <span className="text-xl">💡</span>
                          <div>
                            <h5 className="font-bold text-text-primary text-xs mb-1">Garantía de Aprobación de Descuento</h5>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              Como completaste tu evaluación VIPRO de ${viproPrice.toFixed(2)} USD, tienes activo un cupón del <span className="font-bold text-brand-primary">25% de descuento</span> aplicable a cualquier trámite de asesoría formal con nuestros agentes de la red. ¡Contáctalos para aplicarlo!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                          ? (partnerApp.signed_at ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-amber-50/50 border-amber-200 text-amber-800")
                          : partnerApp.status === "rejected"
                            ? "bg-red-50/50 border-red-200 text-red-800"
                            : "bg-amber-50/50 border-amber-200 text-amber-800"
                          }`}>
                          <h4 className="font-bold text-sm mb-1">
                            {partnerApp.status === "approved" || partnerApp.status === "active"
                              ? (partnerApp.signed_at ? "¡Tu solicitud ha sido aprobada!" : "⚠️ Firma de Acuerdo Comercial Requerida")
                              : partnerApp.status === "rejected"
                                ? "Tu solicitud requiere cambios"
                                : "Postulación recibida"}
                          </h4>
                          <p className="text-xs leading-relaxed opacity-90">
                            {partnerApp.status === "approved" || partnerApp.status === "active"
                              ? (partnerApp.signed_at
                                ? "Tu cuenta de agente consultor se encuentra activa. Ya puedes acceder al panel de administración de casos de TodoVisa para recibir clientes."
                                : "Tu postulación ha sido aprobada por la administración. Para comenzar a operar y recibir clientes, por favor firma digitalmente el acuerdo comercial desde tu portal de socio.")
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

                        {/* Actions for editing application & viewing full portal */}
                        <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-border-light">
                          <button
                            onClick={() => {
                              const targetId = partnerApp.application_id || partnerApp.id;
                              if (targetId) {
                                router.push(`/agents/portal?id=${encodeURIComponent(targetId)}`);
                              } else {
                                router.push("/agents/portal");
                              }
                            }}
                            className="px-5 py-2.5 bg-white border border-border-light text-text-primary text-xs font-bold rounded-sm hover:bg-background-hover transition-colors cursor-pointer shadow-2xs"
                          >
                            👁 Ver Solicitud Completa →
                          </button>

                          {(partnerApp.status === "rejected" || partnerApp.status === "draft") && (
                            <button
                              onClick={() => router.push("/agents/apply")}
                              className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors shadow-sm cursor-pointer"
                            >
                              Corregir o Modificar Postulación →
                            </button>
                          )}
                        </div>
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
                                            setIsEditingStatus(false);
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

                          {selectedApp.status === "pending" || isEditingStatus ? (
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
                              {isEditingStatus && (
                                <button
                                  onClick={() => setIsEditingStatus(false)}
                                  className="px-3 py-2 bg-white border border-border-light text-text-secondary text-xs font-bold rounded-sm hover:bg-background-hover transition-colors cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${selectedApp.status === "approved" || selectedApp.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                                }`}>
                                {selectedApp.status === "approved" || selectedApp.status === "active" ? "✓ APROBADO" : "✕ RECHAZADO / DEVUELTO"}
                              </span>
                              <button
                                onClick={() => {
                                  setIsEditingStatus(true);
                                  // Clear comments to force entering a new reason for status change
                                  setAdminNotesInput("");
                                }}
                                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-sm shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                              >
                                ⚙️ Cambiar Estado
                              </button>
                            </div>
                          )}
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
                              {allProfilesList.length.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-text-muted mt-1 font-medium">Total de usuarios registrados</p>
                          </div>

                          <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">VIPRO C</span>
                              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-3xl font-black text-[#113E5F] font-mono">
                              {dbPurchases.filter((p: any) => p.product_type === "vipro").length.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-text-muted mt-1 font-medium">Evaluaciones VIPRO adquiridas</p>
                          </div>

                          <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">Agentes</span>
                              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-3xl font-black text-[#113E5F] font-mono">
                              {agentsCount.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-text-muted mt-1 font-medium">Agentes registrados ({agenciesCount} agencias, {pendingAppsCount} pend.)</p>
                          </div>

                          <div className="bg-white p-5 border border-border-light rounded-2xl shadow-xs hover:border-[#113E5F]/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113E5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#113E5F]/10">Ingreso Total</span>
                              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-3xl font-black text-[#113E5F] font-mono">
                              ${dbPurchases.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-text-muted mt-1 font-medium">Total procesado</p>
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
                          Supervisar preformularios completados, auditoría de formularios DS-160 y documentos cargados.
                        </p>
                      </button>
                    </div>

                    {/* System Configuration Panel */}
                    <div className="bg-white p-6 border border-border-light rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-border-light pb-3">
                        <svg className="w-5 h-5 text-[#113E5F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Configuración de Precios del Sistema</h3>
                      </div>
                      <div className="flex flex-col gap-4 max-w-md text-left">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                            Precio Asesoría Consular Completa ($ USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fullServicePrice}
                            onChange={(e) => setFullServicePrice(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2 border border-border-light rounded-lg focus:outline-none focus:border-[#113E5F] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                            Precio Evaluación VIPRO ($ USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={viproPrice}
                            onChange={(e) => setViproPrice(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2 border border-border-light rounded-lg focus:outline-none focus:border-[#113E5F] font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <button
                          onClick={async () => {
                            try {
                              // Guardar en la base de datos de Supabase primero
                              await SettingsClientService.updateSettings({
                                vipro_price: String(viproPrice),
                                full_service_price: String(fullServicePrice),
                              });

                              // Guardar en localStorage para reactividad local instantánea
                              localStorage.setItem("fullServicePrice", String(fullServicePrice));
                              localStorage.setItem("viproPrice", String(viproPrice));

                              showToast(`Precios actualizados correctamente en base de datos. Asesoría: $${Number(fullServicePrice).toFixed(2)} USD, VIPRO: $${Number(viproPrice).toFixed(2)} USD.`, "success");
                              window.dispatchEvent(new Event("storage"));
                            } catch (err: any) {
                              showToast(`Error al guardar precios en la base de datos: ${err.message || err}`, "error");
                            }
                          }}
                          className="px-6 py-2 bg-[#113E5F] hover:bg-[#0f3755] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Guardar Precios
                        </button>
                      </div>
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
                                    No se encontraron usuarios registrados en el sistema.
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
                        <p className="text-xs text-text-secondary mt-1">Revisión centralizada de preformularios, estado de DS-160 y archivos cargados.</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border-light">
                      <table className="w-full text-xs text-left text-text-primary">
                        <thead className="bg-background-main text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-light">
                          <tr>
                            <th className="py-3 px-4">Solicitante</th>
                            <th className="py-3 px-4">Preformulario</th>
                            <th className="py-3 px-4">Documentos Cargados</th>
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
                                const key = `app_${app.id || app.application_id || app.email}`;
                                solicitudesMap.set(key, {
                                  id: app.id || app.application_id,
                                  user_id: app.user_id || app.id,
                                  type: app.documents?.partner_type === "b2b_agency" || app.application_type === "agency" ? "🏢 Acreditación de Agencia B2B" : "👤 Solicitud de Asesor",
                                  status: app.status,
                                  is_completed: true,
                                  answers: app,
                                  documents: app.documents,
                                  updated_at: app.updated_at || app.created_at,
                                  raw: app,
                                });
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
                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-brand-primary font-bold border border-gray-200">todovisa/expedientes/{userIdShort}</code>
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <button
                                      onClick={() => router.push(`/profile/dossier/${sol.user_id || sol.id}`)}
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

                              const isCompleted = Boolean(ev.is_completed === true && ev.score !== null && ev.score !== undefined);
                              const evScore = isCompleted ? Number(ev.score) : null;
                              const isHigh = evScore !== null && evScore >= 80;
                              const evDate = ev.created_at ? new Date(ev.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : "Reciente";

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
                                    {isCompleted ? (
                                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isHigh ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                                        {evScore} / 100 ({isHigh ? "Alta Viabilidad" : "Viabilidad Media"})
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                                        🟡 Pendiente (En Progreso)
                                      </span>
                                    )}
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

                {/* TAB: LEADS REFERIDOS DE EMPRESA (ADMIN Y EMPRESAS) */}
                {activeTab === "admin_referidos" && user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR || user.role === ROLES.AGENCY) && (
                  <div className="animate-fadeIn space-y-6 text-left">
                    <div className="mb-6 pb-4 border-b border-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-xs mb-1.5">
                          <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <span>Módulo B2B & Referidos</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Prospectos y Leads Referidos por Empresa</h2>
                        <p className="text-xs text-text-secondary mt-1">
                          Clientes ingresados mediante código corporativo. Atendidos directamente por Asesores oficiales TodoVisa.
                        </p>
                      </div>

                      <button
                        onClick={loadReferralLeadsData}
                        className="px-4 py-2 bg-white border border-border-light hover:bg-background-hover text-text-primary text-xs font-semibold rounded-sm cursor-pointer transition-colors flex items-center gap-2 shrink-0 shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span>Actualizar Lista</span>
                      </button>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-sm border border-border-light shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Prospectos</span>
                        <div className="text-2xl font-black text-brand-primary">{referralLeadsList.length}</div>
                        <p className="text-[11px] text-text-secondary">Leads de empresas aliadas</p>
                      </div>

                      <div className="bg-white p-4 rounded-sm border border-slate-200 bg-slate-50/60 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Pendientes de Contacto</span>
                        <div className="text-2xl font-black text-slate-800">
                          {referralLeadsList.filter((l: any) => l.status === "pending_advisor_contact" || l.status === "pending" || !l.status).length}
                        </div>
                        <p className="text-[11px] text-slate-600">Requieren llamada de asesor</p>
                      </div>

                      <div className="bg-white p-4 rounded-sm border border-slate-200 bg-slate-50/60 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">En Gestión / Contactados</span>
                        <div className="text-2xl font-black text-slate-800">
                          {referralLeadsList.filter((l: any) => l.status === "contacted" || l.status === "in_progress").length}
                        </div>
                        <p className="text-[11px] text-slate-600">En proceso consular</p>
                      </div>

                      <div className="bg-white p-4 rounded-sm border border-emerald-200 bg-emerald-50/40 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Completados / Ganados</span>
                        <div className="text-2xl font-black text-emerald-700">
                          {referralLeadsList.filter((l: any) => l.status === "completed").length}
                        </div>
                        <p className="text-[11px] text-emerald-800">Comisión lista para pago</p>
                      </div>
                    </div>

                    {/* Filter & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 border border-border-light rounded-sm shadow-xs">
                      <div className="relative w-full sm:w-96">
                        <input
                          type="text"
                          placeholder="Buscar por cliente, correo, WhatsApp o código de empresa..."
                          value={referralLeadSearch}
                          onChange={(e) => setReferralLeadSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-background-main border border-border-light rounded-sm text-xs text-text-primary focus:outline-none focus:border-brand-primary font-sans"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <span className="text-xs text-text-secondary font-semibold">
                        Mostrando {referralLeadsList.length} registro(s)
                      </span>
                    </div>

                    {/* Tabla de Ancho Amplio (min-w-[1500px]) con Scroll Horizontal */}
                    <div className="overflow-x-auto rounded-sm border border-border-light bg-white shadow-xs">
                      <table className="w-full min-w-[1500px] text-xs text-left text-text-primary border-collapse">
                        <thead className="bg-background-main text-text-secondary uppercase text-[10px] font-bold tracking-wider border-b border-border-light">
                          <tr>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Fecha</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">Cliente Solicitante</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[240px]">Información de Contacto</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[340px]">Empresa / Código de Referido</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[200px]">Trámite & País</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[240px]">Notas del Cliente</th>
                            <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">Estado</th>
                            <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">Acciones Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light font-sans">
                          {isLoadingReferralLeads ? (
                            <tr>
                              <td colSpan={8} className="py-10 text-center text-text-muted">
                                Cargando prospectos de empresas...
                              </td>
                            </tr>
                          ) : referralLeadsList && referralLeadsList.length > 0 ? (
                            referralLeadsList
                              .filter((lead: any) => {
                                if (!referralLeadSearch.trim()) return true;
                                const q = referralLeadSearch.toLowerCase();
                                return (
                                  (lead.client_name || "").toLowerCase().includes(q) ||
                                  (lead.client_email || "").toLowerCase().includes(q) ||
                                  (lead.client_phone || "").toLowerCase().includes(q) ||
                                  (lead.agency_code || "").toLowerCase().includes(q) ||
                                  (lead.agency_name || "").toLowerCase().includes(q) ||
                                  (lead.notes || "").toLowerCase().includes(q)
                                );
                              })
                              .map((lead: any, idx: number) => {
                                const formattedDate = lead.created_at
                                  ? new Date(lead.created_at).toLocaleDateString("es-ES", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Reciente";

                                const cleanPhone = (lead.client_phone || "").replace(/[^0-9]/g, "");

                                return (
                                  <tr key={lead.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                    {/* Fecha */}
                                    <td className="py-4 px-4 font-mono text-[11px] text-text-secondary align-top whitespace-nowrap">
                                      {formattedDate}
                                    </td>

                                    {/* Cliente Solicitante */}
                                    <td className="py-4 px-4 align-top whitespace-nowrap">
                                      <div className="font-bold text-text-primary text-xs whitespace-nowrap">{lead.client_name || "Cliente Referido"}</div>
                                    </td>

                                    {/* Información de Contacto */}
                                    <td className="py-4 px-4 align-top whitespace-nowrap space-y-1">
                                      {lead.client_email ? (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 whitespace-nowrap">
                                          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                          <a href={`mailto:${lead.client_email}`} className="hover:underline hover:text-brand-primary">
                                            {lead.client_email}
                                          </a>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">Sin correo</span>
                                      )}

                                      {lead.client_phone ? (
                                        <div className="pt-0.5">
                                          <a
                                            href={`https://wa.me/${cleanPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-1 rounded hover:bg-slate-200 transition-colors whitespace-nowrap"
                                          >
                                            <svg className="w-3.5 h-3.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span>{lead.client_phone}</span>
                                          </a>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic block">Sin teléfono</span>
                                      )}
                                    </td>

                                    {/* Empresa / Código Completo sin saltos */}
                                    <td className="py-4 px-4 align-top whitespace-nowrap">
                                      <span className="font-bold text-brand-primary text-xs block whitespace-nowrap">
                                        {lead.agency_name || "Empresa Aliada"}
                                      </span>
                                      <span className="font-mono text-xs bg-slate-100 text-slate-900 px-2.5 py-1 rounded border border-slate-300 inline-block mt-1 whitespace-nowrap select-all font-semibold tracking-wide">
                                        {lead.agency_code || "N/A"}
                                      </span>
                                    </td>

                                    {/* Trámite Consular */}
                                    <td className="py-4 px-4 align-top whitespace-nowrap">
                                      <div className="font-bold text-text-primary text-xs whitespace-nowrap">{lead.visa_type || "Turismo (B1/B2)"}</div>
                                      <div className="text-[11px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">{lead.destination_country || "Estados Unidos"}</div>
                                    </td>

                                    {/* Notas del Cliente */}
                                    <td className="py-4 px-4 align-top">
                                      {lead.notes ? (
                                        <p className="text-[11px] text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded leading-relaxed max-w-xs">
                                          {lead.notes}
                                        </p>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">Sin comentarios adicionales</span>
                                      )}
                                    </td>

                                    {/* Estado */}
                                    <td className="py-4 px-4 align-top whitespace-nowrap">
                                      <select
                                        value={lead.status || "pending_advisor_contact"}
                                        onChange={async (e) => {
                                          const newStatus = e.target.value;
                                          try {
                                            await supabase
                                              .from("agency_referral_leads")
                                              .update({ status: newStatus })
                                              .eq("id", lead.id);
                                            showToast("Estado actualizado correctamente", "success");
                                            loadReferralLeadsData();
                                          } catch (err) {
                                            showToast("No se pudo actualizar el estado", "error");
                                          }
                                        }}
                                        className="w-full min-w-[150px] px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-primary whitespace-nowrap"
                                      >
                                        <option value="pending_advisor_contact">Pendiente Asesor</option>
                                        <option value="contacted">Contactado</option>
                                        <option value="in_progress">En Gestión</option>
                                        <option value="completed">Trámite Concluido</option>
                                      </select>
                                    </td>

                                    {/* Acciones Admin */}
                                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                                      {user && (user.role === ROLES.ADMIN || user.role === ROLES.MODERATOR) ? (
                                        <button
                                          onClick={() => {
                                            setSelectedTxForCommission(null);
                                            setAdminCommissionGross("150.00");
                                            setAdminCommissionClientName(lead.client_name || "");
                                            setAdminTargetAgencyId(lead.agency_id || lead.agency_code || "");
                                            setAdminCommissionRate("20");
                                            setIsAdminCommissionModalOpen(true);
                                          }}
                                          className="px-3 py-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm border-none cursor-pointer shadow-xs transition-colors"
                                        >
                                          Asignar Comisión (20%)
                                        </button>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                          <span>Pendiente Asignación</span>
                                        </span>
                                      )}
                                    </td>

                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-10 text-center text-text-muted">
                                No se han registrado prospectos de empresas en la base de datos Supabase.
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
                        <p className="text-xs text-text-secondary mt-1">Cobros procesados vía PayPal SDK y asignación manual de comisiones B2B.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTxForCommission(null);
                          setAdminCommissionGross("150.00");
                          setAdminCommissionClientName("");
                          setAdminCommissionRate("20");
                          setIsAdminCommissionModalOpen(true);
                        }}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm border-none cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <span>+ Asignar Comisión a Empresa (20%)</span>
                      </button>
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
                            <th className="py-3 px-4 text-right">Acción Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light font-sans">
                          {dbPurchases && dbPurchases.length > 0 ? (
                            [...dbPurchases]
                              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .map((item: any, idx: number) => {
                                const userProf = item.user_id ? dbProfilesMap[item.user_id] : (item.user_email ? dbProfilesMap[item.user_email.toLowerCase()] : null);
                                const clientName = item.user_name || userProf?.name || (item.user_id === user.id ? `${firstName} ${lastName}`.trim() : null) || item.user_email || "Cliente Registrado";
                                const clientEmail = item.user_email || userProf?.email || "";
                                const conceptName = item.product_type === "vipro" ? "Evaluación Diagnóstica VIPRO" : "Servicio Completo con Asesor Acreditado";
                                const rawTxId = item.paypal_tx_id || item.last_paypal_tx;
                                const transactionId = rawTxId 
                                  ? (rawTxId.startsWith("PAYPAL") ? rawTxId : `PAYPAL-${rawTxId}`)
                                  : (item.id && !item.id.startsWith("prof-") ? `PAYPAL-${item.id.substring(0, 8).toUpperCase()}` : `PAYPAL-TX-${idx + 101}`);
                                return (
                                  <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="py-3.5 px-4 font-mono font-bold text-text-secondary">{transactionId}</td>
                                    <td className="py-3.5 px-4 font-semibold">
                                      <div>{clientName}</div>
                                      {clientEmail && clientEmail !== clientName && <div className="text-[10px] text-text-muted font-normal">{clientEmail}</div>}
                                    </td>
                                    <td className="py-3.5 px-4">{conceptName}</td>
                                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">${Number(item.amount).toFixed(2)} USD</td>
                                    <td className="py-3.5 px-4">
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Completado</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      <button
                                        onClick={() => {
                                          setSelectedTxForCommission(item);
                                          setAdminCommissionGross(String(item.amount || 150));
                                          setAdminCommissionClientName(clientName);
                                          setAdminCommissionRate("20");
                                          setIsAdminCommissionModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold rounded-sm cursor-pointer transition-colors"
                                      >
                                        Asignar 20% a Empresa
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-text-muted">
                                No se encontraron transacciones registradas en la base de datos Supabase.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* TAB: CHAT CON CLIENTES (solo para AGENT) */}

                {activeTab === "chat_agente" && user && user.role === ROLES.AGENT && (
                  <div className="animate-fadeIn h-full">
                    <div className="mb-4 pb-4 border-b border-border-light">
                      <h2 className="text-lg font-bold text-text-primary">Gestión de Casos y Clientes</h2>
                      <p className="text-xs text-text-secondary mt-1">Casos y clientes asignados por tu empresa. Aquí podrás auditar documentos, gestionar citas y chatear directamente.</p>
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
                    ) : !selectedClient ? (
                      <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                        {assignedClients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedClientProfile(null);
                              setAgentChatMessages([]);
                              loadAgentChatMessages(client.client_id);
                              const fetchLatestClientProfile = () => {
                                ProfileClientService.getProfile(client.client_id)
                                  .then((res) => {
                                    if (res?.profile) {
                                      setSelectedClientProfile(res.profile);
                                      if (res.profile.document_reviews) {
                                        setDocReviews(res.profile.document_reviews);
                                      } else {
                                        setDocReviews({});
                                      }
                                      if (res.profile.expediente_status) {
                                        setAuditExpedienteStatus(res.profile.expediente_status);
                                      }
                                    }
                                  })
                                  .catch(() => null);
                              };
                              fetchLatestClientProfile();
                            }}
                            className="bg-gradient-to-br from-white to-[#FAF9F6] border border-slate-200 rounded-lg p-4 hover:border-brand-primary hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                          >
                            <div className="flex items-center gap-4 text-left">
                              <div className="relative flex-shrink-0">
                                {client.photo_url ? (
                                  <img
                                    src={client.photo_url}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-base border border-slate-200 shadow-sm">
                                    {(client.first_name || client.client_name || "?").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-emerald-500"></span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-text-primary text-sm tracking-tight truncate">
                                  {client.first_name ? `${client.first_name} ${client.last_name || ""}`.trim() : (client.client_name || "Cliente")}
                                </h4>
                                <p className="text-[11px] text-text-secondary mt-0.5 truncate">{client.client_email || ""}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0 justify-between sm:justify-end">
                              <span className="inline-flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Asignado
                              </span>

                              <span className="text-[11px] font-bold text-brand-primary hover:text-brand-hover transition-all flex items-center gap-1">
                                Abrir Chat
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6 animate-fade-in">
                        {/* Chat Window Container */}
                        <div className="flex flex-col gap-6">
                          {/* Chat Window */}
                          <div className="border border-border-light rounded-2xl overflow-hidden flex flex-col h-[550px] bg-[#FAF9F6] shadow-sm relative">
                            {/* Chat Header */}
                            <div className="bg-white px-6 py-4 border-b border-border-light flex items-center justify-between shadow-sm z-10">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setSelectedClient(null)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-none flex items-center gap-1"
                                >
                                  &larr; Volver
                                </button>
                                <div className="h-6 w-px bg-border-light mx-1 flex-shrink-0" />
                                {selectedClientProfile?.photo_url ? (
                                  <img
                                    src={selectedClientProfile.photo_url}
                                    alt="Cliente"
                                    className="w-10 h-10 rounded-full object-cover border border-border-light shadow-sm flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/40 flex items-center justify-center text-brand-primary font-bold text-sm shadow-sm flex-shrink-0">
                                    {(selectedClient.client_name || "?").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="text-left">
                                  <h4 className="font-bold text-text-primary text-sm leading-tight">
                                    {selectedClientProfile ? `${selectedClientProfile.first_name} ${selectedClientProfile.last_name || ""}`.trim() : selectedClient.client_name}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full mr-2 hidden md:inline-block">
                                  Conectado
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAdvisorSubTab('chat')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${advisorSubTab === 'chat'
                                      ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                >
                                  💬 Chat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdvisorSubTab('audit')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${advisorSubTab === 'audit'
                                      ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                >
                                  📂 Expediente
                                </button>
                              </div>
                            </div>

                            {advisorSubTab === 'chat' ? (
                              <>
                                {/* Messages Box */}
                                <div ref={agentChatRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#FAF9F6]/60 to-white/40 custom-scrollbar animate-fade-in">
                                  {agentChatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-2">
                                      <span className="text-3xl">💬</span>
                                      <p className="text-xs font-semibold text-text-primary">Chat seguro habilitado</p>
                                      <p className="text-[11px] text-text-muted max-w-xs">Escribe tu primer mensaje abajo para iniciar la conversación directa con tu cliente.</p>
                                    </div>
                                  ) : (
                                    agentChatMessages.map((msg) => (
                                      <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                                      >
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "agent"
                                          ? "bg-brand-primary text-white rounded-br-sm"
                                          : "bg-white border border-border-light text-text-primary rounded-bl-sm"
                                          }`}>
                                          <p className="text-left">{msg.text}</p>
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
                              </>
                            ) : (
                              <div className="flex-1 overflow-y-auto bg-[#F8F8F6] custom-scrollbar animate-fade-in">
                                {/* Header strip */}
                                <div className="px-5 py-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <h3 className="font-extrabold text-slate-800 text-[13px] tracking-tight">📋 Expediente y Auditoría Consular</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                      {selectedClientProfile?.first_name} {selectedClientProfile?.last_name} — Revisa y dictamina cada documento
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-500">Auditoría:</span>
                                      <select
                                        value={auditExpedienteStatus}
                                        onChange={(e: any) => setAuditExpedienteStatus(e.target.value)}
                                        disabled={true}
                                        className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary font-bold cursor-not-allowed text-slate-500 shadow-sm opacity-80"
                                      >
                                        <option value="submitted">⏳ En Auditoría</option>
                                        <option value="approved">✅ Aprobado</option>
                                        <option value="draft">✍️ Requiere Correcciones</option>
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-500">Simulacro:</span>
                                      <select
                                        value={selectedClientProfile?.appointment_request?.status || selectedClientProfile?.cita_details?.status || selectedClientProfile?.document_reviews?.appointment_request?.status || 'pending'}
                                        onChange={(e: any) => handleCitaStatusChange(e.target.value)}
                                        disabled={true}
                                        className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary font-bold cursor-not-allowed text-slate-500 shadow-sm opacity-80"
                                      >
                                        <option value="pending">⏳ Cita Pendiente</option>
                                        <option value="confirmed">✅ Cita Confirmada</option>
                                        <option value="proposed">⚡ Propuesta Enviada</option>
                                        <option value="rejected">❌ Cita Rechazada</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-5 space-y-6">
                                  {/* BLOQUE 1: GESTIÓN Y APROBACIÓN DE CITAS CONSULARES */}
                                  {(() => {
                                    const clientAppt = selectedClientProfile?.appointment_request || selectedClientProfile?.cita_details || selectedClientProfile?.document_reviews?.appointment_request || selectedClientProfile?.document_reviews?.cita_details;
                                    return (
                                      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                          <div>
                                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                              <span>Aprobación y Agendamiento de Cita / Simulacro</span>
                                            </h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Admite, propone o rechaza los horarios para la cita del cliente.</p>
                                          </div>
                                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${clientAppt?.status === 'confirmed'
                                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                              : clientAppt?.status === 'rejected'
                                                ? 'bg-red-100 text-red-800 border border-red-300'
                                                : clientAppt?.status === 'proposed'
                                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                                            }`}>
                                            {clientAppt?.status === 'confirmed' ? 'Cita Confirmada' :
                                              clientAppt?.status === 'rejected' ? 'Rechazada' :
                                                clientAppt?.status === 'proposed' ? 'Propuesta Enviada' : 'Pendiente de Revisión'}
                                          </span>
                                        </div>

                                        {auditExpedienteStatus !== 'approved' ? (
                                          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-center">
                                            <p className="text-xs text-amber-800 font-bold flex items-center justify-center gap-1.5">
                                              <span>⚠️</span>
                                              <span>La auditoría debe estar aprobada para habilitar las citas y simulacros.</span>
                                            </p>
                                          </div>
                                        ) : clientAppt ? (
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                              <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Trámite</span>
                                                <span className="font-semibold text-slate-800 block mt-0.5">{clientAppt.appointment_type}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha Solicitada</span>
                                                <span className="font-bold text-slate-800 block mt-0.5">{clientAppt.requested_date || clientAppt.confirmed_date}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Hora Solicitada</span>
                                                <span className="font-bold text-slate-800 block mt-0.5">{clientAppt.requested_time || clientAppt.confirmed_time} hrs</span>
                                              </div>
                                            </div>

                                            {clientAppt.client_notes && (
                                              <p className="text-xs text-slate-700 italic bg-slate-100/70 p-3 rounded-xl border border-slate-200">
                                                💬 Comentario del Cliente: &quot;{clientAppt.client_notes}&quot;
                                              </p>
                                            )}

                                            {/* Enlace a Videollamada (Zoom / Google Meet) */}
                                            <div>
                                              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                                <span>🎥 Enlace a Reunión Virtual (Zoom / Google Meet)</span>
                                                <span className="text-brand-primary font-bold text-[10px] normal-case">El cliente podrá unirse haciendo clic</span>
                                              </label>
                                              <div className="relative">
                                                <input
                                                  type="url"
                                                  value={agentCitaProposal.meetingLink}
                                                  onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, meetingLink: e.target.value }))}
                                                  placeholder="Ej. https://zoom.us/j/123456789 o https://meet.google.com/abc-defg-hij"
                                                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-mono shadow-2xs font-medium"
                                                />
                                                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔗</span>
                                              </div>
                                            </div>

                                            {/* Input para Comentario / Respuesta del Asesor */}
                                            <div>
                                              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                💬 Respuesta / Instrucciones del Asesor para el Cliente
                                              </label>
                                              <input
                                                type="text"
                                                value={agentCitaProposal.agentNotes}
                                                onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, agentNotes: e.target.value }))}
                                                placeholder="Ej. Cita aprobada exitosamente. Favor conectarse a Zoom 5 min antes..."
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-medium shadow-2xs"
                                              />
                                            </div>

                                            {/* Botones de Acción Directa del Asesor */}
                                            <div className="flex flex-wrap gap-2.5 pt-1">
                                              <button
                                                type="button"
                                                onClick={() => handleAgentAcceptCita(agentCitaProposal.agentNotes, agentCitaProposal.meetingLink)}
                                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border-none"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                <span>✅ Confirmar Cita y Guardar Enlace</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setIsAgentProposingCita(!isAgentProposingCita)}
                                                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                              >
                                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span>Proponer Horario Alternativo</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleAgentRejectCita(agentCitaProposal.agentNotes)}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                              >
                                                <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                <span>Rechazar Cita</span>
                                              </button>
                                            </div>

                                            {/* Formulario de Proposición de Horario Alternativo por el Asesor */}
                                            {isAgentProposingCita && (
                                              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                                                <span className="text-xs font-extrabold text-amber-950 block">Ingresa la nueva fecha y hora propuesta al cliente:</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  <div>
                                                    <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Nueva Fecha Propuesta</span>
                                                    <input
                                                      type="date"
                                                      value={agentCitaProposal.proposedDate}
                                                      onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, proposedDate: e.target.value }))}
                                                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                                                    />
                                                  </div>
                                                  <div>
                                                    <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Nueva Hora Propuesta</span>
                                                    <input
                                                      type="text"
                                                      value={agentCitaProposal.proposedTime}
                                                      onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, proposedTime: e.target.value }))}
                                                      placeholder="Ej. 14:00"
                                                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                                                    />
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={handleAgentProposeCita}
                                                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                                                >
                                                  📩 Enviar Propuesta al Cliente por Chat
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-center">
                                            <p className="text-xs text-slate-600 font-medium">El cliente aún no ha registrado una solicitud de cita en el portal.</p>
                                            <button
                                              type="button"
                                              onClick={() => setIsAgentProposingCita(!isAgentProposingCita)}
                                              className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                                            >
                                              <span>📅</span>
                                              <span>Asignar Horario de Cita al Cliente</span>
                                            </button>
                                            {isAgentProposingCita && (
                                              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-left animate-in fade-in duration-200 mt-2">
                                                <span className="text-xs font-extrabold text-amber-950 block">Asignar / Proponer Cita al Cliente:</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  <div>
                                                    <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Fecha</span>
                                                    <input
                                                      type="date"
                                                      value={agentCitaProposal.proposedDate}
                                                      onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, proposedDate: e.target.value }))}
                                                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                                                    />
                                                  </div>
                                                  <div>
                                                    <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Hora</span>
                                                    <input
                                                      type="text"
                                                      value={agentCitaProposal.proposedTime}
                                                      onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, proposedTime: e.target.value }))}
                                                      placeholder="Ej. 10:00"
                                                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                                                    />
                                                  </div>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Comentario para el cliente</span>
                                                  <input
                                                    type="text"
                                                    value={agentCitaProposal.agentNotes}
                                                    onChange={(e) => setAgentCitaProposal(prev => ({ ...prev, agentNotes: e.target.value }))}
                                                    placeholder="Comentario sobre el horario..."
                                                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                                                  />
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={handleAgentProposeCita}
                                                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                                                >
                                                  📩 Notificar Cita al Cliente
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* BLOQUE 2: AUDITORÍA DE DOCUMENTACIÓN CONSULAR */}
                                  <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                        <span>Documentación Adjunta y Formulario Consular</span>
                                      </h4>
                                      <span className="text-[10px] text-slate-400 font-bold">4 Requisitos + DS-160</span>
                                    </div>

                                    {/* Documents grid */}
                                    {/* Documents grid */}
                                    {[
                                      { key: "passport", label: "Pasaporte Vigente", desc: "Primera página con datos de identidad", icon: "", color: "blue" },
                                      { key: "dui", label: "DUI / Identificación", desc: "Copia legible por ambos lados", icon: "", color: "indigo" },
                                      { key: "workCert", label: "Arraigo Laboral / Académico", desc: "Constancia laboral o matrícula firmada", icon: "", color: "violet" },
                                      { key: "bankStatements", label: "Solvencia Económica", desc: "Estados de cuenta (últimos 3 meses)", icon: "", color: "purple" },
                                    ].map((doc) => {
                                      const clientDocsMap = selectedClientProfile?.client_docs || {};
                                      const fileName = clientDocsMap[doc.key];
                                      const fileUrl = clientDocsMap[`${doc.key}_url`];
                                      const review = docReviews[doc.key] || { status: 'pending', comment: '' };
                                      const statusColor = review.status === 'approved' ? 'emerald' : review.status === 'rejected' ? 'red' : review.status === 'observed' ? 'amber' : 'slate';
                                      const statusLabel = review.status === 'approved' ? 'Aprobado' : review.status === 'rejected' ? 'Rechazado' : review.status === 'observed' ? 'Observado' : 'Pendiente';

                                      return (
                                        <div key={doc.key} className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${review.status === 'approved' ? 'border-emerald-200 bg-emerald-50/10' :
                                            review.status === 'rejected' ? 'border-red-200 bg-red-50/10' :
                                              review.status === 'observed' ? 'border-amber-200 bg-amber-50/10' :
                                                'border-slate-200 hover:border-slate-300'
                                          }`}>
                                          {/* Card top row */}
                                          <div className="flex items-start gap-3 p-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${review.status === 'approved' ? 'bg-emerald-50' :
                                                review.status === 'rejected' ? 'bg-red-50' :
                                                  review.status === 'observed' ? 'bg-amber-50' :
                                                    'bg-slate-50'
                                              }`}>
                                              {doc.key === 'passport' && <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                                              {doc.key === 'dui' && <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>}
                                              {doc.key === 'workCert' && <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                                              {doc.key === 'bankStatements' && <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="text-[12px] font-bold text-slate-800 block">{doc.label}</span>
                                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                      review.status === 'observed' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-500'
                                                  }`}>{statusLabel}</span>
                                              </div>
                                              <span className="text-[10px] text-slate-400 block mt-0.5">{doc.desc}</span>
                                              {/* File status */}
                                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                {fileName ? (
                                                  <>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 max-w-[160px] truncate">
                                                      📄 {fileName}
                                                    </span>
                                                    {fileUrl && (
                                                      <a
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-brand-primary hover:bg-brand-hover text-white text-[10px] font-bold rounded-lg shadow-sm transition-all no-underline"
                                                      >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        Ver documento
                                                      </a>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                    ⬜ Aún no subido por el cliente
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Review controls */}
                                          <div className="border-t border-slate-50 bg-slate-50/70 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            <div className="flex gap-1.5 flex-shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => setDocReviews(prev => ({ ...prev, [doc.key]: { ...review, status: 'approved' } }))}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${review.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                                                  }`}
                                              >Aprobar</button>
                                              <button
                                                type="button"
                                                onClick={() => setDocReviews(prev => ({ ...prev, [doc.key]: { ...review, status: 'observed' } }))}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${review.status === 'observed'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-400 hover:text-amber-600'
                                                  }`}
                                              >Observar</button>
                                              <button
                                                type="button"
                                                onClick={() => setDocReviews(prev => ({ ...prev, [doc.key]: { ...review, status: 'rejected' } }))}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${review.status === 'rejected'
                                                    ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-red-400 hover:text-red-600'
                                                  }`}
                                              >Rechazar</button>
                                            </div>
                                            <input
                                              type="text"
                                              value={review.comment || ""}
                                              onChange={(e) => setDocReviews(prev => ({ ...prev, [doc.key]: { ...review, comment: e.target.value } }))}
                                              placeholder="Comentario al cliente (opcional)..."
                                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-brand-primary placeholder-slate-300 min-w-0"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* DS-160 Block */}
                                    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${(docReviews.ds160?.status || 'pending') === 'approved' ? 'border-emerald-200' :
                                        (docReviews.ds160?.status || 'pending') === 'rejected' ? 'border-red-200' :
                                          (docReviews.ds160?.status || 'pending') === 'observed' ? 'border-amber-200' :
                                            'border-amber-100'
                                      }`}>
                                      <div className="flex items-start gap-3 p-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-[12px] font-bold text-slate-800">Formulario DS-160 / UKVI</span>
                                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${(docReviews.ds160?.status || 'pending') === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                (docReviews.ds160?.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-700' :
                                                  (docReviews.ds160?.status || 'pending') === 'observed' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-amber-50 text-amber-600'
                                              }`}>
                                              {(docReviews.ds160?.status || 'pending') === 'approved' ? 'Aprobado' :
                                                (docReviews.ds160?.status || 'pending') === 'rejected' ? 'Rechazado' :
                                                  (docReviews.ds160?.status || 'pending') === 'observed' ? 'Observado' : 'Pendiente'}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-slate-400 block mt-0.5">Datos consulates llenados y confirmados por el cliente</span>
                                          {(selectedClientProfile?.ds160_confirmed || selectedClientProfile?.ds160_full_name) ? (
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                              {[
                                                { label: "Nombre completo", value: selectedClientProfile.ds160_full_name },
                                                { label: "N° Pasaporte", value: selectedClientProfile.ds160_passport_num },
                                                { label: "Fecha de nacimiento", value: selectedClientProfile.ds160_birth_date },
                                                { label: "Propósito del viaje", value: selectedClientProfile.ds160_purpose_of_trip },
                                                { label: "¿Posee arraigos/bienes?", value: selectedClientProfile.ds160_has_assets ? "Sí" : "No" },
                                              ].map(f => (
                                                <div key={f.label} className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 text-left">
                                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{f.label}</span>
                                                  <span className="text-[11px] font-semibold text-slate-700 mt-0.5 block">{f.value || "—"}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                              ⏳ Pendiente de confirmación por el cliente
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="border-t border-slate-50 bg-slate-50/70 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <div className="flex gap-1.5 flex-shrink-0">
                                          {[
                                            { s: 'approved', label: 'Aprobar', active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm', inactive: 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400 hover:text-emerald-600' },
                                            { s: 'observed', label: 'Observar', active: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm', inactive: 'bg-white text-slate-500 border-slate-200 hover:border-amber-400 hover:text-amber-600' },
                                            { s: 'rejected', label: 'Rechazar', active: 'bg-red-50 text-red-700 border-red-200 shadow-sm', inactive: 'bg-white text-slate-500 border-slate-200 hover:border-red-400 hover:text-red-600' },
                                          ].map(btn => (
                                            <button
                                              key={btn.s}
                                              type="button"
                                              onClick={() => setDocReviews(prev => ({
                                                ...prev,
                                                ds160: { ...(docReviews.ds160 || { status: 'pending' as const, comment: '' }), status: btn.s as 'pending' | 'approved' | 'rejected' | 'observed' }
                                              }))}
                                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border shadow-sm ${(docReviews.ds160?.status || 'pending') === btn.s ? btn.active : btn.inactive
                                                }`}
                                            >{btn.label}</button>
                                          ))}
                                        </div>
                                        <input
                                          type="text"
                                          value={docReviews.ds160?.comment || ""}
                                          onChange={(e) => setDocReviews(prev => ({
                                            ...prev,
                                            ds160: { ...(docReviews.ds160 || { status: 'pending', comment: '' }), comment: e.target.value }
                                          }))}
                                          placeholder="Comentario al cliente (opcional)..."
                                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-brand-primary placeholder-slate-300 min-w-0"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                </div>
                                {/* Save footer */}
                                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
                                  <span className="text-[10px] text-slate-400">Los cambios se notificarán al cliente vía chat automáticamente.</span>
                                  <button
                                    type="button"
                                    onClick={handleSaveAudit}
                                    disabled={isSavingAudit}
                                    className="px-5 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                  >
                                    {isSavingAudit ? (
                                      <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                    ) : (
                                      <>✓ Guardar Auditoría</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                    }
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
                        {/* Actions for viewing full portal */}
                        <div className="flex justify-start pt-4 border-t border-border-light">
                          <button
                            onClick={() => router.push(`/agents/portal?id=${agentApp.application_id}`)}
                            className="px-5 py-2.5 bg-white border border-border-light text-text-primary text-xs font-bold rounded-sm hover:bg-background-hover transition-colors cursor-pointer shadow-2xs"
                          >
                            👁 Ver Solicitud y Contrato Completo &rarr;
                          </button>
                        </div>
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
                    <div className="mb-6 pb-4 border-b border-border-light text-left">
                      <h2 className="text-lg font-bold text-text-primary">Historial y Control de Comisiones</h2>
                      <p className="text-xs text-text-secondary mt-1">Revisa el detalle, tasa de comisiones y balances netos acumulados de tus expedientes cerrados.</p>
                    </div>

                    {/* Info Card explaining how commissions work */}
                    <div className="bg-brand-light/30 border border-brand-primary/10 rounded-sm p-5 mb-6 text-left space-y-2">
                      <div className="flex items-center gap-2 text-brand-primary font-bold text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.02-.086.041a.25.25 0 00-.115.1l-.014.032m-3.56 3.85a9 9 0 1112.728 0M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z" />
                        </svg>
                        <span>¿Cómo funciona el esquema de comisiones?</span>
                      </div>
                      {user.role === ROLES.AGENCY ? (
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Como Agencia/Socio Comercial, recibes el <strong>{getSystemConfig().agencyReferralRate}% del importe bruto</strong> de cada trámite consular realizado por los clientes que ingresen a la plataforma mediante tu <strong>Link de Referido Exclusivo</strong>. TodoVisa administra la plataforma y el soporte operativo. Los cortes se realizan de forma semanal y las liquidaciones se transfieren a tu cuenta bancaria o PayPal registrada todos los viernes.
                        </p>
                      ) : (
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Como Asesor Certificado de la red TodoVisa, recibes el <strong>{getSystemConfig().agentCommissionRate}% del importe bruto</strong> de cada trámite consular asignado. El procesamiento de liquidaciones se realiza semanalmente y los pagos netos acumulados se depositan en tu método de cobro configurado cada viernes.
                        </p>
                      )}
                    </div>

                    {/* Financial metrics & Table */}
                    {(() => {
                      const sysConfig = getSystemConfig();
                      const fullServicePrice = sysConfig.fullServicePrice;
                      const commissionRate = (user.role === ROLES.AGENCY ? sysConfig.agencyReferralRate : sysConfig.agentCommissionRate) / 100;
                      const agentCommissionAmount = fullServicePrice * commissionRate;

                      // Merge real database commissions with synthetic ones for assigned clients that don't have a commission record yet
                      const mergedCommissions: Commission[] = [...agentCommissions];

                      assignedClients.forEach(client => {
                        const clientName = client.client_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Cliente';
                        const hasRealComm = agentCommissions.some(c => {
                          const cName = (c.client_name || "").toLowerCase();
                          const clName = clientName.toLowerCase();
                          return cName.includes(clName) || clName.includes(cName);
                        });

                        if (!hasRealComm) {
                          // Determine status: if the appointment status is confirmed/completed, it is paid, otherwise pending/processing
                          const isCompleted = client.appointment_request?.status === 'confirmed' || client.cita_details?.status === 'confirmed' || selectedClientProfile?.appointment_request?.status === 'confirmed';

                          mergedCommissions.push({
                            id: `synthetic-comm-${client.id}`,
                            agent_id: user.id,
                            client_folio: client.id.substring(0, 8).toUpperCase(),
                            client_name: clientName,
                            service_type: 'full_service' as any,
                            gross_amount: fullServicePrice,
                            commission_rate: commissionRate,
                            commission_amount: agentCommissionAmount,
                            status: isCompleted ? 'paid' : 'processing',
                            paid_at: isCompleted ? new Date().toISOString() : null,
                            notes: 'Comisión de trámite en curso',
                            created_at: client.created_at || new Date().toISOString()
                          });
                        }
                      });

                      const calcAmt = (c: any) => {
                        if (typeof c.commission_amount === "number" && !isNaN(c.commission_amount) && c.commission_amount > 0) {
                          return c.commission_amount;
                        }
                        const gross = Number(c.gross_amount || c.sale_amount || 0);
                        let rate = Number(c.commission_rate || (user?.role === ROLES.AGENCY ? 20 : 80));
                        if (rate > 0 && rate <= 1) rate = rate * 100;
                        return gross * (rate / 100);
                      };

                      const totalClients = assignedClients.length + mergedCommissions.length;
                      const pendingBalance = mergedCommissions.filter(c => c.status === 'pending' || c.status === 'processing').reduce((sum, c) => sum + calcAmt(c), 0);
                      const availableBalance = mergedCommissions.filter(c => c.status === 'paid' || c.status === 'completed').reduce((sum, c) => sum + calcAmt(c), 0);
                      const totalEarned = mergedCommissions.reduce((sum, c) => sum + calcAmt(c), 0);

                      return (
                        <>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 text-left">
                            <div className="p-4 bg-background-main border border-border-light rounded-sm">
                              <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">Expedientes / Leads</span>
                              <p className="text-lg font-bold text-text-primary font-mono mt-1">{totalClients}</p>
                            </div>
                            <div className="p-4 bg-background-main border border-border-light rounded-sm">
                              <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">Saldo en Trámite</span>
                              <p className="text-lg font-bold text-amber-600 font-mono mt-1">${pendingBalance.toFixed(2)} USD</p>
                            </div>
                            <div className="p-4 bg-background-main border border-border-light rounded-sm">
                              <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">Líquido / Acreditar</span>
                              <p className="text-lg font-bold text-emerald-600 font-mono mt-1">${availableBalance.toFixed(2)} USD</p>
                            </div>
                            <div className="p-4 bg-brand-light border border-brand-primary/20 rounded-sm">
                              <span className="text-[9px] text-brand-primary uppercase tracking-wider font-bold block">Histórico Acumulado</span>
                              <p className="text-lg font-bold text-brand-primary font-mono mt-1">${totalEarned.toFixed(2)} USD</p>
                            </div>
                          </div>

                          {/* Table */}
                          <div className="border border-border-light rounded-sm p-5 bg-white text-left">
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Listado de Expedientes y Comisiones</h3>
                            {isLoadingCommissions ? (
                              <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin" />
                              </div>
                            ) : mergedCommissions.length === 0 ? (
                              <div className="py-8 text-center text-text-muted italic text-xs border-t border-border-light">
                                No se han encontrado registros de comisiones aprobadas para tu cuenta.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-border-light text-text-secondary uppercase tracking-wider text-[9px] font-bold">
                                      <th className="py-2.5">Fecha</th>
                                      <th className="py-2.5">Cliente Solicitante</th>
                                      <th className="py-2.5">Trámite / Servicio</th>
                                      <th className="py-2.5">Tasa Comisión</th>
                                      <th className="py-2.5">Monto Comisión</th>
                                      <th className="py-2.5">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border-light">
                                    {mergedCommissions.map((c) => {
                                      const amt = calcAmt(c);
                                      const rateDisplay = typeof c.commission_rate === 'number' ? (c.commission_rate <= 1 ? (c.commission_rate * 100) : c.commission_rate) : 20;

                                      return (
                                        <tr key={c.id} className="hover:bg-background-main/50 transition-colors">
                                          <td className="py-3 font-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                                          <td className="py-3 font-semibold">{c.client_name}</td>
                                          <td className="py-3 text-text-secondary">{c.service_type === 'full_service' ? 'Asesoría Consular Completa' : c.service_type}</td>
                                          <td className="py-3 font-mono text-slate-600">{rateDisplay}%</td>
                                          <td className="py-3 font-bold font-mono text-brand-primary">${amt.toFixed(2)} USD</td>
                                          <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.status === "paid" || c.status === "completed"
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              : c.status === "processing" || c.status === "pending"
                                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                : "bg-gray-100 text-gray-500"
                                              }`}>
                                              {c.status === "paid" || c.status === "completed" ? "Pagado / Acreditado" : (c.status === "processing" || c.status === "pending") ? "En Proceso" : "Pendiente"}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </>
                      );

                    })()}
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
                      <form onSubmit={handleSavePayoutSettings} className="space-y-6 max-w-2xl text-left">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Método de Cobro</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('paypal')}
                              className={`group py-4 px-5 rounded-sm border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer focus:outline-none ${payoutMethod === 'paypal'
                                ? 'bg-brand-light/30 text-brand-primary border-brand-primary ring-2 ring-brand-primary/10 shadow-sm'
                                : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/30 hover:bg-white'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`p-2 rounded-sm transition-colors ${payoutMethod === 'paypal' ? 'bg-brand-primary text-white' : 'bg-white border border-border-light text-text-secondary'}`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6.18-11.25h16.86c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H2.82c-.621 0-1.125-.504-1.125-1.125V3.87c0-.621.504-1.125 1.125-1.125z" />
                                  </svg>
                                </span>
                                <span className="font-bold text-text-primary text-xs">PayPal Express</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${payoutMethod === 'paypal' ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'}`}>
                                {payoutMethod === 'paypal' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPayoutMethod('ach')}
                              className={`group py-4 px-5 rounded-sm border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer focus:outline-none ${payoutMethod === 'ach'
                                ? 'bg-brand-light/30 text-brand-primary border-brand-primary ring-2 ring-brand-primary/10 shadow-sm'
                                : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/30 hover:bg-white'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`p-2 rounded-sm transition-colors ${payoutMethod === 'ach' ? 'bg-brand-primary text-white' : 'bg-white border border-border-light text-text-secondary'}`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-3.75h16.5M2.25 9l9.75-6 9.75 6m-18.75 3v6.75M5.25 12v6.75m4.5-6.75v6.75m3-6.75v6.75m4.5-6.75v6.75m3-6.75v6.75" />
                                  </svg>
                                </span>
                                <span className="font-bold text-text-primary text-xs">Transferencia ACH</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${payoutMethod === 'ach' ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'}`}>
                                {payoutMethod === 'ach' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          </div>
                        </div>

                        {payoutMethod === 'paypal' ? (
                          <div className="p-5 bg-background-main rounded-sm border border-border-light space-y-3">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Correo Electrónico de PayPal</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                              </span>
                              <input
                                type="email"
                                required
                                value={paypalEmail}
                                onChange={(e) => setPaypalEmail(e.target.value)}
                                placeholder="correo@paypal.com"
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-border-light rounded-sm text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all text-text-primary"
                              />
                            </div>
                            <span className="text-[9px] text-text-muted block">Tus fondos se transferirán de inmediato a esta cuenta.</span>
                          </div>
                        ) : (
                          <div className="p-5 bg-background-main rounded-sm border border-border-light space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Nombre del Banco</label>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-3.75h16.5M2.25 9l9.75-6 9.75 6m-18.75 3v6.75M5.25 12v6.75m4.5-6.75v6.75m3-6.75v6.75m4.5-6.75v6.75m3-6.75v6.75" />
                                    </svg>
                                  </span>
                                  <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Banco Agrícola, BAC, etc." className="w-full pl-9 pr-3 py-2 bg-white border border-border-light rounded-sm text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all text-text-primary" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Tipo de Cuenta</label>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.879c1.003 1.003 2.63 1.003 3.633 0L14 13.5a2.56 2.56 0 00-2-2.5h-.5a2.56 2.56 0 01-2-2.5L10 6.5a2.56 2.56 0 012-2.5h.5c.875 0 1.625.5 2 1.25" />
                                    </svg>
                                  </span>
                                  <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-border-light rounded-sm text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all text-text-primary cursor-pointer h-[38px]">
                                    <option value="Ahorros">Ahorros</option>
                                    <option value="Corriente">Corriente</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Número de Cuenta</label>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </span>
                                  <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Nº de cuenta bancaria" className="w-full pl-9 pr-3 py-2.5 bg-white border border-border-light rounded-sm text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all text-text-primary" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Identificación Tributaria / NIT / DUI</label>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                    </svg>
                                  </span>
                                  <input type="text" required value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Identificación del titular de la cuenta" className="w-full pl-9 pr-3 py-2.5 bg-white border border-border-light rounded-sm text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all text-text-primary" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={savingPayout}
                            className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold rounded-sm transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2 shadow-sm border-none"
                          >
                            {savingPayout ? (
                              <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Guardar Configuración de Pago
                              </>
                            )}
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
                        <p className="text-xs text-text-secondary mt-1">Genera y comparte tu enlace único de recomendación. Obtén el **20% de comisión** de cada compra de visado realizada por tus clientes.</p>
                      </div>

                      {/* Banner alert */}
                      <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6 text-left">
                        <div className="flex items-start gap-3">
                          <span className="p-2 bg-amber-100 text-amber-800 rounded-sm shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                          </span>
                          <div>
                            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Nueva Modalidad por Recomendación</h3>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                              Las agencias ya no registran sub-agentes en la plataforma. Al enviar tu enlace de referido al cliente final, el sistema acreditará automáticamente el <strong>20% del valor del trámite</strong> a tu cuenta de agencia (80% para TodoVisa).
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
                          <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60 pointer-events-none">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                              </svg>
                            </span>
                            <input
                              type="text"
                              readOnly
                              value={`${typeof window !== "undefined" ? `${window.location.origin}/referral` : "https://todovisa.com/referral"}?ref=${user?.id || ""}`}
                              className="w-full pl-9 pr-3 py-2.5 bg-background-main border border-border-light rounded-sm text-xs font-mono text-text-primary select-all focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (typeof window !== "undefined" && user?.id) {
                                navigator.clipboard.writeText(`${window.location.origin}/referral?ref=${user.id}`);
                                setCopiedReferral(true);
                                setTimeout(() => setCopiedReferral(false), 3000);
                              }
                            }}

                            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all cursor-pointer border-none flex items-center justify-center gap-2 shrink-0"
                          >
                            {copiedReferral ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                ¡Enlace Copiado!
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.25 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                                </svg>
                                Copiar Link de Referido
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </>
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
                {ds160Confirmed ? 'DATOS CONFIRMADOS' : 'PENDIENTE DE CONFIRMACIÓN'}
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




      {/* MODAL ADMIN: ASIGNACIÓN MANUAL DE COMISIÓN A EMPRESA (20%) */}
      {isAdminCommissionModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-border-light rounded-sm max-w-md w-full overflow-hidden shadow-xl text-left">
            <div className="bg-brand-primary p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-xs">
                  Módulo Admin TodoVisa
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Asignar Comisión a Empresa (20%)
                </h3>
              </div>
              <button
                onClick={() => setIsAdminCommissionModalOpen(false)}
                className="text-white/80 hover:text-white text-base font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignCommissionSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-text-muted mb-1 text-[10px]">
                  Empresa / Agencia Aliada (ID o Código) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. B2B-SAN-SALVADOR o UUID de Agencia"
                  value={adminTargetAgencyId}
                  onChange={(e) => setAdminTargetAgencyId(e.target.value)}
                  className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs text-text-primary focus:outline-none focus:border-brand-primary font-mono uppercase"
                />
                {dbProfilesMap && Object.values(dbProfilesMap).filter((p: any) => p?.role === ROLES.AGENCY).length > 0 && (
                  <select
                    onChange={(e) => setAdminTargetAgencyId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background-main border border-border-light rounded-sm text-xs text-text-secondary mt-1.5 focus:outline-none focus:border-brand-primary font-sans"
                  >
                    <option value="">-- Seleccionar de Agencias Registradas --</option>
                    {Object.values(dbProfilesMap)
                      .filter((p: any) => p?.role === ROLES.AGENCY)
                      .map((ag: any) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.first_name || ag.last_name ? `${ag.first_name || ""} ${ag.last_name || ""}`.trim() : ag.id} ({ag.email || ag.id})
                        </option>
                      ))}
                  </select>
                )}
              </div>


              <div>
                <label className="block font-bold uppercase tracking-wider text-text-muted mb-1 text-[10px]">
                  Cliente Referido
                </label>
                <input
                  type="text"
                  value={adminCommissionClientName}
                  onChange={(e) => setAdminCommissionClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-text-muted mb-1 text-[10px]">
                    Monto Bruto ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={adminCommissionGross}
                    onChange={(e) => setAdminCommissionGross(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs text-text-primary font-mono focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-text-muted mb-1 text-[10px]">
                    Porcentaje de Comisión
                  </label>
                  <input
                    type="number"
                    value={adminCommissionRate}
                    onChange={(e) => setAdminCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs font-bold text-emerald-700 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-900 flex justify-between items-center font-semibold">
                <span>Monto a acreditar a la empresa:</span>
                <span className="text-sm font-extrabold font-mono text-emerald-700">
                  ${((Number(adminCommissionGross) || 0) * ((Number(adminCommissionRate) || 20) / 100)).toFixed(2)} USD
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminCommissionModalOpen(false)}
                  className="px-4 py-2 bg-white border border-border-light text-text-secondary text-xs font-semibold rounded-sm cursor-pointer hover:bg-background-hover"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAssigningCommission}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm border-none cursor-pointer disabled:opacity-50"
                >
                  {isAssigningCommission ? "Asignando..." : "Asignar Comisión"}
                </button>
              </div>
            </form>
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
