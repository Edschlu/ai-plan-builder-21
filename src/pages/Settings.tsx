import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const [settings, setSettings] = useState({
    company_name: '',
    starting_cash: '0',
    currency: 'USD',
    runway_alert_threshold: 3,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings({
          company_name: data.company_name || '',
          starting_cash: String(data.starting_cash || '0'),
          currency: data.currency || 'USD',
          runway_alert_threshold: data.runway_alert_threshold || 3,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          company_name: settings.company_name,
          starting_cash: parseFloat(settings.starting_cash),
          currency: settings.currency,
          runway_alert_threshold: settings.runway_alert_threshold,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Configure your company and cashflow preferences
            </p>
          </div>

          <Card className="p-6 shadow-card space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Your Company Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starting_cash">Starting Cash Balance ($)</Label>
              <Input
                id="starting_cash"
                type="number"
                value={settings.starting_cash}
                onChange={(e) => setSettings({ ...settings, starting_cash: e.target.value })}
                placeholder="100000"
              />
              <p className="text-sm text-muted-foreground">
                Your current cash position at the start of forecasting
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="USD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Runway Alert Threshold (months)</Label>
              <Input
                id="threshold"
                type="number"
                value={settings.runway_alert_threshold}
                onChange={(e) => setSettings({ ...settings, runway_alert_threshold: parseInt(e.target.value) })}
                placeholder="3"
              />
              <p className="text-sm text-muted-foreground">
                Show alerts when runway falls below this number
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full gap-2 bg-gradient-primary"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
