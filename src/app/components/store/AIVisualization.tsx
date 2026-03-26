import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, Check, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface AIVisualizationProps {
  customerId: string;
  productId: string;
  onBack: () => void;
  onApprove: () => void;
}

export const AIVisualization: React.FC<AIVisualizationProps> = ({
  customerId,
  productId,
  onBack,
  onApprove,
}) => {
  const { products, customers, updateCustomer } = useApp();
  const [customerImages, setCustomerImages] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const product = products.find(p => p.id === productId);
  const customer = customers.find(c => c.id === customerId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));
      setCustomerImages([...customerImages, ...imageUrls]);
      toast.success(`${files.length} image(s) uploaded`);
    }
  };

  const handleGenerateAI = async () => {
    if (customerImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsGenerating(true);
    toast.info('AI is generating visualization...');

    // Simulate AI processing (2-3 seconds)
    setTimeout(() => {
      // In a real app, this would call an AI API
      // For now, we'll use a placeholder or the customer's image
      setAiGeneratedImage(customerImages[0]); // Simulated AI result
      setIsGenerating(false);
      setShowPreview(true);
      toast.success('AI visualization generated!');
    }, 3000);
  };

  const handleApprove = () => {
    // Save images to customer record
    if (customer) {
      const updatedImages = [
        ...(customer.aiDesignImages || []),
        ...customerImages,
        aiGeneratedImage,
      ];

      updateCustomer(customer.id, {
        aiDesignImages: updatedImages,
      });

      toast.success('Design approved and saved!');
      onApprove();
    }
  };

  const handleReject = () => {
    setShowPreview(false);
    setAiGeneratedImage('');
    toast.info('You can try uploading different images');
  };

  if (!product || !customer) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B6B6B]">Product or Customer not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#B8860B] hover:bg-[#FFF8F0]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            AI Visualization
          </h1>
          <p className="text-[#6B6B6B]">Generate realistic preview in customer space</p>
        </div>
      </div>

      {/* Product & Customer Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
          <CardHeader>
            <CardTitle className="text-[#B8860B] text-lg">Selected Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-20 h-20 rounded-lg object-cover border-2 border-[#B8860B]/20" />
              )}
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{product.name}</h3>
                <p className="text-sm text-[#6B6B6B]">{product.category}</p>
                <p className="text-lg font-bold text-[#B8860B] mt-1">₹{product.price.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
          <CardHeader>
            <CardTitle className="text-[#B8860B] text-lg">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">{customer.name}</h3>
              <p className="text-sm text-[#6B6B6B]">{customer.phone}</p>
              {customer.location && (
                <p className="text-sm text-[#6B6B6B] mt-1">{customer.location}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Room Selection */}
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B]">Select Room Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                      <SelectValue placeholder="Choose room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="floor">Floor</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Customer Space Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-[#B8860B]/30 rounded-lg p-8 text-center hover:border-[#B8860B]/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="customer-images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="customer-images" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-[#B8860B]" />
                    <p className="text-[#1A1A1A] font-medium mb-1">Upload House/Kitchen/Floor Images</p>
                    <p className="text-sm text-[#6B6B6B]">PNG, JPG up to 10MB • Multiple images supported</p>
                  </label>
                </div>

                {/* Uploaded Images Preview */}
                {customerImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A] mb-3">
                      Uploaded Images ({customerImages.length})
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {customerImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#B8860B]/20">
                          <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => setCustomerImages(customerImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateAI}
              disabled={customerImages.length === 0 || !selectedRoom || isGenerating}
              className="w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white py-6 text-lg disabled:opacity-50"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating AI Preview...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Visualization
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Preview */}
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Generated Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div>
                    <p className="text-sm font-medium text-[#6B6B6B] mb-3">Original Image</p>
                    <div className="aspect-video rounded-lg overflow-hidden border-2 border-[#B8860B]/20">
                      <img src={customerImages[0]} alt="Original" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* AI Generated */}
                  <div>
                    <p className="text-sm font-medium text-[#6B6B6B] mb-3">With {product.name}</p>
                    <div className="aspect-video rounded-lg overflow-hidden border-2 border-[#B8860B] shadow-lg relative">
                      <img src={aiGeneratedImage} alt="AI Generated" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Info Overlay */}
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[#FFF8F0] to-white border border-[#B8860B]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6B6B6B]">Visualizing:</p>
                      <p className="font-semibold text-[#1A1A1A]">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#6B6B6B]">Room:</p>
                      <p className="font-semibold text-[#1A1A1A] capitalize">{selectedRoom.replace('-', ' ')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decision Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={handleReject}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 py-6 text-lg"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                Reject & Try Again
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-6 text-lg"
                size="lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Approve & Continue
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};