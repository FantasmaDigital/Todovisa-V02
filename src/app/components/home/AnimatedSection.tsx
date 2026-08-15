"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className = "" }: AnimatedSectionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
