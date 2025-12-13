import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Calendar, User, ChevronLeft, ChevronRight, Play, Pause, Phone, MessageCircle } from 'lucide-react';
import { Listing } from './ProductCard';

interface ProductDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  listing,
  isOpen,
  onClose
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track component mount state
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Modal ochilganda indeksga qaytarish
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setIsAutoPlaying(false);
    }
  }, [isOpen]);

  // Avtomatik slayd
  useEffect(() => {
    if (!listing || !isAutoPlaying || !isMounted) return;
    
    const images = [
      listing.image_url_1,
      listing.image_url_2
    ].filter(Boolean);

    if (images.length <= 1) return;

    const interval = setInterval(() => {
      if (isMounted) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    }, 3000); // 3 soniyada bir

    return () => clearInterval(interval);
  }, [isAutoPlaying, listing, isMounted]);

  if (!listing || !isMounted) return null;

  // Rasmlar massivini tayyorlash
  const images = [
    listing.image_url_1,
    listing.image_url_2
  ].filter(Boolean); // null yoki undefined bo'lganlarni olib tashlash

  // Agar rasm bo'lmasa, placeholder qo'shish
  if (images.length === 0) {
    images.push('/placeholder.svg');
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-6xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-lg relative z-50 ${
        listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium') 
          ? 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-amber-500/10 before:via-yellow-500/10 before:to-amber-500/10 before:rounded-lg before:animate-pulse' 
          : ''
      }`} style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)' }}>
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-lg ${
          listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
            ? 'shadow-amber-500/20 shadow-2xl'
            : ''
        }`}></div>
        
        {/* Premium shimmer effect */}
        {(listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')) && (
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent -skew-x-12 animate-shimmer"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-amber-400/10 via-transparent to-amber-400/5 animate-pulse"></div>
          </div>
        )}
        
        {/* Yopish tugmasi */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-[60] bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={onClose}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        <DialogHeader className="relative pb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full"></div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {listing.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 text-sm sm:text-base">
              {listing.category_name || 'Kategoriya'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="relative grid md:grid-cols-2 gap-6 sm:gap-8 mt-6">
          {/* Rasm qismi */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-purple-200 shadow-xl group">
              {/* Asosiy rasm */}
              <div className="relative h-64 sm:h-80 md:h-96">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${listing.title} - ${index + 1}-rasm`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* Navigatsiya tugmalari */}
              {images.length > 1 && (
                <>
                  {/* Chap tugma */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-purple-600 p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                    aria-label="Oldingi rasm"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* O'ng tugma */}
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-purple-600 p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                    aria-label="Keyingi rasm"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Play/Pause tugma */}
                  <button
                    onClick={toggleAutoPlay}
                    className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm text-purple-600 p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                  >
                    {isAutoPlaying ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                </>
              )}

              {/* Rasm indekatorlari (dots) */}
              {images.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'bg-white w-6 sm:w-8 shadow-lg'
                          : 'bg-white/60 hover:bg-white/80 w-1.5 sm:w-2'
                      }`}
                      aria-label={`Rasm ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Kichik rasmlar (thumbnails) */}
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'border-purple-500 scale-105 shadow-lg'
                        : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-purple-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} - ${index + 1}-rasm`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ma'lumotlar qismi */}
          <div className="space-y-4 sm:space-y-6">
            {/* Narx */}
            <div className={`text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-lg ${
              listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                ? 'bg-gradient-to-r from-amber-600/10 via-yellow-600/10 to-amber-600/10 border-amber-200/50 shadow-amber-500/20'
                : 'bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 border-purple-200/50'
            }`}>
              <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                  ? 'from-amber-600 to-yellow-600'
                  : 'from-purple-600 to-blue-600'
              }`}>
                {listing.price.toLocaleString('uz-UZ')} so'm
              </div>
              <div className={`text-xs sm:text-sm mt-2 font-medium ${
                listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                  ? 'text-amber-600'
                  : 'text-gray-600'
              }`}>
                {listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium') 
                  ? 'Premium mahsulot narxi' 
                  : 'Mahsulot narxi'
                }
              </div>
            </div>

            {/* Tavsif */}
            <div className="p-4 sm:p-6 bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-lg">
              <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-gray-800">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
                </div>
                Tavsifi
              </h3>
              
              {/* Model/Brand */}
              {listing.model && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                    <span className="text-sm sm:text-base font-semibold text-purple-700">Model:</span>
                    <span className="text-sm sm:text-base font-medium text-purple-900">{listing.model}</span>
                  </div>
                </div>
              )}
              
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {listing.description}
              </p>
            </div>

            {/* Joylashuv */}
            <div className="p-4 sm:p-6 bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-lg">
              <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-gray-800">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Manzil
              </h3>
              <div className="text-gray-700 space-y-1">
                <div className="font-medium text-base sm:text-lg">{listing.city}</div>
                <div className="text-xs sm:text-sm text-gray-600">{listing.address}</div>
              </div>
            </div>

            {/* Sotuvchi ma'lumotlari */}
            <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-lg ${
              listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                ? 'bg-gradient-to-br from-amber-50/70 via-yellow-50/50 to-amber-50/70 border-amber-200/50 shadow-amber-500/20'
                : 'bg-white/50 backdrop-blur-sm border-gray-200/50'
            }`}>
              <h3 className={`font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 ${
                listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                  ? 'text-amber-800'
                  : 'text-gray-800'
              }`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                  listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600'
                }`}>
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                {listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                  ? 'Premium sotuvchi'
                  : 'Sotuvchi ma\'lumotlari'
                }
              </h3>
              <div className={`font-medium text-base sm:text-lg mb-4 ${
                listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')
                  ? 'text-amber-700'
                  : 'text-gray-700'
              }`}>
                {listing.owner_name || 'Noma\'lum'}
                {(listing?.owner_name?.includes('Premium') || listing?.owner_name?.includes('premium')) && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-amber-600 font-medium">Premium foydalanuvchi</span>
                  </div>
                )}
              </div>
              
              {/* Bog'lanish tugmalari */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Telefon tugmasi */}
                <a
                  href={`tel:${listing.contact_phone}`}
                  className="flex-1"
                >
                  <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="text-sm sm:text-base">Telefon raqami</span>
                  </Button>
                </a>
                
                {/* Telegram tugmasi */}
                {listing.contact_telegram && (
                  <a
                    href={`https://t.me/${listing.contact_telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Telegram</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Qo'shimcha ma'lumotlar */}
            <div className="p-4 sm:p-6 bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-lg">
              <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-gray-800">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Qo'shimcha ma'lumotlar
              </h3>
              <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>E'lon qo'shilgan:</span>
                  <span className="font-medium">{new Date(listing.created_at).toLocaleDateString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Yangilangan:</span>
                  <span className="font-medium">{new Date(listing.updated_at).toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
