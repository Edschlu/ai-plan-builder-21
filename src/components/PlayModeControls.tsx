import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { 
  Play, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayModeControlsProps {
  scenario: 'base' | 'optimistic' | 'pessimistic';
  onScenarioChange: (scenario: 'base' | 'optimistic' | 'pessimistic') => void;
  revenueGrowth: number;
  onRevenueGrowthChange: (value: number) => void;
  costInflation: number;
  onCostInflationChange: (value: number) => void;
  churnRate?: number;
  onChurnRateChange?: (value: number) => void;
  cac?: number;
  onCacChange?: (value: number) => void;
  toggles: {
    marketing: boolean;
    headcount: boolean;
    investments: boolean;
  };
  onToggleChange: (key: 'marketing' | 'headcount' | 'investments', value: boolean) => void;
}

export default function PlayModeControls({
  scenario,
  onScenarioChange,
  revenueGrowth,
  onRevenueGrowthChange,
  costInflation,
  onCostInflationChange,
  churnRate,
  onChurnRateChange,
  cac,
  onCacChange,
  toggles,
  onToggleChange
}: PlayModeControlsProps) {
  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <Play className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Play Mode</h3>
        <Badge variant="secondary" className="ml-auto">Interactive</Badge>
      </div>

      <div className="space-y-6">
        {/* Scenario Buttons */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Scenario</Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={scenario === 'base' ? 'default' : 'outline'}
              onClick={() => onScenarioChange('base')}
              className={cn(
                "gap-2",
                scenario === 'base' && "bg-primary"
              )}
            >
              <Zap className="w-4 h-4" />
              Base
            </Button>
            <Button
              variant={scenario === 'optimistic' ? 'default' : 'outline'}
              onClick={() => onScenarioChange('optimistic')}
              className={cn(
                "gap-2",
                scenario === 'optimistic' && "bg-success hover:bg-success/90"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Best
            </Button>
            <Button
              variant={scenario === 'pessimistic' ? 'default' : 'outline'}
              onClick={() => onScenarioChange('pessimistic')}
              className={cn(
                "gap-2",
                scenario === 'pessimistic' && "bg-destructive hover:bg-destructive/90"
              )}
            >
              <TrendingDown className="w-4 h-4" />
              Worst
            </Button>
          </div>
        </div>

        {/* Growth Sliders */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Revenue Growth: {revenueGrowth}%
            </Label>
            <Slider
              value={[revenueGrowth]}
              onValueChange={([value]) => onRevenueGrowthChange(value)}
              min={-20}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              Cost Inflation: {costInflation}%
            </Label>
            <Slider
              value={[costInflation]}
              onValueChange={([value]) => onCostInflationChange(value)}
              min={-10}
              max={30}
              step={1}
              className="mt-2"
            />
          </div>

          {churnRate !== undefined && onChurnRateChange && (
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-warning" />
                Churn Rate: {churnRate}%
              </Label>
              <Slider
                value={[churnRate]}
                onValueChange={([value]) => onChurnRateChange(value)}
                min={0}
                max={20}
                step={0.5}
                className="mt-2"
              />
            </div>
          )}

          {cac !== undefined && onCacChange && (
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                CAC: ${cac}
              </Label>
              <Slider
                value={[cac]}
                onValueChange={([value]) => onCacChange(value)}
                min={0}
                max={2000}
                step={50}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Toggle Controls */}
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm font-medium block mb-3">Active Components</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing-toggle" className="text-sm cursor-pointer">
              Marketing Spend
            </Label>
            <Switch
              id="marketing-toggle"
              checked={toggles.marketing}
              onCheckedChange={(checked) => onToggleChange('marketing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="headcount-toggle" className="text-sm cursor-pointer">
              Headcount Growth
            </Label>
            <Switch
              id="headcount-toggle"
              checked={toggles.headcount}
              onCheckedChange={(checked) => onToggleChange('headcount', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="investments-toggle" className="text-sm cursor-pointer">
              Investments
            </Label>
            <Switch
              id="investments-toggle"
              checked={toggles.investments}
              onCheckedChange={(checked) => onToggleChange('investments', checked)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}