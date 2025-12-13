import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/useAuth';
import { Bot, User, Send, ArrowLeft, Minimize2, Maximize2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { geminiService } from '@/lib/ai/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user is authenticated
  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-xl border-0 bg-white/90 backdrop-blur-lg">
          <CardContent className="p-8 text-center">
            <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Yordamchi</h2>
            <p className="text-gray-600 mb-6">
              Hurmatli foydalanuvchi, AI xizmatidan foydalanish uchun avval tizimga kiring.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Tizimga Kirish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Assalomu alaykum! Men Parkent Finora Markent platformasining rasmiy AI yordamchisiman. Hurmatli foydalanuvchi, sizga qanday yordam bera olaman? Eslatib otamiz bu bizning shaxsiy ai ornatyapmiz vaqtincha sodda ai dan foydlanib turasiz Meta tomondan sertifikat olganmiz',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    score: number;
    analysis: string;
    keywords: string[];
  } | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [analysisInput, setAnalysisInput] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    city: ''
  });
  const [dailyQuestionCount, setDailyQuestionCount] = useState(0);
  const [dailyAnalysisCount, setDailyAnalysisCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load daily usage from localStorage
    const today = new Date().toDateString();
    const savedData = localStorage.getItem('aiDailyUsage');
    
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.date === today) {
        setDailyQuestionCount(data.questions || 0);
        setDailyAnalysisCount(data.analysis || 0);
      } else {
        // Reset for new day
        localStorage.setItem('aiDailyUsage', JSON.stringify({
          date: today,
          questions: 0,
          analysis: 0
        }));
      }
    }
  }, []);

  const getDailyLimits = () => {
    // Mock premium check - replace with actual premium status
    const isPremium = false; // This should come from auth context
    return {
      questionLimit: isPremium ? 50 : 10,
      analysisLimit: isPremium ? 50 : 10
    };
  };

  const getApiKeyStatus = () => {
    return geminiService.getKeyUsageStatus();
  };

  const canAskQuestion = () => {
    const { questionLimit } = getDailyLimits();
    return dailyQuestionCount < questionLimit;
  };

  const canUseAnalysis = () => {
    const { analysisLimit } = getDailyLimits();
    return dailyAnalysisCount < analysisLimit;
  };

  const incrementQuestionCount = () => {
    const today = new Date().toDateString();
    const newCount = dailyQuestionCount + 1;
    setDailyQuestionCount(newCount);
    
    const savedData = {
      date: today,
      questions: newCount,
      analysis: dailyAnalysisCount
    };
    localStorage.setItem('aiDailyUsage', JSON.stringify(savedData));
  };

  const incrementAnalysisCount = () => {
    const today = new Date().toDateString();
    const newCount = dailyAnalysisCount + 1;
    setDailyAnalysisCount(newCount);
    
    const savedData = {
      date: today,
      questions: dailyQuestionCount,
      analysis: newCount
    };
    localStorage.setItem('aiDailyUsage', JSON.stringify(savedData));
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // If Gemini is configured, use it for intelligent responses
    if (geminiService.isConfigured()) {
      try {
        const aiResponse = await geminiService.chatResponse(userMessage);
        if (aiResponse) {
          return aiResponse;
        }
      } catch (error) {
        console.error('Gemini chat error:', error);
      }
    }

    // Fallback to rule-based responses if AI fails
    const responses = [
      'Hurmatli foydalanuvchi, mahsulotlarimiz haqida batafsil ma\'lumot olish uchun katalog bo\'limiga o\'tishingiz mumkin.',
      'Hurmatli foydalanuvchi, savatchangizga mahsulot qo\'shish uchun "Mahsulotlar" bo\'limiga o\'ting.',
      'Hurmatli foydalanuvchi, profil sozlamalaringizni shaxsiy kabinetingizdan o\'zgartirishingiz mumkin.',
      'Hurmatli foydalanuvchi, admin panelga faqat adminlar kirishlari mumkin.',
      'Hurmatli foydalanuvchi, biz bilan bog\'lanish uchun "Kontakt" bo\'limidan foydalaning.',
      'Hurmatli foydalanuvchi, AI tahlili uchun "AI Tahlili" tugmasidan foydalaning.'
    ];

    if (userMessage.toLowerCase().includes('mahsulot') || userMessage.toLowerCase().includes('tovar')) {
      return responses[0];
    } else if (userMessage.toLowerCase().includes('savatch') || userMessage.toLowerCase().includes('cart')) {
      return responses[1];
    } else if (userMessage.toLowerCase().includes('profil') || userMessage.toLowerCase().includes('sozlam')) {
      return responses[2];
    } else if (userMessage.toLowerCase().includes('admin')) {
      return responses[3];
    } else if (userMessage.toLowerCase().includes('bog\'lan') || userMessage.toLowerCase().includes('kontakt')) {
      return responses[4];
    } else if (userMessage.toLowerCase().includes('tahlil') || userMessage.toLowerCase().includes('ai')) {
      return responses[5];
    } else {
      return 'Hurmatli foydalanuvchi, men Parkent Finora Markent AI yordamchisiman. Platformamizdan foydalanish bo\'yicha savollaringizga javob berishdan mamnun bo\'laman. Qanday yordam bera olaman?';
    }
  };

  const handleAiAnalysis = async () => {
    if (!analysisInput.title || !analysisInput.description || !analysisInput.category || !analysisInput.price) {
      toast({
        title: "Xatolik",
        description: "AI tahlili uchun avval barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Xatolik",
        description: "AI tahlilidan foydalanish uchun tizimga kiring",
        variant: "destructive",
      });
      return;
    }

    if (!geminiService.isConfigured()) {
      toast({
        title: "AI xizmati mavjud emas",
        description: "Gemini API kaliti sozlanmagan.",
        variant: "destructive",
      });
      return;
    }

    // Check daily analysis limit
    if (!canUseAnalysis()) {
      const { analysisLimit } = getDailyLimits();
      toast({
        title: "Kunlik tahlil limiti to'ldi",
        description: `Bugungi tahlil limiti: ${dailyAnalysisCount}/${analysisLimit}. Keyinroq urinib ko'ring.`,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await geminiService.analyzeListing({
        title: analysisInput.title,
        description: analysisInput.description,
        category: analysisInput.category,
        price: parseFloat(analysisInput.price),
        city: analysisInput.city
      });

      if (result) {
        setAiAnalysis(result);
        setShowAiAnalysis(true);
        
        // Increment analysis count
        incrementAnalysisCount();
        
        toast({
          title: "Muvaffaqiyat!",
          description: "AI tahlili muvaffaqiyatli yakunlandi",
        });
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "AI tahlili jarayonida xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Xatolik",
        description: "AI xizmatidan foydalanish uchun tizimga kiring",
        variant: "destructive",
      });
      return;
    }

    // Check daily limit
    if (!canAskQuestion()) {
      const { questionLimit } = getDailyLimits();
      toast({
        title: "Kunlik limit to'ldi",
        description: `Bugungi savollar limiti: ${dailyQuestionCount}/${questionLimit}. Keyinroq urinib ko'ring.`,
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
        
        // Increment question count
        incrementQuestionCount();
      }, 1000);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "AI javob berishda xatolik yuz berdi",
        variant: "destructive"
      });
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Desktop View */}
      <div className="hidden md:flex flex-1 max-w-6xl mx-auto h-full flex-col p-2 md:p-4 lg:p-6 relative">
        <Card className="flex-1 shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-lg flex flex-col">
          {/* Desktop Header */}
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 sm:p-3 md:p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  onClick={() => window.history.back()}
                  className="h-6 w-6 sm:h-8 sm:w-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </Button>
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 bg-white/20 backdrop-blur-sm border border-white/30">
                  <AvatarFallback className="text-white">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg font-bold">AI Yordamchi</CardTitle>
                  <p className="text-purple-100 text-xs">Parkent Markent AI</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-100 text-xs hidden sm:inline">Online</span>
                <div className="hidden sm:flex items-center gap-2 text-xs text-purple-100">
                  <span>Savol: {dailyQuestionCount}/{getDailyLimits().questionLimit}</span>
                  <span>Tahlil: {dailyAnalysisCount}/{getDailyLimits().analysisLimit}</span>
                  <span>API: {getApiKeyStatus().currentKey}/{getApiKeyStatus().totalKeys}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          {/* Desktop Chat Messages */}
          <CardContent className="flex-1 p-2 sm:p-3 md:p-4 flex flex-col bg-gradient-to-b from-gray-50/50 to-white/80 pb-20">
            <ScrollArea className="flex-1 pr-1 sm:pr-2">
              <div className="space-y-2 sm:space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-1 sm:space-x-2 animate-fadeIn ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0">
                        <AvatarFallback className="text-white">
                          <Bot className="h-2 w-2 sm:h-3 sm:w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shadow transition-all duration-200 hover:shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-white border border-purple-100 text-gray-800'
                    }`}>
                      <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('uz-UZ', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {message.role === 'user' && (
                      <Avatar className="h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0">
                        <AvatarFallback className="text-white">
                          <User className="h-2 w-2 sm:h-3 sm:w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start space-x-1 sm:space-x-2">
                    <Avatar className="h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0">
                      <AvatarFallback className="text-white">
                        <Bot className="h-2 w-2 sm:h-3 sm:w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-purple-100 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shadow">
                      <div className="flex space-x-0.5 sm:space-x-1">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Desktop Input Area - Fixed Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-lg shadow-xl border-0 border-t border-purple-100">
              <div className="p-3 sm:p-4">
                <div className="flex space-x-2 sm:space-x-3">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Savol bering..."
                    className="flex-1 h-10 sm:h-12 px-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping || !canAskQuestion()}
                    className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    title={!canAskQuestion() ? `Kunlik limit to'ldi: ${dailyQuestionCount}/${getDailyLimits().questionLimit}` : "Yuborish"}
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
                
                {/* Desktop Quick Actions */}
                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                  {[
                    'Mahsulotlar',
                    'Savatcha',
                    'Profil',
                    'Admin',
                    'AI Tahlili'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (suggestion === 'AI Tahlili') {
                          setShowAiAnalysis(true);
                        } else {
                          setInputMessage(suggestion);
                        }
                      }}
                      className="px-3 py-1 text-xs sm:text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                
                {/* AI Analysis Section */}
                {showAiAnalysis && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-amber-50/70 via-yellow-50/50 to-amber-50/70 border border-amber-200/50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-amber-800">AI Mahsulot Tahlili</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAiAnalysis(false)}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        placeholder="Mahsulot nomi"
                        value={analysisInput.title}
                        onChange={(e) => setAnalysisInput({...analysisInput, title: e.target.value})}
                        className="bg-white/80"
                      />
                      <Input
                        placeholder="Mahsulot tavsifi"
                        value={analysisInput.description}
                        onChange={(e) => setAnalysisInput({...analysisInput, description: e.target.value})}
                        className="bg-white/80"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Kategoriya"
                          value={analysisInput.category}
                          onChange={(e) => setAnalysisInput({...analysisInput, category: e.target.value})}
                          className="bg-white/80"
                        />
                        <Input
                          placeholder="Narx"
                          type="number"
                          value={analysisInput.price}
                          onChange={(e) => setAnalysisInput({...analysisInput, price: e.target.value})}
                          className="bg-white/80"
                        />
                        <Input
                          placeholder="Shahar"
                          value={analysisInput.city}
                          onChange={(e) => setAnalysisInput({...analysisInput, city: e.target.value})}
                          className="bg-white/80"
                        />
                      </div>
                      
                      <Button
                        onClick={handleAiAnalysis}
                        disabled={isAnalyzing || !geminiService.isConfigured() || !canUseAnalysis()}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                        title={!canUseAnalysis() ? `Kunlik tahlil limiti to'ldi: ${dailyAnalysisCount}/${getDailyLimits().analysisLimit}` : "AI Tahlili"}
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Tahlil qilinmoqda...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            <span>AI Tahlili</span>
                          </div>
                        )}
                      </Button>
                      
                      {aiAnalysis && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {aiAnalysis.score >= 7 ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                              )}
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-amber-800">AI Tahlil Natijalari</h4>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  aiAnalysis.score >= 7 
                                    ? 'bg-green-100 text-green-800' 
                                    : aiAnalysis.score >= 5 
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  Baho: {aiAnalysis.score}/10
                                </div>
                              </div>
                              
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {aiAnalysis.analysis}
                              </p>
                              
                              {aiAnalysis.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs font-medium text-gray-600">Kalit so'zlar:</span>
                                  {aiAnalysis.keywords.map((keyword, index) => (
                                    <span 
                                      key={index}
                                      className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!geminiService.isConfigured() && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">AI xizmati mavjud emas. Admin bilan bog'laning.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex-1 flex flex-col">
        {!isMinimized ? (
          <Card className="flex-1 shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-lg m-2 flex flex-col">
            {/* Mobile Header */}
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.history.back()}
                    className="h-6 w-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-0"
                  >
                    <ArrowLeft className="h-3 w-3 text-white" />
                  </Button>
                  <Avatar className="h-6 w-6 bg-white/20 backdrop-blur-sm border border-white/30">
                    <AvatarFallback className="text-white">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-bold">AI Yordamchi</CardTitle>
                    <p className="text-purple-100 text-xs">Parkent Markent AI</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <Button
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-0"
                  >
                    <Minimize2 className="h-3 w-3 text-white" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Mobile Chat Messages */}
            <CardContent className="flex-1 p-2 flex flex-col bg-gradient-to-b from-gray-50/50 to-white/80">
              <ScrollArea className="flex-1 pr-1">
                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-1 animate-fadeIn ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-4 w-4 bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0">
                          <AvatarFallback className="text-white">
                            <Bot className="h-2 w-2" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[85%] rounded-lg px-2 py-1.5 shadow transition-all duration-200 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-white border border-purple-100 text-gray-800'
                      }`}>
                        <p className="text-xs leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-0.5 ${
                          message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      {message.role === 'user' && (
                        <Avatar className="h-4 w-4 bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0">
                          <AvatarFallback className="text-white">
                            <User className="h-2 w-2" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start space-x-1">
                      <Avatar className="h-4 w-4 bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0">
                        <AvatarFallback className="text-white">
                          <Bot className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white border border-purple-100 rounded-lg px-2 py-1.5 shadow">
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            {/* Mobile Input Area - Fixed Bottom */}
            <div className="p-2 bg-white/60 backdrop-blur-sm border-t border-purple-100">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Savol bering..."
                  className="flex-1 h-8 px-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-lg focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 text-xs"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Mobile Quick Actions */}
              <div className="mt-1.5 flex flex-wrap gap-0.5">
                {[
                  'Mahsulotlar',
                  'Savatcha',
                  'Profil',
                  'Admin',
                  'AI Tahlili'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      if (suggestion === 'AI Tahlili') {
                        setShowAiAnalysis(true);
                      } else {
                        setInputMessage(suggestion);
                      }
                    }}
                    className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              
              {/* Mobile AI Analysis Section */}
              {showAiAnalysis && (
                <div className="mt-3 p-3 bg-gradient-to-br from-amber-50/70 via-yellow-50/50 to-amber-50/70 border border-amber-200/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-amber-800">AI Mahsulot Tahlili</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAiAnalysis(false)}
                      className="text-amber-600 hover:text-amber-800 h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Mahsulot nomi"
                      value={analysisInput.title}
                      onChange={(e) => setAnalysisInput({...analysisInput, title: e.target.value})}
                      className="bg-white/80 h-8 text-xs"
                    />
                    <Input
                      placeholder="Mahsulot tavsifi"
                      value={analysisInput.description}
                      onChange={(e) => setAnalysisInput({...analysisInput, description: e.target.value})}
                      className="bg-white/80 h-8 text-xs"
                    />
                    <div className="grid grid-cols-3 gap-1">
                      <Input
                        placeholder="Kategoriya"
                        value={analysisInput.category}
                        onChange={(e) => setAnalysisInput({...analysisInput, category: e.target.value})}
                        className="bg-white/80 h-8 text-xs"
                      />
                      <Input
                        placeholder="Narx"
                        type="number"
                        value={analysisInput.price}
                        onChange={(e) => setAnalysisInput({...analysisInput, price: e.target.value})}
                        className="bg-white/80 h-8 text-xs"
                      />
                      <Input
                        placeholder="Shahar"
                        value={analysisInput.city}
                        onChange={(e) => setAnalysisInput({...analysisInput, city: e.target.value})}
                        className="bg-white/80 h-8 text-xs"
                      />
                    </div>
                    
                    <Button
                      onClick={handleAiAnalysis}
                      disabled={isAnalyzing || !geminiService.isConfigured()}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white h-8 text-xs"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Tahlil qilinmoqda...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          <span>AI Tahlili</span>
                        </div>
                      )}
                    </Button>
                    
                    {aiAnalysis && (
                      <div className="mt-3 p-2 bg-white rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0">
                            {aiAnalysis.score >= 7 ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-amber-800">AI Maslahatlari</h4>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                aiAnalysis.score >= 7 
                                  ? 'bg-green-100 text-green-800' 
                                  : aiAnalysis.score >= 5 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                Sifat: {aiAnalysis.score}/10
                              </div>
                            </div>
                            
                            <p className="text-gray-700 text-xs leading-relaxed">
                              {aiAnalysis.analysis}
                            </p>
                            
                            {aiAnalysis.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs font-medium text-gray-600">Kalit so'zlar:</span>
                                {aiAnalysis.keywords.map((keyword, index) => (
                                  <span 
                                    key={index}
                                    className="px-1 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!geminiService.isConfigured() && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-xs">AI xizmati mavjud emas. Admin bilan bog'laning.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          /* Mobile Minimized Chat */
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-lg">
              <Button
                onClick={() => setIsMinimized(false)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg p-3 flex items-center space-x-2"
              >
                <Bot className="h-4 w-4" />
                <span className="text-sm font-medium">AI Yordamchi</span>
                <Maximize2 className="h-3 w-3" />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </Button>
            </Card>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;
