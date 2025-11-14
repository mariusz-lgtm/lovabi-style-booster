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
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex min-w-full md:grid md:grid-cols-6 w-full">
                <TabsTrigger value="profile" className="flex-shrink-0 min-w-[100px] md:min-w-0">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="flex-shrink-0 min-w-[100px] md:min-w-0">
                  Security
                </TabsTrigger>
                <TabsTrigger value="plan" className="flex-shrink-0 min-w-[100px] md:min-w-0">
                  Plan
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex-shrink-0 min-w-[120px] md:min-w-0">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="cookies" className="flex-shrink-0 min-w-[100px] md:min-w-0">
                  Cookies
                </TabsTrigger>
                <TabsTrigger value="account" className="flex-shrink-0 min-w-[100px] md:min-w-0">
                  Account
                </TabsTrigger>
              </TabsList>
            </div>

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
