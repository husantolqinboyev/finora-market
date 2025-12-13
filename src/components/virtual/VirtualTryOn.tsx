import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Download, Save, User, Users, Baby } from 'lucide-react';
import type { Product } from '@/components/products/ProductCard';

interface VirtualTryOnProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const AVATAR_MODELS = [
  { id: 'default', name: 'Default Model', icon: User, description: 'Standard fit model' },
  { id: 'athletic', name: 'Athletic Model', icon: Users, description: 'Muscular build model' },
  { id: 'petite', name: 'Petite Model', icon: Baby, description: 'Smaller frame model' },
];

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ isOpen, onOpenChange, product }) => {
  const [selectedModel, setSelectedModel] = useState('default');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (product) {
      setSelectedSize(product.size_options?.[0] || '');
      setSelectedColor(product.color_options?.[0] || '');
    }
  }, [product]);

  const handleSaveSession = async () => {
    if (!product) return;
    
    // In a real implementation, this would save to the database
    console.log('Saving try-on session:', {
      productId: product.id,
      model: selectedModel,
      size: selectedSize,
      color: selectedColor,
    });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Virtual Try-On: {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Controls Panel */}
          <div className="w-80 space-y-4 overflow-y-auto">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Select Model</h3>
                <div className="space-y-2">
                  {AVATAR_MODELS.map((model) => {
                    const IconComponent = model.icon;
                    return (
                      <Button
                        key={model.id}
                        variant={selectedModel === model.id ? 'default' : 'outline'}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => setSelectedModel(model.id)}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {product.size_options && product.size_options.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.size_options.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {product.color_options && product.color_options.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.color_options.map((color) => (
                      <Button
                        key={color}
                        variant={selectedColor === color ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSaveSession} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Try-On Display */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gradient-secondary rounded-lg p-4 flex items-center justify-center relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={600}
                className="border border-border rounded-lg bg-background"
              />
              
              {/* Overlay showing selected options */}
              <div className="absolute top-4 left-4 space-y-2">
                <Badge variant="secondary">Model: {AVATAR_MODELS.find(m => m.id === selectedModel)?.name}</Badge>
                {selectedSize && <Badge variant="secondary">Size: {selectedSize}</Badge>}
                {selectedColor && <Badge variant="secondary">Color: {selectedColor}</Badge>}
              </div>

              {/* Placeholder content for demonstration */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-4">
                  <div className="w-32 h-48 bg-gradient-primary/20 rounded-lg flex items-center justify-center mx-auto">
                    <User className="w-16 h-16 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">3D Try-On Preview</p>
                    <p className="text-xs text-muted-foreground">
                      Virtual try-on would render here with selected model and clothing
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Preview
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualTryOn;