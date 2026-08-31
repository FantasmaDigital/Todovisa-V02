"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  partnerType?: "b2b_agency_entity" | "outsourced_agent" | string;
}

// rule: rendering-hoist-jsx — static map at module level, not inside the component
const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 text-xl",
} as const;

// rule: rerender-no-inline-components — pure utility at module level; avoids redefinition on every render
function getInitials(str?: string | null): string {
  if (!str || !str.trim()) return "TV";
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

// rule: rerender-no-inline-components — separate component keyed on src
// so React remounts it on every src change, resetting error without useEffect
function AvatarImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  // rule: rerender-derived-state-no-effect — local error state, no useEffect needed
  const [error, setError] = useState(false);

  // rule: rendering-conditional-render — explicit ternary, not &&
  if (error) return null;

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={className}
    />
  );
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = "md",
  className = "",
  partnerType,
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const imgClass = `${sizeClass} rounded-full object-cover border border-border-light shadow-2xs ${className}`;

  const isValidUrl =
    src &&
    typeof src === "string" &&
    src.trim().length > 5 &&
    !src.includes("unavatar.io") &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("/") ||
      src.startsWith("data:image"));

  // key=src makes React remount AvatarImage on src change → error state resets automatically
  if (isValidUrl) {
    return (
      <AvatarImage key={src} src={src} alt={name || "Usuario"} className={imgClass} />
    );
  }

  const isAgency =
    partnerType === "b2b_agency_entity" ||
    !!name?.toLowerCase().includes("agencia") ||
    !!name?.toLowerCase().includes("fantasma");

  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClass} rounded-full border border-border-light flex items-center justify-center font-bold font-sans uppercase tracking-wider text-white shadow-2xs select-none ${
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
