import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, MapPin, Phone, MessageCircle, Calendar, Edit, Mail, Globe, Plus } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  nickname: string | null;
  address: string | null;
  bio: string | null;
  avatar_url: string | null;
  user_id?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  city: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        // Profil ma'lumotlarini olish
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        } else if (profileData) {
          // Debug: avatar_url ni tekshirish
          console.log('Profile data:', profileData);
          console.log('Avatar URL:', profileData.avatar_url);
          
          // Minimal profile object with available fields
          const completeProfile: UserProfile = {
            id: profileData.id || user.id,
            full_name: profileData.full_name || null,
            email: user.email || null,
            phone: profileData.phone || null,
            telegram_username: profileData.telegram_username || null,
            nickname: profileData.nickname || null,
            address: profileData.address || null,
            bio: profileData.bio || null,
            avatar_url: profileData.avatar_url || null,
            user_id: profileData.user_id || profileData.id,
            is_admin: profileData.is_admin || false,
            created_at: profileData.created_at || new Date().toISOString(),
            updated_at: profileData.updated_at || new Date().toISOString()
          };
          console.log('Complete profile:', completeProfile);
          setProfile(completeProfile);
        }

        // Foydalanuvchining e'lonlarini olish
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, city, created_at, status')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (listingsError) {
          console.error('Listings fetch error:', listingsError);
        } else {
          setUserListings(listingsData || []);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Tasdiqlangan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rad etilgan</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Kutilmoqda</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Profil ma'lumotlari topilmadi</p>
            <Button onClick={() => navigate('/profile-setup')}>
              Profil yaratish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guest user uchun ko'rish
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
            <CardContent className="relative p-16 text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Profilni ko'rish uchun tizimga kiring
              </h2>
              <p className="text-gray-600 mb-8">
                Boshqa foydalanuvchilarning profilini ko'rish uchun avval ro'yxatdan o'ting
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Profil Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
          <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar Section */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <Avatar className="relative h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      {profile.full_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isOwner && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-2 shadow-lg">
                      <Edit className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {profile.full_name || 'Noma\'lum'}
                    </h1>
                    {profile.nickname && (
                      <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-0 px-4 py-2">
                        @{profile.nickname}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Telefon</div>
                        <div className="font-medium">{profile.phone || 'Telefon raqam mavjud emas'}</div>
                      </div>
                    </div>
                    
                    {profile.telegram_username && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Telegram</div>
                          <div className="font-medium">@{profile.telegram_username}</div>
                        </div>
                      </div>
                    )}
                    
                    {profile.address && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Manzil</div>
                          <div className="font-medium">{profile.address}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                      <p className="text-gray-700 italic">"{profile.bio}"</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ro'yxatdan o'tgan: {new Date(profile.created_at).toLocaleDateString('uz-UZ')}
                    </div>
                    {profile.is_admin && (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <Button
                    onClick={() => navigate('/profile-setup')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Profili Tahrirlash
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Foydalanuvchi e'lonlari */}
        {userListings.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardHeader className="relative p-8 pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    E'lonlar ({userListings.length})
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 ml-16">
                  Foydalanuvchining barcha e'lonlari
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-8 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-300"></div>
                      
                      <div className="relative p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-700 transition-colors">
                            {listing.title}
                          </h3>
                          <Badge 
                            className={`${
                              listing.status === 'approved' 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0' 
                                : listing.status === 'rejected'
                                ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-0'
                                : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-0'
                            } px-3 py-1`}
                          >
                            {listing.status === 'approved' 
                              ? 'Tasdiqlangan' 
                              : listing.status === 'rejected'
                              ? 'Rad etilgan'
                              : 'Kutilmoqda'
                            }
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              {listing.price.toLocaleString('uz-UZ')} so'm
                            </span>
                            <div className="flex items-center gap-1 text-gray-500">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{listing.city}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(listing.created_at).toLocaleDateString('uz-UZ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {userListings.length === 0 && isOwner && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardContent className="relative p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-30"></div>
                    <div className="relative p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full inline-block">
                      <Globe className="w-16 h-16 text-purple-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    Sizda hali e'lonlar yo'q
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Birinchi e'loningizni joylashtiring va mahsulotlaringizni sotishni boshlang
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    E'lon Yaratish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;