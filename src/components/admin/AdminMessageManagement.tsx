import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/useAuth';
import { MessageService, MessageWithSender } from '@/lib/messages';
import { MessageSquare, Send, Reply, Trash2, Check, X, User, Users, Crown, Mail, MailOpen } from 'lucide-react';

const AdminMessageManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    receiverId: '',
    subject: '',
    content: ''
  });
  const [users, setUsers] = useState<{ id: string; full_name: string; nickname: string }[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminMessages, allUsers] = await Promise.all([
          MessageService.getAdminMessages(),
          MessageService.getAllUsers()
        ]);
        setMessages(adminMessages);
        setUsers(allUsers);

        const unreadMessages = adminMessages.filter(msg => !msg.read).length;
        setUnreadCount(unreadMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Xatolik",
          description: "Xabarlarni yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} daqiqa oldin`;
    } else if (diffHours < 24) {
      return `${diffHours} soat oldin`;
    } else {
      return `${diffDays} kun oldin`;
    }
  };

  const markAsRead = async (messageId: string) => {
    const success = await MessageService.markAsRead(messageId);
    if (success) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const success = await MessageService.markAllAsRead('admin'); // Admin ID placeholder
    if (success) {
      setMessages(prev =>
        prev.map(msg => ({ ...msg, read: true }))
      );
      setUnreadCount(0);
      toast({
        title: "Barchasi o'qildi",
        description: "Barcha xabarlar o'qilgan deb belgilandi",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    const success = await MessageService.deleteMessage(messageId);
    if (success) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: "O'chirildi",
        description: "Xabar o'chirildi",
      });
    }
  };

  const clearAll = async () => {
    const success = await MessageService.clearAllMessages('admin'); // Admin ID placeholder
    if (success) {
      setMessages([]);
      setUnreadCount(0);
      toast({
        title: "Tozalandi",
        description: "Barcha xabarlar tozalandi",
      });
    }
  };

  const sendMessage = async () => {
    if (!composeData.receiverId || !composeData.subject || !composeData.content) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      if (!user) {
        throw new Error('Admin user not found');
      }

      // If 'all' selected, send to all users
      if (composeData.receiverId === 'all') {
        const allUsers = await MessageService.getAllUsers();
        const sendPromises = allUsers.map(u => 
          MessageService.sendAdminMessage(
            user.id,
            u.id,
            composeData.subject,
            composeData.content
          )
        );
        
        await Promise.all(sendPromises);
        
        toast({
          title: "Yuborildi",
          description: `Xabar ${allUsers.length} ta foydalanuvchiga muvaffaqiyatli yuborildi`,
        });
      } else {
        const message = await MessageService.sendAdminMessage(
          user.id,
          composeData.receiverId,
          composeData.subject,
          composeData.content
        );

        if (message) {
          toast({
            title: "Yuborildi",
            description: "Xabar muvaffaqiyatli yuborildi",
          });
        } else {
          throw new Error('Message not sent');
        }
      }

      setIsComposeOpen(false);
      setComposeData({ receiverId: '', subject: '', content: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Xatolik",
        description: "Xabar yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Xabarlar boshqaruvi</h2>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} ta o'qilmagan xabar` : 'Barcha xabarlar o\'qilgan'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Check className="w-4 h-4 mr-2" />
              Hammasini o'qilgan deb belgilash
            </Button>
          )}
          {messages.length > 0 && (
            <Button
              onClick={clearAll}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Tozalash
            </Button>
          )}
          <Button
            onClick={() => setIsComposeOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Yangi xabar
          </Button>
        </div>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-lg">
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Xabarlar yo'q</h3>
            <p className="text-gray-600">Hozircha admin xabarlari yo'q</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`border-0 shadow-lg bg-white/95 backdrop-blur-lg transition-all duration-300 hover:shadow-xl ${
                !message.read ? 'ring-2 ring-purple-200' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    !message.read ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold ${
                          !message.read ? 'text-purple-900' : 'text-gray-800'
                        }`}>
                          {message.subject}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {message.sender_name || message.sender_nickname || 'Noma\'lum'} dan
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {!message.read && (
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{message.content}</p>
                    <div className="flex items-center space-x-2">
                      {!message.read && (
                        <Button
                          onClick={() => markAsRead(message.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          O'qildi
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteMessage(message.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Compose Message Dialog */}
      {isComposeOpen && (
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>Yangi xabar yuborish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiver">Qabul qiluvchi</Label>
              <Select
                value={composeData.receiverId}
                onValueChange={(value) => setComposeData(prev => ({ ...prev, receiverId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Foydalanuvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Barcha userlar
                    </div>
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} (@{user.nickname})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Mavzu</Label>
              <Input
                id="subject"
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Xabar mavzusi"
              />
            </div>
            <div>
              <Label htmlFor="content">Xabar matni</Label>
              <Textarea
                id="content"
                value={composeData.content}
                onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Xabar matnini kiriting..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsComposeOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={sendMessage}
                disabled={isSending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSending ? 'Yuborilmoqda...' : 'Yuborish'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMessageManagement;
