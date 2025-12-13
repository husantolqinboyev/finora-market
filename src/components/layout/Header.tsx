import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/useAuth';
import { ShoppingBag, LogOut, Settings, User, LogIn, Home, Package, ShoppingCart, Shirt, Sofa, Sparkles, Bell, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService } from '@/lib/notifications';
import { MessageService } from '@/lib/messages';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (user) {
        const [notifications, messages] = await Promise.all([
          NotificationService.getUnreadCount(user.id),
          MessageService.getUnreadCount(user.id)
        ]);
        setUnreadCount(notifications);
        setUnreadMessagesCount(messages);
      }
    };

    fetchUnreadCounts();
    
    // Poll for new notifications and messages every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { name: 'Asosiy', path: '/', icon: Home },
    { name: 'Mahsulotlar', path: '/products', icon: Package },
    { name: 'AI Yordamchi', path: '/ai-assistant', icon: Sparkles },
    { name: 'Bildirishnomalar', path: '/notifications', icon: Bell },
    { name: 'Xabarlar', path: '/messages', icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5"></div>
      
      <div className="container relative flex h-16 sm:h-18 md:h-20 items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 w-full max-w-7xl">
          {/* Logo */}
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-hover:from-purple-600/30 group-hover:to-blue-600/30 transition-all duration-500"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-6 bg-gradient-to-r from-purple-600 to-blue-600">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
            </div>
            <div className="hidden md:flex flex-col">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover-scale">
                Parkent Finora Markent
              </h1>
              {isAdmin && (
                <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full inline-block w-fit mt-0.5 sm:mt-1 bg-gradient-to-r from-purple-600 to-blue-600 shadow-md sm:shadow-lg">
                  Admin Panel
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center space-x-2 sm:space-x-3 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`relative px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                    active 
                      ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md sm:shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden xl:inline">{item.name}</span>
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {item.path === '/messages' && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Tablet Navigation Menu */}
          <nav className="hidden md:flex lg:hidden items-center space-x-2 flex-1 justify-center">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`relative h-11 w-11 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                    active 
                      ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-5 h-5" />
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {item.path === '/messages' && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Mobile Navigation Menu */}
          <nav className="flex md:hidden items-center space-x-1 flex-1 justify-center">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`relative h-12 w-12 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                    active 
                      ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-6 h-6" />
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {item.path === '/messages' && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-4">
          {user && isAdmin && (
            <Button
              onClick={() => navigate('/messages')}
              className="h-10 sm:h-11 md:h-12 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline ml-2">Admin Xabar</span>
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-full hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 animate-pulse"></div>
                  <Avatar className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 ring-2 ring-purple-200 hover:ring-purple-400 transition-all duration-300">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
                    <AvatarFallback className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 p-2 bg-white/95 backdrop-blur-lg border border-purple-100 shadow-lg sm:shadow-xl rounded-xl" align="end" forceMount>
                <DropdownMenuItem className="flex-col items-start p-3 rounded-lg hover:bg-purple-50 cursor-pointer">
                  <div className="font-semibold text-base text-gray-800 truncate">{user.user_metadata?.full_name || 'Foydalanuvchi'}</div>
                  <div className="text-xs text-gray-600 mt-1 truncate">{user.email}</div>
                </DropdownMenuItem>
                <div className="h-px bg-purple-100 my-2"></div>
                <DropdownMenuItem onClick={() => navigate('/profile')} className="p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-all">
                  <User className="mr-3 h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-800 text-base">Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-all">
                  <Settings className="mr-3 h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-800 text-base">Sozlamalar</span>
                </DropdownMenuItem>
                <div className="h-px bg-purple-100 my-2"></div>
                <DropdownMenuItem onClick={handleSignOut} className="p-3 rounded-lg hover:bg-red-50 cursor-pointer transition-all">
                  <LogOut className="mr-3 h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600 text-base">Chiqish</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => navigate('/auth')}
              className="h-10 sm:h-11 md:h-12 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl font-semibold shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm sm:text-base"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Kirish</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;