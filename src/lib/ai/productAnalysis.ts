interface ProductAnalysis {
  trendingScore: number;
  categoryTrends: string[];
  userInterestKeywords: string[];
  recommendedPrice: number;
  marketDemand: 'low' | 'medium' | 'high';
  insights: string[];
}

export class ProductAnalysisService {
  static async analyzeProduct(
    title: string, 
    description: string, 
    category: string,
    price: number
  ): Promise<ProductAnalysis> {
    // Mock AI analysis - real implementation would call an AI service
    const keywords = this.extractKeywords(title + ' ' + description);
    const categoryTrends = this.getCategoryTrends(category);
    const marketDemand = this.calculateMarketDemand(category, price);
    const recommendedPrice = this.calculateRecommendedPrice(category, price);
    
    return {
      trendingScore: this.calculateTrendingScore(keywords, categoryTrends),
      categoryTrends,
      userInterestKeywords: keywords,
      recommendedPrice,
      marketDemand,
      insights: this.generateInsights(category, price, keywords)
    };
  }

  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction - in real implementation, use NLP
    const commonWords = ['va', 'uchun', 'bilan', 'ham', 'bunda', 'shu', 'bu', 'har', 'yoki'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
    
    // Count frequency and return top keywords
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private static getCategoryTrends(category: string): string[] {
    const trends: Record<string, string[]> = {
      'Kiyim-kechak': ['kuzgi kolleksiya', 'yozgi liboslar', 'zamonaviy uslub', 'qulay material'],
      'Poyabzal': ['sport poyabzal', 'rasmiy poyabzal', 'kunning yangilari', 'ekologik material'],
      'Aksessuarlar': ['zargarlik buyumlari', 'soatlar', 'sumkalar', 'qurollar'],
      'Uy jihozlari': ['zamonaviy dizayn', 'ekologik mahsulotlar', 'aqlli jihozlar', 'minimalizm'],
      'Elektronika': ['smartfonlar', 'noutbuklar', 'qurilma aksessuarlari', 'gadjetlar'],
      'Boshqa': ['noyob mahsulotlar', 'ixtisoslashtirilgan', 'yangi kelgan', 'maxsus taklif']
    };
    
    return trends[category] || ['umumiy tendentsiyalar', 'soraluvchan mahsulotlar'];
  }

  private static calculateMarketDemand(category: string, price: number): 'low' | 'medium' | 'high' {
    // Mock calculation based on category and price
    const avgPrices: Record<string, number> = {
      'Kiyim-kechak': 150000,
      'Poyabzal': 200000,
      'Aksessuarlar': 100000,
      'Uy jihozlari': 500000,
      'Elektronika': 1500000,
      'Boshqa': 300000
    };
    
    const avgPrice = avgPrices[category] || 300000;
    const priceRatio = price / avgPrice;
    
    if (priceRatio < 0.8) return 'high';
    if (priceRatio < 1.5) return 'medium';
    return 'low';
  }

  private static calculateRecommendedPrice(category: string, currentPrice: number): number {
    const avgPrices: Record<string, number> = {
      'Kiyim-kechak': 150000,
      'Poyabzal': 200000,
      'Aksessuarlar': 100000,
      'Uy jihozlari': 500000,
      'Elektronika': 1500000,
      'Boshqa': 300000
    };
    
    const avgPrice = avgPrices[category] || 300000;
    const marketAdjustment = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    
    return Math.round(avgPrice * marketAdjustment);
  }

  private static calculateTrendingScore(keywords: string[], categoryTrends: string[]): number {
    const matchingKeywords = keywords.filter(keyword => 
      categoryTrends.some(trend => trend.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    const baseScore = matchingKeywords.length * 20;
    const keywordBonus = keywords.length * 5;
    const randomFactor = Math.random() * 10;
    
    return Math.min(100, Math.round(baseScore + keywordBonus + randomFactor));
  }

  private static generateInsights(category: string, price: number, keywords: string[]): string[] {
    const insights: string[] = [];
    
    // Price insights
    if (price < 100000) {
      insights.push('Past narx ko\'plab sotuvchilarni jalb qilishi mumkin');
    } else if (price > 1000000) {
      insights.push('Yuqori narx sifatga e\'tibor beruvchi xaridorlarni jalb qiladi');
    } else {
      insights.push('O\'rtacha narx keng auditoriyaga mos keladi');
    }
    
    // Category insights
    const categoryInsights: Record<string, string> = {
      'Kiyim-kechak': 'Mavsumiy tendentsiyalarni hisobga oling',
      'Poyabzal': 'Qulaylik va uslub muhim omil',
      'Aksessuarlar': 'Nooblik va eksklyuzivlik qiymat oshiradi',
      'Uy jihozlari': 'Funksionallik va dizayn muhim',
      'Elektronika': 'Texnik xususiyatlar va kafolat muhim',
      'Boshqa': 'Maxuslik va foydalanish sohasini ta\'kidlang'
    };
    
    insights.push(categoryInsights[category] || 'Mahsulotning afzalliklarini ko\'rsating');
    
    // Keyword insights
    if (keywords.length > 3) {
      insights.push('Tavsifda kalit so\'zlarni to\'g\'ri ishlatganingiz yaxshi');
    } else {
      insights.push('Tavsifga ko\'proq tavsiflovchi so\'zlar qo\'shing');
    }
    
    return insights;
  }

  static async getMarketInsights(category: string): Promise<{
    topProducts: string[];
    averagePrice: number;
    demandLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    // Mock market insights
    return {
      topProducts: ['mahsulot A', 'mahsulot B', 'mahsulot C'],
      averagePrice: 300000,
      demandLevel: 'medium',
      recommendations: [
        'Sifati yuqori bo\'lgan mahsulotlarni tanlang',
        'Narxni raqobatchilarga qarab belgilang',
        'Mavsumiy tendentsiyalarni kuzatib boring'
      ]
    };
  }
}
