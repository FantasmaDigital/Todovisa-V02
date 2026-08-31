"use client";

import React, { useEffect, useRef, useState } from "react";

interface PayPalHostedButtonProps {
  hostedButtonId: string;
  className?: string;
}

export function PayPalHostedButton({ hostedButtonId, className = "" }: PayPalHostedButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `paypal-container-${hostedButtonId}`;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostedButtonId) return;

    let isMounted = true;

    const renderHostedButton = () => {
      if (!isMounted) return;
      if ((window as any).paypal?.HostedButtons && containerRef.current) {
        try {
          containerRef.current.innerHTML = "";
          const targetDiv = document.createElement("div");
          targetDiv.id = containerId;
          containerRef.current.appendChild(targetDiv);

          (window as any).paypal
            .HostedButtons({
              hostedButtonId: hostedButtonId,
            })
            .render(`#${containerId}`);
        } catch (err: any) {
          console.error("Error rendering PayPal Hosted Button:", err);
          setError("No se pudo cargar el botón hosted de PayPal.");
        }
      }
    };

    // Check if paypal object with HostedButtons is already loaded by PayPalScriptProvider
    if ((window as any).paypal?.HostedButtons) {
      renderHostedButton();
      return () => {
        isMounted = false;
      };
    }

    // Otherwise, load script safely if not already present
    const scriptId = "paypal-hosted-buttons-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://www.paypal.com/sdk/js?client-id=BAABDygt1EEKIsVIxHg1mxOFBotgpmnVLNF_VMsHzn6jLVXIAzH4gIsQa166lDo45iw30TD4DZBIIHHQZ8&components=hosted-buttons&disable-funding=venmo&currency=USD";
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => renderHostedButton();
      script.onerror = () => {
        if (isMounted) setError("Error al cargar el script de PayPal.");
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", renderHostedButton);
    }

    return () => {
      isMounted = false;
      if (script) {
        script.removeEventListener("load", renderHostedButton);
      }
    };
  }, [hostedButtonId, containerId]);

  if (error) {
    return <div className="text-xs text-red-500 text-center py-2">{error}</div>;
  }

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div ref={containerRef} className="w-full min-h-[50px] flex justify-center items-center" />
    </div>
  );
}
