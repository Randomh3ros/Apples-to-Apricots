import React from 'react';

interface CardDisplayProps {
  text: string;
  className?: string;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ text, className }) => {
  return (
    <p className={`font-bold text-xl lg:text-2xl text-white text-neon-glow text-3d-shadow ${className || ''}`}>
      {text}
    </p>
  );
};

export default CardDisplay;
