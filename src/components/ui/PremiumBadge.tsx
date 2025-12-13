import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  isPremium: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  isPremium, 
  size = 'sm', 
  showText = true 
}) => {
  if (!isPremium) return null;

  const sizeClasses = {
    sm: 'text-xs px-1 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <Badge 
      className={`bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500 ${sizeClasses[size]}`}
    >
      <Crown className={`${iconSizes[size]} mr-1`} />
      {showText && 'Premium'}
    </Badge>
  );
};

export default PremiumBadge;
