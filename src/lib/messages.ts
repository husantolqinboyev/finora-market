import { supabase } from './supabase-client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  message_type: 'admin_to_user' | 'user_to_admin' | 'system';
  read: boolean;
  created_at: string;
  read_at?: string;
}

export interface MessageWithSender extends Message {
  sender_name?: string;
  sender_nickname?: string;
}

export class MessageService {
  static async sendMessage(
    senderId: string,
    receiverId: string,
    subject: string,
    content: string,
    messageType: Message['message_type'] = 'user_to_admin'
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          subject,
          content,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  static async getUserMessages(userId: string): Promise<MessageWithSender[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get sender profiles separately
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, nickname')
            .eq('id', msg.sender_id)
            .single();
          
          return {
            ...msg,
            sender_name: senderData?.full_name,
            sender_nickname: senderData?.nickname,
          };
        })
      );
      
      return messagesWithSenders;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  static async markAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      return !error;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('receiver_id', userId)
        .eq('read', false);

      return !error;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      return !error;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  static async clearAllMessages(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('receiver_id', userId);

      return !error;
    } catch (error) {
      console.error('Error clearing all messages:', error);
      return false;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  static async getAdminMessages(): Promise<MessageWithSender[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('message_type', 'user_to_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get sender profiles separately
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, nickname')
            .eq('id', msg.sender_id)
            .single();
          
          return {
            ...msg,
            sender_name: senderData?.full_name,
            sender_nickname: senderData?.nickname,
          };
        })
      );
      
      return messagesWithSenders;
    } catch (error) {
      console.error('Error fetching admin messages:', error);
      return [];
    }
  }

  static async sendAdminMessage(
    adminId: string,
    receiverId: string,
    subject: string,
    content: string
  ): Promise<Message | null> {
    return this.sendMessage(adminId, receiverId, subject, content, 'admin_to_user');
  }

  static async getAllUsers(): Promise<{ id: string; full_name: string; nickname: string }[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nickname')
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}
