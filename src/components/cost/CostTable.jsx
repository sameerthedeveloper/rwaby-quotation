import { Card, CardContent } from '@/components/ui/Card';
import CostRow from './CostRow';

/**
 * Desktop table showing all cost items in a spreadsheet layout.
 * Mobile: uses a card-based layout.
 */
export default function CostTable({ hourlyRows, fixedRows, onCostChange, onHoursChange, onFixedChange, workshopTotal, readOnlyAmount = false, hidePrices = false }) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b-2 border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-6 py-4 w-1/3 text-left">Item Description</th>
                  <th className="px-6 py-4 w-1/6 text-right">Qty/Count</th>
                  <th className="px-6 py-4 w-1/6 text-right">Rate</th>
                  <th className="px-6 py-4 w-1/6 text-right">Hours</th>
                  <th className="px-6 py-4 w-1/6 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Hourly items */}
                {hourlyRows.map(row => (
                  <CostRow
                    key={row.key}
                    row={row}
                    type="hourly"
                    onAmountChange={onCostChange}
                    onHoursChange={onHoursChange}
                    readOnlyAmount={readOnlyAmount}
                    hidePrices={hidePrices}
                  />
                ))}
                {/* Separator */}
                <tr>
                  <td colSpan={5} className="px-6 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Additional Operations
                  </td>
                </tr>
                {/* Fixed items */}
                {fixedRows.map(row => (
                  <CostRow
                    key={row.key}
                    row={row}
                    type="fixed"
                    onAmountChange={onFixedChange}
                    readOnlyAmount={readOnlyAmount}
                    hidePrices={hidePrices}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200/50 border-t-2 border-slate-300">
                  <td colSpan={4} className="px-6 py-5 font-bold text-slate-700 text-right">Workshop Production Cost:</td>
                  <td className="px-6 py-5 text-right font-bold font-mono text-primary text-xl">
                    {`${(workshopTotal || 0).toFixed(2)} OMR`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {/* Hourly items */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hourly Items</h4>
            {hourlyRows.map(row => (
              <MobileRow
                key={row.key}
                label={row.label}
                amount={row.amount}
                hourly={row.hourly}
                hoursUsed={row.hoursUsed}
                total={row.total}
                onAmountChange={v => onCostChange(row.costField, v)}
                onHoursChange={v => onHoursChange(row.hoursField, v)}
                readOnlyAmount={readOnlyAmount}
                hidePrices={hidePrices}
              />
            ))}
          </CardContent>
        </Card>

        {/* Fixed items */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fixed Operations</h4>
            {fixedRows.map(row => (
              <MobileFixedRow
                key={row.key}
                label={row.label}
                amount={row.amount}
                onAmountChange={v => onFixedChange(row.field, v)}
                readOnlyAmount={readOnlyAmount}
                hidePrices={hidePrices}
              />
            ))}
          </CardContent>
        </Card>

        {/* Total */}
        <div className="bg-slate-100 rounded-lg p-4 flex justify-between items-center">
          <span className="font-bold text-slate-900">Workshop Total</span>
          <span className="font-bold font-mono text-primary text-lg">{`${(workshopTotal || 0).toFixed(2)} OMR`}</span>
        </div>
      </div>
    </>
  );
}

/* ─── Mobile sub-components ─────────────────────────────────────── */
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

function MobileRow({ label, amount, hourly, hoursUsed, total, onAmountChange, onHoursChange, readOnlyAmount, hidePrices }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 space-y-2">
      <h5 className="font-semibold text-slate-900 text-sm">{label}</h5>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-500">Amount (OMR)</Label>
          {readOnlyAmount ? (
            <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-slate-50/50 text-slate-800 font-mono text-sm">
              {hidePrices ? '***' : (amount || 0).toFixed(2)}
            </div>
          ) : (
            <Input type="number" min="0" value={amount || ''} onChange={e => onAmountChange(e.target.value)} />
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-500">Hours Used</Label>
          <Input type="number" min="0" value={hoursUsed || ''} onChange={e => onHoursChange(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span className="text-slate-500">Hourly: <strong className="text-slate-700">{hidePrices ? '***' : (hourly || 0).toFixed(2)}</strong></span>
        <span className="text-slate-500">Total: <strong className="text-primary">{`${(total || 0).toFixed(2)} OMR`}</strong></span>
      </div>
    </div>
  );
}

function MobileFixedRow({ label, amount, onAmountChange, hidePrices }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
      <span className="text-sm font-medium text-slate-700 flex-1">{label}</span>
      <Input type="number" min="0" className="w-28" value={amount || ''} onChange={e => onAmountChange(e.target.value)} />
    </div>
  );
}
