import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Camera } from 'lucide-react';

/* Narrow local types */
interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  telegramUsername: string;
  nickname: string;
  address: string;
  bio: string;
  avatarUrl: string;
}

interface ProfileData {
  full_name?: string | null;
  phone?: string | null;
  telegram_username?: string | null;
  nickname?: string | null;
}

interface MinimalAuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

/* Helper type guards */
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/* Check if response shape has data (for maybeSingle/select) */
const isSelectResult = (v: unknown): v is { data: ProfileData | null; error?: unknown } =>
  isObject(v) && 'data' in v;

/* Component */
const ProfileSetup: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    telegramUsername: '',
    nickname: '',
    address: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        // call supabase.select without generics to avoid deep TS instantiation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: unknown = await (supabase as any)
          .from('profiles')
          .select('full_name, phone, telegram_username, nickname')
          .eq('id', (user as MinimalAuthUser).id)
          .maybeSingle();

        if (!isSelectResult(res)) {
          console.warn('Unexpected supabase select shape', res);
          return;
        }

        const data = res.data; // ProfileData | null
        
        // Agar profile bo'lmasa, yaratamiz
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!data && res.error && (res.error as any).code === 'PGRST116') {
          console.log('Profile not found, creating...');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProfile, error: createError } = await (supabase as any)
            .from('profiles')
            .insert({
              id: (user as MinimalAuthUser).id,
              auth_user_id: (user as MinimalAuthUser).id,
              full_name: '',
              phone: '',
              telegram_username: '',
              nickname: null, // Auto-generate
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .single();
          
          console.log('Profile creation result:', { newProfile, createError });
          
          if (!createError) {
            // Empty profile created, continue with empty state
            setProfile({
              fullName: '',
              email: ((user as MinimalAuthUser).email ?? '') as string,
              phone: '',
              telegramUsername: '',
              nickname: '',
              address: '',
              bio: '',
              avatarUrl: ''
            });
            return;
          }
        }

        const metaRaw = (user as MinimalAuthUser).user_metadata;
        const meta = isObject(metaRaw) ? metaRaw : {};

        // Safely pick values (guarding against null)
        const fullName = (data && data.full_name) ? (data.full_name as string) : ((meta.full_name as string) ?? '');
        const email = ((user as MinimalAuthUser).email ?? '') as string;
        const phone = (data && data.phone) ? (data.phone as string) : ((meta.phone as string) ?? '');
        const telegramUsername = (data && data.telegram_username) ? (data.telegram_username as string) : ((meta.telegram_username as string) ?? '');
        const nickname = (data && data.nickname) ? (data.nickname as string) : '';
        const address = (meta.address as string) ?? '';
        const bio = (meta.bio as string) ?? '';
        const avatarUrl = (meta.avatar_url as string) ?? '';

        setProfile({
          fullName,
          email,
          phone,
          telegramUsername,
          nickname,
          address,
          bio,
          avatarUrl
        });
      } catch (err) {
        console.error('loadProfile error:', err);
        toast({ title: 'Xatolik', description: 'Profilni yuklashda xatolik', variant: 'destructive' });
      }
    };

    loadProfile();
  }, [user, toast]);

  const handleInput = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const normalizeTelegram = (val: string) => (val ? (val.startsWith('@') ? val.slice(1) : val) : '');

  /* Upload avatar and return public URL */
  const uploadAvatar = async (file: File): Promise<string> => {
    const authUser = user as MinimalAuthUser | undefined;
    if (!authUser?.id) throw new Error('User not found');

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Faqat JPG, PNG yoki WebP rasmlar ruxsat etilgan');
    }

    if (file.size > maxSize) {
      throw new Error('Rasm hajmi 2MB dan oshmasligi kerak');
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${authUser.id}/${authUser.id}-${Date.now()}.${ext}`;

      const uploadRes: unknown = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

      // If uploadRes has error property, throw it
      if (isObject(uploadRes) && 'error' in uploadRes && (uploadRes as { error?: unknown }).error) {
        throw (uploadRes as { error?: { message?: string } }).error;
      }

      const urlRes: unknown = supabase.storage.from('avatars').getPublicUrl(path);
      if (isObject(urlRes)) {
        const data = (urlRes as { data?: Record<string, unknown> }).data ?? {};
        const publicUrl = (data.publicUrl as string | undefined) ?? (data.public_url as string | undefined) ?? '';
        
        // Debug: URL ni ko'rish
        console.log('Generated avatar URL:', publicUrl);
        
        // XSS protection: validate URL format
        if (publicUrl && typeof publicUrl === 'string') {
          // Only allow Supabase storage URLs (more flexible pattern)
          const supabaseUrlPattern = /^https:\/\/.*supabase\.co.*avatars/;
          if (supabaseUrlPattern.test(publicUrl)) {
            return publicUrl;
          }
        }
        
        throw new Error('Noto\'g\'ri avatar URL format');
      }

      return '';
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, avatarUrl: (reader.result as string) || prev.avatarUrl }));
    };
    reader.readAsDataURL(file);

    try {
      const url = await uploadAvatar(file);
      if (url) {
        setProfile(prev => ({ ...prev, avatarUrl: url }));
        toast({ title: 'Avatar yuklandi' });
      }
    } catch (err) {
      console.error('avatar upload error', err);
      toast({ title: 'Xatolik', description: 'Avatar yuklashda muammo', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    // Agar user hech narsa kiritmasa, avtomatik random ma'lumotlar bilan saqlaymiz
    if (!profile.fullName.trim() && !profile.phone.trim()) {
      setIsLoading(true);
      try {
        const authUser = user as MinimalAuthUser | undefined;
        const payload = {
          id: authUser?.id ?? null,
          auth_user_id: authUser?.id ?? null,
          full_name: `User_${authUser?.id?.slice(0, 8)}`,
          phone: `+998${Math.floor(Math.random() * 90000000) + 10000000}`,
          telegram_username: `user_${authUser?.id?.slice(0, 6)}`,
          nickname: null, // Auto-generate
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upsertRes: unknown = await (supabase as any).from('profiles').upsert(payload as unknown);

        if (isObject(upsertRes) && 'error' in upsertRes && (upsertRes as { error?: unknown }).error) {
          throw (upsertRes as { error?: { message?: string } }).error;
        }

        toast({ title: 'Muvaffaqiyat', description: 'Profil avtomatik yaratildi' });
        navigate('/');
        return;
      } catch (err) {
        console.error('auto-save error', err);
        toast({ title: 'Xatolik', description: "Avtomatik saqlashda xatolik yuz berdi", variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }

    // Oddiy validation va saqlash
    if (!profile.fullName.trim()) {
      toast({ title: 'Xatolik', description: "To'liq ism kerak", variant: 'destructive' });
      return;
    }
    if (!profile.phone.trim()) {
      toast({ title: 'Xatolik', description: 'Telefon kerak', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const authUser = user as MinimalAuthUser | undefined;
      const payload = {
        id: authUser?.id ?? null,
        auth_user_id: authUser?.id ?? null,
        full_name: profile.fullName,
        phone: profile.phone,
        telegram_username: normalizeTelegram(profile.telegramUsername),
        nickname: profile.nickname || null, // Allow null for auto-generation
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Cast payload to unknown to avoid project-level Supabase typed overload conflicts
      const upsertRes: unknown = await (supabase as unknown as { from: (table: string) => { upsert: (v: unknown) => Promise<unknown> } }).from('profiles').upsert(payload as unknown);

      if (isObject(upsertRes) && 'error' in upsertRes && (upsertRes as { error?: unknown }).error) {
        throw (upsertRes as { error?: { message?: string } }).error;
      }

      if (typeof updateUserProfile === 'function') {
        try {
          await updateUserProfile({
            avatar_url: profile.avatarUrl,
            full_name: profile.fullName,
            phone: profile.phone,
            telegram_username: normalizeTelegram(profile.telegramUsername),
            address: profile.address,
            bio: profile.bio
          });
        } catch (metaErr) {
          console.warn('updateUserProfile failed:', metaErr);
          toast({ title: 'Ogohlantirish', description: 'DB saqlandi, ammo auth metadata yangilanmadi', variant: 'destructive' });
        }
      }

      toast({ title: 'Muvaffaqiyat', description: 'Profil saqlandi' });
      navigate('/');
    } catch (err) {
      console.error('save error', err);
      toast({ title: 'Xatolik', description: "Saqlashda xatolik yuz berdi", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate(-1)} variant="ghost" aria-label="Orqaga">
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Profil Sozlamalari</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil rasmi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} /> : null}
                <AvatarFallback>{profile.fullName ? profile.fullName.charAt(0) : ((user as MinimalAuthUser)?.email?.charAt(0) ?? 'U')}</AvatarFallback>
              </Avatar>

              <label className="cursor-pointer bg-primary px-3 py-1 rounded text-white inline-flex items-center gap-2">
                <Camera />
                Rasm yuklash
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Shaxsiy Ma'lumotlar</CardTitle>
              <CardDescription>Profilingizni yangilang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>To‘liq ism</Label>
                <Input value={profile.fullName} onChange={e => handleInput('fullName', e.target.value)} />
              </div>

              <div>
                <Label>Telefon</Label>
                <Input value={profile.phone} onChange={e => handleInput('phone', e.target.value)} />
              </div>

              <div>
                <Label>Telegram username</Label>
                <Input value={profile.telegramUsername} onChange={e => handleInput('telegramUsername', e.target.value)} placeholder="@username yoki username" />
              </div>

              <div>
                <Label>Nickname (ixtiyoriy)</Label>
                <Input 
                  value={profile.nickname} 
                  onChange={e => handleInput('nickname', e.target.value)} 
                  placeholder="Avtomatik yaratiladi (5-9 belgi, faqat lotin harflari, raqamlar va _)" 
                  maxLength={9}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Agar kiritmasangiz, avtomatik yaratiladi. Faqat kichik lotin harflari, raqamlar va _ ishlatish mumkin.
                </p>
              </div>

              <div>
                <Label>Manzil</Label>
                <Input value={profile.address} onChange={e => handleInput('address', e.target.value)} />
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea value={profile.bio} onChange={e => handleInput('bio', e.target.value)} />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>Bekor qilish</Button>
                <Button onClick={handleSave} disabled={isLoading || isUploadingAvatar}>
                  {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
