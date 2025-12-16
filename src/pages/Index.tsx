import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/useAuth';
import Header from '@/components/layout/Header';
import ProductCard, { Listing } from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import Post from '@/components/user/Post';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Plus, ShoppingBag } from 'lucide-react';

const Index = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [premiumListings, setPremiumListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(() => {
    // Get saved category from localStorage or default to 'all'
    const savedCategory = localStorage.getItem('lastSearchedCategory');
    return savedCategory || 'all';
  });
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  // Debug post modal state
  useEffect(() => {
    console.log('Post modal state changed:', showPostForm);
  }, [showPostForm]);

  // Debug log to track loading state
  console.log('Index component - loading:', loading, 'user:', user?.id);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchListings();
        await fetchPremiumListings();
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save category filter to localStorage when it changes
  useEffect(() => {
    if (categoryFilter !== 'all') {
      localStorage.setItem('lastSearchedCategory', categoryFilter);
    }
  }, [categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchListings = async () => {
    console.log('fetchListings called');
    try {
      // Fetch categories first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoriesResponse = await (supabase as any)
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (!categoriesResponse.error && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      // Fetch listings (only approved and not expired)
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listingsResponse = await (supabase as any)
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .or(`expires_at.gt.${now},expires_at.is.null`)
        .order('created_at', { ascending: false });

      console.log('Listings response:', listingsResponse);

      if (listingsResponse.error) {
        console.error('Listings error:', listingsResponse.error);
        throw listingsResponse.error;
      }

      const listings = listingsResponse.data || [];

      // Create category map
      const categoryMap = new Map(
        (categoriesResponse.data || []).map(cat => [cat.id, cat.name])
      );

      // Fetch profiles for owners with error handling
      let profileMap = new Map();
      try {
        const ownerIds = [...new Set(listings.map(l => l.owner_id).filter(Boolean))];
        if (ownerIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profilesResponse = await (supabase as any)
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', ownerIds);
          
          if (!profilesResponse.error && profilesResponse.data) {
            profileMap = new Map(
              profilesResponse.data.map(profile => [
                profile.id, 
                { full_name: profile.full_name, avatar_url: profile.avatar_url }
              ])
            );
          }

          // Agar profile topilmasa, fallback ma'lumotlar qo'shamiz
          for (const ownerId of ownerIds) {
            if (!profileMap.has(ownerId)) {
              profileMap.set(ownerId, {
                full_name: 'Foydalanuvchi',
                avatar_url: null
              });
            }
          }
        }
      } catch (profileError) {
        console.warn('Profiles fetch failed:', profileError);
      }

      // Transform data
      const transformedListings: Listing[] = listings.map(item => {
        const profile = profileMap.get(item.owner_id);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          category_id: item.category_id,
          category_name: categoryMap.get(item.category_id) || 'Noma\'lum',
          model: (item as any).model || null, // Model maydonini qo'shish
          price: item.price,
          city: item.city,
          address: item.address,
          contact_phone: item.contact_phone,
          contact_telegram: item.contact_telegram,
          owner_id: item.owner_id,
          owner_name: profile?.full_name || 'Noma\'lum',
          owner_avatar_url: profile?.avatar_url || null,
          image_url_1: item.image_url_1,
          image_url_2: item.image_url_2,
          status: item.status,
          expiration_days: (item as unknown as { expiration_days?: number }).expiration_days,
          expires_at: (item as unknown as { expires_at?: string }).expires_at,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });
      
      setListings(transformedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Xatolik",
        description: "E'lonlarni yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchPremiumListings = async () => {
    console.log('fetchPremiumListings called');
    setLoadingPremium(true);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profiles = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('is_premium', true);

      if (!profiles.data) {
        setPremiumListings([]);
        return;
      }

      const ids = profiles.data.map((p: any) => p.id);
      
      if (ids.length === 0) {
        setPremiumListings([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listings = await (supabase as any)
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .in('owner_id', ids)
        .order('created_at', { ascending: false })
        .limit(8);

      if (!listings.data) {
        setPremiumListings([]);
        return;
      }

      const ownerIds = listings.data.map((l: any) => l.owner_id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const owners = await (supabase as any)
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ownerIds);

      const ownerData: any = {};
      if (owners.data) {
        for (const owner of owners.data) {
          ownerData[owner.id] = {
            full_name: owner.full_name || 'Noma\'lum',
            avatar_url: owner.avatar_url
          };
        }
      }

      const catData: any = {};
      for (const cat of categories) {
        catData[cat.id] = cat.name;
      }

      const result: any[] = [];
      for (const item of listings.data) {
        const owner = ownerData[item.owner_id];
        result.push({
          id: item.id,
          title: item.title,
          description: item.description,
          category_id: item.category_id,
          category_name: catData[item.category_id] || 'Noma\'lum',
          model: (item as any).model || null,
          price: Number(item.price),
          city: item.city,
          address: item.address,
          contact_phone: item.contact_phone,
          contact_telegram: item.contact_telegram,
          owner_id: item.owner_id,
          owner_name: owner?.full_name || 'Noma\'lum',
          owner_avatar_url: owner?.avatar_url || null,
          image_url_1: item.image_url_1,
          image_url_2: item.image_url_2,
          status: item.status,
          expiration_days: (item as any).expiration_days,
          expires_at: (item as any).expires_at,
          created_at: item.created_at,
          updated_at: item.updated_at
        });
      }

      setPremiumListings(result as Listing[]);
      
    } catch (error) {
      console.error('Error fetching premium listings:', error);
      setPremiumListings([]);
    } finally {
      setLoadingPremium(false);
    }
  };

  const filterListings = () => {
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (listing.model && listing.model.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.category_id === categoryFilter);
    }

    setFilteredListings(filtered);
  };

  const filterPremiumListings = () => {
    let filtered = premiumListings;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.category_id === categoryFilter);
    }

    return filtered;
  };

  const handleViewDetails = (listing: Listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay state reset to allow React to complete the unmounting animation
    setTimeout(() => {
      setSelectedListing(null);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-animated">
        <div className="flex flex-col items-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary"></div>
          <div className="space-y-2 text-center">
            <p className="text-lg font-medium">Loading your marketplace...</p>
            <p className="text-sm text-muted-foreground">Please wait while we prepare everything</p>
          </div>
        </div>
      </div>
    );
  }

  // Users can view products without authentication

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header />
      
      {/* Premium Products Section */}
      {!loadingPremium && premiumListings.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-xl bg-white/90 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5"></div>
              <CardHeader className="relative pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Premium Mahsulotlar
                  </span>
                  <div className="ml-auto">
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      Tanlangan
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600 ml-10">
                  Premium foydalanuvchilar mahsulotlari
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filterPremiumListings().map((listing, index) => (
                    <div 
                      key={listing.id} 
                      className="animate-float"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductCard
                        listing={listing}
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto p-6">
        {/* Admin Panel Section */}
        {isAdmin && (
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardHeader className="relative p-6 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Admin Panel
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 ml-11">
                  E'lonlarni boshqarish
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-6 pt-0">
                <Button 
                  onClick={() => navigate('/admin')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Admin panelga o'tish
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
          <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-purple-100 rounded-lg">
                    <Search className="w-5 h-5 text-purple-600" />
                  </div>
                  <Input
                    placeholder="Mahsulotlar va modellarni qidiring..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-16 h-14 rounded-xl border-purple-200 bg-white/70 backdrop-blur focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-300 text-lg"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-64 h-14 rounded-xl border-purple-200 bg-white/70 backdrop-blur hover:border-purple-400 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Filter className="w-5 h-5 text-blue-600" />
                      </div>
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-purple-200 bg-white/90 backdrop-blur">
                    <SelectItem value="all">Barcha Kategoriyalar</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Grid */}
        {loadingListings ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardContent className="relative p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-30"></div>
                    <div className="relative p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full inline-block">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    E'lonlar yuklanmoqda...
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Iltimos, so'nggi e'lonlar tayyorlanishini kuting
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardContent className="relative p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-30"></div>
                    <div className="relative p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full inline-block">
                      <ShoppingBag className="w-16 h-16 text-purple-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    E'lonlar topilmadi
                  </h3>
                  <p className="text-gray-600 text-lg mb-8">
                    {searchTerm || categoryFilter !== 'all' 
                      ? 'Qidirish yoki filtr shartlarini o\'zgartirib ko\'ring' 
                      : 'Hozircha hech qanday e\'lon mavjud emas. Tez orada yangi e\'lonlar qo\'shiladi!'}
                  </p>
                  {(searchTerm || categoryFilter !== 'all') && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Filtrlarni tozalash
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10 blur-xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
              <CardHeader className="relative p-8 pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    E'lonlar ({filteredListings.length})
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 ml-16">
                  So'nggi e'lonlar
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-8 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredListings.map((listing, index) => (
                    <div 
                      key={listing.id} 
                      className="animate-float"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductCard
                        listing={listing}
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Floating Post Button */}
      {user && (
        <div className="fixed bottom-8 right-8 z-40">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
            <Button
              onClick={() => {
                console.log('Floating post button clicked, user:', user?.id);
                setShowPostForm(true);
              }}
              size="lg"
              className="relative h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-4 border-white"
            >
              <Plus className="w-7 h-7" />
            </Button>
          </div>
        </div>
      )}

      {/* Post Form Modal */}
      {showPostForm && (
        <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
          <DialogOverlay className="z-[9998] bg-black/50 backdrop-blur-sm" />
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-lg z-[9999] fixed">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-lg"></div>
            <DialogHeader className="relative pb-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-3">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Yangi e'lon yaratish
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="relative">
              <Post key={showPostForm ? 'post-form-open' : 'post-form-closed'} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Detail Modal */}
      {selectedListing && (
        <ProductDetailModal
          listing={selectedListing}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Index;
