import { useState, useEffect } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { CameraPreviewDialog } from "@/components/photo/CameraPreviewDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomModelCreatorProps {
  onSave: (name: string, photos: string[], description: {
    gender: 'female' | 'male';
    age: number;
    bodyType: string;
    heightCm: number;
    skinTone: string;
    hairDescription: string;
    additionalNotes: string;
  }) => void;
  onCancel: () => void;
}

const FEMALE_BODY_TYPES = ['petite', 'slim', 'athletic', 'curvy', 'plus-size'];
const MALE_BODY_TYPES = ['slim', 'athletic', 'muscular', 'average', 'large'];

const CustomModelCreator = ({ onSave, onCancel }: CustomModelCreatorProps) => {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);

  // Physical description state
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [age, setAge] = useState(25);
  const [bodyType, setBodyType] = useState<string>('slim');
  const [heightCm, setHeightCm] = useState(165);
  const [skinTone, setSkinTone] = useState<'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'brown' | 'dark'>('medium');
  const [hairDescription, setHairDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const bodyTypes = gender === 'female' ? FEMALE_BODY_TYPES : MALE_BODY_TYPES;

  // Update height default when gender changes
  useEffect(() => {
    if (gender === 'female') {
      setHeightCm(165);
    } else {
      setHeightCm(180);
    }
    // Reset body type to first option when gender changes
    setBodyType(bodyTypes[0]);
  }, [gender]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.75
    };

    try {
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to compress image');
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    setIsCompressing(true);

    try {
      const newPhotos = await Promise.all(
        files.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            return null;
          }

          try {
            const compressedFile = await compressImage(file);
            
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(compressedFile);
            });
          } catch (error) {
            console.error('Error processing file:', error);
            return null;
          }
        })
      );

      const validPhotos = newPhotos.filter((photo): photo is string => photo !== null);
      
      if (validPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...validPhotos]);
        toast.success(`${validPhotos.length} photo${validPhotos.length !== 1 ? 's' : ''} added successfully`);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const availableSlots = 3 - photos.length;
    if (availableSlots === 0) {
      toast.error('You already have 3 photos');
      e.target.value = '';
      return;
    }

    setIsCompressing(true);
    try {
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCameraPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing camera photo:', error);
      toast.error('Failed to process photo');
    } finally {
      setIsCompressing(false);
    }
    
    e.target.value = '';
  };

  const handleAcceptPhoto = () => {
    if (cameraPreview) {
      setPhotos((prev) => [...prev, cameraPreview]);
      setCameraPreview(null);
      toast.success('Photo added successfully');
    }
  };

  const handleRetake = () => {
    setCameraPreview(null);
    setTimeout(() => {
      document.getElementById('camera-input')?.click();
    }, 100);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a model name");
      return;
    }
    if (photos.length < 3) {
      toast.error("Please upload at least 3 photos");
      return;
    }
    
    setIsGeneratingPortrait(true);
    onSave(name, photos, {
      gender,
      age,
      bodyType,
      heightCm,
      skinTone,
      hairDescription,
      additionalNotes
    });
  };

  return (
    <Card className="p-6 bg-card">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
        Create Custom Model
      </h2>

      <div className="space-y-6">
        {/* Gender Selection */}
        <div>
          <Label className="text-foreground mb-2">Gender</Label>
          <Tabs value={gender} onValueChange={(val) => setGender(val as 'female' | 'male')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="female">Female</TabsTrigger>
              <TabsTrigger value="male">Male</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Name Input */}
        <div>
          <Label htmlFor="model-name" className="text-foreground mb-2">
            Model Name
          </Label>
          <Input
            id="model-name"
            placeholder="e.g., My Model"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background border-border"
          />
        </div>

        {/* Physical Description Section */}
        <Card className="p-4 bg-secondary/30 border-border">
          <h3 className="font-heading font-semibold text-foreground mb-4">
            Physical Description
          </h3>
          
          {/* Age Slider */}
          <div className="mb-4">
            <Label className="text-foreground mb-2">Age: {age} years</Label>
            <Slider
              value={[age]}
              onValueChange={(v) => setAge(v[0])}
              min={18}
              max={65}
              step={1}
              className="mt-2"
            />
          </div>
          
          {/* Body Type Dropdown */}
          <div className="mb-4">
            <Label className="text-foreground mb-2">Body Type</Label>
            <Select value={bodyType} onValueChange={(value) => setBodyType(value)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Height Slider */}
          <div className="mb-4">
            <Label className="text-foreground mb-2">Height: {heightCm} cm</Label>
            <Slider
              value={[heightCm]}
              onValueChange={(v) => setHeightCm(v[0])}
              min={gender === 'female' ? 150 : 160}
              max={gender === 'female' ? 190 : 210}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {gender === 'female' ? '150-190 cm' : '160-210 cm'}
            </p>
          </div>
          
          {/* Skin Tone Dropdown */}
          <div className="mb-4">
            <Label className="text-foreground mb-2">Skin Tone</Label>
            <Select value={skinTone} onValueChange={(value) => setSkinTone(value as typeof skinTone)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="olive">Olive</SelectItem>
                <SelectItem value="tan">Tan</SelectItem>
                <SelectItem value="brown">Brown</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Hair Description Input */}
          <div className="mb-4">
            <Label htmlFor="hair-description" className="text-foreground mb-2">Hair Description</Label>
            <Input
              id="hair-description"
              placeholder="e.g., Long brown wavy hair"
              value={hairDescription}
              onChange={(e) => setHairDescription(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          
          {/* Additional Notes Textarea */}
          <div>
            <Label htmlFor="additional-notes" className="text-foreground mb-2">Additional Notes (Optional)</Label>
            <Textarea
              id="additional-notes"
              placeholder="Any other distinctive features or characteristics..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="bg-background border-border resize-none"
            />
          </div>
        </Card>

        {/* Photo Upload */}
        <div>
          <Label className="text-foreground mb-2">
            Photos (minimum 3 required)
          </Label>
          
          {photos.length < 3 && (
            <Card
              className={`border-2 border-dashed transition-all duration-200 mb-4 ${
                isDragging
                  ? "border-primary bg-secondary/50"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-8">
                <input
                  id="file-input-multi"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground mb-3">
                      Upload or capture photos
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-input-multi')?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Browse
                      </Button>
                      
                      {isMobile && (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => document.getElementById('camera-input')?.click()}
                          disabled={photos.length >= 3 || isCompressing}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-foreground-secondary mt-3">
                      {3 - photos.length} more photo{3 - photos.length !== 1 ? "s" : ""} needed
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {cameraPreview && (
            <CameraPreviewDialog
              imagePreview={cameraPreview}
              onAccept={handleAcceptPhoto}
              onRetake={handleRetake}
            />
          )}

          {/* Photo Preview Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!name.trim() || photos.length < 3 || isCompressing || isGeneratingPortrait}
          >
            {isGeneratingPortrait 
              ? 'Generating AI portrait...' 
              : isCompressing 
              ? 'Compressing images...' 
              : 'Create Model'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-border hover:bg-secondary"
            disabled={isGeneratingPortrait}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CustomModelCreator;