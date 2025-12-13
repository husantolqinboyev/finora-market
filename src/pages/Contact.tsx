import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import { Phone, Mail, MapPin, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Xabar yuborildi",
      description: "Tez orada siz bilan bog'lanamiz",
    });
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefon",
      content: "+998 90 123 45 67",
      link: "tel:+998901234567"
    },
    {
      icon: Mail,
      title: "Email",
      content: "info@parkentfinora.uz",
      link: "mailto:info@parkentfinora.uz"
    },
    {
      icon: MapPin,
      title: "Manzil",
      content: "Parkent tumani, O'zbekiston",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-animated">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-xl hover-scale mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ortga
            </Button>
            <h1 className="text-5xl font-bold text-gradient mb-4">Biz bilan bog'laning</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Savollaringiz bormi? Biz yordam berishga tayyormiz!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="card-elegant animate-scale-in">
              <CardHeader>
                <CardTitle className="text-2xl text-gradient">Xabar yuboring</CardTitle>
                <CardDescription>
                  Formani to'ldiring va biz tez orada javob beramiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ismingiz</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ismingizni kiriting"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Xabar</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Xabaringizni yozing..."
                      required
                      rows={5}
                      className="rounded-xl resize-none"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold hover-scale shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)]"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Yuborish
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <Card key={index} className="card-elegant hover-scale cursor-pointer">
                    <CardContent className="flex items-start space-x-4 p-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg"></div>
                        <div className="relative w-14 h-14 rounded-xl flex items-center justify-center shadow-[var(--shadow-elegant)]"
                             style={{ background: 'var(--gradient-primary)' }}>
                          <Icon className="w-7 h-7 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{info.title}</h3>
                        <a href={info.link} className="text-muted-foreground hover:text-primary transition-colors">
                          {info.content}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Map Placeholder */}
              <Card className="card-elegant overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 text-primary mx-auto" />
                    <p className="text-muted-foreground">Xarita joylashuvi</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
