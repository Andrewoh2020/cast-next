'use client';

/**
 * Visual aspect-ratio selector — six small rectangles sized proportionally
 * to each ratio, with the label below. Active selection has an indigo
 * border + tinted background. Matches Runway's filmmaker-friendly UX.
 *
 * Auto-detected default lights up subtly (dotted ring) so the user can see
 * which one matches their currently-selected source image, even before
 * they make their own pick.
 */

export type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export const ASPECT_RATIOS: AspectRatio[] = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];

interface Props {
  value: AspectRatio;
  autoDetected?: AspectRatio;
  onChange: (next: AspectRatio) => void;
  disabled?: boolean;
}

// Pixel sizes for each icon — within a fixed bounding box (~28×28) so the row
// aligns nicely. We pick the larger dimension as 26 and scale the other.
function iconBox(ratio: AspectRatio): { w: number; h: number } {
  const [aStr, bStr] = ratio.split(':');
  const a = Number(aStr);
  const b = Number(bStr);
  const max = 26;
  if (a >= b) return { w: max, h: Math.round((b / a) * max) };
  return { h: max, w: Math.round((a / b) * max) };
}

export default function AspectRatioPicker({ value, autoDetected, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ASPECT_RATIOS.map((r) => {
        const isActive = r === value;
        const isAuto = !!autoDetected && r === autoDetected && r !== value;
        const { w, h } = iconBox(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            disabled={disabled}
            aria-pressed={isActive}
            aria-label={`${r}${isAuto ? ' (matches source)' : ''}`}
            className={`group flex flex-col items-center justify-end gap-1 py-2 rounded-lg border transition-all ${
              isActive
                ? 'border-indigo-500 bg-indigo-50/70 shadow-sm shadow-indigo-500/10'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="h-7 flex items-center justify-center">
              <div
                style={{ width: w, height: h }}
                className={`rounded-[3px] border transition-colors ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-500'
                    : isAuto
                      ? 'border-indigo-400 border-dashed bg-indigo-50'
                      : 'border-gray-400 group-hover:border-gray-600 bg-transparent'
                }`}
              />
            </div>
            <span className={`text-[10px] font-bold tracking-tight tabular-nums ${
              isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-800'
            }`}>
              {r}
            </span>
          </button>
        );
      })}
    </div>
  );
}
