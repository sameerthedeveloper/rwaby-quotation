import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

/**
 * Summary card showing workshop total, margin input, final price and profit.
 */
export default function CostSummary({ workshopTotal, margin, finalPrice, profit, onMarginChange, hidePrices = false }) {
  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="bg-primary/5 border-b pb-4">
        <CardTitle className="text-lg">Cost Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between text-base">
          <span className="text-slate-600 font-medium">Workshop Production Cost:</span>
          <span className="font-bold font-mono text-slate-900">{workshopTotal.toFixed(2)} OMR</span>
        </div>

        <div className="space-y-2">
          <Label>Margin (%)</Label>
          <Input
            type="number"
            min="0"
            value={margin || ''}
            onChange={e => onMarginChange(Number(e.target.value) || 0)}
            className="border-amber-300 focus-visible:ring-amber-500 max-w-xs"
          />
        </div>

        <hr className="border-slate-200" />

        <div className="flex justify-between items-center bg-gradient-to-r from-primary/10 to-blue-50 p-4 rounded-lg ring-1 ring-primary/20">
          <span className="text-lg font-bold text-slate-900">Final Price:</span>
          <span className="text-2xl font-bold text-primary font-mono">{finalPrice.toFixed(2)} OMR</span>
        </div>

        <div className="flex justify-between text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          <span className="font-medium">Profit:</span>
          <span className="font-bold font-mono">{profit.toFixed(2)} OMR</span>
        </div>
      </CardContent>
    </Card>
  );
}
