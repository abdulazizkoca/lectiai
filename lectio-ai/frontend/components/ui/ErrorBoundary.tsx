"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-[#E84855]/10 border border-[#E84855]/20 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-[#E84855] mb-4"><AlertTriangle size={40} /></div>
          <h3 className="text-[#E84855] font-bold text-lg mb-2">Komponentda xatolik yuz berdi</h3>
          <p className="text-[#E84855]/70 text-sm mb-6 max-w-md">
            Dastur ishlashida kutilmagan muammo yuzaga keldi. Oynani yangilang.
          </p>
          <Button 
            variant="secondary" 
            onClick={() => this.setState({ hasError: false })}
            leftIcon={<RefreshCw size={16} />}
          >
            Qayta yuklash
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
