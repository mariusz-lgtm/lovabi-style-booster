import { useState } from "react";
import { Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const ListingGenerator = () => {
  const [formData, setFormData] = useState({
    brand: "",
    size: "",
    color: "",
    condition: "",
    style: "",
  });
  const [generatedListing, setGeneratedListing] = useState<{ title: string; description: string } | null>(null);

  const handleGenerate = () => {
    // Mock generation - will be replaced with AI
    const mockTitle = `${formData.brand} ${formData.style} in ${formData.color} - Size ${formData.size}`;
    const mockDescription = `Beautiful ${formData.brand} ${formData.style} in ${formData.color}. Size ${formData.size}. Condition: ${formData.condition}. Perfect for your wardrobe!`;
    
    setGeneratedListing({
      title: mockTitle,
      description: mockDescription,
    });
    
    toast.success("Listing generated! AI integration coming in the next version.");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Generate Your Listing
            </h1>
            <p className="text-lg text-foreground-secondary">
              Tell us about your item and we'll create the perfect description
            </p>
          </div>

          <Card className="p-8 bg-card shadow-medium mb-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Zara, H&M"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="bg-background border-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Black, Navy"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="bg-background border-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New with tags</SelectItem>
                      <SelectItem value="like-new">Like new</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style/Category</Label>
                <Input
                  id="style"
                  placeholder="e.g., Summer dress, Denim jacket"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="bg-background border-input"
                />
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full gap-2 bg-primary hover:bg-primary-hover text-primary-foreground transition-all hover:scale-105"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                Generate Listing
              </Button>
            </div>
          </Card>

          {generatedListing && (
            <Card className="p-8 bg-card shadow-medium space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold font-heading text-foreground">Title</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedListing.title)}
                    className="gap-2 hover:bg-secondary"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-foreground bg-secondary p-4 rounded-lg">{generatedListing.title}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold font-heading text-foreground">Description</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedListing.description)}
                    className="gap-2 hover:bg-secondary"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-foreground bg-secondary p-4 rounded-lg">{generatedListing.description}</p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListingGenerator;
