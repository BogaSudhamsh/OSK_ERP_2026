import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { 
  Upload, 
  Wand2, 
  Save, 
  Trash2, 
  Download,
  Image as ImageIcon,
  Building2,
  X,
  Check,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';

interface ProductVisualizerAIProps {
  product: {
    id: string;
    name: string;
    image: string;
    category: string;
  };
  onClose: () => void;
}

interface BuildingPart {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  appliedProduct?: {
    id: string;
    name: string;
    image: string;
  };
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  appliedParts: {
    part: string;
    productName: string;
  }[];
  timestamp: Date;
}

export const ProductVisualizerAI: React.FC<ProductVisualizerAIProps> = ({ product, onClose }) => {
  const { products } = useApp();
  const [buildingImage, setBuildingImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState(product);
  const [buildingParts, setBuildingParts] = useState<BuildingPart[]>([
    { id: 'hall', name: 'Hall', icon: '🏛️', selected: false },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', selected: false },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', selected: false },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿', selected: false },
    { id: 'balcony', name: 'Balcony', icon: '🌿', selected: false },
    { id: 'flooring', name: 'Flooring', icon: '🔲', selected: false },
    { id: 'walls', name: 'Walls', icon: '🧱', selected: false },
    { id: 'staircase', name: 'Staircase', icon: '🪜', selected: false },
  ]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<string | null>(null);

  const availableProducts = products
    .filter((p) => !!(p.images?.[0] || p.image))
    .map((p) => ({
      id: p.id,
      name: p.name,
      image: p.images?.[0] || p.image || '',
      category: p.category,
    }));

  const handleBuildingImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuildingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBuildingPart = (partId: string) => {
    setBuildingParts(parts =>
      parts.map(part =>
        part.id === partId ? { ...part, selected: !part.selected } : part
      )
    );
  };

  const applyProductToParts = () => {
    setBuildingParts(parts =>
      parts.map(part =>
        part.selected
          ? { 
              ...part, 
              appliedProduct: {
                id: selectedProduct.id,
                name: selectedProduct.name,
                image: selectedProduct.image
              }
            }
          : part
      )
    );
  };

  const handleGenerate = () => {
    const selectedParts = buildingParts.filter(p => p.selected);
    if (!buildingImage || selectedParts.length === 0) {
      return;
    }

    setIsGenerating(true);
    applyProductToParts();

    // Local preview generation until backend image generation is integrated
    setTimeout(() => {
      const generatedImage = buildingImage;
      
      const newGeneratedImage: GeneratedImage = {
        id: Date.now().toString(),
        imageUrl: generatedImage,
        appliedParts: selectedParts.map(part => ({
          part: part.name,
          productName: selectedProduct.name
        })),
        timestamp: new Date()
      };

      setGeneratedImages(prev => [newGeneratedImage, ...prev]);
      setCurrentGeneratedImage(generatedImage);
      setIsGenerating(false);
      
      // Deselect all parts after generation
      setBuildingParts(parts => parts.map(p => ({ ...p, selected: false })));
    }, 3000);
  };

  const handleSaveGenerated = (imageId: string) => {
    // In real app, this would save to database
    console.log('Saving generated image:', imageId);
  };

  const handleDeleteGenerated = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleDownloadGenerated = (imageUrl: string) => {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `osk-visualization-${Date.now()}.png`;
    link.click();
  };

  const clearBuildingPart = (partId: string) => {
    setBuildingParts(parts =>
      parts.map(part =>
        part.id === partId ? { ...part, appliedProduct: undefined } : part
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#FFF8F0] rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] p-6 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Product Visualizer</h2>
              <p className="text-white/80 text-sm">Apply products to your construction space</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Product & Building Upload */}
            <div className="space-y-6">
              {/* Current Product */}
              <Card className="border-2 border-[#B8860B]/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-[#2C2C2C]">
                    <ImageIcon className="w-5 h-5 text-[#B8860B]" />
                    Selected Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-[#B8860B]/30"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#2C2C2C]">{selectedProduct.name}</h3>
                      <p className="text-sm text-[#6B6B6B]">{selectedProduct.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Products to Switch */}
              <Card className="border-2 border-[#B8860B]/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-transparent">
                  <CardTitle className="text-[#2C2C2C]">Switch Product</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {availableProducts.map((prod) => (
                      <motion.div
                        key={prod.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedProduct(prod)}
                        className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                          selectedProduct.id === prod.id
                            ? 'border-[#B8860B] bg-[#B8860B]/10'
                            : 'border-gray-200 hover:border-[#B8860B]/50'
                        }`}
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-20 object-cover rounded-md mb-2"
                        />
                        <p className="text-xs font-medium text-[#2C2C2C] truncate">{prod.name}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Building Image Upload */}
              <Card className="border-2 border-[#B8860B]/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-[#2C2C2C]">
                    <Building2 className="w-5 h-5 text-[#B8860B]" />
                    Construction Building Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {!buildingImage ? (
                    <label className="border-2 border-dashed border-[#B8860B]/30 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#B8860B] hover:bg-[#B8860B]/5 transition-all">
                      <Upload className="w-12 h-12 text-[#B8860B] mb-3" />
                      <p className="text-[#2C2C2C] font-medium mb-1">Upload Building Image</p>
                      <p className="text-sm text-[#6B6B6B] text-center">
                        Upload interior/exterior construction photo
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBuildingImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={buildingImage}
                        alt="Building"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        onClick={() => setBuildingImage(null)}
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Building Parts & Preview */}
            <div className="space-y-6">
              {/* Building Parts Selection */}
              <Card className="border-2 border-[#B8860B]/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-transparent">
                  <CardTitle className="text-[#2C2C2C]">Select Building Parts</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {buildingParts.map((part) => (
                      <motion.div
                        key={part.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          onClick={() => toggleBuildingPart(part.id)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            part.selected
                              ? 'border-[#B8860B] bg-[#B8860B]/10'
                              : 'border-gray-200 hover:border-[#B8860B]/50'
                          } ${part.appliedProduct ? 'bg-green-50 border-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{part.icon}</span>
                            {part.selected && (
                              <Check className="w-5 h-5 text-[#B8860B]" />
                            )}
                            {part.appliedProduct && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearBuildingPart(part.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                          <p className="font-medium text-sm text-[#2C2C2C]">{part.name}</p>
                          {part.appliedProduct && (
                            <p className="text-xs text-green-600 mt-1 truncate">
                              {part.appliedProduct.name}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!buildingImage || buildingParts.filter(p => p.selected).length === 0 || isGenerating}
                className="w-full bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] hover:shadow-2xl hover:shadow-[#B8860B]/50 text-white font-bold py-6 text-lg rounded-xl border-0"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating AI Visualization...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate AI Visualization
                  </>
                )}
              </Button>

              {/* Current Generated Preview */}
              {currentGeneratedImage && (
                <Card className="border-2 border-green-500 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-[#2C2C2C]">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      Latest Generated Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <img
                      src={currentGeneratedImage}
                      alt="Generated"
                      className="w-full h-64 object-cover rounded-lg mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownloadGenerated(currentGeneratedImage)}
                        className="flex-1 bg-[#B8860B] hover:bg-[#DAA520]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleSaveGenerated(generatedImages[0]?.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Generated Images Gallery */}
          {generatedImages.length > 0 && (
            <Card className="border-2 border-[#B8860B]/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-transparent">
                <CardTitle className="text-[#2C2C2C]">Generated Visualizations History</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {generatedImages.map((image) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-[#B8860B] transition-all"
                      >
                        <img
                          src={image.imageUrl}
                          alt="Generated"
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-3 bg-white">
                          <div className="text-xs text-[#6B6B6B] mb-2">
                            {image.appliedParts.map((ap, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="font-medium">{ap.part}:</span>
                                <span className="truncate">{ap.productName}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleDownloadGenerated(image.imageUrl)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteGenerated(image.id)}
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
};