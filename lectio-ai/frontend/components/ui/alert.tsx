import React from "react";
import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle } from "lucide-react";

interface AlertProps {
  variant?: "default" | "destructive" | "success" | "warning";
  className?: string;
  children?: React.ReactNode;
}

interface AlertDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

export function Alert({ 
  variant = "default", 
  className = "",
  children 
}: AlertProps) {
  const baseStyles = "rounded-lg p-4 flex items-start gap-3";
  
  const variantStyles = {
    default: "bg-blue-500/10 border border-blue-500/20 text-blue-700",
    destructive: "bg-red-500/10 border border-red-500/20 text-red-700",
    success: "bg-green-500/10 border border-green-500/20 text-green-700",
    warning: "bg-yellow-500/10 border border-yellow-500/20 text-yellow-700"
  };

  const IconComponent = {
    default: InfoIcon,
    destructive: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle
  }[variant];

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function AlertDescription({ 
  className = "",
  children 
}: AlertDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}
