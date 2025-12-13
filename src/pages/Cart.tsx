import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Placeholder cart items - in real app this would come from state/database
  const cartItems = [];

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Ro'yxatdan o'ting",
        description: "Buyurtma berish uchun tizimga kiring",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    toast({
      title: "Buyurtma qabul qilindi",
      description: "Tez orada siz bilan bog'lanamiz",
    });
  };

  return (
    <div className="min-h-screen bg-animated">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Savatingiz</h1>
              <p className="text-muted-foreground">Xarid qilishga tayyor mahsulotlaringiz</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-xl hover-scale"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ortga
            </Button>
          </div>

          {/* Cart Content */}
          {cartItems.length === 0 ? (
            <Card className="card-elegant animate-scale-in">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"></div>
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                       style={{ background: 'var(--gradient-primary)' }}>
                    <ShoppingCart className="w-12 h-12 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Savatingiz bo'sh</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Hozircha savatingizda mahsulot yo'q. Mahsulotlarni ko'rib chiqing va xarid qiling!
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="rounded-xl hover-scale shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)]"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  Xarid qilish
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Cart items would be mapped here */}
              
              {/* Summary Card */}
              <Card className="card-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-gradient">Jami</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Jami:</span>
                    <span className="font-bold text-gradient">0 so'm</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full h-12 rounded-xl font-semibold hover-scale shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)]"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    Buyurtma berish
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
