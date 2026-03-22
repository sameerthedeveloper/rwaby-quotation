import React from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export default function ExtraCosts({ extraCosts = [], onAdd, onRemove, onUpdate, hidePrices = false }) {
  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden mt-6">
      <CardHeader className="bg-slate-50/80 border-b px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <DollarSign className="w-5 h-5 text-primary" />
          Other Production Costs
        </CardTitle>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onAdd}
          className="gap-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Cost
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {extraCosts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm italic">
            No additional costs added. Click "Add Cost" to include custom items.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-3 w-3/5">Description</th>
                <th className="px-6 py-3 w-1/4 text-right">Amount (OMR)</th>
                <th className="px-6 py-3 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {extraCosts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-3">
                    <Input
                      placeholder="e.g., Special Packaging, Transport..."
                      value={item.description}
                      onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                      className="border-transparent bg-transparent focus:bg-white focus:border-slate-200 h-9 text-sm transition-all focus:shadow-sm"
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={item.amount || ''}
                        onChange={(e) => onUpdate(item.id, 'amount', e.target.value)}
                        className="w-32 ml-auto text-right font-mono text-sm border-slate-200/60 focus:ring-primary/20 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {extraCosts.length > 0 && !hidePrices && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t">
                  <td className="px-6 py-3 text-sm text-slate-600">Extra Costs Sub-total:</td>
                  <td className="px-6 py-3 text-right font-mono text-primary">
                    {extraCosts.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toFixed(2)} OMR
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </CardContent>
    </Card>
  );
}
