import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

export const CookieBanner = () => {
  const { showBanner, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!showBanner) return null;

  const handleSaveCustom = () => {
    savePreferences({ analytics, marketing });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-in-right">
      <Card className="max-w-4xl mx-auto p-6 shadow-lg bg-card/95 backdrop-blur-sm border-border">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Używamy plików cookies</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Używamy cookies aby zapewnić najlepsze doświadczenie na naszej stronie. Cookies niezbędne są zawsze aktywne, 
                ale możesz wybrać czy chcesz akceptować cookies analityczne i marketingowe.
              </p>
              <Link 
                to="/privacy-policy" 
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                Polityka Prywatności
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={acceptAll} className="flex-1">
              Akceptuj wszystkie
            </Button>
            <Button variant="outline" onClick={rejectAll} className="flex-1">
              Odrzuć opcjonalne
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex-1"
            >
              Dostosuj
            </Button>
          </div>

          {showCustomize && (
            <div className="mt-6 space-y-4 border-t border-border pt-4 animate-fade-in">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Niezbędne</p>
                    <p className="text-sm text-muted-foreground">
                      Wymagane do działania strony (sesja, bezpieczeństwo). Zawsze aktywne.
                    </p>
                  </div>
                  <Switch checked disabled className="mt-1" />
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Analityczne</p>
                    <p className="text-sm text-muted-foreground">
                      Pomagają zrozumieć jak używasz aplikacji aby poprawić doświadczenie użytkownika.
                    </p>
                  </div>
                  <Switch 
                    checked={analytics} 
                    onCheckedChange={setAnalytics}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Marketingowe</p>
                    <p className="text-sm text-muted-foreground">
                      Umożliwiają personalizację reklam i remarketing na podstawie Twoich preferencji.
                    </p>
                  </div>
                  <Switch 
                    checked={marketing} 
                    onCheckedChange={setMarketing}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={handleSaveCustom} className="w-full">
                Zapisz preferencje
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
