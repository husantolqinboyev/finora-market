import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import ProductCard, { Listing } from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import Header from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, ShoppingBag, Package } from 'lucide-react';

const Products = () => {
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(() => {
    // Get saved category from localStorage or default to 'all'
    const savedCategory = localStorage.getItem('lastSearchedCategory');
    return savedCategory || 'all';
  });
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchListings();
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
      // Fetch categories first - use public client for categories
      const { createClient } = await import('@supabase/supabase-js');
      const publicSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
      
      console.log('Fetching categories with public client...');
      const categoriesResponse = await publicSupabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      console.log('Categories response:', categoriesResponse);
      
      if (!categoriesResponse.error && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      } else if (categoriesResponse.error) {
        console.error('Categories error:', categoriesResponse.error);
      }

      // Fetch listings (only approved and not expired) - use public client
      const now = new Date().toISOString();
      console.log('Fetching listings with public client...');
      const listingsResponse = await publicSupabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .or(`expires_at.gt.${now},expires_at.is.null`)
        .order('created_at', { ascending: false });

      console.log('Listings response:', listingsResponse);

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

      // Fetch profiles for owners with error handling - use public client
      let profileMap = new Map();
      try {
        const ownerIds = [...new Set(listings.map(l => l.owner_id).filter(Boolean))];
        if (ownerIds.length > 0) {
          console.log('Fetching profiles with public client...');
          const profilesResponse = await publicSupabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', ownerIds);
          
          console.log('Profiles response:', profilesResponse);
          
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
          model: (item as any).model || null,
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
        description: "Mahsulotlarni yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoadingListings(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Search and Filter Section */}
        <div className="relative mb-8 sm:mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl sm:rounded-3xl opacity-10 blur-xl"></div>
          <Card className="relative border-0 shadow-lg sm:shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
            <CardContent className="relative p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <div className="flex-1 relative group">
                  <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <Input
                    placeholder="Mahsulotlar va modellarni qidiring..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 sm:pl-16 h-10 sm:h-14 rounded-lg sm:rounded-xl border-purple-200 bg-white/70 backdrop-blur focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-300 text-sm sm:text-lg"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48 md:w-64 h-10 sm:h-14 rounded-lg sm:rounded-xl border-purple-200 bg-white/70 backdrop-blur hover:border-purple-400 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg sm:rounded-xl border-purple-200 bg-white/90 backdrop-blur">
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

        {/* Products Grid */}
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
                    Mahsulotlar yuklanmoqda...
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Iltimos, so'nggi mahsulotlar tayyorlanishini kuting
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
                      <Package className="w-16 h-16 text-purple-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    Mahsulotlar topilmadi
                  </h3>
                  <p className="text-gray-600 text-lg mb-8">
                    {searchTerm || categoryFilter !== 'all' 
                      ? 'Qidirish yoki filtr shartlarini o\'zgartirib ko\'ring' 
                      : 'Hozircha hech qanday mahsulot mavjud emas. Tez orada yangi mahsulotlar qo\'shiladi!'}
                  </p>
                  {(searchTerm || categoryFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Filtrlarni tozalash
                    </button>
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
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Mahsulotlar ({filteredListings.length})
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 ml-16">
                  Barcha mahsulotlar
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-8 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
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
      </div>

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

export default Products;
