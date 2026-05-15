"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route Error Caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-[#18181F] p-8 rounded-3xl border border-slate-800 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-[#E84855]/10 text-[#E84855] rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Xatolik yuz berdi</h2>
        <p className="text-slate-400 mb-8 text-sm">
          Ushbu bo'limni yuklashda muammo yuzaga keldi. Iltimos, qayta urinib ko'ring.
        </p>
        <Button 
          variant="primary" 
          className="w-full" 
          leftIcon={<RefreshCw size={18} />}
          onClick={() => reset()}
        >
          Qayta urinish
        </Button>
      </div>
    </div>
  );
}
