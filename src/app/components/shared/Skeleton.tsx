"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  borderRadius,
  variant = "rectangular",
}) => {
  let defaultStyle: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: borderRadius,
  };

  let variantClass = "rounded-md";
  if (variant === "circular") {
    variantClass = "rounded-full";
  } else if (variant === "text") {
    variantClass = "rounded-sm h-4 w-full";
  } else if (variant === "card") {
    variantClass = "rounded-xl border border-border-light";
  }

  return (
    <div
      style={defaultStyle}
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${variantClass} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 3, className = "" }) => {
  return (
    <div className={`p-6 bg-white rounded-2xl border border-border-light shadow-sm space-y-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0 bg-gray-200" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4 h-5 bg-gray-200" />
          <Skeleton variant="text" className="w-1/2 h-3.5 bg-gray-200" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="text" className={`h-4 bg-gray-200 ${i === rows - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton variant="text" className="h-4 bg-gray-200 w-4/5" />
        </td>
      ))}
    </tr>
  );
};
