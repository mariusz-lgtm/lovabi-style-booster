import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, signUp, user, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/enhance');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Zalogowano pomyślnie!');
        navigate('/enhance');
      } else {
        // Walidacja potwierdzenia hasła
        if (password !== confirmPassword) {
          toast.error('Hasła nie są identyczne');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error('Hasło musi mieć co najmniej 6 znaków');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success('Konto utworzone pomyślnie!');
        navigate('/enhance');
      }
    } catch (error: any) {
      toast.error(error.message || 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error('Wprowadź poprawny adres email');
      return;
    }
    
    setResetLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) throw error;
      toast.success('Link do resetowania hasła został wysłany na email!');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się wysłać linku resetującego');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-foreground">
            {isLogin ? 'Zaloguj się' : 'Utwórz konto'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Wprowadź swoje dane aby się zalogować' 
              : 'Utwórz konto aby zapisywać swoje modele'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Imię i nazwisko</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Anna Kowalska"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!isLogin}
                  minLength={6}
                />
              </div>
            )}

            {isLogin && (
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm text-muted-foreground -mt-2"
                onClick={() => setShowForgotPassword(true)}
              >
                Zapomniałeś hasła?
              </Button>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Utwórz konto')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setConfirmPassword('');
                setPassword('');
                setEmail('');
                setFullName('');
              }}
            >
              {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset hasła</DialogTitle>
            <DialogDescription>
              Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="twoj@email.com"
              />
            </div>
            <Button onClick={handleResetPassword} disabled={resetLoading} className="w-full">
              {resetLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
