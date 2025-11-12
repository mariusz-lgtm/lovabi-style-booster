import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import ProfileSection from "@/components/settings/ProfileSection";
import SecuritySection from "@/components/settings/SecuritySection";
import AccountSection from "@/components/settings/AccountSection";
import PlanSection from "@/components/settings/PlanSection";
import CreditTransactionsSection from "@/components/settings/CreditTransactionsSection";
import { CookieSettingsSection } from "@/components/settings/CookieSettingsSection";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
            Settings
          </h1>
          <p className="text-foreground-secondary mb-8">
            Manage your account settings and preferences
          </p>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="plan">Plan</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="cookies">Cookies</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySection />
            </TabsContent>

            <TabsContent value="plan">
              <PlanSection />
            </TabsContent>

            <TabsContent value="transactions">
              <CreditTransactionsSection />
            </TabsContent>

            <TabsContent value="cookies">
              <CookieSettingsSection />
            </TabsContent>

            <TabsContent value="account">
              <AccountSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
