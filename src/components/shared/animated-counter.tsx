'use client';

import { useEffect, useRef, useState } from 'react';

type AnimatedCounterProps = {
  value: number;
  duration?: number;
};

export default function AnimatedCounter({ value, duration = 1000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const currentVal = start + (end - start) * progress;
      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };
    
    requestAnimationFrame(animate);

  }, [value, duration]);

  return <span ref={ref}>{displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}
