"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function ComprobantePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [date, setDate] = useState("");

  useEffect(() => {
    // Establecer fecha actual del comprobante
    setDate(new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const isVipro = id?.includes("VIPRO");
  const amount = isVipro ? "49.00" : "150.00";
  const concept = isVipro ? "Evaluación VIPRO Diagnóstica" : "Asesoría de Visa Premium";

  return (
    <div className="min-h-screen bg-background-main py-10 px-4 font-sans text-text-primary">
      <div className="max-w-2xl mx-auto">
        {/* Acciones superiores (ocultas al imprimir) */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary text-sm font-semibold flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          <button
            onClick={handlePrint}
            className="bg-brand-primary hover:bg-brand-hover text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Comprobante
          </button>
        </div>

        {/* Contenedor del Comprobante (Estilo Ticket/Recibo) */}
        <div className="bg-white rounded-2xl shadow-lg border border-border-light overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Cabecera del recibo */}
          <div className="bg-brand-primary px-8 py-10 text-white text-center relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-md">
                <span className="text-brand-primary font-serif font-bold text-2xl">TV</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Comprobante de Pago</h1>
              <p className="text-brand-light/80 text-sm font-medium uppercase tracking-wider">TodoVisa - Servicios Migratorios</p>
            </div>
          </div>

          {/* Cuerpo del recibo */}
          <div className="px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between border-b border-border-light pb-8 mb-8 gap-6">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Facturado a</p>
                <p className="font-semibold text-text-primary">Cliente TodoVisa</p>
                <p className="text-sm text-text-secondary mt-1">cliente@correo.com</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Detalles del Recibo</p>
                <p className="text-sm text-text-secondary"><span className="font-semibold">Ref:</span> {id}</p>
                <p className="text-sm text-text-secondary mt-1"><span className="font-semibold">Fecha:</span> {date}</p>
                <p className="text-sm text-text-secondary mt-1"><span className="font-semibold">Estado:</span> <span className="text-status-success font-bold">PAGADO</span></p>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <div className="mb-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-border-light text-xs uppercase tracking-wider text-text-muted">
                    <th className="pb-3 font-bold">Descripción</th>
                    <th className="pb-3 font-bold text-center">Cant.</th>
                    <th className="pb-3 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm border-b border-border-light">
                  <tr>
                    <td className="py-4">
                      <p className="font-bold text-text-primary">{concept}</p>
                      <p className="text-xs text-text-secondary mt-1">Servicio digital procesado a través de TodoVisa</p>
                    </td>
                    <td className="py-4 text-center font-medium">1</td>
                    <td className="py-4 text-right font-bold text-text-primary">${amount} USD</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-1/2 lg:w-1/3">
                <div className="flex justify-between py-2 text-sm text-text-secondary">
                  <span>Subtotal</span>
                  <span>${amount}</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-text-secondary">
                  <span>Impuestos (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between py-3 mt-2 border-t border-border-light font-bold text-lg text-brand-primary">
                  <span>Total Pagado</span>
                  <span>${amount} USD</span>
                </div>
              </div>
            </div>

            {/* Footer del recibo */}
            <div className="bg-background-hover rounded-xl p-5 text-center text-xs text-text-secondary">
              <p className="font-semibold mb-1">Gracias por confiar en TodoVisa.</p>
              <p>Este comprobante es válido como confirmación de su pago por servicios digitales migratorios.</p>
              <p className="mt-2 text-[10px] text-text-muted">ID de Transacción: {id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
