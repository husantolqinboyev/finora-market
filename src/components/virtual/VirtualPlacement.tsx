import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, RotateCw, Move, ZoomIn, ZoomOut, Download, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Product } from '@/components/products/ProductCard';

interface VirtualPlacementProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

interface Position {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const VirtualPlacement: React.FC<VirtualPlacementProps> = ({ isOpen, onOpenChange, product }) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [productPosition, setProductPosition] = useState<Position>({
    x: 200,
    y: 200,
    scale: 1,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on the product (simplified hit detection)
    const productBounds = {
      left: productPosition.x - 50,
      right: productPosition.x + 50,
      top: productPosition.y - 50,
      bottom: productPosition.y + 50,
    };

    if (x >= productBounds.left && x <= productBounds.right && 
        y >= productBounds.top && y <= productBounds.bottom) {
      setIsDragging(true);
    }
  }, [productPosition]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setProductPosition(prev => ({
      ...prev,
      x,
      y,
    }));
  }, [isDragging]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const adjustScale = (delta: number) => {
    setProductPosition(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale + delta)),
    }));
  };

  const adjustRotation = (delta: number) => {
    setProductPosition(prev => ({
      ...prev,
      rotation: prev.rotation + delta,
    }));
  };

  const handleSave = async () => {
    toast({
      title: "Placement Saved",
      description: "Your virtual placement has been saved successfully!",
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${product?.name || 'product'}-placement.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Virtual Placement: {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Controls Panel */}
          <div className="w-80 space-y-4 overflow-y-auto">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Upload Background</h3>
                <div className="space-y-3">
                  <Label htmlFor="background-upload">
                    Choose your room, wall, or space image
                  </Label>
                  <Input
                    id="background-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Position & Transform</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => adjustScale(0.1)}
                    >
                      <ZoomIn className="w-4 h-4 mr-1" />
                      Zoom In
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => adjustScale(-0.1)}
                    >
                      <ZoomOut className="w-4 h-4 mr-1" />
                      Zoom Out
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => adjustRotation(-15)}
                    >
                      <RotateCw className="w-4 h-4 mr-1 scale-x-[-1]" />
                      Rotate L
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => adjustRotation(15)}
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      Rotate R
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Scale: {productPosition.scale.toFixed(1)}x</p>
                    <p>Rotation: {productPosition.rotation}°</p>
                    <p>Position: ({productPosition.x}, {productPosition.y})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Placement Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gradient-secondary rounded-lg p-4 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="border border-border rounded-lg bg-background cursor-pointer"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
              
              {/* Instructions overlay */}
              {!backgroundImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center space-y-4 p-8 bg-card/80 backdrop-blur-sm rounded-lg">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div className="space-y-2">
                      <p className="font-medium">Upload a background image</p>
                      <p className="text-sm text-muted-foreground">
                        Upload a photo of your room, wall, or space to see how this product would look
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {backgroundImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center space-y-2 absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg p-3">
                    <Move className="w-4 h-4 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Click and drag the product to move it around
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualPlacement;