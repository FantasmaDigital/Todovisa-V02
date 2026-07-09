"use client";

import { useState, useEffect } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/app/lib/supabase";
import { useAuthStore } from "../../store/authStore";

interface FormData {
  applicantType: "outsourced_agent" | "b2b_agency";
  fullName: string;
  email: string;
  phone: string;
  countryResidence: string;
  experienceYears: string;
  linkedin: string;
  specialties: string[];
  targetCountries: string[];
  languages: string[];
  biography: string;
  // B2B fields
  companyName: string;
  taxId: string;
  legalRepresentative: string;
  corporateEmail: string;
  companyPhone: string;
  companyAddress: string;
  yearsOfOperation: string;
  teamSize: string;
  companyWebsite: string;
  companyDescription: string;
  termsAccepted: boolean;
}

export default function AgentApplyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agent_apply_step");
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [formData, setFormData] = useState<FormData>(() => {
    const defaultData = {
      applicantType: "outsourced_agent",
      fullName: "",
      email: "",
      phone: "",
      countryResidence: "",
      experienceYears: "",
      linkedin: "",
      specialties: [],
      targetCountries: [],
      languages: [],
      biography: "",
      companyName: "",
      taxId: "",
      legalRepresentative: "",
      corporateEmail: "",
      companyPhone: "",
      companyAddress: "",
      yearsOfOperation: "",
      teamSize: "",
      companyWebsite: "",
      companyDescription: "",
      termsAccepted: false,
    };
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agent_apply_form_data");
      return saved ? JSON.parse(saved) : defaultData;
    }
    return defaultData;
  });

  // Prefill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => {
        const updated = { ...prev };
        if (!updated.fullName) updated.fullName = `${user.firstName} ${user.lastName}`.trim();
        if (!updated.email) updated.email = user.email || "";
        if (!updated.phone) updated.phone = user.phone || "";
        if (!updated.countryResidence) updated.countryResidence = user.country || "";
        
        // Prefill corporate defaults
        if (!updated.legalRepresentative) updated.legalRepresentative = `${user.firstName} ${user.lastName}`.trim();
        if (!updated.corporateEmail) updated.corporateEmail = user.email || "";
        if (!updated.companyPhone) updated.companyPhone = user.phone || "";
        return updated;
      });
    }
  }, [user]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Document uploads: key -> { name, url, progress }
  type DocFile = { name: string; url?: string; progress: number | null };
  const [docs, setDocs] = useState<Record<string, DocFile | null>>(() => {
    const defaultDocs = {
      dui: null,
      certificacion: null,
      antecedentes: null,
      domicilio: null,
      titulo: null,
      cv: null,
      actaConstitutiva: null,
      identificacionRepresentante: null,
      registroTributario: null,
      domicilioEmpresa: null,
      brochureServicios: null,
    };
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agent_apply_docs");
      return saved ? JSON.parse(saved) : defaultDocs;
    }
    return defaultDocs;
  });

  const [progressRestored, setProgressRestored] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-save form progress to local storage
  useEffect(() => {
    if (typeof window !== "undefined" && !isSubmitted) {
      localStorage.setItem("agent_apply_form_data", JSON.stringify(formData));
      localStorage.setItem("agent_apply_step", String(step));
      localStorage.setItem("agent_apply_docs", JSON.stringify(docs));
    }
  }, [formData, step, docs, isSubmitted]);

  // Show status banner if progress was restored
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("agent_apply_step");
      const savedForm = localStorage.getItem("agent_apply_form_data");
      if (savedStep || savedForm) {
        setProgressRestored(true);
      }
    }
  }, []);

  const handleRestartApplication = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("agent_apply_form_data");
      localStorage.removeItem("agent_apply_step");
      localStorage.removeItem("agent_apply_docs");
    }
    setFormData({
      applicantType: "outsourced_agent",
      fullName: "",
      email: "",
      phone: "",
      countryResidence: "",
      experienceYears: "",
      linkedin: "",
      specialties: [],
      targetCountries: [],
      languages: [],
      biography: "",
      companyName: "",
      taxId: "",
      legalRepresentative: "",
      corporateEmail: "",
      companyPhone: "",
      companyAddress: "",
      yearsOfOperation: "",
      teamSize: "",
      companyWebsite: "",
      companyDescription: "",
      termsAccepted: false,
    });
    setDocs({
      dui: null,
      certificacion: null,
      antecedentes: null,
      domicilio: null,
      titulo: null,
      cv: null,
      actaConstitutiva: null,
      identificacionRepresentante: null,
      registroTributario: null,
      domicilioEmpresa: null,
      brochureServicios: null,
    });
    setStep(1);
    setProgressRestored(false);
  };

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const saveDraftToSupabase = async (updatedData: FormData, updatedDocs: any, targetStep: number) => {
    const isB2b = updatedData.applicantType === "b2b_agency";
    const emailToUse = isB2b ? updatedData.corporateEmail : updatedData.email;
    const nameToUse = isB2b ? updatedData.companyName : updatedData.fullName;

    if (!emailToUse || !nameToUse) return;

    const draftId = applicationId || (isB2b ? "B2B-" : "TDA-DRAFT-") + Math.floor(100000 + Math.random() * 900000);
    if (!applicationId) {
      setApplicationId(draftId);
    }

    try {
      const { error } = await supabase.from("agent_applications").upsert({
        application_id: draftId,
        user_id: user?.id || null,
        full_name: nameToUse,
        email: emailToUse,
        phone: (isB2b ? updatedData.companyPhone : updatedData.phone) || "",
        country_residence: (isB2b ? updatedData.companyAddress : updatedData.countryResidence) || "",
        experience_years: (isB2b ? updatedData.yearsOfOperation : updatedData.experienceYears) || "1",
        linkedin: (isB2b ? updatedData.companyWebsite : updatedData.linkedin) || "",
        specialties: updatedData.specialties || [],
        target_countries: updatedData.targetCountries || [],
        languages: updatedData.languages || [],
        biography: (isB2b ? updatedData.companyDescription : updatedData.biography) || "",
        terms_accepted: updatedData.termsAccepted || false,
        status: "draft",
        documents: {
          partner_type: updatedData.applicantType,
          dui: isB2b ? null : updatedDocs.dui?.url || updatedDocs.dui?.name || null,
          certificacion: isB2b ? null : updatedDocs.certificacion?.url || updatedDocs.certificacion?.name || null,
          antecedentes: isB2b ? null : updatedDocs.antecedentes?.url || updatedDocs.antecedentes?.name || null,
          domicilio: isB2b ? null : updatedDocs.domicilio?.url || updatedDocs.domicilio?.name || null,
          titulo: isB2b ? null : updatedDocs.titulo?.url || updatedDocs.titulo?.name || null,
          cv: isB2b ? null : updatedDocs.cv?.url || updatedDocs.cv?.name || null,
          actaConstitutiva: isB2b ? updatedDocs.dui?.url || updatedDocs.dui?.name || null : null,
          identificacionRepresentante: isB2b ? updatedDocs.certificacion?.url || updatedDocs.certificacion?.name || null : null,
          registroTributario: isB2b ? updatedDocs.antecedentes?.url || updatedDocs.antecedentes?.name || null : null,
          domicilioEmpresa: isB2b ? updatedDocs.domicilio?.url || updatedDocs.domicilio?.name || null : null,
          brochureServicios: isB2b ? updatedDocs.titulo?.url || updatedDocs.titulo?.name || null : null,
          licenciaTuristica: isB2b ? updatedDocs.cv?.url || updatedDocs.cv?.name || null : null,
          b2b_details: isB2b ? {
            companyName: updatedData.companyName,
            taxId: updatedData.taxId,
            legalRepresentative: updatedData.legalRepresentative,
            corporateEmail: updatedData.corporateEmail,
            companyPhone: updatedData.companyPhone,
            companyAddress: updatedData.companyAddress,
            yearsOfOperation: updatedData.yearsOfOperation,
            teamSize: updatedData.teamSize,
            companyWebsite: updatedData.companyWebsite,
            companyDescription: updatedData.companyDescription
          } : null,
          last_saved_step: targetStep,
        }
      }, { onConflict: "email" });

      if (error) {
        console.warn("Could not auto-save draft to Supabase:", error.message);
      } else {
        console.log("Auto-saved draft progress to Supabase.");
      }
    } catch (err) {
      console.error("Failed to auto-save draft:", err);
    }
  };

  const checkAndLoadDraft = async (email: string) => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return true;

    try {
      const { data, error } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("email", email)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn("Error checking draft:", error.message);
        return true;
      }

      if (data) {
        if (data.status === "draft") {
          const dbDocs = data.documents || {};
          const dbPartnerType = dbDocs.partner_type || (data.application_id.startsWith("B2B-") ? "b2b_agency" : "outsourced_agent");
          const isB2b = dbPartnerType === "b2b_agency";

          setFormData({
            applicantType: dbPartnerType,
            fullName: isB2b ? "" : data.full_name,
            email: isB2b ? "" : data.email,
            phone: isB2b ? "" : data.phone,
            countryResidence: isB2b ? "" : data.country_residence,
            experienceYears: isB2b ? "" : data.experience_years,
            linkedin: isB2b ? "" : data.linkedin || "",
            specialties: data.specialties || [],
            targetCountries: data.target_countries || [],
            languages: data.languages || [],
            biography: isB2b ? "" : data.biography || "",
            companyName: isB2b ? data.full_name : "",
            taxId: isB2b ? (dbDocs.b2b_details?.taxId || "") : "",
            legalRepresentative: isB2b ? (dbDocs.b2b_details?.legalRepresentative || "") : "",
            corporateEmail: isB2b ? data.email : "",
            companyPhone: isB2b ? data.phone : "",
            companyAddress: isB2b ? data.country_residence : "",
            yearsOfOperation: isB2b ? data.experience_years : "",
            teamSize: isB2b ? (dbDocs.b2b_details?.teamSize || "") : "",
            companyWebsite: isB2b ? (data.linkedin || "") : "",
            companyDescription: isB2b ? (data.biography || "") : "",
            termsAccepted: data.terms_accepted || false,
          });

          const getDocFileValue = (val: any): DocFile | null => {
            if (!val) return null;
            if (typeof val === 'string') {
              const name = val.includes('/') ? val.substring(val.lastIndexOf('/') + 1) : val;
              const cleanName = name.includes('-') ? name.substring(name.indexOf('-') + 1) : name;
              const finalName = cleanName.includes('-') ? cleanName.substring(cleanName.indexOf('-') + 1) : cleanName;
              return { name: finalName, url: val, progress: null };
            }
            return val;
          };

          setDocs({
            dui: getDocFileValue(isB2b ? dbDocs.actaConstitutiva : dbDocs.dui),
            certificacion: getDocFileValue(isB2b ? dbDocs.identificacionRepresentante : dbDocs.certificacion),
            antecedentes: getDocFileValue(isB2b ? dbDocs.registroTributario : dbDocs.antecedentes),
            domicilio: getDocFileValue(isB2b ? dbDocs.domicilioEmpresa : dbDocs.domicilio),
            titulo: getDocFileValue(isB2b ? dbDocs.brochureServicios : dbDocs.titulo),
            cv: getDocFileValue(isB2b ? dbDocs.licenciaTuristica : dbDocs.cv),
          });

          const lastSavedStep = dbDocs.last_saved_step || 3;
          setStep(lastSavedStep);
          setApplicationId(data.application_id);
          setProgressRestored(true);

          showToast("Hemos recuperado tu postulación en borrador guardada en la base de datos.", "info");
          return false; // Loaded draft, do not auto-advance to step 3 in the same click
        } else {
          setErrors((prev) => ({
            ...prev,
            email: `Ya existe una postulación activa o completada (${data.status}) vinculada a este correo.`,
          }));
          return false;
        }
      }
    } catch (err) {
      console.error("Error loading draft:", err);
    }
    return true;
  };

  const handleDocUpload = async (key: string, file: File) => {
    setDocs((prev) => ({ ...prev, [key]: { name: file.name, progress: 10 } }));
    if (errors[`doc_${key}`]) setErrors((prev) => ({ ...prev, [`doc_${key}`]: "" }));

    try {
      const uniqueId = user?.id || Math.random().toString(36).substring(2, 11);
      const filePath = `agent-documents/${uniqueId}/${key}-${Date.now()}-${file.name}`;
      
      setDocs((prev) => (prev[key] ? { ...prev, [key]: { name: file.name, progress: 40 } } : prev));

      const { error: uploadError } = await supabase.storage
        .from("todovisa")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading document to Supabase storage:", uploadError.message);
        setDocs((prev) => ({ ...prev, [key]: null }));
        setErrors((prev) => ({ ...prev, [`doc_${key}`]: `Error de carga: ${uploadError.message}` }));
        showToast("Error al subir el archivo al almacenamiento.", "error");
        return;
      }

      setDocs((prev) => (prev[key] ? { ...prev, [key]: { name: file.name, progress: 85 } } : prev));

      const { data: { publicUrl } } = supabase.storage
        .from("todovisa")
        .getPublicUrl(filePath);

      setDocs((prev) => {
        const nextDocs = { ...prev, [key]: { name: file.name, url: publicUrl, progress: null } };
        if (step > 2) {
          saveDraftToSupabase(formData, nextDocs, step);
        }
        return nextDocs;
      });

      showToast("Documento subido con éxito.", "success");
    } catch (err) {
      console.error("Unexpected error in document upload:", err);
      setDocs((prev) => ({ ...prev, [key]: null }));
      setErrors((prev) => ({ ...prev, [`doc_${key}`]: "Error inesperado al subir el archivo." }));
      showToast("Error inesperado al subir el archivo.", "error");
    }
  };

  const removeDoc = (key: string) => setDocs((prev) => {
    const nextDocs = { ...prev, [key]: null };
    if (step > 2) {
      saveDraftToSupabase(formData, nextDocs, step);
    }
    return nextDocs;
  });

  const countriesList = ["Estados Unidos", "Canadá", "México", "Reino Unido", "Australia", "España", "Otro"];
  const specialtiesList = ["Visas de Turista", "Visas de Estudiante", "Visas de Trabajo", "Residencia Permanente", "Visas de Negocios / Inversión", "Renovación de Visa"];
  const languagesList = ["Español", "Inglés", "Francés", "Portugués", "Alemán"];

  // Handle simple input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle checkbox changes for lists
  const handleCheckboxListChange = (listName: "specialties" | "targetCountries" | "languages", item: string) => {
    setFormData((prev) => {
      const currentList = prev[listName];
      const newList = currentList.includes(item)
        ? currentList.filter((x) => x !== item)
        : [...currentList, item];
      
      // Clear errors if selection is made
      if (errors[listName]) {
        setErrors((prevErr) => ({ ...prevErr, [listName]: "" }));
      }
      return { ...prev, [listName]: newList };
    });
  };

  // Validate current step
  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    const isB2b = formData.applicantType === "b2b_agency";

    if (step === 1) {
      // Step 1: Benefits and Earnings model viewer (always valid)
    } else if (step === 2) {
      if (isB2b) {
        if (!formData.companyName.trim()) newErrors.companyName = "El nombre/razón social de la empresa es requerido.";
        if (!formData.taxId.trim()) newErrors.taxId = "El registro comercial/tributario es requerido.";
        if (!formData.legalRepresentative.trim()) newErrors.legalRepresentative = "El nombre del representante legal es requerido.";
        if (!formData.corporateEmail.trim()) {
          newErrors.corporateEmail = "El correo corporativo es requerido.";
        } else if (!/\S+@\S+\.\S+/.test(formData.corporateEmail)) {
          newErrors.corporateEmail = "Ingresa un correo electrónico válido.";
        }
        if (!formData.companyPhone.trim()) newErrors.companyPhone = "El teléfono corporativo es requerido.";
        if (!formData.companyAddress.trim()) newErrors.companyAddress = "La dirección de la empresa es requerida.";
      } else {
        if (!formData.fullName.trim()) newErrors.fullName = "El nombre completo es requerido.";
        if (!formData.email.trim()) {
          newErrors.email = "El correo electrónico es requerido.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Ingresa un correo electrónico válido.";
        }
        if (!formData.phone.trim()) newErrors.phone = "El teléfono de contacto es requerido.";
        if (!formData.countryResidence.trim()) newErrors.countryResidence = "El país de residencia es requerido.";
      }
    } else if (step === 3) {
      if (isB2b) {
        if (!formData.yearsOfOperation) newErrors.yearsOfOperation = "Selecciona los años de operación de la empresa.";
        if (!formData.teamSize) newErrors.teamSize = "Selecciona el número de asesores en tu equipo.";
      } else {
        if (!formData.experienceYears) newErrors.experienceYears = "Selecciona tus años de experiencia.";
      }
      if (formData.specialties.length === 0) newErrors.specialties = "Selecciona al menos una especialidad.";
      if (formData.targetCountries.length === 0) newErrors.targetCountries = "Selecciona al menos un país destino.";
    } else if (step === 4) {
      if (formData.languages.length === 0) newErrors.languages = "Selecciona al menos un idioma.";
      if (isB2b) {
        if (!formData.companyDescription.trim()) {
          newErrors.companyDescription = "Por favor, escribe una breve descripción de la agencia.";
        } else if (formData.companyDescription.length < 50) {
          newErrors.companyDescription = "La descripción debe tener al menos 50 caracteres.";
        }
      } else {
        if (!formData.biography.trim()) {
          newErrors.biography = "Por favor, escribe una breve biografía sobre tu experiencia.";
        } else if (formData.biography.length < 50) {
          newErrors.biography = "Tu biografía debe tener al menos 50 caracteres.";
        }
      }
    } else if (step === 5) {
      if (isB2b) {
        if (!docs.dui) newErrors.doc_dui = "El Registro de Comercio o Acta Constitutiva es obligatorio.";
        if (!docs.certificacion) newErrors.doc_certificacion = "La identificación del representante legal es obligatoria.";
        if (!docs.antecedentes) newErrors.doc_antecedentes = "El comprobante de Registro Tributario (RFC/RUC) es obligatorio.";
      } else {
        if (!docs.dui) newErrors.doc_dui = "El Documento de Identidad (DUI/INE/Pasaporte) es obligatorio.";
      }
    } else if (step === 6) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "Debes aceptar los términos y condiciones para continuar.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!user) {
        router.push("/auth/signup?redirect=/agents/apply");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep()) return;
      setIsSubmitting(true);
      const emailToValidate = formData.applicantType === "b2b_agency" ? formData.corporateEmail : formData.email;
      const canProceed = await checkAndLoadDraft(emailToValidate);
      setIsSubmitting(false);
      if (!canProceed) return;
      
      setStep((prev) => prev + 1);
      saveDraftToSupabase(formData, docs, 3);
    } else {
      if (validateStep()) {
        const next = step + 1;
        setStep(next);
        if (step > 2) {
          saveDraftToSupabase(formData, docs, next);
        }
      }
    }
  };

  const prevStep = () => {
    const prev = step - 1;
    setStep(prev);
    if (step > 2) {
      saveDraftToSupabase(formData, docs, prev);
    }
  };


  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);
    setErrors({});

    const isB2b = formData.applicantType === "b2b_agency";
    const emailToUse = isB2b ? formData.corporateEmail : formData.email;
    const nameToUse = isB2b ? formData.companyName : formData.fullName;
    const randomId = applicationId || (isB2b ? "B2B-" : "TDA-") + Math.floor(100000 + Math.random() * 900000);

    try {
      const { error } = await supabase.from("agent_applications").upsert({
        application_id: randomId,
        user_id: user?.id || null,
        full_name: nameToUse,
        email: emailToUse,
        phone: isB2b ? formData.companyPhone : formData.phone,
        country_residence: isB2b ? formData.companyAddress : formData.countryResidence,
        experience_years: isB2b ? formData.yearsOfOperation : formData.experienceYears,
        linkedin: isB2b ? formData.companyWebsite : formData.linkedin,
        specialties: formData.specialties,
        target_countries: formData.targetCountries,
        languages: formData.languages,
        biography: isB2b ? formData.companyDescription : formData.biography,
        terms_accepted: formData.termsAccepted,
        status: "pending",
        documents: {
          partner_type: formData.applicantType,
          dui: isB2b ? null : docs.dui?.url || docs.dui?.name || null,
          certificacion: isB2b ? null : docs.certificacion?.url || docs.certificacion?.name || null,
          antecedentes: isB2b ? null : docs.antecedentes?.url || docs.antecedentes?.name || null,
          domicilio: isB2b ? null : docs.domicilio?.url || docs.domicilio?.name || null,
          titulo: isB2b ? null : docs.titulo?.url || docs.titulo?.name || null,
          cv: isB2b ? null : docs.cv?.url || docs.cv?.name || null,
          actaConstitutiva: isB2b ? docs.dui?.url || docs.dui?.name || null : null,
          identificacionRepresentante: isB2b ? docs.certificacion?.url || docs.certificacion?.name || null : null,
          registroTributario: isB2b ? docs.antecedentes?.url || docs.antecedentes?.name || null : null,
          domicilioEmpresa: isB2b ? docs.domicilio?.url || docs.domicilio?.name || null : null,
          brochureServicios: isB2b ? docs.titulo?.url || docs.titulo?.name || null : null,
          licenciaTuristica: isB2b ? docs.cv?.url || docs.cv?.name || null : null,
          b2b_details: isB2b ? {
            companyName: formData.companyName,
            taxId: formData.taxId,
            legalRepresentative: formData.legalRepresentative,
            corporateEmail: formData.corporateEmail,
            companyPhone: formData.companyPhone,
            companyAddress: formData.companyAddress,
            yearsOfOperation: formData.yearsOfOperation,
            teamSize: formData.teamSize,
            companyWebsite: formData.companyWebsite,
            companyDescription: formData.companyDescription
          } : null,
        }
      }, { onConflict: "email" });

      if (error) {
        throw new Error(error.message);
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("agent_apply_form_data");
        localStorage.removeItem("agent_apply_step");
        localStorage.removeItem("agent_apply_docs");
      }
      setApplicationId(randomId);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting agent application:", err);
      const isOffline = err.message?.includes('fetch failed') || err.message?.includes('ENOTFOUND') || err.message?.includes('fetch');
      if (isOffline) {
        console.warn("⚠️ Supabase no disponible. Guardando postulación localmente.");
        const localData = {
          application_id: randomId,
          user_id: user?.id || null,
          full_name: nameToUse,
          email: emailToUse,
          phone: isB2b ? formData.companyPhone : formData.phone,
          country_residence: isB2b ? formData.companyAddress : formData.countryResidence,
          experience_years: isB2b ? formData.yearsOfOperation : formData.experienceYears,
          linkedin: isB2b ? formData.companyWebsite : formData.linkedin,
          specialties: formData.specialties,
          target_countries: formData.targetCountries,
          languages: formData.languages,
          biography: isB2b ? formData.companyDescription : formData.biography,
          terms_accepted: formData.termsAccepted,
          status: "pending",
          documents: {
            partner_type: formData.applicantType,
            dui: isB2b ? null : docs.dui?.name || null,
            certificacion: isB2b ? null : docs.certificacion?.name || null,
            antecedentes: isB2b ? null : docs.antecedentes?.name || null,
            domicilio: isB2b ? null : docs.domicilio?.name || null,
            titulo: isB2b ? null : docs.titulo?.name || null,
            cv: isB2b ? null : docs.cv?.name || null,
            actaConstitutiva: isB2b ? docs.dui?.name || null : null,
            identificacionRepresentante: isB2b ? docs.certificacion?.name || null : null,
            registroTributario: isB2b ? docs.antecedentes?.name || null : null,
            domicilioEmpresa: isB2b ? docs.domicilio?.name || null : null,
            brochureServicios: isB2b ? docs.titulo?.name || null : null,
            licenciaTuristica: isB2b ? docs.cv?.name || null : null,
            b2b_details: isB2b ? {
              companyName: formData.companyName,
              taxId: formData.taxId,
              legalRepresentative: formData.legalRepresentative,
              corporateEmail: formData.corporateEmail,
              companyPhone: formData.companyPhone,
              companyAddress: formData.companyAddress,
              yearsOfOperation: formData.yearsOfOperation,
              teamSize: formData.teamSize,
              companyWebsite: formData.companyWebsite,
              companyDescription: formData.companyDescription
            } : null,
          },
          created_at: new Date().toISOString()
        };
        localStorage.setItem(`agent_app_${randomId}`, JSON.stringify(localData));
        if (typeof window !== "undefined") {
          localStorage.removeItem("agent_apply_form_data");
          localStorage.removeItem("agent_apply_step");
          localStorage.removeItem("agent_apply_docs");
        }
        setApplicationId(randomId);
        setIsSubmitted(true);
      } else {
        setErrors({ submit: err.message || "Error al enviar la postulación. Por favor intente de nuevo." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background-main font-sans">
        <Header />
        <main className="w-[80%] mx-auto py-12 flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-text-secondary font-medium">Cargando formulario de postulación...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-main font-sans">
      <Header />

      <main className="w-[80%] mx-auto py-12 flex-grow">
        {!isSubmitted ? (
          <div className="bg-white border border-border-light shadow-sm rounded-sm p-6 sm:p-10 transition-all duration-300">
            {/* Page Header */}
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Únete a la Red</span>
              <h1 className="text-3xl font-bold text-text-primary mt-2">Postulación para Agente Consultor</h1>
              <p className="text-text-secondary text-sm mt-2 max-w-lg mx-auto">
                Completa el proceso de postulación en 6 sencillos pasos para unirte a nuestra red nacional de expertos.
              </p>
            </div>

            {progressRestored && (
              <div className="bg-brand-light/35 border border-brand-primary/20 rounded-md p-4 mb-8 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 max-w-xl mx-auto">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                  <span className="text-sm">🔄</span>
                  <span>Se ha restaurado tu progreso guardado automáticamente hasta el Paso {step}.</span>
                </div>
                <button
                  type="button"
                  onClick={handleRestartApplication}
                  className="text-xs text-brand-primary hover:underline font-bold cursor-pointer border-0 bg-transparent"
                >
                  Empezar de Nuevo
                </button>
              </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="mb-10">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((stepNum) => (
                  <div key={stepNum} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          step >= stepNum
                            ? "bg-brand-primary text-white scale-110 shadow-sm"
                            : "bg-gray-100 text-text-secondary border border-border-light"
                        }`}
                      >
                        {step > stepNum ? "✓" : stepNum}
                      </div>
                      <span className="text-[10px] font-semibold text-text-secondary mt-1.5 absolute top-9 whitespace-nowrap">
                        {stepNum === 1 && "Beneficios"}
                        {stepNum === 2 && "Datos"}
                        {stepNum === 3 && "Especialidad"}
                        {stepNum === 4 && "Perfil"}
                        {stepNum === 5 && "Documentos"}
                        {stepNum === 6 && "Revisar"}
                      </span>
                    </div>
                    {stepNum < 6 && (
                      <div className="flex-grow mx-2 h-[2px] bg-gray-100 relative">
                        <div
                          className="absolute left-0 top-0 h-full bg-brand-primary transition-all duration-500"
                          style={{ width: step > stepNum ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6">
              {/* STEP 1: Incentives & Earnings model */}
              {step === 1 && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Selector of Applicant Type */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary block mb-3">Paso 1: Modalidad de Registro</span>
                    <h3 className="text-lg font-bold text-text-primary mb-6">Selecciona el tipo de perfil para tu postulación</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, applicantType: "outsourced_agent" }));
                        }}
                        className={`p-5 rounded-lg border text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                          formData.applicantType === "outsourced_agent"
                            ? "border-brand-primary bg-brand-light/30 shadow-md ring-1 ring-brand-primary"
                            : "border-border-light bg-white hover:bg-background-hover hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 w-full">
                          <span className="text-2xl">💼</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.applicantType === "outsourced_agent" ? "border-brand-primary bg-brand-primary" : "border-gray-300"}`}>
                            {formData.applicantType === "outsourced_agent" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">Asesor Independiente</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Trabaja a título individual recibiendo casos pre-calificados y ganando comisiones semanales directas.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, applicantType: "b2b_agency" }));
                        }}
                        className={`p-5 rounded-lg border text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                          formData.applicantType === "b2b_agency"
                            ? "border-brand-primary bg-brand-light/30 shadow-md ring-1 ring-brand-primary"
                            : "border-border-light bg-white hover:bg-background-hover hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 w-full">
                          <span className="text-2xl">🏢</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.applicantType === "b2b_agency" ? "border-brand-primary bg-brand-primary" : "border-gray-300"}`}>
                            {formData.applicantType === "b2b_agency" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">Agencia de Viajes B2B / Empresa</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Asocia tu agencia de viajes o empresa para distribuir visados y gestionar los casos de tus clientes en equipo.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Benefits grid */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Por Qué Unirse</span>
                    <h2 className="text-xl font-bold text-text-primary mt-1 mb-5">
                      {formData.applicantType === "b2b_agency" ? "Ventajas de Alianza para Agencias B2B" : "Ventajas de la Red TodoVisa"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        {formData.applicantType === "b2b_agency" ? (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Distribución Exclusiva</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Ofrece a tus clientes el servicio de perfilamiento premium respaldado por la tecnología y expertos de TodoVisa.</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Clientes Pre-Calificados</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Te asignamos solicitudes evaluadas y viables, sin que tengas que buscar clientes por tu cuenta.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        {formData.applicantType === "b2b_agency" ? (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Comisiones Consolidadas</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Esquema corporativo preferente del 75% al 85% sobre cada trámite completado por tu equipo.</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Ganancias Transparentes</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Comisiones claras que premian tu experiencia y eficiencia. Sin sorpresas ni costos ocultos.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        {formData.applicantType === "b2b_agency" ? (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Panel Multi-Agente B2B</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Monitorea y gestiona los expedientes de todos los clientes de tu agencia desde un tablero consolidado.</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Gestión 100% Digital</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Panel centralizado para expedientes, chat con clientes y archivo seguro de documentos.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        {formData.applicantType === "b2b_agency" ? (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Marca Homologada Partner</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Sello oficial de Agencia Autorizada TodoVisa para aumentar la confianza y conversión de tu marca.</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Flexibilidad Total</h4>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Trabaja desde cualquier lugar, controla tus horarios y escala tu práctica a tu ritmo.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Earning model */}
                  <div className="bg-brand-primary text-white shadow-sm rounded-sm border-t border-white/10 p-6 sm:p-8 relative overflow-hidden text-left">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Modelo de Ingresos</span>
                        <h3 className="text-lg font-bold font-serif italic text-white mt-0.5">
                          {formData.applicantType === "b2b_agency" ? "Plan Financiero Corporativo B2B" : "Detalles de Ganancia"}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-xs">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">
                            {formData.applicantType === "b2b_agency" ? "75%" : "70%"}
                          </span>
                          <span className="text-white/60 leading-tight">Comisión base</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">
                            {formData.applicantType === "b2b_agency" ? "+10%" : "+10%"}
                          </span>
                          <span className="text-white/60 leading-tight">
                            {formData.applicantType === "b2b_agency" ? "Bono volumen" : "Bono excelencia"}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-bold text-white mt-1">Semanal</span>
                          <span className="text-white/60 leading-tight">Cada viernes</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-bold text-white mt-1">$100–$350</span>
                          <span className="text-white/60 leading-tight">USD por trámite</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/50 mt-4 leading-normal">
                      {formData.applicantType === "b2b_agency"
                        ? "* El bono de volumen se activa automáticamente al consolidar más de 15 solicitudes mensuales a través de tu agencia."
                        : "* Bono de excelencia aplicable al mantener calificación promedio ≥ 4.8 estrellas en ciclos mensuales."}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal / Corporate Info */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">
                    {formData.applicantType === "b2b_agency" ? "Datos de la Agencia B2B" : "Información Personal"}
                  </h3>
                  
                  {formData.applicantType === "b2b_agency" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="companyName" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Nombre / Razón Social de la Agencia</label>
                        <input
                          type="text"
                          name="companyName"
                          id="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Ej. Volamos Viajes S.A. de C.V."
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.companyName && <p className="text-xs text-status-error mt-1">{errors.companyName}</p>}
                      </div>

                      <div>
                        <label htmlFor="taxId" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Registro Comercial / Identificación Tributaria (RFC / RUC)</label>
                        <input
                          type="text"
                          name="taxId"
                          id="taxId"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          placeholder="Ej. VVI-123456-XX1"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.taxId && <p className="text-xs text-status-error mt-1">{errors.taxId}</p>}
                      </div>

                      <div>
                        <label htmlFor="legalRepresentative" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Nombre del Representante Legal</label>
                        <input
                          type="text"
                          name="legalRepresentative"
                          id="legalRepresentative"
                          value={formData.legalRepresentative}
                          onChange={handleInputChange}
                          placeholder="Ej. Eduardo Martínez Solís"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.legalRepresentative && <p className="text-xs text-status-error mt-1">{errors.legalRepresentative}</p>}
                      </div>

                      <div>
                        <label htmlFor="corporateEmail" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Correo Electrónico Corporativo</label>
                        <input
                          type="email"
                          name="corporateEmail"
                          id="corporateEmail"
                          value={formData.corporateEmail}
                          onChange={handleInputChange}
                          placeholder="reservas@tuagencia.com"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.corporateEmail && <p className="text-xs text-status-error mt-1">{errors.corporateEmail}</p>}
                      </div>

                      <div>
                        <label htmlFor="companyPhone" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Teléfono Corporativo / WhatsApp de Contacto</label>
                        <input
                          type="text"
                          name="companyPhone"
                          id="companyPhone"
                          value={formData.companyPhone}
                          onChange={handleInputChange}
                          placeholder="Ej. +52 55 9876 5432"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.companyPhone && <p className="text-xs text-status-error mt-1">{errors.companyPhone}</p>}
                      </div>

                      <div>
                        <label htmlFor="companyAddress" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Dirección y Ciudad de la Agencia</label>
                        <input
                          type="text"
                          name="companyAddress"
                          id="companyAddress"
                          value={formData.companyAddress}
                          onChange={handleInputChange}
                          placeholder="Ej. Av. Reforma 405, CDMX, México"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.companyAddress && <p className="text-xs text-status-error mt-1">{errors.companyAddress}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="fullName" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Nombre Completo</label>
                        <input
                          type="text"
                          name="fullName"
                          id="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Ej. Juan Pérez García"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.fullName && <p className="text-xs text-status-error mt-1">{errors.fullName}</p>}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Correo Electrónico</label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="ejemplo@todovisa.com"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.email && <p className="text-xs text-status-error mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Teléfono / WhatsApp</label>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+52 55 1234 5678"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.phone && <p className="text-xs text-status-error mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label htmlFor="countryResidence" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">País y Ciudad de Residencia</label>
                        <input
                          type="text"
                          name="countryResidence"
                          id="countryResidence"
                          value={formData.countryResidence}
                          onChange={handleInputChange}
                          placeholder="Ej. CDMX, México"
                          className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                        />
                        {errors.countryResidence && <p className="text-xs text-status-error mt-1">{errors.countryResidence}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Professional Details / Operations */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">
                    {formData.applicantType === "b2b_agency" ? "Detalles de Operación" : "Perfil Profesional"}
                  </h3>

                  {formData.applicantType === "b2b_agency" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="yearsOfOperation" className="block text-xs font-bold text-text-secondary uppercase mb-2">Años de Operación en el Sector de Viajes</label>
                        <select
                          name="yearsOfOperation"
                          id="yearsOfOperation"
                          value={formData.yearsOfOperation}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                        >
                          <option value="">Selecciona una opción</option>
                          <option value="Menos de 2 años">Menos de 2 años</option>
                          <option value="2-5 años">2 a 5 años</option>
                          <option value="5-10 años">5 a 10 años</option>
                          <option value="Más de 10 años">Más de 10 años</option>
                        </select>
                        {errors.yearsOfOperation && <p className="text-xs text-status-error mt-1.5">{errors.yearsOfOperation}</p>}
                      </div>

                      <div>
                        <label htmlFor="teamSize" className="block text-xs font-bold text-text-secondary uppercase mb-2">Cantidad de Asesores en tu Equipo</label>
                        <select
                          name="teamSize"
                          id="teamSize"
                          value={formData.teamSize}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                        >
                          <option value="">Selecciona una opción</option>
                          <option value="1-3 asesores">1 a 3 asesores</option>
                          <option value="4-10 asesores">4 a 10 asesores</option>
                          <option value="11-25 asesores">11 a 25 asesores</option>
                          <option value="Más de 25 asesores">Más de 25 asesores</option>
                        </select>
                        {errors.teamSize && <p className="text-xs text-status-error mt-1.5">{errors.teamSize}</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="experienceYears" className="block text-xs font-bold text-text-secondary uppercase mb-2">Años de Experiencia en Trámites Consulares</label>
                      <select
                        name="experienceYears"
                        id="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleInputChange}
                        className="w-full md:w-1/2 px-3 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="Menos de 1 año">Menos de 1 año</option>
                        <option value="1-3 años">1 a 3 años</option>
                        <option value="3-5 años">3 a 5 años</option>
                        <option value="Más de 5 años">Más de 5 años</option>
                      </select>
                      {errors.experienceYears && <p className="text-xs text-status-error mt-1.5">{errors.experienceYears}</p>}
                    </div>
                  )}

                  {/* Specialties */}
                  <div>
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-3">Especialidades de Visados que Gestionan</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                      {specialtiesList.map((spec) => (
                        <label
                          key={spec}
                          className={`flex items-center gap-3 px-4 py-3 border rounded-sm text-xs font-medium cursor-pointer transition-all duration-200 ${
                            formData.specialties.includes(spec)
                              ? "bg-brand-light border-brand-primary text-brand-primary"
                              : "bg-background-main border-border-light text-text-secondary hover:bg-background-hover"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.specialties.includes(spec)}
                            onChange={() => handleCheckboxListChange("specialties", spec)}
                          />
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.specialties.includes(spec) ? "border-brand-primary bg-brand-primary text-white" : "border-gray-300"}`}>
                            {formData.specialties.includes(spec) && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                          </span>
                          {spec}
                        </label>
                      ))}
                    </div>
                    {errors.specialties && <p className="text-xs text-status-error mt-2">{errors.specialties}</p>}
                  </div>

                  {/* Target Countries */}
                  <div>
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-3">Países Destino que Domina su Operación</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                      {countriesList.map((country) => (
                        <label
                          key={country}
                          className={`flex items-center gap-3 px-4 py-3 border rounded-sm text-xs font-medium cursor-pointer transition-all duration-200 ${
                            formData.targetCountries.includes(country)
                              ? "bg-brand-light border-brand-primary text-brand-primary"
                              : "bg-background-main border-border-light text-text-secondary hover:bg-background-hover"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.targetCountries.includes(country)}
                            onChange={() => handleCheckboxListChange("targetCountries", country)}
                          />
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.targetCountries.includes(country) ? "border-brand-primary bg-brand-primary text-white" : "border-gray-300"}`}>
                            {formData.targetCountries.includes(country) && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                          </span>
                          {country}
                        </label>
                      ))}
                    </div>
                    {errors.targetCountries && <p className="text-xs text-status-error mt-2">{errors.targetCountries}</p>}
                  </div>
                </div>
              )}

              {/* STEP 4: Certifications & Corporate Profile */}
              {step === 4 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">
                    {formData.applicantType === "b2b_agency" ? "Perfil Corporativo" : "Certificaciones y Biografía"}
                  </h3>

                  <div>
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-3">
                      {formData.applicantType === "b2b_agency" ? "Idiomas que Domina el Equipo" : "Idiomas que Domina"}
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {languagesList.map((lang) => (
                        <label
                          key={lang}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 ${
                            formData.languages.includes(lang)
                              ? "bg-brand-primary border-brand-primary text-white"
                              : "bg-background-main border-border-light text-text-secondary hover:bg-background-hover"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.languages.includes(lang)}
                            onChange={() => handleCheckboxListChange("languages", lang)}
                          />
                          {lang}
                        </label>
                      ))}
                    </div>
                    {errors.languages && <p className="text-xs text-status-error mt-2">{errors.languages}</p>}
                  </div>

                  <div>
                    <label htmlFor={formData.applicantType === "b2b_agency" ? "companyWebsite" : "linkedin"} className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      {formData.applicantType === "b2b_agency" ? "Sitio Web Corporativo o LinkedIn de la Agencia" : "Perfil de LinkedIn (Opcional)"}
                    </label>
                    <input
                      type="url"
                      name={formData.applicantType === "b2b_agency" ? "companyWebsite" : "linkedin"}
                      id={formData.applicantType === "b2b_agency" ? "companyWebsite" : "linkedin"}
                      value={formData.applicantType === "b2b_agency" ? formData.companyWebsite : formData.linkedin}
                      onChange={handleInputChange}
                      placeholder={formData.applicantType === "b2b_agency" ? "https://www.tuagencia.com" : "https://linkedin.com/in/tu-perfil"}
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                    />
                  </div>

                  {/* Biography / Corporate Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor={formData.applicantType === "b2b_agency" ? "companyDescription" : "biography"} className="block text-xs font-bold text-text-secondary uppercase">
                        {formData.applicantType === "b2b_agency" ? "Trayectoria y Descripción de la Agencia" : "Tu Trayectoria y Biografía Profesional"}
                      </label>
                      <span className={`text-[10px] font-bold ${(formData.applicantType === "b2b_agency" ? formData.companyDescription.length : formData.biography.length) > 500 ? "text-status-error" : "text-text-secondary"}`}>
                        {(formData.applicantType === "b2b_agency" ? formData.companyDescription.length : formData.biography.length)}/500 caracteres
                      </span>
                    </div>
                    <textarea
                      name={formData.applicantType === "b2b_agency" ? "companyDescription" : "biography"}
                      id={formData.applicantType === "b2b_agency" ? "companyDescription" : "biography"}
                      rows={4}
                      value={formData.applicantType === "b2b_agency" ? formData.companyDescription : formData.biography}
                      onChange={handleInputChange}
                      placeholder={formData.applicantType === "b2b_agency" ? "Describe brevemente los servicios de tu agencia de viajes, trayectoria comercial y por qué desean ser aliados de TodoVisa..." : "Cuéntanos sobre tu trayectoria ayudando a personas a obtener sus visados..."}
                      maxLength={500}
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all resize-none"
                    />
                    {(formData.applicantType === "b2b_agency" ? errors.companyDescription : errors.biography) && (
                      <p className="text-xs text-status-error mt-1">
                        {formData.applicantType === "b2b_agency" ? errors.companyDescription : errors.biography}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-brand-light border border-brand-primary/20 rounded-sm">
                    <svg className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-xs text-brand-primary leading-relaxed">
                      {formData.applicantType === "b2b_agency" ? (
                        <>
                          En el siguiente paso podrás subir los documentos de la empresa: <strong>Registro de Comercio/Acta Constitutiva, DUI/Identificación del Representante Legal, Comprobante de Registro Tributario, Comprobante de Domicilio Corporativo y Brochure de Servicios</strong>.
                        </>
                      ) : (
                        <>
                          En el siguiente paso podrás subir tus documentos oficiales: <strong>DUI/INE/Pasaporte, certificaciones, antecedentes penales, comprobante de domicilio, título profesional y CV</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: Documentation */}
              {step === 5 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">Documentación Requerida</h3>
                  <p className="text-xs text-text-secondary font-semibold">
                    Sube los documentos solicitados. Los marcados con <span className="text-status-error font-bold">*</span> son obligatorios. Formatos: PDF, JPG, PNG (Máx. 10MB por archivo).
                  </p>

                  {((formData.applicantType === "b2b_agency"
                    ? [
                        { key: "dui", label: "Acta Constitutiva / Registro de Comercio", required: true, hint: "Escritura pública que acredite la existencia legal de la empresa" },
                        { key: "certificacion", label: "Identificación del Representante Legal (DUI / INE / Pasaporte)", required: true, hint: "Documento oficial con foto del firmante autorizado" },
                        { key: "antecedentes", label: "Registro Tributario (RFC / RUC / Tax ID)", required: true, hint: "Cédula fiscal o constancia de inscripción de impuestos" },
                        { key: "domicilio", label: "Comprobante de Domicilio de la Oficina", required: false, hint: "Recibo de servicio (agua, luz, teléfono) a nombre de la empresa" },
                        { key: "titulo", label: "Brochure de Servicios / Presentación Comercial", required: false, hint: "Portafolio de servicios turísticos o de visado que ofrece la agencia" },
                        { key: "cv", label: "Licencia de Operación Turística (Opcional)", required: false, hint: "Acreditación de turismo nacional o local del ministerio correspondiente" },
                      ]
                    : [
                        { key: "dui", label: "Documento Único de Identidad (DUI / INE / Pasaporte)", required: true, hint: "Página principal con foto y datos visibles" },
                        { key: "certificacion", label: "Certificación Consular o Migratoria", required: false, hint: "Ej. RCIC, CSIC, consulado acreditante" },
                        { key: "antecedentes", label: "Carta de No Antecedentes Penales", required: false, hint: "Emitida en los últimos 6 meses" },
                        { key: "domicilio", label: "Comprobante de Domicilio", required: false, hint: "Recibo de luz, agua o estado de cuenta (máx. 3 meses)" },
                        { key: "titulo", label: "Título o Diploma Profesional", required: false, hint: "Derecho, Relaciones Internacionales, Administración, etc." },
                        { key: "cv", label: "Currículum Vitae (CV)", required: false, hint: "Formato PDF preferido" },
                      ]
                  ) as { key: string; label: string; required: boolean; hint: string }[]).map(({ key, label, required, hint }) => (
                    <div key={key}>
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-xs font-bold text-text-secondary uppercase">{label}</span>
                        {required && <span className="text-status-error font-bold text-sm">*</span>}
                      </div>
                      <p className="text-[10px] text-text-secondary mb-2">{hint}</p>

                      {!docs[key] ? (
                        <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-sm bg-background-main hover:bg-background-hover hover:border-brand-primary/40 transition-all cursor-pointer">
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) handleDocUpload(key, e.target.files[0]); }} />
                          <svg className="w-5 h-5 text-brand-primary/50 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                          <span className="text-xs text-text-secondary">Haz clic para seleccionar archivo</span>
                        </label>
                      ) : docs[key]!.progress !== null ? (
                        <div className="px-4 py-3 border border-border-light rounded-sm bg-background-main animate-fadeIn">
                          <div className="flex justify-between text-[10px] text-text-secondary mb-1.5">
                            <span>📎 {docs[key]!.name}</span>
                            <span>{docs[key]!.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-brand-primary h-1 transition-all duration-200" style={{ width: `${docs[key]!.progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-4 py-2.5 border border-brand-primary/20 rounded-sm bg-brand-light animate-fadeIn">
                          <span className="text-xs font-semibold text-brand-primary">✓ {docs[key]!.name}</span>
                          <button type="button" onClick={() => removeDoc(key)} className="text-status-error text-xs font-bold hover:opacity-75 cursor-pointer">✕ Eliminar</button>
                        </div>
                      )}
                      {errors[`doc_${key}`] && <p className="text-xs text-status-error mt-1">{errors[`doc_${key}`]}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 6: Review and Submit */}
              {step === 6 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">Revisar Datos Ingresados</h3>
                  
                  {formData.applicantType === "b2b_agency" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm bg-background-main p-5 border border-border-light rounded-sm text-left">
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Modalidad de Registro</span>
                        <span className="font-semibold text-brand-primary">Agencia B2B / Partner Corporativo</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Nombre / Razón Social de la Agencia</span>
                        <span className="font-semibold text-text-primary">{formData.companyName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Identificación Tributaria (RFC / RUC)</span>
                        <span className="font-semibold text-text-primary">{formData.taxId}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Representante Legal</span>
                        <span className="font-semibold text-text-primary">{formData.legalRepresentative}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Correo Corporativo</span>
                        <span className="font-semibold text-text-primary">{formData.corporateEmail}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Teléfono Corporativo</span>
                        <span className="font-semibold text-text-primary">{formData.companyPhone}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Dirección de la Agencia</span>
                        <span className="font-semibold text-text-primary">{formData.companyAddress}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Años de Operación</span>
                        <span className="font-semibold text-text-primary">{formData.yearsOfOperation}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Cantidad de Asesores</span>
                        <span className="font-semibold text-text-primary">{formData.teamSize}</span>
                      </div>
                      {formData.companyWebsite && (
                        <div>
                          <span className="block text-[10px] font-bold text-text-secondary uppercase">Sitio Web / LinkedIn</span>
                          <a href={formData.companyWebsite} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">{formData.companyWebsite}</a>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Especialidades que Gestionan</span>
                        <span className="font-semibold text-text-primary">{formData.specialties.join(", ")}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Países Destino</span>
                        <span className="font-semibold text-text-primary">{formData.targetCountries.join(", ")}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Idiomas del Equipo</span>
                        <span className="font-semibold text-text-primary">{formData.languages.join(", ")}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Descripción de la Agencia</span>
                        <p className="text-xs text-text-secondary mt-1 italic leading-relaxed">&ldquo;{formData.companyDescription}&rdquo;</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm bg-background-main p-5 border border-border-light rounded-sm text-left">
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Modalidad de Registro</span>
                        <span className="font-semibold text-brand-primary">Asesor Independiente</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Nombre Completo</span>
                        <span className="font-semibold text-text-primary">{formData.fullName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Correo Electrónico</span>
                        <span className="font-semibold text-text-primary">{formData.email}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Teléfono / WhatsApp</span>
                        <span className="font-semibold text-text-primary">{formData.phone}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Ubicación</span>
                        <span className="font-semibold text-text-primary">{formData.countryResidence}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Experiencia</span>
                        <span className="font-semibold text-text-primary">{formData.experienceYears}</span>
                      </div>
                      {formData.linkedin && (
                        <div>
                          <span className="block text-[10px] font-bold text-text-secondary uppercase">LinkedIn</span>
                          <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">{formData.linkedin}</a>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Especialidades</span>
                        <span className="font-semibold text-text-primary">{formData.specialties.join(", ")}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Países Destino</span>
                        <span className="font-semibold text-text-primary">{formData.targetCountries.join(", ")}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Idiomas</span>
                        <span className="font-semibold text-text-primary">{formData.languages.join(", ")}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold text-text-secondary uppercase">Biografía</span>
                        <p className="text-xs text-text-secondary mt-1 italic leading-relaxed">&ldquo;{formData.biography}&rdquo;</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border-light">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, termsAccepted: e.target.checked }));
                          if (errors.termsAccepted) setErrors((prev) => ({ ...prev, termsAccepted: "" }));
                        }}
                        className="mt-1.5 accent-brand-primary rounded-sm cursor-pointer"
                      />
                      <span className="text-xs text-text-secondary leading-normal">
                        He leído y acepto los{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          className="text-brand-primary font-semibold underline hover:text-brand-hover inline cursor-pointer border-none bg-transparent p-0"
                        >
                          Términos del Acuerdo del Agente y Estructura de Ganancias
                        </button>{" "}
                        así como la política de privacidad de TodoVisa, y autorizo la verificación de mi historial profesional/empresarial.
                      </span>
                    </label>
                    {errors.termsAccepted && <p className="text-xs text-status-error mt-2">{errors.termsAccepted}</p>}
                  </div>
                </div>
              )}

              {/* STEP 6 review: show uploaded docs summary */}
              {step === 6 && Object.entries(docs).some(([, v]) => v && v.progress === null) && (
                <div className="bg-background-main border border-border-light rounded-sm p-4 -mt-2 text-left">
                  <span className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Documentos Adjuntos</span>
                  <div className="flex flex-col gap-1">
                    {Object.entries(docs).filter(([, v]) => v && v.progress === null).map(([k, v]) => {
                      const docLabelsMap: Record<string, string> = formData.applicantType === "b2b_agency"
                        ? {
                            dui: "Acta Constitutiva / Registro de Comercio",
                            certificacion: "Identificación del Representante Legal",
                            antecedentes: "Registro Tributario",
                            domicilio: "Comprobante de Domicilio",
                            titulo: "Brochure de Servicios",
                            cv: "Licencia de Operación Turística",
                          }
                        : {
                            dui: "DUI / INE / Pasaporte",
                            certificacion: "Certificación Consular",
                            antecedentes: "Antecedentes Penales",
                            domicilio: "Comprobante de Domicilio",
                            titulo: "Título Profesional",
                            cv: "Currículum Vitae",
                          };
                      return (
                        <span key={k} className="text-xs text-brand-primary font-semibold">📎 {docLabelsMap[k] || k}: {v!.name}</span>
                      );
                    })}
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                  ⚠️ {errors.submit}
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-border-light">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2.5 border border-border-light text-text-secondary text-xs font-bold rounded-sm hover:bg-background-hover transition-colors focus:outline-none cursor-pointer"
                  >
                    ← Atrás
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors focus:outline-none cursor-pointer"
                  >
                    {step === 1 ? "Comenzar Solicitud →" : "Siguiente →"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Procesando...
                      </>
                    ) : (
                      "Enviar Postulación"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
      ) : (
          /* SUCCESS SCREEN */
          <div className="bg-white border border-border-light shadow-sm rounded-sm p-8 sm:p-12 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-green-50 border border-status-success/20 text-status-success rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-text-primary">¡Postulación Recibida!</h1>
            <p className="text-sm text-text-secondary mt-3 max-w-md mx-auto">
              Muchas gracias por tu interés en unirte a TodoVisa. Tu postulación ha sido registrada con éxito en nuestro sistema y está lista para revisión.
            </p>

            {/* Submission Receipt Card */}
            <div className="max-w-md mx-auto bg-background-main border border-border-light rounded-sm p-6 my-8 text-left space-y-4">
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Folio de Postulación</span>
                <span className="text-xs font-bold text-brand-primary">{applicationId}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Candidato</span>
                <span className="text-xs font-semibold text-text-primary">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Correo de Contacto</span>
                <span className="text-xs font-semibold text-text-primary">{formData.email}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Tiempo Estimado de Revisión</span>
                <span className="text-xs font-semibold text-text-primary">3 a 5 días hábiles</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href={`/agents/portal?id=${applicationId}`}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-sm hover:bg-emerald-700 transition-colors text-center inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver Contrato y Estado</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors text-center cursor-pointer"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {showTermsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative border border-border-light flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-brand-primary text-white border-b border-white/10 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/75 mb-1">Acuerdo Legal y Financiero</p>
              <h3 className="text-xl font-bold font-serif italic text-white">Términos de la Red de Agentes y Plan de Ganancias</h3>
            </div>

            {/* Scrollable Terms Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-text-secondary leading-relaxed scrollbar-thin">
              {formData.applicantType === "b2b_agency" ? (
                <>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">1. Estructura de Ganancias Corporativas</h4>
                    <p>
                      La Agencia Partner B2B percibirá una retribución económica basada en las tramitaciones de visados gestionadas y completadas con éxito. El plan financiero para agencias se detalla a continuación:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>
                        <strong>Comisión Base:</strong> La agencia percibirá el <strong>75% del valor neto</strong> de los honorarios de asesoría de visado por cada trámite.
                      </li>
                      <li>
                        <strong>Bono por Volumen de Ventas:</strong> Se otorgará un <strong>+10% adicional (total de 85%)</strong> si la agencia procesa y consolida más de 15 solicitudes de visados pagadas en un ciclo mensual calendario.
                      </li>
                      <li>
                        <strong>Cuota de Plataforma B2B:</strong> TodoVisa retiene el 5% por transacción para cubrir la infraestructura multi-agente, soporte prioritario a la agencia, almacenamiento ilimitado de expedientes corporativos y el uso de herramientas IA de pre-perfilamiento.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">2. Consolidación de Pagos y Facturación</h4>
                    <p>
                      Los pagos acumulados se gestionarán bajo las directrices corporativas siguientes:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>
                        <strong>Frecuencia de Pago:</strong> Las ganancias se liquidan de forma <strong>semanal todos los días viernes</strong>, consolidando todos los trámites cerrados de la agencia.
                      </li>
                      <li>
                        <strong>Cuenta de Destino:</strong> Se transferirá a la cuenta bancaria de la empresa (Razón Social) o cuenta corporativa registrada y validada en su panel.
                      </li>
                      <li>
                        <strong>Requisito Fiscal:</strong> Para recibir la transferencia, la agencia deberá emitir y cargar la factura comercial (CFDI / factura local equivalente) con el desglose correspondiente por el valor de las comisiones generadas.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">3. Distribución B2B y Gestión de Clientes</h4>
                    <p>
                      La Agencia B2B es responsable de la captación y primer contacto de sus propios clientes. TodoVisa provee:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>Herramientas para asignar asesores internos de su equipo a clientes específicos.</li>
                      <li>Un canal directo de soporte y escalabilidad con expertos consultores consulares de TodoVisa.</li>
                      <li>Un panel centralizado de supervisión y estadísticas para el administrador de la agencia.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">4. Estándares y Acreditación de Socios</h4>
                    <p>
                      La agencia socia se compromete a mantener los siguientes estándares de calidad:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>Presentar documentación real y vigente sobre la constitución y registro fiscal de la empresa.</li>
                      <li>Asegurar que su personal atienda de manera profesional y verídica a los clientes, sin realizar promesas de obtención de visa garantizada.</li>
                      <li>No sublicenciar o revender los accesos a la plataforma TodoVisa a terceros sin consentimiento expreso.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">5. Terminación de la Alianza</h4>
                    <p>
                      TodoVisa podrá suspender o rescindir el contrato comercial con la agencia partner de manera inmediata ante el hallazgo de información tributaria falsa, cobros indebidos por encima de las tarifas oficiales homologadas, o conductas fraudulentas.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">1. Estructura de Ganancias y Comisiones</h4>
                    <p>
                      El Agente Consultor percibirá una retribución económica basada en las asesorías y tramitaciones completadas exitosamente. El modelo financiero se detalla a continuación:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>
                        <strong>Comisión Base:</strong> El agente percibirá el <strong>70% del valor neto</strong> cobrado al cliente por la asesoría de visado.
                      </li>
                      <li>
                        <strong>Bono de Excelencia:</strong> TodoVisa otorga un <strong>+10% adicional (total de 80%)</strong> para aquellos agentes que mantengan una calificación promedio de satisfacción del cliente de 4.8/5.0 estrellas o superior, medida en ciclos mensuales.
                      </li>
                      <li>
                        <strong>Cuota de Plataforma:</strong> TodoVisa retiene un 5% sobre el valor del servicio para cubrir costos administrativos, procesamiento seguro de pagos, soporte en línea y mantenimiento de herramientas de IA.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">2. Método y Frecuencia de Liquidación</h4>
                    <p>
                      Los ingresos acumulados se procesarán bajo las siguientes directrices de pago:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>
                        <strong>Periodo de Pago:</strong> Las ganancias se liquidan de forma <strong>semanal todos los días viernes</strong>.
                      </li>
                      <li>
                        <strong>Vía de Transferencia:</strong> Los pagos se realizarán mediante transferencia bancaria (ACH/SPEI), PayPal o Stripe a la cuenta registrada por el agente.
                      </li>
                      <li>
                        <strong>Cierre de Casos:</strong> Una comisión es elegible para pago una vez que el cliente haya recibido la resolución o entrega final de su documentación y el caso se marque como cerrado en la plataforma.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">3. Asignación de Clientes y Leads</h4>
                    <p>
                      TodoVisa gestionará un flujo continuo de leads previamente evaluados. El algoritmo asignará clientes a los agentes en base a:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>La especialidad del visado y el país de destino seleccionado por el agente.</li>
                      <li>Los idiomas dominados y la disponibilidad declarada en el perfil.</li>
                      <li>La calificación del agente (agentes con mayor reputación tendrán prioridad de asignación).</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">4. Obligaciones y Estándares de Servicio</h4>
                    <p>
                      Para pertenecer y mantenerse activo en la Red de Expertos TodoVisa, el agente se compromete a:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>Brindar asesoría veraz y legal conforme a las directrices consulares del país correspondiente.</li>
                      <li>Mantener un tiempo de respuesta inferior a 24 horas hábiles en el chat interno para consultas de clientes activos.</li>
                      <li>Actualizar el estado del expediente en la plataforma oportunamente.</li>
                      <li>Mantener absoluta confidencialidad sobre los datos personales y documentos del solicitante.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">5. Terminación y Retención por Incumplimiento</h4>
                    <p>
                      TodoVisa se reserva el derecho de suspender la cuenta del agente de forma temporal o definitiva en casos de:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>Falsificación de documentos o acreditaciones profesionales.</li>
                      <li>Intentos de cobro extraoficiales por fuera de la pasarela de TodoVisa.</li>
                      <li>Incumplimiento grave de confidencialidad (filtración de datos sensibles).</li>
                      <li>Tasa de cancelación o abandono de casos asignados superior al 20% en un mes.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-background-main border-t border-border-light flex gap-3 justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, termsAccepted: true }));
                  setShowTermsModal(false);
                }}
                className="px-5 py-2 bg-brand-primary text-white hover:bg-brand-hover text-xs font-semibold rounded-sm transition-all focus:outline-none shadow-sm cursor-pointer"
              >
                Aceptar Términos y Ganancias
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2 bg-white border border-border-light text-text-secondary hover:text-text-primary text-xs font-semibold rounded-sm transition-all focus:outline-none cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] px-4 py-3 rounded shadow-md text-white font-semibold text-xs transition-all duration-300 animate-in slide-in-from-bottom-5 ${
          toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-rose-600" : "bg-blue-600"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
