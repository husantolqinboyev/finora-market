interface GeminiAnalysisResult {
  analysis: string;
  score: number;
  keywords: string[];
}

export class GeminiAIService {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private keyUsageCounts: Map<number, { count: number; lastReset: Date }> = new Map();
  public readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private readonly KEY_LIMIT = 50; // Har bir key uchun kunlik limit

  constructor() {
    // Load all API keys from environment
    this.apiKeys = [
      import.meta.env.VITE_GEMINI_API_KEY_1,
      import.meta.env.VITE_GEMINI_API_KEY_2,
      import.meta.env.VITE_GEMINI_API_KEY_3,
      import.meta.env.VITE_GEMINI_API_KEY_4,
      import.meta.env.VITE_GEMINI_API_KEY_5,
      import.meta.env.VITE_GEMINI_API_KEY_6,
      import.meta.env.VITE_GEMINI_API_KEY_7,
      import.meta.env.VITE_GEMINI_API_KEY_8,
      import.meta.env.VITE_GEMINI_API_KEY_9,
      import.meta.env.VITE_GEMINI_API_KEY_10,
    ].filter(key => key && key !== 'your_gemini_api_key_here' && key.startsWith('AIza'));

    // Initialize usage counts for each key
    const today = new Date().toDateString();
    this.apiKeys.forEach((_, index) => {
      this.keyUsageCounts.set(index, { count: 0, lastReset: new Date(today) });
    });

    if (this.apiKeys.length === 0) {
      console.warn('No valid Gemini API keys found. AI analysis will be disabled.');
    }
  }

  get currentApiKey(): string {
    return this.apiKeys[this.currentKeyIndex] || '';
  }

  private checkAndRotateKey(): boolean {
    const today = new Date().toDateString();
    const currentUsage = this.keyUsageCounts.get(this.currentKeyIndex);
    
    // Reset daily count if it's a new day
    if (currentUsage && currentUsage.lastReset.toDateString() !== today) {
      this.keyUsageCounts.set(this.currentKeyIndex, { count: 0, lastReset: new Date(today) });
    }

    // Check if current key reached limit
    const usage = this.keyUsageCounts.get(this.currentKeyIndex);
    if (usage && usage.count >= this.KEY_LIMIT) {
      // Try to find next available key
      for (let i = 0; i < this.apiKeys.length; i++) {
        const nextIndex = (this.currentKeyIndex + i + 1) % this.apiKeys.length;
        const nextUsage = this.keyUsageCounts.get(nextIndex);
        
        if (nextUsage && nextUsage.count < this.KEY_LIMIT) {
          this.currentKeyIndex = nextIndex;
          console.log(`Rotated to API key ${nextIndex + 1}`);
          return true;
        }
      }
      
      // All keys reached limit
      console.warn('All API keys reached daily limit');
      return false;
    }
    
    return true;
  }

  private incrementUsage(): void {
    const usage = this.keyUsageCounts.get(this.currentKeyIndex);
    if (usage) {
      usage.count++;
      this.keyUsageCounts.set(this.currentKeyIndex, usage);
    }
  }

  async analyzeListing(listing: {
    title: string;
    description: string;
    category: string;
    price: number;
    city: string;
  }): Promise<GeminiAnalysisResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    // Check and rotate key if needed
    if (!this.checkAndRotateKey()) {
      return null;
    }

    try {
      const prompt = `Siz Parkent Finora Markent platformasining rasmiy AI yordamchisiz. O'zingizni "Finora Markent AI" deb tanishtiring va har doim hurmatli murojaat qiling.

MA'LUMOTLAR:
- Sarlavha: ${listing.title}
- Tavsif: ${listing.description}
- Kategoriya: ${listing.category}
- Narx: ${listing.price} so'm
- Shahar: ${listing.city}

VAZIFALAR:
1. E'lon sifatini 0 dan 10 gacha baholang (10 - eng yuqori sifat)
2. Qisqa tahlil yozing (150-200 so'z ichida)
3. Kalit so'zlarni ajratib oling (5-8 ta kalit so'z)

BAHOLASH MEZONLARI:
- Tavsifning batafsilligi va aniqligi
- Narxning mosligi
- Sarlavhaning jalb qiluvchanligi
- Kategoriyaga to'g'ri kelishi
- Umumiy sifat

JAVOB FORMATI (faqat JSON formatida, hech qanday qo'shimcha matn siz):
{
  "score": 7.5,
  "analysis": "Tahlil matni shu yerda bo'ladi...",
  "keywords": ["kalit", "so'zlar", "shu", "yerda"]
}`;

      const response = await fetch(`${this.baseUrl}?key=${this.currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      console.log('Gemini response:', text);

      // Parse JSON response - multiple fallback methods
      let result;
      try {
        // Remove markdown code blocks and find JSON
        let cleanText = text;
        
        // Remove ```json and ``` markers
        cleanText = cleanText.replace(/```json\s*/g, '');
        cleanText = cleanText.replace(/```\s*$/g, '');
        
        // Try to find complete JSON object
        const jsonMatch = cleanText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
        if (jsonMatch) {
          // Try to fix incomplete JSON
          let jsonStr = jsonMatch[0];
          
          // Fix incomplete strings
          if (jsonStr.includes('"analysis":') && !jsonStr.match(/"analysis":\s*"[^"]*"/)) {
            jsonStr = jsonStr.replace(/("analysis":\s*"[^"]*)/, '$1..."');
          }
          
          // Fix incomplete keywords array
          if (jsonStr.includes('"keywords":') && !jsonStr.match(/"keywords":\s*\[[^\]]*\]/)) {
            jsonStr = jsonStr.replace(/("keywords":\s*\[[^\]]*)/, '$1]');
          }
          
          try {
            result = JSON.parse(jsonStr);
          } catch (e) {
            // If still fails, create fallback
            throw new Error('Still invalid JSON after cleanup');
          }
        } else {
          // Try to parse the whole cleaned text as JSON
          result = JSON.parse(cleanText);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // Extract what we can from the response
        const scoreMatch = text.match(/"score":\s*([\d.]+)/);
        const analysisMatch = text.match(/"analysis":\s*"([^"]*)"/);
        const keywordsMatch = text.match(/"keywords":\s*\[([^\]]*)\]/);
        
        result = {
          score: scoreMatch ? parseFloat(scoreMatch[1]) : 7.0,
          analysis: analysisMatch ? analysisMatch[1] : text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/[{}"]/g, '').substring(0, 200) || "Tahlil mavjud emas",
          keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim().replace(/"/g, '')).filter(k => k) : ["mahsulot", "sotuv", "yaxshi"]
        };
      }

      // Validate and sanitize result
      return {
        score: Math.min(10, Math.max(0, Number(result.score) || 7)),
        analysis: String(result.analysis || text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').substring(0, 200) || 'Tahlil mavjud emas'),
        keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 8) : ["mahsulot", "sotuv", "yaxshi"]
      };

    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      return null;
    }
  }

  async analyzeBatch(listings: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    city: string;
  }>): Promise<Array<{ id: string; result: GeminiAnalysisResult | null }>> {
    const results = [];
    
    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < listings.length; i += 5) {
      const batch = listings.slice(i, i + 5);
      
      const batchPromises = batch.map(async (listing) => {
        const result = await this.analyzeListing(listing);
        return { id: listing.id, result };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limits
      if (i + 5 < listings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async chatResponse(message: string): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    // Check and rotate key if needed
    if (!this.checkAndRotateKey()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Siz Finora Markent AI yordamchisiz. Har doim "hurmatli foydalanuvchi" deb murojaat qiling. Faqat o'zbek tilida javob bering.

Savol: ${message}

Qisqa javob bering (2-3 gap).`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 250,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Increment usage count
      this.incrementUsage();
      
      return text.trim();
    } catch (error) {
      console.error('Gemini chat error:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.apiKeys.length > 0 && this.currentApiKey !== '';
  }

  getKeyUsageStatus(): { currentKey: number; totalKeys: number; currentUsage: number; limit: number } {
    const usage = this.keyUsageCounts.get(this.currentKeyIndex);
    return {
      currentKey: this.currentKeyIndex + 1,
      totalKeys: this.apiKeys.length,
      currentUsage: usage?.count || 0,
      limit: this.KEY_LIMIT
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await fetch(`${this.baseUrl}?key=${this.currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Test"
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10,
          }
        })
      });

      return testResponse.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiAIService();
