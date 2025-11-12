import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

export const CookieSettingsSection = () => {
  const { preferences, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setAnalytics(preferences.analytics);
      setMarketing(preferences.marketing);
    }
  }, [preferences]);

  const handleSave = () => {
    setIsSaving(true);
    savePreferences({ analytics, marketing });
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Preferencje cookies zostały zaktualizowane");
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preferencje Cookies</h3>
        <p className="text-sm text-muted-foreground">
          Zarządzaj swoimi preferencjami dotyczącymi plików cookies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Niezbędne</CardTitle>
          <CardDescription>
            Wymagane do działania aplikacji (sesja, autentykacja, bezpieczeństwo)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <Badge variant="secondary">Zawsze aktywne</Badge>
          <Switch checked disabled />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analityczne</CardTitle>
          <CardDescription>
            Pomagają zrozumieć jak używasz aplikacji, aby poprawić doświadczenie użytkownika i optymalizować funkcjonalności
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <Badge variant={analytics ? "default" : "secondary"}>
            {analytics ? "Włączone" : "Wyłączone"}
          </Badge>
          <Switch checked={analytics} onCheckedChange={setAnalytics} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketingowe</CardTitle>
          <CardDescription>
            Umożliwiają personalizację reklam i remarketing na podstawie Twoich preferencji oraz zachowań
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <Badge variant={marketing ? "default" : "secondary"}>
            {marketing ? "Włączone" : "Wyłączone"}
          </Badge>
          <Switch checked={marketing} onCheckedChange={setMarketing} />
        </CardContent>
      </Card>

      {preferences && (
        <div className="text-sm text-muted-foreground">
          Ostatnia aktualizacja: {new Date(preferences.timestamp).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Zapisywanie..." : "Zapisz preferencje"}
      </Button>
    </div>
  );
};
