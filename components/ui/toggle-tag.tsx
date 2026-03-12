import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ToggleTagProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function ToggleTag({ label, selected, onClick }: ToggleTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer',
        selected
          ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-200'
          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
      )}
    >
      {selected && <Check size={12} strokeWidth={3} className="flex-shrink-0" />}
      {label}
    </button>
  );
}
