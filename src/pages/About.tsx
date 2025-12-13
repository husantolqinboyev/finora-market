import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { ArrowLeft, Target, Users, Award, TrendingUp } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "Maqsadimiz",
      description: "Eng sifatli mahsulotlarni qulay narxlarda taqdim etish va mijozlarimizga yuqori darajadagi xizmat ko'rsatish"
    },
    {
      icon: Users,
      title: "Jamoamiz",
      description: "Professional va tajribali mutaxassislardan iborat jamoamiz har doim sizga yordam berishga tayyor"
    },
    {
      icon: Award,
      title: "Sifat kafolati",
      description: "Barcha mahsulotlarimiz sifat standartlariga javob beradi va kafolat bilan ta'minlanadi"
    },
    {
      icon: TrendingUp,
      title: "Rivojlanish",
      description: "Doimiy ravishda yangi mahsulotlar va xizmatlar bilan assortimentimizni kengaytiramiz"
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
            <h1 className="text-5xl font-bold text-gradient mb-4">Biz haqimizda</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Parkent Finora Markent - zamonaviy onlayn savdo platformasi
            </p>
          </div>

          {/* Hero Card */}
          <Card className="card-elegant mb-12 overflow-hidden animate-scale-in">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gradient">
                    Parkent Finora Markent ga xush kelibsiz
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Biz 2024-yilda tashkil topgan va mijozlarimizga eng yaxshi onlayn xarid qilish tajribasini taqdim etishga intilamiz. 
                    Bizning platformamiz orqali siz turli xil mahsulotlarni topishingiz, solishtirishingiz va xarid qilishingiz mumkin.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Biz mijozlarimizning ehtiyojlarini birinchi o'ringa qo'yamiz va har bir xarid tajribasi qoniqarli bo'lishini ta'minlaymiz.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => navigate('/')}
                      className="rounded-xl hover-scale shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)]"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      Mahsulotlarni ko'rish
                    </Button>
                    <Button
                      onClick={() => navigate('/contact')}
                      variant="outline"
                      className="rounded-xl hover-scale"
                    >
                      Bog'lanish
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-2xl"></div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl"
                       style={{ background: 'var(--gradient-primary)' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-32 h-32 text-primary-foreground opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="card-elegant hover-scale animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg"></div>
                        <div className="relative w-14 h-14 rounded-xl flex items-center justify-center shadow-[var(--shadow-elegant)]"
                             style={{ background: 'var(--gradient-primary)' }}>
                          <Icon className="w-7 h-7 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-gradient">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stats Section */}
          <Card className="card-elegant mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "1000+", label: "Mahsulotlar" },
                  { value: "500+", label: "Mijozlar" },
                  { value: "50+", label: "Hamkorlar" },
                  { value: "100%", label: "Kafolat" }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
