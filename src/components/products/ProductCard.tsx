import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';

export interface Listing {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name?: string; // For display purposes
  model?: string; // Product model/brand
  price: number;
  city: string;
  address: string;
  contact_phone: string;
  contact_telegram: string;
  owner_id: string;
  owner_name?: string; // For display purposes
  owner_avatar_url?: string;
  image_url_1?: string;
  image_url_2?: string;
  status?: 'pending' | 'approved' | 'rejected';
  expiration_days?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface ProductCardProps {
  listing: Listing;
  onViewDetails: (listing: Listing) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  listing, 
  onViewDetails
}) => {

  return (
    <Card className="border-0 shadow-lg sm:shadow-xl bg-white/90 backdrop-blur-lg overflow-hidden group transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-2xl hover:shadow-purple-200/30 cursor-pointer rounded-lg sm:rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-lg sm:rounded-xl"></div>
      
      <CardHeader className="p-0 relative">
        <div className="relative overflow-hidden">
          <img
            src={listing.image_url_1 || '/placeholder.svg'}
            alt={listing.title}
            className="w-full h-32 sm:h-40 md:h-48 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Category badge */}
          <div className="absolute top-1.5 sm:top-4 right-1.5 sm:right-4">
            <Badge 
              className="bg-white/90 backdrop-blur-sm text-purple-600 border-purple-200 rounded-full px-1.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-sm font-medium shadow-lg"
            >
              {listing.category_name || 'Kategoriya'}
            </Badge>
          </div>

          {/* Status badge */}
          {listing.status === 'pending' && (
            <div className="absolute top-1.5 sm:top-4 left-1.5 sm:left-4">
              <Badge className="bg-yellow-500/90 backdrop-blur-sm text-white border-yellow-400 rounded-full px-1.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-sm font-medium shadow-lg">
                Tasdiqlanmoqda
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative p-2 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2 md:space-y-3">
        <div className="space-y-1 sm:space-y-2">
          <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-800 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 leading-tight">
            {listing.title}
          </h3>
          
          {/* Model/Brand */}
          {listing.model && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="px-1.5 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 rounded sm:rounded-md">
                <span className="text-[10px] sm:text-xs font-medium text-purple-700">{listing.model}</span>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="truncate">{listing.city}</span>
            <span>•</span>
            <span className="truncate">{listing.address}</span>
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {listing.price.toLocaleString('uz-UZ')} so'm
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative p-2 sm:p-3 md:p-4 pt-0">
        <div className="flex gap-1.5 sm:gap-2 md:gap-3 w-full">
          {/* Batafsil tugmasi */}
          <Button 
            onClick={() => onViewDetails(listing)}
            className="w-full h-7 sm:h-9 md:h-12 font-bold text-[10px] sm:text-xs md:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded sm:rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 mr-0.5 sm:mr-1 md:mr-2" />
            <span className="hidden sm:inline md:inline">Batafsil</span>
            <span className="inline sm:hidden md:hidden">Ko'rish</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;