import { Link } from "react-router-dom";
import { Sparkles, ImagePlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold font-heading text-foreground leading-tight">
                Turn Your Closet Into a{" "}
                <span className="text-primary">Boutique</span>
              </h1>
              <p className="text-xl text-foreground-secondary leading-relaxed">
                Professional photos and perfect listings for your Vinted shop. No experience needed—just upload and let AI handle the rest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/enhance">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground transition-all hover:scale-105 shadow-medium"
                  >
                    <ImagePlus className="w-5 h-5" />
                    Enhance Photo
                  </Button>
                </Link>
                <Link to="/listing">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="gap-2 border-border hover:bg-secondary transition-all hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    Generate Listing
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-medium">
                <img 
                  src={heroImage} 
                  alt="Fashion items showcase" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-heading text-foreground mb-4">
              Everything You Need to Sell Better
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Professional tools designed for fashion resellers who want to stand out
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 bg-card shadow-soft hover:shadow-medium transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <ImagePlus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-foreground mb-3">
                Photo Enhancement
              </h3>
              <p className="text-foreground-secondary">
                Transform your quick snaps into professional product photos with perfect lighting and clarity.
              </p>
            </Card>

            <Card className="p-8 bg-card shadow-soft hover:shadow-medium transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-foreground mb-3">
                AI-Powered Listings
              </h3>
              <p className="text-foreground-secondary">
                Generate compelling titles and descriptions that attract buyers and increase your visibility.
              </p>
            </Card>

            <Card className="p-8 bg-card shadow-soft hover:shadow-medium transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold font-heading text-foreground mb-3">
                Ready to List
              </h3>
              <p className="text-foreground-secondary">
                Copy your optimized content directly to Vinted and watch your items sell faster than ever.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-primary to-accent p-12 lg:p-16 text-center shadow-medium">
            <h2 className="text-3xl lg:text-4xl font-bold font-heading text-primary-foreground mb-4">
              Your Item Deserves the Spotlight
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join sellers who are already transforming their Vinted success with professional-quality listings.
            </p>
            <Link to="/enhance">
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2 transition-all hover:scale-105 shadow-medium"
              >
                <Sparkles className="w-5 h-5" />
                Get Started Free
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
