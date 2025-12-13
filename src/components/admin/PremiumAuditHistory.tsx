import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { History, User, Calendar, Clock, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PremiumAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  admin_id: string;
  admin_name: string;
  action: 'assigned' | 'removed' | 'extended' | 'modified';
  old_premium_end_date?: string;
  new_premium_end_date?: string;
  old_daily_post_limit?: number;
  new_daily_post_limit?: number;
  old_ai_analysis_limit?: number;
  new_ai_analysis_limit?: number;
  premium_days_added?: number;
  notes?: string;
  created_at: string;
}

const PremiumAuditHistory: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<PremiumAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [daysFilter, setDaysFilter] = useState<string>('7');

  useEffect(() => {
    fetchAuditLogs();
  }, [daysFilter]);

  const fetchAuditLogs = async (): Promise<void> => {
    try {
      const { data, error } = await (supabase.rpc as any)('get_recent_premium_changes', { 
        p_days: parseInt(daysFilter) 
      });

      if (error) throw error;
      
      setLogs(data || []);
    } catch (error: any) {
      console.error('Audit loglarni yuklashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Audit loglarni yuklashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'assigned': return 'bg-green-100 text-green-800';
      case 'removed': return 'bg-red-100 text-red-800';
      case 'extended': return 'bg-blue-100 text-blue-800';
      case 'modified': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'assigned': return 'Premium berildi';
      case 'removed': return 'Premium bekor qilindi';
      case 'extended': return 'Premium uzaytirildi';
      case 'modified': return 'Limitlar o\'zgartirildi';
      default: return action;
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            Premium Audit Tarixi
          </CardTitle>
          <CardDescription>
            Premium o'zgarishlarining to'liq tarixi va kim amalga oshirganligi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Foydalanuvchi yoki admin qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Amal turini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha amallar</SelectItem>
                <SelectItem value="assigned">Premium berildi</SelectItem>
                <SelectItem value="removed">Premium bekor qilindi</SelectItem>
                <SelectItem value="extended">Premium uzaytirildi</SelectItem>
                <SelectItem value="modified">Limitlar o'zgartirildi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vaqt oralig'i" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Oxirgi 1 kun</SelectItem>
                <SelectItem value="7">Oxirgi 7 kun</SelectItem>
                <SelectItem value="30">Oxirgi 30 kun</SelectItem>
                <SelectItem value="90">Oxirgi 90 kun</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Hech qanday audit log topilmadi</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {getActionText(log.action)}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString('uz-UZ')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Foydalanuvchi:</span>
                          <span>{log.user_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Admin:</span>
                          <span>{log.admin_name}</span>
                        </div>
                      </div>

                      {/* Change Details */}
                      {(log.old_daily_post_limit !== log.new_daily_post_limit ||
                        log.old_ai_analysis_limit !== log.new_ai_analysis_limit ||
                        log.premium_days_added) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <div className="font-medium mb-2">O'zgarishlar:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {log.old_daily_post_limit !== log.new_daily_post_limit && (
                              <div>
                                Kunlik elon limiti: {log.old_daily_post_limit} → {log.new_daily_post_limit}
                              </div>
                            )}
                            {log.old_ai_analysis_limit !== log.new_ai_analysis_limit && (
                              <div>
                                AI limiti: {log.old_ai_analysis_limit} → {log.new_ai_analysis_limit}
                              </div>
                            )}
                            {log.premium_days_added && (
                              <div>
                                Premium muddati: +{log.premium_days_added} kun
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {log.notes && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          Izoh: {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumAuditHistory;
