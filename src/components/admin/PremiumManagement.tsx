import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { updateUserPremiumAsAdmin, removeUserPremiumAsAdmin } from '@/lib/admin/premiumService';
import { NotificationService } from '@/lib/notifications';
import { Crown, Calendar, Users, Zap, Search, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserProfile {
  id: string;
  full_name: string;
  nickname: string;
  is_premium: boolean;
  premium_end_date?: string;
  daily_post_limit: number;
  ai_analysis_limit: number;
  created_at: string;
}

const PremiumManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [premiumDays, setPremiumDays] = useState('7');
  const [dailyLimit, setDailyLimit] = useState('5');
  const [aiLimit, setAiLimit] = useState('50');
  const [isAddingPremium, setIsAddingPremium] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched users data:', data);
      
      setUsers((data || []).map(user => {
        console.log(`User ${user.id}: is_premium = ${user.is_premium}, premium_end_date = ${user.premium_end_date}`);
        return {
          id: user.id,
          full_name: user.full_name || 'Noma\'lum',
          nickname: user.nickname || 'user',
          is_premium: user.is_premium === true,
          premium_end_date: user.premium_end_date,
          daily_post_limit: user.daily_post_limit || 1,
          ai_analysis_limit: user.ai_analysis_limit || 10,
          created_at: user.created_at
        };
      }));
    } catch (error) {
      console.error('Foydalanuvchilarni yuklashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Foydalanuvchilarni yuklashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPremium = !showOnlyPremium || user.is_premium;
    return matchesSearch && matchesPremium;
  });

  const handleAddPremium = async () => {
    if (!selectedUser || !premiumDays) return;

    setIsAddingPremium(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(premiumDays));

      console.log('Updating premium for user:', selectedUser.id);
      console.log('Premium end date:', endDate.toISOString());
      console.log('Daily limit:', parseInt(dailyLimit));
      console.log('AI limit:', parseInt(aiLimit));

      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Admin user not found');
      }

      // Use secure service role function
      const data = await updateUserPremiumAsAdmin(user.id, selectedUser.id, {
        is_premium: true,
        premium_end_date: endDate.toISOString(),
        daily_post_limit: parseInt(dailyLimit),
        ai_analysis_limit: parseInt(aiLimit)
      });

      console.log('Premium update result:', data);

      // Create notification for user
      await NotificationService.createNotification(
        selectedUser.id,
        'product_approved',
        'Premium tasdiqlandi!',
        `Tabriklaymiz! Sizning premiumingiz muvaffaqiyatli tasdiqlandi. ${premiumDays} kun mobaynida kunlik ${parseInt(dailyLimit)} ta post va ${parseInt(aiLimit)} ta AI tahlil imkoniyatlari mavjud.`,
        '/notifications'
      );

      // Log premium assignment to audit table
      const { error: logError } = await supabase
        .from('premium_audit_log')
        .insert({
          user_id: selectedUser.id,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'assigned',
          old_premium_end_date: null,
          new_premium_end_date: endDate.toISOString(),
          old_daily_post_limit: 1,
          new_daily_post_limit: parseInt(dailyLimit),
          old_ai_analysis_limit: 10,
          new_ai_analysis_limit: parseInt(aiLimit),
          premium_days_added: parseInt(premiumDays),
          notes: `Premium assigned for ${premiumDays} days via admin panel`
        });

      if (logError) {
        console.error('Failed to log premium assignment:', logError);
      }

      // Also update premium_users table for better tracking
      console.log('Updating premium_users table...');
      const { error: premiumError, data: premiumData } = await supabase
        .from('premium_users')
        .upsert({
          id: selectedUser.id,
          premium_start_date: new Date().toISOString(),
          premium_end_date: endDate.toISOString(),
          daily_post_limit: parseInt(dailyLimit),
          ai_analysis_limit: parseInt(aiLimit),
          premium_type: 'premium',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select();

      console.log('Premium users update result:', { premiumError, premiumData });

      if (premiumError) {
        console.error('Failed to update premium_users table:', premiumError);
      }

      toast({
        title: "Muvaffaqiyat!",
        description: `${selectedUser.full_name} foydalanuvchisi ${premiumDays} kunlik premiumga qo'shildi`,
      });

      fetchUsers();
      setSelectedUser(null);
      setPremiumDays('7');
      setDailyLimit('5');
      setAiLimit('50');

    } catch (error) {
      console.error('Premium qo\'shishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Premium qo'shishda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsAddingPremium(false);
    }
  };

  const handleRemovePremium = async (userId: string) => {
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Admin user not found');
      }

      // Get current user data before removing premium
      const { data: currentUser, error: fetchError } = await supabase
        .from('profiles')
        .select('is_premium, premium_end_date, daily_post_limit, ai_analysis_limit')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Use secure service role function
      const data = await removeUserPremiumAsAdmin(user.id, userId);

      console.log('Premium removal result:', data);

      // Log premium removal to audit table
      const { error: logError } = await supabase
        .from('premium_audit_log')
        .insert({
          user_id: userId,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'removed',
          old_premium_end_date: currentUser?.premium_end_date,
          new_premium_end_date: null,
          old_daily_post_limit: currentUser?.daily_post_limit || 1,
          new_daily_post_limit: 1,
          old_ai_analysis_limit: currentUser?.ai_analysis_limit || 10,
          new_ai_analysis_limit: 10,
          notes: 'Premium removed via admin panel'
        });

      if (logError) {
        console.error('Failed to log premium removal:', logError);
      }

      // Also remove from premium_users table
      const { error: premiumError } = await supabase
        .from('premium_users')
        .delete()
        .eq('id', userId);

      if (premiumError) {
        console.error('Failed to remove from premium_users table:', premiumError);
      }

      toast({
        title: "Muvaffaqiyat!",
        description: "Premium maqomi bekor qilindi",
      });

      fetchUsers();
    } catch (error) {
      console.error('Premiumni bekor qilishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Premiumni bekor qilishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const isPremiumExpired = (endDate?: string) => {
    if (!endDate) return true;
    return new Date(endDate) < new Date();
  };

  const getPremiumStatus = (user: UserProfile) => {
    if (!user.is_premium) return { status: 'regular', color: 'bg-gray-100 text-gray-800', text: 'Oddiy' };
    if (isPremiumExpired(user.premium_end_date)) return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'Muddati tugagan' };
    return { status: 'active', color: 'bg-green-100 text-green-800', text: 'Premium 👑' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Premium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Premium Boshqaruvi
          </CardTitle>
          <CardDescription>
            Foydalanuvchilarga premium maqomini berish va boshqarish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Foydalanuvchi qidirish</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Ism yoki nickname bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="premium-filter"
                  checked={showOnlyPremium}
                  onChange={(e) => setShowOnlyPremium(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="premium-filter" className="text-sm">
                  Faqat premium userlarni ko'rsatish
                </Label>
              </div>
            </div>

            {/* Add Premium Form */}
            <div className="space-y-2">
              <Label>Premium qo'shish</Label>
              <div className="flex gap-2">
                <Select value={selectedUser?.id || ''} onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user || null);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Foydalanuvchini tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.slice(0, 10).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} (@{user.nickname})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddPremium}
                  disabled={!selectedUser || isAddingPremium}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Premium
                </Button>
              </div>
            </div>
          </div>

          {/* Premium Settings */}
          {selectedUser && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="premium-days">Muddat (kun)</Label>
                <Input
                  id="premium-days"
                  type="number"
                  min="1"
                  max="365"
                  value={premiumDays}
                  onChange={(e) => setPremiumDays(e.target.value)}
                  placeholder="7"
                />
              </div>
              <div>
                <Label htmlFor="daily-limit">Kunlik elon limiti</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  min="2"
                  max="10"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="ai-limit">AI tahlil limiti</Label>
                <Input
                  id="ai-limit"
                  type="number"
                  min="10"
                  max="100"
                  value={aiLimit}
                  onChange={(e) => setAiLimit(e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Foydalanuvchilar ({filteredUsers.length})
            {showOnlyPremium && (
              <Badge className="bg-yellow-100 text-yellow-800">
                Premium: {filteredUsers.filter(u => u.is_premium).length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map(user => {
              const premiumStatus = getPremiumStatus(user);
              return (
                <div key={user.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                  user.is_premium ? 'bg-yellow-50 border-yellow-200' : ''
                }`}>
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold">{user.full_name || 'Noma\'lum'}</h4>
                      <p className="text-sm text-muted-foreground">@{user.nickname}</p>
                    </div>
                    <Badge className={premiumStatus.color}>
                      {premiumStatus.text}
                    </Badge>
                    {user.is_premium && user.premium_end_date && (
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(user.premium_end_date).toLocaleDateString('uz-UZ')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span>E'lon: {user.daily_post_limit}/kun</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span>AI: {user.ai_analysis_limit}</span>
                      </div>
                    </div>
                    
                    {user.is_premium && (
                      <Button
                        onClick={() => handleRemovePremium(user.id)}
                        variant="destructive"
                        size="sm"
                      >
                        Premiumni olib tashlash
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumManagement;
