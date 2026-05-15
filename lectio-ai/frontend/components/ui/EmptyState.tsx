import React from "react";
import { FolderSearch, Plus } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon = <FolderSearch size={48} className="text-slate-400" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl w-full">
      <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          onClick={onAction}
          leftIcon={<Plus size={18} />}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
