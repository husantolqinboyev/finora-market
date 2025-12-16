import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { geminiService } from '@/lib/ai/gemini';
import { Plus, Upload, Brain, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  category_id: string;
  price: string;
  city: string;
  address: string;
  contact_phone: string;
  contact_telegram: string;
  image_url_1: string;
  image_url_2: string;
  expiration_days: string;
}

const Post: React.FC = () => {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    score: number;
    analysis: string;
    keywords: string[];
  } | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category_id: '',
    price: '',
    city: '',
    address: '',
    contact_phone: '',
    contact_telegram: '',
    image_url_1: '',
    image_url_2: '',
    expiration_days: isPremium ? '12' : '5'
  });

  const [uploadedImages, setUploadedImages] = useState<(File | undefined)[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [compressingImages, setCompressingImages] = useState<boolean[]>([false, false]);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Fetch categories from Supabase
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories for post form...');
        
        // Try to use public client first
        try {
          const { publicSupabase } = await import('../../lib/public-client');
          const { data, error } = await publicSupabase
            .from('categories')
            .select('id, name')
            .order('name');

          if (error) {
            console.error('Public client error:', error);
            throw error;
          }
          
          console.log('Categories fetched with public client:', data);
          
          if (!data || data.length === 0) {
            // Default categories
            setCategories([
              { id: 'cat1', name: 'Elektronika' },
              { id: 'cat2', name: 'Kiyim-kechak' },
              { id: 'cat3', name: 'Uy jihozlari' },
              { id: 'cat4', name: 'Transport' },
              { id: 'cat5', name: 'Xizmatlar' },
              { id: 'cat6', name: 'Boshqa' }
            ]);
          } else {
            setCategories(data || []);
          }
        } catch (publicClientError) {
          console.error('Public client failed, trying authenticated client:', publicClientError);
          
          // Fallback to authenticated client
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any)
            .from('categories')
            .select('id, name')
            .order('name');

          if (error) throw error;
          
          console.log('Categories fetched with authenticated client:', data);
          
          if (!data || data.length === 0) {
            // Default categories
            setCategories([
              { id: 'cat1', name: 'Elektronika' },
              { id: 'cat2', name: 'Kiyim-kechak' },
              { id: 'cat3', name: 'Uy jihozlari' },
              { id: 'cat4', name: 'Transport' },
              { id: 'cat5', name: 'Xizmatlar' },
              { id: 'cat6', name: 'Boshqa' }
            ]);
          } else {
            setCategories(data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Default categories
        setCategories([
          { id: 'cat1', name: 'Elektronika' },
          { id: 'cat2', name: 'Kiyim-kechak' },
          { id: 'cat3', name: 'Uy jihozlari' },
          { id: 'cat4', name: 'Transport' },
          { id: 'cat5', name: 'Xizmatlar' },
          { id: 'cat6', name: 'Boshqa' }
        ]);
      }
    };
    
    fetchCategories();
  }, []);

  // AI Analysis function
  const handleAiAnalysis = async () => {
    if (!formData.title || !formData.description || !formData.category_id || !formData.price) {
      toast({
        title: "Xatolik",
        description: "AI tahlili uchun avval barcha asosiy maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    if (!geminiService.isConfigured()) {
      toast({
        title: "AI xizmati mavjud emas",
        description: "Gemini API kaliti sozlanmagan. Iltimos, .env fayliga API kalitini qo'shing.",
        variant: "destructive",
      });
      return;
    }

    // Check AI analysis limit
    if (!user) {
      toast({
        title: "Xatolik",
        description: "Avval tizimga kiring",
        variant: "destructive",
      });
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('ai_analysis_limit')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
      }

      // Check today's AI analysis usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todayAnalysis, error: analysisError } = await (supabase as any)
        .from('listings')
        .select('id')
        .eq('owner_id', user.id)
        .not('ai_analysis', 'is', null)
        .gte('ai_analyzed_at', today.toISOString());

      if (analysisError) {
        console.error('Analysis count error:', analysisError);
      }

      const aiLimit = profile?.ai_analysis_limit || 10;
      const todayUsage = todayAnalysis?.length || 0;

      if (todayUsage >= aiLimit) {
        toast({
          title: "AI analiz limiti to'ldi",
          description: `Bugungi limit: ${todayUsage}/${aiLimit}. Keyinroq urinib ko'ring.`,
          variant: "destructive",
        });
        return;
      }

    } catch (error) {
      console.error('Limit check error:', error);
    }

    setIsAnalyzing(true);
    
    try {
      const category = categories.find(cat => cat.id === formData.category_id);
      const result = await geminiService.analyzeListing({
        title: formData.title,
        description: formData.description,
        category: category?.name || 'Noma\'lum',
        price: parseFloat(formData.price),
        city: formData.city
      });

      if (result) {
        setAiAnalysis(result);
        setShowAiAnalysis(true);
        
        toast({
          title: "AI tahlil tugallandi",
          description: `Sifat bahosi: ${result.score}/10`,
        });
      } else {
        toast({
          title: "AI tahlil xatosi",
          description: "Tahlilni amalga oshirib bo'lmadi. Iltimos, keyinroq urinib ko'ring.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      toast({
        title: "AI tahlil xatosi",
        description: "Tahlil jarayonida xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Xatolik",
        description: "Faqat JPG va PNG formatdagi rasmlar ruxsat etilgan",
        variant: "destructive"
      });
      return false;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "Xatolik",
        description: "Rasm hajmi 5MB dan kichik bo'lishi kerak",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleImageChange = async (index: number, file?: File) => {
    if (!file) {
      const newUploadedImages = [...uploadedImages];
      newUploadedImages[index] = undefined;
      setUploadedImages(newUploadedImages);
      
      const newImagePreviewUrls = [...imagePreviewUrls];
      newImagePreviewUrls[index] = '';
      setImagePreviewUrls(newImagePreviewUrls);
      return;
    }

    if (!validateImageFile(file)) return;

    try {
      const newCompressingImages = [...compressingImages];
      newCompressingImages[index] = true;
      setCompressingImages(newCompressingImages);

      const compressedFile = await compressImage(file);
      
      const newUploadedImages = [...uploadedImages];
      newUploadedImages[index] = compressedFile;
      setUploadedImages(newUploadedImages);

      const newImagePreviewUrls = [...imagePreviewUrls];
      newImagePreviewUrls[index] = URL.createObjectURL(compressedFile);
      setImagePreviewUrls(newImagePreviewUrls);

    } catch (error) {
      console.error('Rasm yuklash xatoligi:', error);
      toast({
        title: "Xatolik",
        description: "Rasm yuklashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      const newCompressingImages = [...compressingImages];
      newCompressingImages[index] = false;
      setCompressingImages(newCompressingImages);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      event.target.value = '';
      return;
    }

    try {
      // Set loading state
      const newCompressingImages = [...compressingImages];
      newCompressingImages[imageNumber - 1] = true;
      setCompressingImages(newCompressingImages);

      // Compress image
      const compressedFile = await compressImage(file);
      
      // Calculate compression ratio
      const originalSize = file.size;
      const compressedSize = compressedFile.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      console.log(`Rasm hajmi kamaydi: ${(originalSize / 1024 / 1024).toFixed(2)}MB dan ${(compressedSize / 1024 / 1024).toFixed(2)}MB ga (${compressionRatio}%)`);

      const newUploadedImages = [...uploadedImages];
      newUploadedImages[imageNumber - 1] = compressedFile;
      setUploadedImages(newUploadedImages);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPreviewUrls = [...imagePreviewUrls];
        newPreviewUrls[imageNumber - 1] = e.target?.result as string;
        setImagePreviewUrls(newPreviewUrls);
      };
      reader.readAsDataURL(compressedFile);

      toast({
        title: "Muvaffaqiyat!",
        description: `Rasm yuklandi (${compressionRatio}% hajmini kamaytirildi)`,
      });

    } catch (error) {
      console.error('Rasmni siqishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Rasmni siqishda xatolik yuz berdi",
        variant: "destructive"
      });
      event.target.value = '';
    } finally {
      // Reset loading state
      const newCompressingImages = [...compressingImages];
      newCompressingImages[imageNumber - 1] = false;
      setCompressingImages(newCompressingImages);
    }
  };

  const removeImage = (imageNumber: 1 | 2) => {
    const newUploadedImages = [...uploadedImages];
    newUploadedImages[imageNumber - 1] = undefined;
    setUploadedImages(newUploadedImages);
    
    const newPreviewUrls = [...imagePreviewUrls];
    newPreviewUrls[imageNumber - 1] = '';
    setImagePreviewUrls(newPreviewUrls);
    
    // Clear file input using React ref
    if (fileInputRefs[imageNumber - 1].current) {
      fileInputRefs[imageNumber - 1].current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Xatolik",
        description: "Avval tizimga kiring",
        variant: "destructive"
      });
      return;
    }

    // Validatsiya
    if (!formData.title.trim() || !formData.description.trim() || !formData.category_id || 
        !formData.price || !formData.city || !formData.address || 
        !formData.contact_phone || !formData.contact_telegram || !formData.expiration_days) {
      toast({
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'ldiring",
        variant: "destructive"
      });
      return;
    }

    // Validate expiration days based on user type
    const expirationDays = parseInt(formData.expiration_days);
    const maxDays = isPremium ? 12 : 5;
    const minDays = 1;

    if (isNaN(expirationDays) || expirationDays < minDays || expirationDays > maxDays) {
      toast({
        title: "Xatolik",
        description: `E'lon muddati ${minDays}-${maxDays} kun oralig'ida bo'lishi kerak`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check daily posting limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('daily_post_limit')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Foydalanuvchi profili topilmadi');
      }

      // Count today's posts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todayPosts, error: countError } = await (supabase as any)
        .from('listings')
        .select('id')
        .eq('owner_id', user.id)
        .gte('created_at', today.toISOString())
        .count();

      if (countError) {
        console.error('Post count error:', countError);
        throw new Error('Bugungi e\'lonlar sonini hisoblashda xatolik');
      }

      const postCount = todayPosts?.[0]?.count || 0;
      const dailyLimit = profile.daily_post_limit || 1;

      if (postCount >= dailyLimit) {
        toast({
          title: "Cheklov!",
          description: `Kuniga faqat ${dailyLimit} ta e'lon qo'sha olasiz. Bugun ${postCount} ta e'lon qo'shgansiz.`,
          variant: "destructive"
        });
        return;
      }
      // Listings jadvaliga yozish
      let imageUrl1 = null;
      let imageUrl2 = null;
      
      // Upload images if any
      if (uploadedImages[0] || uploadedImages[1]) {
        for (let i = 0; i < uploadedImages.length; i++) {
          const imageFile = uploadedImages[i];
          if (imageFile) {
            const fileName = `${Date.now()}_${imageFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('listing-images')
              .upload(fileName, imageFile);
            
            if (uploadError) {
              console.error('Rasm yuklash xatoligi:', uploadError);
              throw new Error(`Rasm yuklashda xatolik: ${uploadError.message}`);
            }
            
            console.log('Rasm muvaffaqiyatli yuklandi:', uploadData);
            
            const { data: { publicUrl } } = supabase.storage
              .from('listing-images')
              .getPublicUrl(fileName);
            
            console.log('Rasm public URL:', publicUrl);
            
            if (i === 0) imageUrl1 = publicUrl;
            if (i === 1) imageUrl2 = publicUrl;
          }
        }
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('listings')
        .insert({
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          city: formData.city,
          address: formData.address,
          contact_phone: formData.contact_phone,
          contact_telegram: formData.contact_telegram,
          image_url_1: imageUrl1,
          image_url_2: imageUrl2,
          status: 'pending',
          owner_id: user.id,
          expiration_days: expirationDays,
          expires_at: expiresAt.toISOString(),
          // Add AI analysis if available
          ...(aiAnalysis && {
            ai_analysis: aiAnalysis.analysis,
            ai_score: aiAnalysis.score,
            ai_keywords: aiAnalysis.keywords
          })
        })
        .select()
        .single();

      if (error) {
        console.error('E\'lon yaratish xatoligi:', error);
        throw error;
      }

      console.log('E\'lon muvaffaqiyatli yaratildi:', data);

      toast({
        title: "Muvaffaqiyat!",
        description: "E'lon muvaffaqiyatli yaratildi va tasdiqlashni kutmoqda",
      });

      // Formani tozalash
      setFormData({
        title: '',
        description: '',
        category_id: '',
        price: '',
        city: '',
        address: '',
        contact_phone: '',
        contact_telegram: '',
        image_url_1: '',
        image_url_2: '',
        expiration_days: isPremium ? '12' : '5'
      });
      setUploadedImages([undefined, undefined]);
      setImagePreviewUrls(['', '']);

      // Modalni yopish
      const modalElement = document.querySelector('[role="dialog"]');
      if (modalElement) {
        (modalElement as HTMLElement).click();
      }

  } catch (error) {
      console.error('Form yuborish xatoligi:', error);
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "E'lon yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
        <CardHeader className="relative pb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Yangi E'lon Qo'shish
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Mahsulotingizni sotish uchun e'lon yarating
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Asosiy ma'lumotlar */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">E'lon nomi *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Mahsulot nomi"
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategoriya *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                    <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Narx (so'm) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="1000000"
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                    E'lon muddati (kun) *
                    <span className="ml-2 text-xs text-gray-500">
                      ({isPremium ? '1-12 kun' : '1-5 kun'})
                    </span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={isPremium ? "1" : "1"}
                    max={isPremium ? "12" : "5"}
                    value={formData.expiration_days}
                    onChange={(e) => handleInputChange('expiration_days', e.target.value)}
                    placeholder={isPremium ? "12" : "5"}
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                  <div className="mt-1 text-xs text-gray-600">
                    {isPremium ? 
                      "Premium foydalanuvchi 1-12 kun oralig'ida tanlay oladi" : 
                      "Oddiy foydalanuvchi 1-5 kun oralig'ida tanlay oladi"
                    }
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Tavsif *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Mahsulot haqida to'liq ma'lumot..."
                    rows={4}
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Joylashuv */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Joylashuv</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">Shahar *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Toshkent"
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Manzil</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Aniq manzil"
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Rasm yuklash */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Rasmlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Rasm {index + 1} {index === 0 ? '*' : '(ixtiyoriy)'}
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRefs[index]}
                        onChange={(e) => handleImageChange(index, e.target.files?.[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRefs[index]?.current?.click()}
                        className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors"
                        disabled={compressingImages[index]}
                      >
                        {compressingImages[index] ? (
                          <span>Siqilmoqda...</span>
                        ) : imagePreviewUrls[index] ? (
                          <img 
                            src={imagePreviewUrls[index]} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-gray-500">
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs">Rasm tanlang</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aloqa ma'lumotlari */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Aloqa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefon raqami *</Label>
                  <Input
                    id="phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+998901234567"
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telegram" className="text-sm font-medium text-gray-700">Telegram username *</Label>
                  <Input
                    id="telegram"
                    value={formData.contact_telegram}
                    onChange={(e) => handleInputChange('contact_telegram', e.target.value)}
                    placeholder="@username"
                    className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">AI Tahlili</h3>
                <Button
                  type="button"
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing || !geminiService.isConfigured()}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Tahlil qilinmoqda...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <span>AI Tahlili</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* AI Analysis Results */}
              {showAiAnalysis && aiAnalysis && (
                <div className="bg-gradient-to-br from-amber-50/70 via-yellow-50/50 to-amber-50/70 border border-amber-200/50 rounded-xl p-4 shadow-amber-500/20">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {aiAnalysis.score >= 7 ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-amber-800">AI Tahlil Natijalari</h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          aiAnalysis.score >= 7 
                            ? 'bg-green-100 text-green-800' 
                            : aiAnalysis.score >= 5 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Baho: {aiAnalysis.score}/10
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {aiAnalysis.analysis}
                      </p>
                      
                      {aiAnalysis.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-medium text-gray-600">Kalit so'zlar:</span>
                          {aiAnalysis.keywords.map((keyword, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!geminiService.isConfigured() && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">AI xizmati mavjud emas</p>
                      <p className="text-xs text-gray-500">.env fayliga Gemini API kalitini qo'shing</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Yuborilmoqda...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>E'lonni yuborish</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Post;