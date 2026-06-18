'use client';

import { useState, useEffect } from 'react';

interface LoadingTextRotatorProps {
  texts: string[];
  intervalMs?: number;
}

export default function LoadingTextRotator({ texts, intervalMs = 2500 }: LoadingTextRotatorProps) {
  const [index, setIndex] = useState(0);
  const [visibleText, setVisibleText] = useState(texts[0] || '');
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (texts.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      
      setTimeout(() => {
        setIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % texts.length;
          setVisibleText(texts[nextIndex]);
          return nextIndex;
        });
        setFade(true);
      }, 300); // 300ms matches the duration-300 transition
    }, intervalMs);

    return () => clearInterval(interval);
  }, [texts, intervalMs]);

  return (
    <span 
      className={`inline-block transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
    >
      {visibleText}
    </span>
  );
}
