import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const PlanSection = () => {
  const currentPlan = 'Free';
  const features = [
    'Photo enhancement',
    'Virtual try-on with predefined models',
    'Up to 3 custom models',
    'Basic listing generator',
    'Generation history'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Plan</CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
            <p className="text-2xl font-bold text-primary mt-1">{currentPlan}</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Active
          </Badge>
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Included features:</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-foreground-secondary">
                <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4">
          <Button disabled className="w-full sm:w-auto">
            Upgrade Plan (Coming Soon)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Premium plans with unlimited generations will be available soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanSection;
