"use client";

import { useState, useEffect } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/app/lib/supabase";

interface FormData {
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
  termsAccepted: boolean;
}

export default function AgentApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agent_apply_step");
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [formData, setFormData] = useState<FormData>(() => {
    const defaultData = {
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
      termsAccepted: false,
    };
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agent_apply_form_data");
      return saved ? JSON.parse(saved) : defaultData;
    }
    return defaultData;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Document uploads: key -> { name, progress }
  type DocFile = { name: string; progress: number | null };
  const [docs, setDocs] = useState<Record<string, DocFile | null>>(() => {
    const defaultDocs = {
      dui: null,
      certificacion: null,
      antecedentes: null,
      domicilio: null,
      titulo: null,
      cv: null,
    };
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agent_apply_docs");
      return saved ? JSON.parse(saved) : defaultDocs;
    }
    return defaultDocs;
  });

  const [progressRestored, setProgressRestored] = useState(false);

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
      termsAccepted: false,
    });
    setDocs({
      dui: null,
      certificacion: null,
      antecedentes: null,
      domicilio: null,
      titulo: null,
      cv: null,
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
    if (!updatedData.email || !updatedData.fullName) return;

    const draftId = applicationId || "TDA-DRAFT-" + Math.floor(100000 + Math.random() * 900000);
    if (!applicationId) {
      setApplicationId(draftId);
    }

    try {
      const { error } = await supabase.from("agent_applications").upsert({
        application_id: draftId,
        full_name: updatedData.fullName,
        email: updatedData.email,
        phone: updatedData.phone || "",
        country_residence: updatedData.countryResidence || "",
        experience_years: updatedData.experienceYears || "1",
        linkedin: updatedData.linkedin || "",
        specialties: updatedData.specialties || [],
        target_countries: updatedData.targetCountries || [],
        languages: updatedData.languages || [],
        biography: updatedData.biography || "",
        terms_accepted: updatedData.termsAccepted || false,
        status: "draft",
        documents: {
          dui: updatedDocs.dui?.name || null,
          certificacion: updatedDocs.certificacion?.name || null,
          antecedentes: updatedDocs.antecedentes?.name || null,
          domicilio: updatedDocs.domicilio?.name || null,
          titulo: updatedDocs.titulo?.name || null,
          cv: updatedDocs.cv?.name || null,
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
          setFormData({
            fullName: data.full_name,
            email: data.email,
            phone: data.phone,
            countryResidence: data.country_residence,
            experienceYears: data.experience_years,
            linkedin: data.linkedin || "",
            specialties: data.specialties || [],
            targetCountries: data.target_countries || [],
            languages: data.languages || [],
            biography: data.biography || "",
            termsAccepted: data.terms_accepted || false,
          });

          const dbDocs = data.documents || {};
          setDocs({
            dui: dbDocs.dui ? { name: dbDocs.dui, progress: null } : null,
            certificacion: dbDocs.certificacion ? { name: dbDocs.certificacion, progress: null } : null,
            antecedentes: dbDocs.antecedentes ? { name: dbDocs.antecedentes, progress: null } : null,
            domicilio: dbDocs.domicilio ? { name: dbDocs.domicilio, progress: null } : null,
            titulo: dbDocs.titulo ? { name: dbDocs.titulo, progress: null } : null,
            cv: dbDocs.cv ? { name: dbDocs.cv, progress: null } : null,
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

  const handleDocUpload = (key: string, file: File) => {
    setDocs((prev) => ({ ...prev, [key]: { name: file.name, progress: 0 } }));
    if (errors[`doc_${key}`]) setErrors((prev) => ({ ...prev, [`doc_${key}`]: "" }));
    let p = 0;
    const iv = setInterval(() => {
      p += 20;
      if (p >= 100) {
        clearInterval(iv);
        setDocs((prev) => {
          const nextDocs = { ...prev, [key]: { name: file.name, progress: null } };
          if (step > 2) {
            saveDraftToSupabase(formData, nextDocs, step);
          }
          return nextDocs;
        });
      } else {
        setDocs((prev) => (prev[key] ? { ...prev, [key]: { name: prev[key]!.name, progress: p } } : prev));
      }
    }, 120);
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
    if (step === 1) {
      // Step 1: Benefits and Earnings model viewer (always valid)
    } else if (step === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = "El nombre completo es requerido.";
      if (!formData.email.trim()) {
        newErrors.email = "El correo electrónico es requerido.";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Ingresa un correo electrónico válido.";
      }
      if (!formData.phone.trim()) newErrors.phone = "El teléfono de contacto es requerido.";
      if (!formData.countryResidence.trim()) newErrors.countryResidence = "El país de residencia es requerido.";
    } else if (step === 3) {
      if (!formData.experienceYears) newErrors.experienceYears = "Selecciona tus años de experiencia.";
      if (formData.specialties.length === 0) newErrors.specialties = "Selecciona al menos una especialidad.";
      if (formData.targetCountries.length === 0) newErrors.targetCountries = "Selecciona al menos un país destino.";
    } else if (step === 4) {
      if (formData.languages.length === 0) newErrors.languages = "Selecciona al menos un idioma.";
      if (!formData.biography.trim()) {
        newErrors.biography = "Por favor, escribe una breve biografía sobre tu experiencia.";
      } else if (formData.biography.length < 50) {
        newErrors.biography = "Tu biografía debe tener al menos 50 caracteres.";
      }
    } else if (step === 5) {
      if (!docs.dui) newErrors.doc_dui = "El Documento de Identidad (DUI/INE/Pasaporte) es obligatorio.";
    } else if (step === 6) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "Debes aceptar los términos y condiciones para continuar.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (step === 2) {
      if (!validateStep()) return;
      setIsSubmitting(true);
      const canProceed = await checkAndLoadDraft(formData.email);
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

    const randomId = applicationId || "TDA-" + Math.floor(100000 + Math.random() * 900000);

    try {
      const { error } = await supabase.from("agent_applications").upsert({
        application_id: randomId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        country_residence: formData.countryResidence,
        experience_years: formData.experienceYears,
        linkedin: formData.linkedin,
        specialties: formData.specialties,
        target_countries: formData.targetCountries,
        languages: formData.languages,
        biography: formData.biography,
        terms_accepted: formData.termsAccepted,
        status: "pending",
        documents: {
          dui: docs.dui?.name || null,
          certificacion: docs.certificacion?.name || null,
          antecedentes: docs.antecedentes?.name || null,
          domicilio: docs.domicilio?.name || null,
          titulo: docs.titulo?.name || null,
          cv: docs.cv?.name || null,
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
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          country_residence: formData.countryResidence,
          experience_years: formData.experienceYears,
          linkedin: formData.linkedin,
          specialties: formData.specialties,
          target_countries: formData.targetCountries,
          languages: formData.languages,
          biography: formData.biography,
          terms_accepted: formData.termsAccepted,
          status: "pending",
          documents: {
            dui: docs.dui?.name || null,
            certificacion: docs.certificacion?.name || null,
            antecedentes: docs.antecedentes?.name || null,
            domicilio: docs.domicilio?.name || null,
            titulo: docs.titulo?.name || null,
            cv: docs.cv?.name || null,
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
                <div className="space-y-6 animate-fadeIn">
                  {/* Benefits grid */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Por Qué Unirse</span>
                    <h2 className="text-xl font-bold text-text-primary mt-1 mb-5">Ventajas de la Red TodoVisa</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">Clientes Pre-Calificados</h4>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">Te asignamos solicitudes evaluadas y viables, sin que tengas que buscar clientes por tu cuenta.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">Ganancias Transparentes</h4>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">Comisiones claras que premian tu experiencia y eficiencia. Sin sorpresas ni costos ocultos.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">Gestión 100% Digital</h4>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">Panel centralizado para expedientes, chat con clientes y archivo seguro de documentos.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">Flexibilidad Total</h4>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">Trabaja desde cualquier lugar, controla tus horarios y escala tu práctica a tu ritmo.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earning model */}
                  <div className="bg-brand-primary text-white shadow-sm rounded-sm border-t border-white/10 p-6 sm:p-8 relative overflow-hidden text-left">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Modelo de Ingresos</span>
                        <h3 className="text-lg font-bold font-serif italic text-white mt-0.5">Detalles de Ganancia</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-xs">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">70%</span>
                          <span className="text-white/60 leading-tight">Comisión base</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">+10%</span>
                          <span className="text-white/60 leading-tight">Bono excelencia</span>
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
                    <p className="text-[10px] text-white/50 mt-4 leading-normal">* Bono de excelencia aplicable al mantener calificación promedio ≥ 4.8 estrellas en ciclos mensuales.</p>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Info */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">Información Personal</h3>
                  
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
                </div>
              )}

              {/* STEP 3: Professional Details */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">Perfil Profesional</h3>

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

                  {/* Specialties */}
                  <div>
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-3">Especialidades de Visados</span>
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
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-3">Países Destino que Domina</span>
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

              {/* STEP 4: Certifications & Bio */}
              {step === 4 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">Certificaciones y Biografía</h3>

                  <div>
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-3">Idiomas que Domina</span>
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
                    <label htmlFor="linkedin" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Perfil de LinkedIn (Opcional)</label>
                    <input
                      type="url"
                      name="linkedin"
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/tu-perfil"
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                    />
                  </div>

                  {/* Biography */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="biography" className="block text-xs font-bold text-text-secondary uppercase">Tu Trayectoria y Biografía Profesional</label>
                      <span className={`text-[10px] font-bold ${formData.biography.length > 500 ? "text-status-error" : "text-text-secondary"}`}>
                        {formData.biography.length}/500 caracteres
                      </span>
                    </div>
                    <textarea
                      name="biography"
                      id="biography"
                      rows={4}
                      value={formData.biography}
                      onChange={handleInputChange}
                      placeholder="Cuéntanos sobre tu trayectoria ayudando a personas a obtener sus visados..."
                      maxLength={500}
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all resize-none"
                    />
                    {errors.biography && <p className="text-xs text-status-error mt-1">{errors.biography}</p>}
                  </div>

                  <div className="flex items-start gap-3 px-4 py-3 bg-brand-light border border-brand-primary/20 rounded-sm">
                    <svg className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-xs text-brand-primary leading-relaxed">
                      En el siguiente paso podrás subir tus documentos oficiales: <strong>DUI/INE/Pasaporte, certificaciones, antecedentes penales, comprobante de domicilio, título profesional y CV</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: Documentation */}
              {step === 5 && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">Documentación Requerida</h3>
                  <p className="text-xs text-text-secondary font-semibold">Sube los documentos solicitados. Los marcados con <span className="text-status-error font-bold">*</span> son obligatorios. Formatos: PDF, JPG, PNG (Máx. 10MB por archivo).</p>

                  {([
                    { key: "dui", label: "Documento Único de Identidad (DUI / INE / Pasaporte)", required: true, hint: "Página principal con foto y datos visibles" },
                    { key: "certificacion", label: "Certificación Consular o Migratoria", required: false, hint: "Ej. RCIC, CSIC, consulado acreditante" },
                    { key: "antecedentes", label: "Carta de No Antecedentes Penales", required: false, hint: "Emitida en los últimos 6 meses" },
                    { key: "domicilio", label: "Comprobante de Domicilio", required: false, hint: "Recibo de luz, agua o estado de cuenta (máx. 3 meses)" },
                    { key: "titulo", label: "Título o Diploma Profesional", required: false, hint: "Derecho, Relaciones Internacionales, Administración, etc." },
                    { key: "cv", label: "Currículum Vitae (CV)", required: false, hint: "Formato PDF preferido" },
                  ] as { key: string; label: string; required: boolean; hint: string }[]).map(({ key, label, required, hint }) => (
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm bg-background-main p-5 border border-border-light rounded-sm text-left">
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
                        así como la política de privacidad de TodoVisa, y autorizo la verificación de mi historial profesional.
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
                    {Object.entries(docs).filter(([, v]) => v && v.progress === null).map(([k, v]) => (
                      <span key={k} className="text-xs text-brand-primary font-semibold">📎 {v!.name}</span>
                    ))}
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
