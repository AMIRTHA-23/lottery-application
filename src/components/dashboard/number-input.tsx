'use client';

import React, { useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useFormField } from '@/components/ui/form';

interface NumberInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(
  ({ length, value, onChange, disabled }, ref) => {
    const { error } = useFormField();
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
      const target = e.target;
      let targetValue = target.value.replace(/[^0-9]/g, ''); // Only allow numbers
      targetValue = targetValue.slice(-1); // Only allow single digit

      const newValue = value ? value.split('') : Array(length).fill('');
      newValue[index] = targetValue;
      onChange(newValue.join(''));

      // Move to next input if a digit is entered
      if (targetValue !== '' && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      // Move to previous input on backspace if current input is empty
      if (e.key === 'Backspace' && index > 0 && (e.target as HTMLInputElement).value === '') {
        inputsRef.current[index - 1]?.focus();
      }
    };

    return (
      <div ref={ref} className="flex items-center justify-center gap-2 md:gap-3">
        {Array.from({ length }).map((_, i) => (
          <Input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="tel" // Use tel for better mobile numeric keyboard
            maxLength={1}
            value={value?.[i] ?? ''}
            onChange={(e) => handleInputChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={disabled}
            className={cn(
              'h-12 w-12 md:h-16 md:w-16 text-center text-xl md:text-3xl font-bold',
              error && 'border-destructive'
            )}
          />
        ))}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
