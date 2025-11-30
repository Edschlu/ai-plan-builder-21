import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    businessModel: "",
    targetMarket: "",
    productDescription: "",
    revenueModel: "",
    initialInvestment: "",
    monthlyBurn: "",
    teamSize: "",
    launchDate: "",
    competitorAnalysis: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-financial-model', {
        body: formData
      });

      if (error) throw error;

      // Store the generated model in localStorage for now
      localStorage.setItem('financialModel', JSON.stringify(data));
      
      toast.success("Financial model generated successfully!");
      navigate("/");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to generate financial model. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Let's Build Your Business Plan</h1>
            <p className="text-lg text-muted-foreground">
              Answer a few questions and we'll generate a comprehensive financial model for your startup
            </p>
          </div>

          <Card className="p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessModel">Business Model</Label>
                <Select
                  value={formData.businessModel}
                  onValueChange={(value) => updateField('businessModel', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="hardware">Hardware/D2C</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetMarket">Target Market</Label>
                <Input
                  id="targetMarket"
                  placeholder="B2B SaaS companies with 10-100 employees"
                  value={formData.targetMarket}
                  onChange={(e) => updateField('targetMarket', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Product/Service Description</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Describe your product or service in detail..."
                  value={formData.productDescription}
                  onChange={(e) => updateField('productDescription', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenueModel">Revenue Model</Label>
                <Input
                  id="revenueModel"
                  placeholder="Monthly subscription at $99/user"
                  value={formData.revenueModel}
                  onChange={(e) => updateField('revenueModel', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                  <Input
                    id="initialInvestment"
                    type="number"
                    placeholder="100000"
                    value={formData.initialInvestment}
                    onChange={(e) => updateField('initialInvestment', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyBurn">Expected Monthly Burn ($)</Label>
                  <Input
                    id="monthlyBurn"
                    type="number"
                    placeholder="15000"
                    value={formData.monthlyBurn}
                    onChange={(e) => updateField('monthlyBurn', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Current Team Size</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    placeholder="3"
                    value={formData.teamSize}
                    onChange={(e) => updateField('teamSize', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="launchDate">Expected Launch Date</Label>
                  <Input
                    id="launchDate"
                    type="month"
                    value={formData.launchDate}
                    onChange={(e) => updateField('launchDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitorAnalysis">Competitor Analysis (Optional)</Label>
                <Textarea
                  id="competitorAnalysis"
                  placeholder="List main competitors and your differentiators..."
                  value={formData.competitorAnalysis}
                  onChange={(e) => updateField('competitorAnalysis', e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  "Generating Your Plan..."
                ) : (
                  <>
                    Generate Financial Model
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
