import { Input } from '@/components/ui/Input';
import { Select } from '../ui/Select';

/**
 * A single row in the cost table.
 * For hourly items: shows Amount, Hour Cost (computed), Hours Used, Total.
 * For fixed items: shows only Amount input and the value as total.
 */
export default function CostRow({ row, type = 'hourly', onAmountChange, onHoursChange, readOnlyAmount = false, hidePrices = false }) {
  if (type === 'fixed') {
    return (
      <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 group">
        <td className="px-6 py-3.5 w-1/3">
          <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">{row.label}</span>
        </td>
        <td className="px-6 py-3.5 w-1/6 text-right">
          <Input
            type="number"
            min="0"
            placeholder="0.00"
            className="w-24 ml-auto text-right border-slate-200 font-mono text-sm focus:ring-primary/20 bg-green-50/20 group-hover:bg-green-50/40 transition-colors"
            value={row.amount || ''}
            onChange={e => onAmountChange(row.field, e.target.value)}
          />
        </td>
        <td className="px-6 py-3.5 w-1/6 text-right text-slate-400 text-xs font-mono">—</td>
        <td className="px-6 py-3.5 w-1/6 text-right text-slate-400 text-xs font-mono">—</td>
        <td className="px-6 py-3.5 w-1/6 text-right font-mono text-sm font-bold text-slate-900 bg-slate-50/30 group-hover:bg-slate-100/50 transition-colors">
          {(row.amount || 0).toFixed(2)}
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 group">
      <td className="px-6 py-3.5 w-1/3">
        <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">{row.label}</span>
      </td>
      <td className="px-6 py-3.5 w-1/6 text-right">
        {(row.key === 'labor' || row.key === 'fabricator') ? (
          <Select
            type="number"
            min="0"
            className="w-24 ml-auto text-right border-slate-200 focus:ring-primary/20 bg-white shadow-sm hover:border-slate-300 transition-all font-mono text-xs"
            value={row.amount || ''}
            onChange={e => onAmountChange(row.costField, e.target.value)}
          >
            <option value="">Qty</option>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        ) : (
          readOnlyAmount ? (
            <span className="text-slate-300 font-mono text-xs italic tracking-widest">—</span>
          ) : (
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              className="w-24 ml-auto text-right border-slate-200/60 font-mono text-sm focus:ring-primary/20 bg-slate-50/30 focus:bg-white transition-all"
              value={row.amount || ''}
              onChange={e => onAmountChange(row.costField, e.target.value)}
            />
          )
        )}
      </td>
      <td className="px-6 py-3.5 w-1/6 text-right font-mono text-xs text-slate-400 tabular-nums">
        {(row.hourly || 0).toFixed(2)}
      </td>
      <td className="px-6 py-3.5 w-1/6 text-right">
        <Input
          type="number"
          min="0"
          placeholder="0"
          className="w-20 ml-auto text-right border-slate-200 font-mono text-sm focus:ring-primary/20 bg-primary/[0.03] focus:bg-white group-hover:bg-primary/[0.06] transition-all"
          value={row.hoursUsed || ''}
          onChange={e => onHoursChange(row.hoursField, e.target.value)}
        />
      </td>
      <td className="px-6 py-3.5 w-1/6 text-right font-mono text-sm font-bold text-slate-900 bg-slate-50/30 group-hover:bg-slate-100/50 transition-colors">
        {(row.total || 0).toFixed(2)}
      </td>
    </tr>
  );
}
