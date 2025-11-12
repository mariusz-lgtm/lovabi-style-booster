import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Polityka Prywatności</h1>
          <p className="text-muted-foreground">
            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Wprowadzenie</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                Lovabi ("my", "nas", "nasz") szanuje Twoją prywatność i zobowiązuje się do ochrony Twoich danych osobowych. 
                Niniejsza polityka prywatności wyjaśnia, jak gromadzimy, wykorzystujemy i chronimy Twoje informacje podczas 
                korzystania z naszej aplikacji.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Jakie dane zbieramy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Dane konta:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Imię i nazwisko</li>
                  <li>Adres email</li>
                  <li>Hasło (zaszyfrowane)</li>
                  <li>Avatar (opcjonalnie)</li>
                  <li>Kraj (opcjonalnie)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dane użytkowania:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Przesłane zdjęcia i wygenerowane obrazy</li>
                  <li>Niestandardowe modele i ich zdjęcia</li>
                  <li>Historia generacji obrazów</li>
                  <li>Transakcje kredytowe</li>
                  <li>Preferencje ustawień</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dane techniczne:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Adres IP</li>
                  <li>Typ przeglądarki i urządzenia</li>
                  <li>Znaczniki czasu działań</li>
                  <li>Pliki cookies (zgodnie z Twoimi preferencjami)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Jak używamy plików cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Niezbędne cookies (zawsze aktywne):</h4>
                <p className="text-muted-foreground mb-2">
                  Te pliki cookies są niezbędne do działania aplikacji i nie można ich wyłączyć:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Sesja użytkownika i autentykacja (Supabase Auth)</li>
                  <li>Preferencje cookies</li>
                  <li>Zabezpieczenia CSRF</li>
                  <li>Przechowywanie stanu aplikacji</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cookies analityczne (wymagają zgody):</h4>
                <p className="text-muted-foreground">
                  Pomagają nam zrozumieć, jak użytkownicy korzystają z aplikacji, aby poprawić doświadczenie użytkownika 
                  i zoptymalizować funkcjonalności. Te cookies są ustawiane tylko po Twojej zgodzie.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cookies marketingowe (wymagają zgody):</h4>
                <p className="text-muted-foreground">
                  Umożliwiają personalizację reklam i remarketing na podstawie Twoich preferencji i zachowań. 
                  Te cookies są ustawiane tylko po Twojej zgodzie.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Cel wykorzystania danych</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Świadczenie usług generowania i ulepszania zdjęć</li>
                <li>Zarządzanie Twoim kontem i preferencjami</li>
                <li>Przetwarzanie transakcji kredytowych</li>
                <li>Przechowywanie historii generacji i niestandardowych modeli</li>
                <li>Poprawa jakości usług i doświadczenia użytkownika</li>
                <li>Komunikacja z użytkownikami (powiadomienia, wsparcie)</li>
                <li>Zapewnienie bezpieczeństwa i ochrona przed nadużyciami</li>
                <li>Spełnienie wymogów prawnych</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Przechowywanie i bezpieczeństwo danych</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Twoje dane są przechowywane bezpiecznie na serwerach Supabase z następującymi środkami bezpieczeństwa:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Szyfrowanie połączeń SSL/TLS</li>
                <li>Zaszyfrowane przechowywanie haseł (bcrypt)</li>
                <li>Zabezpieczenia Row Level Security (RLS) w bazie danych</li>
                <li>Regularne kopie zapasowe</li>
                <li>Monitorowanie bezpieczeństwa</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Przechowujemy Twoje dane osobowe tak długo, jak długo masz aktywne konto lub jak jest to konieczne 
                do świadczenia usług. Możesz w każdej chwili usunąć swoje konto i wszystkie powiązane dane.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Twoje prawa (RODO)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Zgodnie z RODO masz następujące prawa:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Prawo dostępu:</strong> możesz uzyskać dostęp do swoich danych osobowych</li>
                <li><strong>Prawo do sprostowania:</strong> możesz poprawić swoje dane w sekcji Ustawienia</li>
                <li><strong>Prawo do usunięcia:</strong> możesz usunąć swoje konto i wszystkie dane</li>
                <li><strong>Prawo do ograniczenia przetwarzania:</strong> możesz ograniczyć wykorzystanie niektórych danych</li>
                <li><strong>Prawo do przenoszenia danych:</strong> możesz eksportować swoje dane</li>
                <li><strong>Prawo do wycofania zgody:</strong> możesz w każdej chwili zmienić preferencje cookies</li>
                <li><strong>Prawo do sprzeciwu:</strong> możesz sprzeciwić się przetwarzaniu Twoich danych w celach marketingowych</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Udostępnianie danych</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Nie sprzedajemy Twoich danych osobowych. Możemy udostępniać Twoje dane tylko w następujących przypadkach:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Dostawcom usług (Supabase, Lovable AI) - wyłącznie w celu świadczenia usług</li>
                <li>W przypadku wymogów prawnych lub ochrony praw</li>
                <li>Za Twoją wyraźną zgodą</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Zmiany w polityce prywatności</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Możemy okresowo aktualizować niniejszą politykę prywatności. O wszelkich istotnych zmianach 
                poinformujemy Cię przez email lub poprzez powiadomienie w aplikacji. Data ostatniej aktualizacji 
                jest zawsze widoczna na górze tej strony.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Kontakt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Jeśli masz pytania dotyczące tej polityki prywatności lub chcesz skorzystać ze swoich praw, 
                skontaktuj się z nami:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Email:</p>
                <a href="mailto:support@lovabi.com" className="text-primary hover:underline">
                  support@lovabi.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
