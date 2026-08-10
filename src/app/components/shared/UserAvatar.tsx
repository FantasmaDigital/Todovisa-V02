"use client";

import React, { useState, useEffect } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  partnerType?: "b2b_agency_entity" | "outsourced_agent" | string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = "md",
  className = "",
  partnerType,
}) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const getInitials = (str?: string | null) => {
    if (!str || !str.trim()) return "TV";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-20 h-20 text-xl",
  }[size];

  const isValidUrl =
    src &&
    typeof src === "string" &&
    src.trim().length > 5 &&
    !src.includes("unavatar.io") &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("/") ||
      src.startsWith("data:image"));

  if (isValidUrl && !error) {
    return (
      <img
        src={src}
        alt={name || "Usuario"}
        onError={() => setError(true)}
        className={`${sizeClasses} rounded-full object-cover border border-border-light shadow-2xs ${className}`}
      />
    );
  }

  const isAgency =
    partnerType === "b2b_agency_entity" ||
    name?.toLowerCase().includes("agencia") ||
    name?.toLowerCase().includes("fantasma");

  return (
    <div
      className={`${sizeClasses} rounded-full border border-border-light flex items-center justify-center font-bold font-sans uppercase tracking-wider text-white shadow-2xs select-none ${
        isAgency
          ? "bg-gradient-to-br from-brand-primary to-indigo-800"
          : "bg-gradient-to-br from-brand-hover to-teal-700"
      } ${className}`}
      title={name || "Usuario"}
    >
      <span>{initials}</span>
    </div>
  );
};
