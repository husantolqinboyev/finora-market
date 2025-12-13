import { supabase } from '@/integrations/supabase/client';

export interface PremiumLimits {
  daily_post_limit: number;
  ai_analysis_limit: number;
  is_premium: boolean;
  premium_end_date?: string;
}

export class PremiumService {
  static async getUserPremiumStatus(userId: string): Promise<PremiumLimits> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_end_date, daily_post_limit, ai_analysis_limit')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return {
          is_premium: false,
          daily_post_limit: 1,
          ai_analysis_limit: 10
        };
      }

      // Check if premium is expired
      const isExpired = data.premium_end_date 
        ? new Date(data.premium_end_date) < new Date() 
        : true;

      return {
        is_premium: data.is_premium && !isExpired,
        premium_end_date: data.premium_end_date,
        daily_post_limit: isExpired ? 1 : data.daily_post_limit,
        ai_analysis_limit: isExpired ? 10 : data.ai_analysis_limit
      };
    } catch (error) {
      console.error('Premium status check error:', error);
      return {
        is_premium: false,
        daily_post_limit: 1,
        ai_analysis_limit: 10
      };
    }
  }

  static async checkDailyPostLimit(userId: string): Promise<{ canPost: boolean; remaining: number; used: number }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user's premium status
      const premiumStatus = await this.getUserPremiumStatus(userId);
      
      // Check today's usage
      const { data: usage, error } = await supabase
        .from('user_daily_limits')
        .select('posts_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      const usedCount = usage?.posts_count || 0;
      const remaining = Math.max(0, premiumStatus.daily_post_limit - usedCount);
      const canPost = remaining > 0;

      return { canPost, remaining, used: usedCount };
    } catch (error) {
      console.error('Daily limit check error:', error);
      return { canPost: false, remaining: 0, used: 0 };
    }
  }

  static async incrementDailyPostCount(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.rpc('increment_daily_post_count', {
        p_user_id: userId,
        p_date: today
      });

      if (error) {
        // Fallback: try to insert or update manually
        const { data: existing } = await supabase
          .from('user_daily_limits')
          .select('posts_count')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (existing) {
          await supabase
            .from('user_daily_limits')
            .update({ 
              posts_count: existing.posts_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('date', today);
        } else {
          await supabase
            .from('user_daily_limits')
            .insert({
              user_id: userId,
              date: today,
              posts_count: 1
            });
        }
      }

      return true;
    } catch (error) {
      console.error('Increment daily post count error:', error);
      return false;
    }
  }

  static async checkAiAnalysisLimit(userId: string): Promise<{ canAnalyze: boolean; remaining: number; used: number }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user's premium status
      const premiumStatus = await this.getUserPremiumStatus(userId);
      
      // Check today's AI usage
      const { data: usage, error } = await supabase
        .from('user_daily_limits')
        .select('ai_analysis_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      const usedCount = usage?.ai_analysis_count || 0;
      const remaining = Math.max(0, premiumStatus.ai_analysis_limit - usedCount);
      const canAnalyze = remaining > 0;

      return { canAnalyze, remaining, used: usedCount };
    } catch (error) {
      console.error('AI limit check error:', error);
      return { canAnalyze: false, remaining: 0, used: 0 };
    }
  }

  static async incrementAiAnalysisCount(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existing } = await supabase
        .from('user_daily_limits')
        .select('ai_analysis_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('user_daily_limits')
          .update({ 
            ai_analysis_count: existing.ai_analysis_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('date', today);
      } else {
        await supabase
          .from('user_daily_limits')
          .insert({
            user_id: userId,
            date: today,
            ai_analysis_count: 1
          });
      }

      return true;
    } catch (error) {
      console.error('Increment AI analysis count error:', error);
      return false;
    }
  }

  static async getCategoryRanking(categoryId: string, userId: string): Promise<{ rank: number; total: number }> {
    try {
      const { data, error } = await supabase
        .from('category_rankings')
        .select('rank_position')
        .eq('category_id', categoryId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return { rank: 0, total: 0 };
      }

      // Get total count in this category
      const { count } = await supabase
        .from('category_rankings')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      return { rank: data.rank_position, total: count || 0 };
    } catch (error) {
      console.error('Category ranking error:', error);
      return { rank: 0, total: 0 };
    }
  }

  static async updateCategoryRankings(categoryId: string): Promise<void> {
    try {
      // This would typically be called by a scheduled job
      // For now, it's a placeholder for manual ranking updates
      const { data: listings } = await supabase
        .from('listings')
        .select('owner_id, created_at')
        .eq('category_id', categoryId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!listings) return;

      // Group by user and count their listings
      const userCounts = listings.reduce((acc, listing) => {
        acc[listing.owner_id] = (acc[listing.owner_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Sort users by count and update rankings
      const sortedUsers = Object.entries(userCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([userId]) => userId);

      // Update rankings (top 10 only)
      const top10 = sortedUsers.slice(0, 10);
      
      for (let i = 0; i < top10.length; i++) {
        await supabase
          .from('category_rankings')
          .upsert({
            category_id: categoryId,
            user_id: top10[i],
            rank_position: i + 1,
            total_score: userCounts[top10[i]],
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'category_id,user_id'
          });
      }
    } catch (error) {
      console.error('Update category rankings error:', error);
    }
  }
}
