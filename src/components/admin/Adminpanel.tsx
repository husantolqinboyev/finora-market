import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Eye, Users, Clock, CheckCircle, FolderOpen, Trash2, Crown, History, MessageSquare } from 'lucide-react';
import CategoryManagement from './CategoryManagement';
import PremiumManagement from './PremiumManagement';
import PremiumAuditHistory from './PremiumAuditHistory';
import AdminMessageManagement from './AdminMessageManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingListing {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name?: string;
  price: number;
  city: string;
  address: string;
  contact_phone: string;
  contact_telegram: string;
  owner_id: string;
  owner_name?: string;
  owner_avatar_url?: string;
  image_url_1?: string;
  image_url_2?: string;
  created_at: string;
  updated_at: string;
  expiry_date: string;
  // status field qo'shish kerak schema ga
  status?: 'pending' | 'approved' | 'rejected';
}

const Adminpanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [approvedListings, setApprovedListings] = useState<PendingListing[]>([]);
  const [rejectedListings, setRejectedListings] = useState<PendingListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'categories' | 'premium' | 'audit'>('pending');
  const [expirationInputs, setExpirationInputs] = useState<Record<string, string>>({});
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExpirationInput, setModalExpirationInput] = useState<string>('');
  const [userLimitInput, setUserLimitInput] = useState<string>('');

  const fetchListings = useCallback(async () => {
    try {
      // Barcha e'lonlarni olish (status bo'yicha filter qilish uchun)
      const { data, error } = await ((supabase as unknown as { 
        from: (table: string) => { 
          select: (query: string) => { 
            order: (column: string, options: { ascending: boolean }) => Promise<unknown> 
          } 
        } 
      }).from('listings')
        .select(`
          *,
          categories(name),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false }) as Promise<{
          data: Array<{
            id: string;
            title: string;
            description: string;
            category_id: string;
            price: number;
            city: string;
            address: string;
            contact_phone: string;
            contact_telegram: string;
            owner_id: string;
            image_url_1?: string;
            image_url_2?: string;
            created_at: string;
            updated_at: string;
            expiry_date: string;
            status?: 'pending' | 'approved' | 'rejected';
            categories?: { name: string } | null;
            profiles?: { full_name: string } | null;
          }> | null;
          error: { message: string } | null;
        }>);

      if (error) throw error;

      // Mock status - real app da bu status field bo'lishi kerak
      const allListings = (data || []).map(item => ({
        ...item,
        category_name: item.categories?.name || 'Noma\'lum',
        owner_name: item.profiles?.full_name || 'Noma\'lum',
        status: item.status || 'pending' as const
      }));

      // Status bo'yicha guruhlash
      const pending = allListings.filter(item => item.status === 'pending');
      const approved = allListings.filter(item => item.status === 'approved');
      const rejected = allListings.filter(item => item.status === 'rejected');

      setPendingListings(pending);
      setApprovedListings(approved);
      setRejectedListings(rejected);

    } catch (error) {
      console.error('E\'lonlarni yuklashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "E'lonlarni yuklashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      // Admin ekanligini tekshirish
      const checkAdmin = async () => {
        try {
          console.log('Checking admin for user:', user.id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          console.log('Admin check result:', { data, error });
          
          // Agar profile bo'lmasa, yaratamiz
          if (error && error.code === 'PGRST116') {
            console.log('Profile not found, creating...');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newProfile, error: createError } = await (supabase as any)
              .from('profiles')
              .insert({
                id: user.id,
                auth_user_id: user.id,
                full_name: 'Admin User',
                phone: '+998000000000',
                telegram_username: 'admin_user',
                nickname: 'admin_user',
                is_admin: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .single();
            
            console.log('Profile creation result:', { newProfile, createError });
            
            if (!createError) {
              setIsAdmin(true);
              fetchListings();
              return;
            }
          }
          
          if (data?.is_admin) {
            setIsAdmin(true);
            fetchListings();
          } else {
            setIsAdmin(false);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Admin check error:', err);
          setIsAdmin(false);
          setIsLoading(false);
        }
      };
      
      checkAdmin();
    }
  }, [user, fetchListings]);

  const handleApprove = async (listingId: string) => {
    try {
      const expirationDays = parseInt(expirationInputs[listingId] || '7');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      // Status ni 'approved' ga o'zgartirish va expiration ma'lumotlarini saqlash
      const { error } = await (supabase as unknown as { 
        from: (table: string) => { 
          update: (data: Record<string, unknown>) => ({ 
            eq: (column: string, value: string) => Promise<{ error?: { message: string } }> 
          }) 
        } 
      }).from('listings')
        .update({ 
          status: 'approved', 
          expiration_days: expirationDays,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat!",
        description: `E'lon tasdiqlandi va ${expirationDays} kun muddatga o'rnatildi`,
      });

      // Clear input for this listing
      setExpirationInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[listingId];
        return newInputs;
      });

      fetchListings(); // Qayta yuklash

    } catch (error) {
      console.error('Tasdiqlashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "E'lonni tasdiqlashda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      // Status ni 'rejected' ga o'zgartirish
      const { error } = await (supabase as unknown as { 
        from: (table: string) => { 
          update: (data: Record<string, unknown>) => ({ 
            eq: (column: string, value: string) => Promise<{ error?: { message: string } }> 
          }) 
        } 
      }).from('listings')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Rad etildi",
        description: "E'lon rad etildi",
      });

      fetchListings(); // Qayta yuklash

    } catch (error) {
      console.error('Rad etishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "E'lonni rad etishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (listingId: string) => {
    try {
      // Delete listing completely from database
      const { error } = await (supabase as unknown as { 
        from: (table: string) => { 
          delete: () => ({ 
            eq: (column: string, value: string) => Promise<{ error?: { message: string } }> 
          }) 
        } 
      }).from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "O'chirildi!",
        description: "E'lon to'liq o'chirib tashlandi",
      });

      fetchListings(); // Qayta yuklash

    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "E'lonni o'chirishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (listing: PendingListing) => {
    setSelectedListing(listing);
    setModalExpirationInput('');
    setUserLimitInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
    setModalExpirationInput('');
    setUserLimitInput('');
  };

  const handleUpdateExpiration = async () => {
    if (!selectedListing || !modalExpirationInput) return;
    
    try {
      const expirationDays = parseInt(modalExpirationInput);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const { error } = await (supabase as unknown as { 
        from: (table: string) => { 
          update: (data: Record<string, unknown>) => ({ 
            eq: (column: string, value: string) => Promise<{ error?: { message: string } }> 
          }) 
        } 
      }).from('listings')
        .update({ 
          expiration_days: expirationDays,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedListing.id);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat!",
        description: `E'lon muddati ${expirationDays} kunga o'zgartirildi`,
      });

      fetchListings();
      handleCloseModal();

    } catch (error) {
      console.error('Muddatni o\'zgartirishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Muddatni o'zgartirishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUserLimit = async () => {
    if (!selectedListing || !userLimitInput) return;
    
    try {
      const dailyLimit = parseInt(userLimitInput);
      
      const { error } = await (supabase as unknown as { 
        from: (table: string) => { 
          update: (data: Record<string, unknown>) => ({ 
            eq: (column: string, value: string) => Promise<{ error?: { message: string } }> 
          }) 
        } 
      }).from('profiles')
        .update({ 
          daily_post_limit: dailyLimit,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedListing.owner_id);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat!",
        description: `Foydalanuvchi kunlik limiti ${dailyLimit} taga o'zgartirildi`,
      });

      handleCloseModal();

    } catch (error) {
      console.error('Limitni o\'zgartirishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Limitni o'zgartirishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const getListingsByTab = () => {
    switch (activeTab) {
      case 'pending': return pendingListings;
      case 'approved': return approvedListings;
      case 'rejected': return rejectedListings;
      default: return pendingListings;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'categories': return <FolderOpen className="w-4 h-4" />;
      case 'premium': return <Crown className="w-4 h-4" />;
      case 'audit': return <History className="w-4 h-4" />;
      case 'messages': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTabColor = (tab: string) => {
    switch (tab) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'categories': return 'bg-blue-500';
      case 'premium': return 'bg-yellow-500';
      case 'audit': return 'bg-purple-500';
      case 'messages': return 'bg-blue-600';
      default: return 'bg-yellow-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Xatolik</CardTitle>
            <CardDescription>
              Siz admin huquqiga ega emassiz. Bu sahifaga kirish uchun admin bo'lishingiz kerak.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/'}>
              Asosiy sahifaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Userlar yuborgan e'lonlarni boshqarish
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['pending', 'approved', 'rejected', 'categories', 'premium', 'audit', 'messages'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 ${
              activeTab === tab ? getTabColor(tab) + ' text-white' : ''
            }`}
          >
            {getTabIcon(tab)}
            {tab === 'pending' && `Kutilayotgan (${pendingListings.length})`}
            {tab === 'approved' && `Tasdiqlangan (${approvedListings.length})`}
            {tab === 'rejected' && `Rad etilgan (${rejectedListings.length})`}
            {tab === 'categories' && 'Kategoriyalar'}
            {tab === 'premium' && 'Premium boshqaruvi'}
            {tab === 'audit' && 'Audit tarixi'}
            {tab === 'messages' && 'Xabarlar'}
          </Button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'categories' ? (
        <CategoryManagement />
      ) : activeTab === 'premium' ? (
        <PremiumManagement />
      ) : activeTab === 'audit' ? (
        <PremiumAuditHistory />
      ) : activeTab === 'messages' ? (
        <AdminMessageManagement />
      ) : (
        /* Listings */
        <div className="space-y-4">
          {getListingsByTab().length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-muted-foreground">
                  {activeTab === 'pending' && 'Kutilayotgan e\'lonlar yo\'q'}
                  {activeTab === 'approved' && 'Tasdiqlangan e\'lonlar yo\'q'}
                  {activeTab === 'rejected' && 'Rad etilgan e\'lonlar yo\'q'}
                </div>
              </CardContent>
            </Card>
          ) : (
            getListingsByTab().map(listing => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      {/* Image Section */}
                      <div className="flex-shrink-0">
                        <img
                          src={listing.image_url_1 || '/placeholder.svg'}
                          alt={listing.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{listing.title}</h3>
                          <Badge variant="outline">{listing.category_name}</Badge>
                          <Badge 
                            className={
                              listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {listing.status === 'pending' && 'Kutilmoqda'}
                            {listing.status === 'approved' && 'Tasdiqlangan'}
                            {listing.status === 'rejected' && 'Rad etilgan'}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {listing.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Narx:</span> {listing.price.toLocaleString('uz-UZ')} so'm
                          </div>
                          <div>
                            <span className="font-medium">Shahar:</span> {listing.city}
                          </div>
                          <div>
                            <span className="font-medium">Sotuvchi:</span> {listing.owner_name}
                          </div>
                          <div>
                            <span className="font-medium">Telefon:</span> {listing.contact_phone}
                          </div>
                          <div>
                            <span className="font-medium">Muddat:</span> {new Date(listing.expiry_date).toLocaleDateString('uz-UZ')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {activeTab === 'pending' && (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor={`expiration-${listing.id}`} className="text-sm font-medium whitespace-nowrap">
                              Muddat (kun):
                            </Label>
                            <Input
                              id={`expiration-${listing.id}`}
                              type="number"
                              min="1"
                              max="365"
                              defaultValue="7"
                              value={expirationInputs[listing.id] || ''}
                              onChange={(e) => setExpirationInputs(prev => ({
                                ...prev,
                                [listing.id]: e.target.value
                              }))}
                              className="w-20 h-8 text-sm"
                              placeholder="7"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(listing.id)}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Tasdiqlash
                            </Button>
                            <Button
                              onClick={() => handleReject(listing.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Rad etish
                            </Button>
                          </div>
                        </>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(listing)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Batafsil
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(listing.id)}
                        size="sm"
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedListing && (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedListing.title}</DialogTitle>
              <DialogDescription>
                E'lon to'liq ma'lumotlari
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Left Column - Image and Basic Info */}
              <div className="space-y-4">
                {selectedListing.image_url_1 && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={selectedListing.image_url_1}
                      alt={selectedListing.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        selectedListing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedListing.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {selectedListing.status === 'pending' && 'Kutilmoqda'}
                      {selectedListing.status === 'approved' && 'Tasdiqlangan'}
                      {selectedListing.status === 'rejected' && 'Rad etilgan'}
                    </Badge>
                    <Badge variant="outline">{selectedListing.category_name}</Badge>
                  </div>
                  
                  <div className="text-2xl font-bold text-green-600">
                    {selectedListing.price.toLocaleString('uz-UZ')} so'm
                  </div>
                </div>
              </div>
              
              {/* Right Column - Detailed Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Tavsif</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedListing.description}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Joylashuv</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>Shahar:</strong> {selectedListing.city}</p>
                    <p><strong>Manzil:</strong> {selectedListing.address}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Aloqa</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>Telefon:</strong> {selectedListing.contact_phone}</p>
                    <p><strong>Telegram:</strong> {selectedListing.contact_telegram}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Sotuvchi</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>Ism:</strong> {selectedListing.owner_name}</p>
                    <p><strong>ID:</strong> {selectedListing.owner_id}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Vaqt</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p><strong>Qo'shilgan:</strong> {new Date(selectedListing.created_at).toLocaleString('uz-UZ')}</p>
                    <p><strong>Yangilangan:</strong> {new Date(selectedListing.updated_at).toLocaleString('uz-UZ')}</p>
                    {selectedListing.expiry_date && (
                      <p><strong>Muddati:</strong> {new Date(selectedListing.expiry_date).toLocaleDateString('uz-UZ')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Update Expiration */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">E'lon muddatini o'zgartirish</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor="modal-expiration" className="text-sm font-medium">
                      Muddat (kun):
                    </Label>
                    <Input
                      id="modal-expiration"
                      type="number"
                      min="1"
                      max="365"
                      value={modalExpirationInput}
                      onChange={(e) => setModalExpirationInput(e.target.value)}
                      className="w-24 h-8 text-sm"
                      placeholder="7"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateExpiration}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!modalExpirationInput}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Muddatni o'zgartirish
                  </Button>
                </div>
                
                {/* Update User Limit */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3">Foydalanuvchi limitini o'zgartirish</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor="user-limit" className="text-sm font-medium">
                      Kunlik limit:
                    </Label>
                    <Input
                      id="user-limit"
                      type="number"
                      min="1"
                      max="50"
                      value={userLimitInput}
                      onChange={(e) => setUserLimitInput(e.target.value)}
                      className="w-24 h-8 text-sm"
                      placeholder="1"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateUserLimit}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!userLimitInput}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Limitni o'zgartirish
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Adminpanel;