import { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className, hover = false }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-gray-800 rounded-lg overflow-hidden',
        hover && 'transition-transform duration-300 hover:scale-105 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;

