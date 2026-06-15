"use client";

import { useState, useRef } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import Link from "next/link";

const OFFICE_LOCATIONS = [
  { id: "cdmx", label: "Ciudad de México — Polanco", address: "Av. Presidente Masaryk 61, Col. Polanco, CDMX", phone: "5551 2345", schedule: ["lunes 9:00‑18:00", "martes 9:00‑18:00", "miércoles 9:00‑18:00", "jueves 9:00‑18:00", "viernes 9:00‑18:00", "sábado 10:00‑14:00"] },
  { id: "gdl",  label: "Guadalajara — Providencia",  address: "Av. Américas 1254, Col. Providencia, Jalisco", phone: "3332 1122", schedule: ["lunes 9:00‑18:00", "martes 9:00‑18:00", "miércoles 9:00‑18:00", "jueves 9:00‑18:00", "viernes 9:00‑18:00", "sábado 10:00‑14:00"] },
  { id: "mty",  label: "Monterrey — San Pedro",       address: "Calzada del Valle 400, San Pedro Garza García, N.L.", phone: "4445 6677", schedule: ["lunes 9:00‑18:00", "martes 9:00‑18:00", "miércoles 9:00‑18:00", "jueves 9:00‑18:00", "viernes 9:00‑18:00", "sábado 10:00‑14:00"] },
  { id: "ssv",  label: "San Salvador — Centro",      address: "67 Avenida Sur Local #1, San Salvador", phone: "2245 4027", schedule: [
      "domingo Cerrado",
      "lunes 8:30 a.m.–6 p.m.",
      "martes 8:30 a.m.–6 p.m.",
      "miércoles (Día del Padre) 8:30 a.m.–6 p.m.",
      "jueves 8:30 a.m.–6 p.m.",
      "viernes 8:30 a.m.–6 p.m.",
      "sábado 9 a.m.–5 p.m."
    ] }
];

const VISA_TYPES = [
  "Visa de Turismo",
  "Visa de Estudiante",
  "Visa de Trabajo",
  "Visa de Negocios / Inversión",
  "Residencia Permanente",
  "Renovación de Visa",
  "Otro / No sé aún",
];

const COUNTRIES = [
  "Estados Unidos",
  "Canadá",
  "México",
  "Inglaterra / Reino Unido",
  "Australia",
  "India",
  "Otro",
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  officeId: string;
  visaType: string;
  country: string;
  date: string;
  time: string;
  notes: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.fullName.trim())   errors.fullName = "El nombre es obligatorio.";
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Ingresa un correo electrónico válido.";
  if (!data.phone.trim())      errors.phone = "El teléfono es obligatorio.";
  if (!data.officeId)          errors.officeId = "Selecciona una oficina.";
  if (!data.visaType)          errors.visaType = "Selecciona el tipo de visa.";
  if (!data.country)           errors.country = "Selecciona el país de destino.";
  if (!data.date)              errors.date = "Selecciona una fecha.";
  if (!data.time)              errors.time = "Selecciona un horario disponible.";
  return errors;
}

const TODAY = new Date().toISOString().split("T")[0];

export default function CitasPage() {
  const headerRef = useRef(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    officeId: "",
    visaType: "",
    country: "",
    date: "",
    time: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1800));
    const id = `TV-CITA-${Date.now().toString(36).toUpperCase()}`;
    setConfirmationId(id);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const selectedOffice = OFFICE_LOCATIONS.find((o) => o.id === formData.officeId);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      {/* ── Hero Banner ── */}
      <div className="w-full bg-brand-primary py-14 px-6 relative overflow-hidden" id="cita-presencial">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="w-[80%] mx-auto relative z-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-3">
            Atención Personalizada
          </p>
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4 font-semibold font-serif italic">
            Agenda tu cita presencial
          </h1>
          <p className="text-white/95 text-base md:text-lg max-w-2xl leading-relaxed">
            Visítanos en nuestras oficinas y recibe orientación de un experto certificado. Resuelve todas tus dudas cara a cara y comienza tu trámite con el pie derecho.
          </p>
        </div>
      </div>

      <main className="w-[80%] mx-auto py-14 flex-1">
        {!submitted ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* ── Left: Info cards ── */}
            <aside className="lg:col-span-2 flex flex-col gap-5">

              {/* What to expect */}
              <div className="bg-white border border-border-light rounded-md p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                  ¿Qué incluye la cita?
                </h2>
                <ul className="space-y-4">
                  {[
                    { icon: "🎯", title: "Diagnóstico de perfil",   desc: "Evaluamos tu situación migratoria actual." },
                    { icon: "📋", title: "Revisión documental",     desc: "Checklist personalizado según tu visa objetivo." },
                    { icon: "💬", title: "Asesoría sin compromiso", desc: "60 min con un experto certificado TodoVisa." },
                    { icon: "🗺️", title: "Plan de acción",          desc: "Hoja de ruta con fechas y pasos concretos." },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3 items-start">
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{item.title}</p>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Offices */}
              <div className="bg-white border border-border-light rounded-md p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                  Nuestras oficinas
                </h2>
                <ul className="space-y-3">
                  {OFFICE_LOCATIONS.map((o) => (
                    <li key={o.id} className="flex gap-2 items-start">
                      <svg className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-text-primary leading-snug">{o.label}</p>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{o.address}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note */}
              <div className="bg-brand-light border border-brand-primary/20 rounded-md p-4 flex gap-3 items-start">
                <svg className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  La cita es <strong className="text-text-primary">gratuita y sin compromiso</strong>. Recibirás un correo de confirmación con todos los detalles.
                </p>
              </div>
            </aside>

            {/* ── Right: Form ── */}
            <section className="lg:col-span-3">
              <div className="bg-white border border-border-light rounded-md shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Form header */}
                <div className="px-8 py-5 border-b border-border-light">
                  <h2 className="text-base font-bold text-text-primary">Datos de la cita</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Completa el formulario y confirmaremos tu cita en menos de 2 horas hábiles.</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="px-8 py-7 space-y-5">

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Ej. Juan Pérez García"
                        className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                      />
                      {errors.fullName && <p className="text-xs text-status-error mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="juan@email.com"
                        className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                      />
                      {errors.email && <p className="text-xs text-status-error mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+52 55 1234 5678"
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all"
                    />
                    {errors.phone && <p className="text-xs text-status-error mt-1">{errors.phone}</p>}
                  </div>

                  <hr className="border-border-light" />

                  {/* Office */}
                  <div>
                    <label htmlFor="officeId" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Oficina a visitar
                    </label>
                    <select
                      id="officeId"
                      name="officeId"
                      value={formData.officeId}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                    >
                      <option value="">Selecciona una oficina</option>
                      {OFFICE_LOCATIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    {selectedOffice && (
                      <p className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {selectedOffice.address}
                      </p>
                    )}
                    {errors.officeId && <p className="text-xs text-status-error mt-1">{errors.officeId}</p>}
                  </div>

                  {/* Visa type + Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="visaType" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Tipo de visa
                      </label>
                      <select
                        id="visaType"
                        name="visaType"
                        value={formData.visaType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                      >
                        <option value="">Selecciona una opción</option>
                        {VISA_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {errors.visaType && <p className="text-xs text-status-error mt-1">{errors.visaType}</p>}
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        País de destino
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                      >
                        <option value="">Selecciona un país</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.country && <p className="text-xs text-status-error mt-1">{errors.country}</p>}
                    </div>
                  </div>

                  <hr className="border-border-light" />

                  {/* Date + Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="date" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Fecha preferida
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        min={TODAY}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all cursor-pointer"
                      />
                      {errors.date && <p className="text-xs text-status-error mt-1">{errors.date}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Horario disponible
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, time: slot }));
                              if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                            }}
                            className={`px-2 py-1.5 text-xs font-semibold rounded-sm border transition-all ${
                              formData.time === slot
                                ? "bg-brand-primary text-white border-brand-primary"
                                : "bg-background-main text-text-secondary border-border-light hover:border-brand-primary/50 hover:text-brand-primary"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      {errors.time && <p className="text-xs text-status-error mt-1.5">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Comentarios adicionales <span className="font-normal text-text-muted normal-case">(opcional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Cuéntanos brevemente tu situación o cualquier duda específica que tengas..."
                      className="w-full px-3.5 py-2 border border-border-light rounded-sm text-sm text-text-primary bg-background-main focus:border-border-focus transition-all resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-8 py-3 bg-brand-primary text-white text-sm font-bold rounded-sm hover:bg-brand-hover transition-all focus:outline-none flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Confirmando cita...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          Agendar mi cita presencial
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-text-muted mt-3">
                      Al agendar, aceptas recibir comunicaciones relacionadas con tu cita. Sin spam, prometido.
                    </p>
                  </div>
                </form>
              </div>
            </section>
          </div>
        ) : (
          /* ── Success Screen ── */
          <div className="bg-white border border-border-light shadow-sm rounded-md p-8 sm:p-12 text-center max-w-xl mx-auto animate-fadeIn">
            <div className="w-16 h-16 bg-green-50 border border-status-success/20 text-status-success rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">¡Cita agendada con éxito!</h1>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8">
              Recibirás un correo de confirmación en <strong className="text-text-primary">{formData.email}</strong> con todos los detalles y la dirección exacta.
            </p>

            {/* Receipt */}
            <div className="bg-background-main border border-border-light rounded-md p-6 text-left space-y-3 mb-8">
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Folio de Cita</span>
                <span className="text-xs font-bold text-brand-primary">{confirmationId}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Cliente</span>
                <span className="text-xs font-semibold text-text-primary">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Oficina</span>
                <span className="text-xs font-semibold text-text-primary">{selectedOffice?.label}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Fecha y Hora</span>
                <span className="text-xs font-semibold text-text-primary">{formData.date} — {formData.time} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Tipo de Visa</span>
                <span className="text-xs font-semibold text-text-primary">{formData.visaType}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors text-center"
              >
                Volver al Inicio
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ fullName: "", email: "", phone: "", officeId: "", visaType: "", country: "", date: "", time: "", notes: "" });
                  setConfirmationId("");
                }}
                className="w-full sm:w-auto px-6 py-2.5 border border-border-light text-text-secondary text-xs font-bold rounded-sm hover:bg-background-hover transition-colors"
              >
                Agendar otra cita
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
