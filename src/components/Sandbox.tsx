import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

export default function Sandbox({ ideaId }: { ideaId: string }) {
  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-6">Experiment with Assumptions</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Monthly Growth Rate (%)</Label>
              <Badge variant="secondary">15%</Badge>
            </div>
            <Slider defaultValue={[15]} max={50} step={1} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Customer Acquisition Cost ($)</Label>
              <Badge variant="secondary">$50</Badge>
            </div>
            <Slider defaultValue={[50]} max={200} step={5} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Average Revenue Per User ($)</Label>
              <Badge variant="secondary">$99</Badge>
            </div>
            <Slider defaultValue={[99]} max={500} step={10} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Monthly Churn Rate (%)</Label>
              <Badge variant="secondary">5%</Badge>
            </div>
            <Slider defaultValue={[5]} max={20} step={1} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Starting Cash ($)</Label>
              <Badge variant="secondary">$100,000</Badge>
            </div>
            <Slider defaultValue={[100000]} max={500000} step={10000} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Adjust the sliders to see how different assumptions affect your financial model in real-time
        </p>
      </Card>

      <Card className="p-6 shadow-card bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">Projected Impact</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">New Revenue (24mo)</p>
            <p className="text-xl font-bold text-success">$240,000</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">New Runway</p>
            <p className="text-xl font-bold text-primary">14 months</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
