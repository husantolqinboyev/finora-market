import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from '@/components/ui/PremiumBadge';
import { Crown, MapPin, Phone, MessageCircle } from 'lucide-react';

interface ListingCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  category_name: string;
  city: string;
  contact_phone: string;
  contact_telegram: string;
  owner_name: string;
  owner_nickname: string;
  is_premium: boolean;
  image_url_1?: string;
  created_at: string;
  rank_in_category?: number;
  onClick?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  description,
  price,
  category_name,
  city,
  contact_phone,
  contact_telegram,
  owner_name,
  owner_nickname,
  is_premium,
  image_url_1,
  created_at,
  rank_in_category,
  onClick
}) => {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with image and premium badge */}
        <div className="flex gap-4 mb-3">
          <div className="flex-shrink-0 relative">
            <img
              src={image_url_1 || '/placeholder.svg'}
              alt={title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            {rank_in_category && rank_in_category <= 10 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {rank_in_category}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
              <PremiumBadge isPremium={is_premium} size="sm" />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{category_name}</Badge>
              <div className="text-2xl font-bold text-green-600">
                {price.toLocaleString('uz-UZ')} so'm
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
              {description}
            </p>
          </div>
        </div>

        {/* Seller info */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {is_premium && (
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-sm">{owner_name}</span>
                  <span className="text-muted-foreground text-sm">@{owner_nickname}</span>
                </div>
              )}
              {!is_premium && (
                <div>
                  <span className="font-semibold text-sm">{owner_name}</span>
                  <span className="text-muted-foreground text-sm">@{owner_nickname}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="w-3 h-3" />
                {city}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3 h-3" />
                {contact_phone}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <MessageCircle className="w-3 h-3" />
                {contact_telegram}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
