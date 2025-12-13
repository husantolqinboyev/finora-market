import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, X, Trash2, User, Package, MessageSquare, Star, Heart, ShoppingCart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/layout/Header';
import { useAuth } from '@/components/auth/useAuth';
import { NotificationService, Notification } from '@/lib/notifications';

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userNotifications = await NotificationService.getUserNotifications(user.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: "Xatolik",
          description: "Bildirishnomalarni yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, toast]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'product_approved':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'product_rejected':
        return <X className="w-5 h-5 text-red-600" />;
      case 'profile_updated':
        return <User className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

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

  const markAsRead = async (id: string) => {
    const success = await NotificationService.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const success = await NotificationService.markAllAsRead(user.id);
    if (success) {
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast({
        title: "Barchasi o'qildi",
        description: "Barcha bildirishnomalar o'qilgan deb belgilandi",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    const success = await NotificationService.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast({
        title: "O'chirildi",
        description: "Bildirishnoma o'chirildi",
      });
    }
  };

  const clearAll = async () => {
    if (!user) return;
    
    const success = await NotificationService.clearAllNotifications(user.id);
    if (success) {
      setNotifications([]);
      toast({
        title: "Tozalandi",
        description: "Barcha bildirishnomalar tozalandi",
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl"></div>
                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-r from-purple-600 to-blue-600">
                  <Bell className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bildirishnomalar
                </h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} ta o'qilmagan bildirishnoma` : 'Barcha bildirishnomalar o\'qilgan'}
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
              {notifications.length > 0 && (
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
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="border-0 shadow-lg sm:shadow-xl bg-white/95 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Bildirishnomalar yo'q</h3>
              <p className="text-gray-600">Hozircha sizga hech qanday bildirishnoma yo'q</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-0 shadow-lg sm:shadow-xl bg-white/95 backdrop-blur-lg transition-all duration-300 hover:shadow-xl ${
                  !notification.read ? 'ring-2 ring-purple-200' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${
                      !notification.read ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold ${
                          !notification.read ? 'text-purple-900' : 'text-gray-800'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center space-x-2">
                        {notification.action_url && (
                          <Button
                            onClick={() => {
                              // Navigate to action URL
                              console.log('Navigate to:', notification.action_url);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                          >
                            Ko'rish
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            O'qildi
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
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
      </div>
    </div>
    </>
  );
};

export default Notifications;
