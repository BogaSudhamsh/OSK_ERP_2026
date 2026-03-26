import React, { useState, useRef, useEffect } from 'react';
import { Upload, Wand2, Download, X, Sparkles, Loader2, Send, Info, Save, Home, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/app/components/ui/alert';

// Category Structure
const categoryStructure: Record<string, Array<{ label: string; value: string }>> = {
  'Exterior': [
    { label: 'Out wall', value: 'exterior-wall' },
    { label: 'Out pillars', value: 'exterior-pillars' },
    { label: 'Steps / Staircase', value: 'exterior-staircase' },
    { label: 'Boundary wall', value: 'boundary-wall' },
    { label: 'Compound wall', value: 'compound-wall' },
    { label: 'Gate design', value: 'gate-design' },
    { label: 'Porch / Sit-out area', value: 'porch-sitout' },
    { label: 'Parking area flooring', value: 'parking-flooring' },
    { label: 'Front Area', value: 'front-area' },
    { label: 'Front elevation', value: 'front-elevation' },
    { label: 'Leftside elevation', value: 'leftside-elevation' },
    { label: 'Rightside elevation', value: 'rightside-elevation' }
  ],
  'Exterior Flooring': [
    { label: 'Ramp flooring', value: 'ramp-flooring' },
    { label: 'Steps flooring', value: 'steps-flooring' },
    { label: 'Entrance flooring', value: 'entrance-flooring' },
    { label: 'Pathway Tiles', value: 'pathway-tiles' },
    { label: 'Sit-out / Veranda Flooring', value: 'sitout-veranda-flooring' }
  ],
  'Balcony Area': [
    { label: 'Balcony railing area', value: 'balcony-railing area' },
    { label: 'Balcony tiles', value: 'balcony-tiles' },
    { label: 'Balcony wall texture', value: 'balcony-wall-texture' }
  ],
  'Windows & Doors': [
    { label: 'Main door frame area', value: 'main-door-frame' },
    { label: 'Window frame wall', value: 'window-frame-wall' },
    { label: 'Window border tiles', value: 'window-border-tiles' },
    { label: 'Door Surround Wall', value: 'door-surround-wall' }
  ],
  'Garden / Landscaping': [
    { label: 'Planting area', value: 'garden-planting-area' },
    { label: 'Garden tiles', value: 'garden-tiles' },
    { label: 'Lawn space', value: 'lawn-space' },
    { label: 'Outdoor seating area', value: 'outdoor-seating-area' }
  ],
  'Rooms': [
    { label: 'Bed', value: 'bedroom-floor' },
    { label: 'Hall', value: 'living-room-floor' },
    { label: 'Kitchen', value: 'kitchen-floor' },
    { label: 'Bedroom Flooring', value: 'bedroom-flooring' },
    { label: 'Hall Flooring', value: 'hall-flooring' }
  ],
  'Interior': [
    { label: 'Inside steps', value: 'staircase' },
    { label: 'Kitchen flooring', value: 'kitchen-floor' },
    { label: 'Kitchen walls', value: 'kitchen-backsplash' },
    { label: 'Kitchen platform', value: 'countertop' },
    { label: 'Bathroom flooring', value: 'bathroom-floor' },
    { label: 'Bathroom wall', value: 'bathroom-wall' },
    { label: 'Pooja room', value: 'pooja-room' },
    { label: 'Balcony', value: 'balcony-floor' },
    { label: 'Entire Wall', value: 'entire-wall' },
    { label: 'Pillar', value: 'interior-pillar' }
  ],
  'Others': [
    { label: 'Countertop', value: 'countertop' },
    { label: 'Terrace Area', value: 'terrace-area' },
    { label: 'Side Passage Tiles', value: 'side-passage-tiles' }
  ]
};

// Material types - initial default values
const defaultMaterialTypes = [
  { value: 'ceramic-tiles', label: 'Ceramic Tiles' },
  { value: 'porcelain-tiles', label: 'Porcelain Tiles' },
  { value: 'vitrified-tiles', label: 'Vitrified Tiles' },
  { value: 'marble', label: 'Natural Marble' },
  { value: 'italian-marble', label: 'Italian Marble' },
  { value: 'granite', label: 'Granite' },
  { value: 'quartz', label: 'Quartz Stone' },
  { value: 'mosaic', label: 'Mosaic Tiles' },
  { value: 'stone-tiles', label: 'Natural Stone' },
  { value: 'wood-finish', label: 'Wood Finish Tiles' }
];

// Prompt templates for each combination
const promptTemplates: Record<string, Record<string, string>> = {
  'ceramic-tiles': {
    'living-room-floor': 'Using the provided construction image and material texture, seamlessly apply the ceramic tile pattern to the entire living room floor. Ensure photorealistic integration with proper perspective, lighting reflections, and grout lines. Maintain the room\'s existing lighting, furniture, and walls. The tiles should have a subtle glossy finish with natural light reflections.',
    'bedroom-floor': 'Apply the ceramic tile texture to the bedroom floor in the provided image. Match the perspective and lighting perfectly. Show realistic grout lines, subtle shine, and ensure the tiles follow the room\'s geometry. Keep all furniture and decor unchanged.',
    'kitchen-floor': 'Transform the kitchen floor with the provided ceramic tile texture. Apply realistic tile layout with proper grout spacing, light reflections from kitchen lighting, and ensure the pattern aligns with the room\'s perspective. Maintain all cabinets, appliances, and kitchen elements.',
    'bathroom-floor': 'Apply the ceramic tile material to the bathroom floor. Show realistic wet-look finish with subtle reflections, proper grout lines, and seamless integration with existing bathroom fixtures. Ensure the tile pattern follows the floor geometry.',
    'bathroom-wall': 'Apply the ceramic tiles to the bathroom walls in the provided image. Create a photorealistic installation with proper grout lines, subtle glossy reflections from bathroom lighting, and ensure tiles align with architectural features like windows and fixtures.',
    'kitchen-backsplash': 'Transform the kitchen backsplash area with the provided ceramic tile texture. Show professional installation with perfect alignment, grout lines, and realistic reflections from kitchen lighting. Integrate seamlessly with countertops and cabinets.',
  },
  // Add more material types and combinations as needed
};

export const TextureApplyGenerator: React.FC = () => {
  const { currentUser } = useApp();
  const [constructionImage, setConstructionImage] = useState<string | null>(null);
  const [textureImage, setTextureImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Array<{ construction: string; texture: string; result: string; prompt: string; timestamp: string }>>([]);

  // New state for category-based selection
  const [category, setCategory] = useState('Exterior');
  const [materialType, setMaterialType] = useState('');
  const [applicationArea, setApplicationArea] = useState('');

  // Material types management
  const [materialTypes, setMaterialTypes] = useState(() => {
    const saved = localStorage.getItem('customMaterialTypes');
    return saved ? JSON.parse(saved) : defaultMaterialTypes;
  });
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false);
  const [newMaterialLabel, setNewMaterialLabel] = useState('');
  const [newMaterialValue, setNewMaterialValue] = useState('');

  // WhatsApp and save states
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLeadForSave, setSelectedLeadForSave] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

  // Image data
  const [constructionImageData, setConstructionImageData] = useState<string | null>(null);
  const [materialImageData, setMaterialImageData] = useState<string | null>(null);
  const [constructionImageMime, setConstructionImageMime] = useState('image/jpeg');
  const [materialImageMime, setMaterialImageMime] = useState('image/jpeg');
  const [currentResultData, setCurrentResultData] = useState<string | null>(null);

  const constructionInputRef = useRef<HTMLInputElement>(null);
  const textureInputRef = useRef<HTMLInputElement>(null);

  // Update application options when category changes
  useEffect(() => {
    const options = categoryStructure[category] || [];
    if (options.length > 0) {
      setApplicationArea(options[0].value);
    } else {
      setApplicationArea('');
    }
  }, [category]);

  // Save material types to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customMaterialTypes', JSON.stringify(materialTypes));
  }, [materialTypes]);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'construction' | 'material'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should not exceed 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      if (imageType === 'construction') {
        setConstructionImage(result);
        setConstructionImageData(base64Data);
        setConstructionImageMime(mimeType);
      } else {
        setTextureImage(result);
        setMaterialImageData(base64Data);
        setMaterialImageMime(mimeType);
      }

      toast.success(`${imageType === 'construction' ? 'Construction' : 'Material'} image uploaded successfully`);
    };
    reader.readAsDataURL(file);
  };

  const generatePrompt = (): string | null => {
    if (!materialType || !applicationArea) {
      return null;
    }

    // Get the application area label
    const allAreas = Object.values(categoryStructure).flat();
    const areaLabel = allAreas.find(a => a.value === applicationArea)?.label || applicationArea;

    // Try to match with pre-defined prompt, else use generic fallback
    const specificPrompt = promptTemplates[materialType]?.[applicationArea];

    if (specificPrompt) {
      return specificPrompt;
    }

    // Fallback generic prompt
    return `Apply the provided material texture to the ${areaLabel} in the construction image. Create a photorealistic visualization with proper lighting, perspective, and material properties tailored for ${areaLabel}.`;
  };

  const generateTexturedImage = async () => {
    // Validation
    if (!constructionImageData) {
      toast.error('Please upload a construction space image');
      return;
    }

    if (!materialImageData) {
      toast.error('Please upload a material texture image');
      return;
    }

    if (!materialType || !applicationArea) {
      toast.error('Please select both material type and application area');
      return;
    }

    const prompt = generatePrompt();
    if (!prompt) {
      toast.error('Could not generate prompt for selected combination');
      return;
    }

    setIsGenerating(true);

    try {
      // Route Gemini requests through server-side proxy to avoid exposing API keys in the browser.
      const response = await fetch('/api/gemini/generate-texture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: constructionImageMime,
                  data: constructionImageData
                }
              },
              {
                inline_data: {
                  mime_type: materialImageMime,
                  data: materialImageData
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract image data from response
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;

        let imageData: string | null = null;
        let mimeType = 'image/png';

        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }

        if (!imageData) {
          throw new Error('No image data found in the response. The model might have returned text instead.');
        }

        const generatedImageUrl = `data:${mimeType};base64,${imageData}`;
        setGeneratedImage(generatedImageUrl);
        setCurrentResultData(imageData);

        // Set the generated image as the new construction image for the next iteration
        setConstructionImage(generatedImageUrl);
        setConstructionImageData(imageData);
        setConstructionImageMime(mimeType);

        // Reset material selection for the next iteration
        setTextureImage(null);
        setMaterialImageData(null);
        setMaterialImageMime('image/jpeg');
        if (textureInputRef.current) {
          textureInputRef.current.value = '';
        }

        // Add to history
        setHistory(prev => [{
          construction: constructionImage || '',
          texture: textureImage || '',
          result: generatedImageUrl,
          prompt: prompt,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 4)]); // Keep last 5 items

        toast.success('Material visualization generated successfully!');
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error generating visualization:', error);
      toast.error(`Failed to generate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!currentResultData) {
      toast.error('No image to download');
      return;
    }

    const filename = `${materialType}-${applicationArea}-${Date.now()}.png`;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${currentResultData}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Image downloaded successfully');
  };

  const resetAll = () => {
    setConstructionImage(null);
    setTextureImage(null);
    setConstructionImageData(null);
    setMaterialImageData(null);
    setGeneratedImage(null);
    setCurrentResultData(null);
    setMaterialType('');
    setCategory('Exterior');
    if (constructionInputRef.current) constructionInputRef.current.value = '';
    if (textureInputRef.current) textureInputRef.current.value = '';
  };

  const handleAddMaterial = () => {
    if (!newMaterialLabel.trim() || !newMaterialValue.trim()) {
      toast.error('Please enter both material name and value');
      return;
    }

    const valueSlug = newMaterialValue.toLowerCase().replace(/\s+/g, '-');
    const exists = materialTypes.some((m: { value: string; label: string }) => m.value === valueSlug);

    if (exists) {
      toast.error('This material already exists');
      return;
    }

    setMaterialTypes([...materialTypes, { value: valueSlug, label: newMaterialLabel }]);
    setNewMaterialLabel('');
    setNewMaterialValue('');
    setShowAddMaterialDialog(false);

    toast.success('Material added successfully');
  };

  const handleDeleteMaterial = (valueToDelete: string) => {
    if (materialTypes.length <= 1) {
      toast.error('Cannot delete the last material type');
      return;
    }

    setMaterialTypes(materialTypes.filter((m: { value: string; label: string }) => m.value !== valueToDelete));

    if (materialType === valueToDelete) {
      setMaterialType('');
    }

    toast.success('Material deleted successfully');
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <div className="p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] shadow-xl flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] bg-clip-text text-transparent truncate">
                AI Material Visualizer
              </h2>
              <p className="text-[#6B6B6B] mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base truncate">
                Transform your construction spaces with AI-powered material visualization
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Banner */}
      <Alert className="border-l-4 border-[#B8860B] bg-[#FFF8F0]/50">
        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8860B] flex-shrink-0" />
        <AlertTitle className="text-[#2C2C2C] font-semibold text-xs sm:text-sm lg:text-base">
          How It Works
        </AlertTitle>
        <AlertDescription className="text-[#6B6B6B] mt-1 text-[10px] sm:text-xs lg:text-sm">
          Upload your construction space image and select a material texture. Our AI will intelligently apply the material to your space, creating photorealistic visualizations for tiles, marbles, granites, and ceramics in seconds.
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Construction Image */}
        <Card
          onClick={() => constructionInputRef.current?.click()}
          className={`border-2 p-3 sm:p-4 lg:p-6 cursor-pointer transition-all hover:shadow-lg ${constructionImage ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-[#B8860B]'}`}
        >
          <input
            ref={constructionInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'construction')}
            className="hidden"
            aria-label="Upload construction space image"
          />
          <div className="text-center">
            <div className="mb-2 sm:mb-3 lg:mb-4">
              <div className="inline-flex p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-[#B8860B]/10">
                <Home className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#B8860B]" />
              </div>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-[#2C2C2C] mb-1 sm:mb-2">
              Construction Space
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mb-2 sm:mb-3 lg:mb-4">
              Upload interior/exterior image
            </p>
            {constructionImage ? (
              <div className="relative">
                <img src={constructionImage} alt="Construction" className="w-full h-32 sm:h-40 lg:h-48 xl:h-56 object-cover rounded-lg border-2 border-gray-200" />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setConstructionImage(null);
                    setConstructionImageData(null);
                    if (constructionInputRef.current) constructionInputRef.current.value = '';
                  }}
                  className="absolute top-1.5 sm:top-2 lg:top-3 right-1.5 sm:right-2 lg:right-3 h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-2 sm:mb-3" />
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Click to upload or drag and drop
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Material Texture */}
        <Card
          onClick={() => textureInputRef.current?.click()}
          className={`border-2 p-3 sm:p-4 lg:p-6 cursor-pointer transition-all hover:shadow-lg ${textureImage ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-[#DAA520]'}`}
        >
          <input
            ref={textureInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'material')}
            className="hidden"
            aria-label="Upload material texture image"
          />
          <div className="text-center">
            <div className="mb-2 sm:mb-3 lg:mb-4">
              <div className="inline-flex p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-[#DAA520]/10">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#DAA520]" />
              </div>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-[#2C2C2C] mb-1 sm:mb-2">
              Material Texture
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mb-2 sm:mb-3 lg:mb-4">
              Upload material sample image
            </p>
            {textureImage ? (
              <div className="relative">
                <img src={textureImage} alt="Material" className="w-full h-32 sm:h-40 lg:h-48 xl:h-56 object-cover rounded-lg border-2 border-gray-200" />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setTextureImage(null);
                    setMaterialImageData(null);
                    if (textureInputRef.current) textureInputRef.current.value = '';
                  }}
                  className="absolute top-1.5 sm:top-2 lg:top-3 right-1.5 sm:right-2 lg:right-3 h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-2 sm:mb-3" />
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Click to upload or drag and drop
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Selection Grid */}
      <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div>
            <Label className="text-xs sm:text-sm font-medium text-[#2C2C2C] mb-1.5 sm:mb-2 block">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm bg-[#FFF8F0] border-[#B8860B]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(categoryStructure).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs sm:text-sm">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <Label className="text-xs sm:text-sm font-medium text-[#2C2C2C]">
                Material Type
              </Label>
              <div className="flex gap-1 sm:gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddMaterialDialog(true)}
                  className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>
            <Select value={materialType} onValueChange={setMaterialType}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm bg-[#FFF8F0] border-[#B8860B]/20">
                <SelectValue placeholder="Select material..." />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((mat: { value: string; label: string }) => (
                  <SelectItem key={mat.value} value={mat.value} className="text-xs sm:text-sm">
                    {mat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {materialType && (
              <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-[#6B6B6B]">
                <span className="truncate">{materialTypes.find((m: { value: string; label: string }) => m.value === materialType)?.label}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteMaterial(materialType)}
                  className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs sm:text-sm font-medium text-[#2C2C2C] mb-1.5 sm:mb-2 block">
              Application Area
            </Label>
            <Select value={applicationArea} onValueChange={setApplicationArea}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm bg-[#FFF8F0] border-[#B8860B]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(categoryStructure[category] || []).map((area) => (
                  <SelectItem key={area.value} value={area.value} className="text-xs sm:text-sm">{area.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Generate and Reset Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={generateTexturedImage}
          disabled={!constructionImageData || !materialImageData || !materialType || !applicationArea || isGenerating}
          className="flex-1 h-11 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg font-semibold bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] shadow-lg hover:shadow-xl transition-all text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
              <span className="truncate">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="truncate">Generate Visualization</span>
            </>
          )}
        </Button>
        <Button
          onClick={resetAll}
          disabled={isGenerating}
          variant="outline"
          className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-4 sm:px-6 text-sm sm:text-base font-medium"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg p-4 sm:p-6 lg:p-8 text-center">
          <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 animate-spin text-[#B8860B] mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base lg:text-lg font-semibold text-[#2C2C2C]">
            Applying material to your space...
          </p>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 sm:mt-2">
            This may take 20-40 seconds for photorealistic results
          </p>
        </Card>
      )}

      {/* Result */}
      {generatedImage && !isGenerating && (
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#2C2C2C] mb-2 sm:mb-3 lg:mb-4">
            Generated Visualization
          </h3>
          <div className="rounded-lg overflow-hidden border-2 border-gray-200 mb-3 sm:mb-4 lg:mb-6">
            <img src={generatedImage} alt="Generated" className="w-full" />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            <Button onClick={downloadImage} className="bg-[#B8860B] hover:bg-[#DAA520] h-9 sm:h-10 lg:h-11 px-3 sm:px-4 lg:px-6 text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span>Download</span>
            </Button>
            <Button onClick={generateTexturedImage} className="bg-gray-600 hover:bg-gray-700 h-9 sm:h-10 lg:h-11 px-3 sm:px-4 lg:px-6 text-xs sm:text-sm col-span-2 sm:col-span-1">
              <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span>Regenerate</span>
            </Button>
          </div>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg p-3 sm:p-4 lg:p-6">
          <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-[#2C2C2C] mb-2 sm:mb-3 lg:mb-4">
            Recent Generations
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="cursor-pointer group"
                onClick={() => {
                  setConstructionImage(item.construction);
                  setTextureImage(item.texture);
                  setGeneratedImage(item.result);
                }}
              >
                <img
                  src={item.result}
                  alt={`History ${idx + 1}`}
                  className="w-full h-20 sm:h-24 lg:h-28 xl:h-32 object-cover rounded-lg border-2 border-gray-300 group-hover:border-[#B8860B] transition-all shadow-sm hover:shadow-md"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Material Dialog */}
      <Dialog open={showAddMaterialDialog} onOpenChange={setShowAddMaterialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#B8860B]" />
              Add New Material Type
            </DialogTitle>
            <DialogDescription>
              Add a custom material type to your visualization options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Material Name</Label>
              <Input
                value={newMaterialLabel}
                onChange={(e) => setNewMaterialLabel(e.target.value)}
                placeholder="e.g., Limestone Tiles"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Material Value (unique identifier)</Label>
              <Input
                value={newMaterialValue}
                onChange={(e) => setNewMaterialValue(e.target.value)}
                placeholder="e.g., limestone-tiles"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase letters and hyphens only
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddMaterial}
                className="flex-1 bg-[#B8860B] hover:bg-[#DAA520]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
              <Button
                onClick={() => {
                  setShowAddMaterialDialog(false);
                  setNewMaterialLabel('');
                  setNewMaterialValue('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
