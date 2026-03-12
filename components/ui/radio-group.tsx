'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('flex flex-wrap gap-3', className)} {...props} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & { label: string }
>(({ className, label, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'group flex items-center gap-2.5 cursor-pointer rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all',
      'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 bg-white',
      'data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
      className
    )}
    {...props}
  >
    {/* Custom radio indicator */}
    <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 group-data-[state=checked]:border-indigo-500 transition-colors flex-shrink-0">
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-indigo-500 block" />
      </RadioGroupPrimitive.Indicator>
    </span>
    <span>{label}</span>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
