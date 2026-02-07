'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedScoreProps {
  value: number;
  className?: string;
}

export function AnimatedScore({ value, className = '' }: AnimatedScoreProps) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsubscribe;
  }, [display]);

  const color =
    value >= 80 ? 'text-[#7C8B6F]' :
    value >= 60 ? 'text-[#C2A15E]' :
    'text-[#B36B4C]';

  return (
    <motion.span
      ref={ref}
      className={`${color} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {Math.round(value)}
    </motion.span>
  );
}
