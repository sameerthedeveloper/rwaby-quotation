import { Input } from '@/components/ui/Input';

/**
 * A single row in the cost table.
 * For hourly items: shows Amount, Hour Cost (computed), Hours Used, Total.
 * For fixed items: shows only Amount input and the value as total.
 */
export default function CostRow({ row, type = 'hourly', onAmountChange, onHoursChange, readOnlyAmount = false, hidePrices = false }) {
  if (type === 'fixed') {
    return (
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="px-4 sm:px-6 py-3">
          <span className="font-medium text-slate-900 text-sm">{row.label}</span>
          <span className="text-xs text-slate-400 ml-2">Fixed</span>
        </td>
        <td className="px-4 sm:px-6 py-3 text-right">
          {readOnlyAmount ? (
             <span className="font-mono text-sm text-slate-800">{hidePrices ? '***' : (row.amount || 0).toFixed(2)}</span>
          ) : (
            <Input
              type="number"
              min="0"
              className="w-24 ml-auto text-right"
              value={row.amount || ''}
              onChange={e => onAmountChange(row.field, e.target.value)}
            />
          )}
        </td>
        <td className="px-4 sm:px-6 py-3 text-right text-slate-400 text-sm">—</td>
        <td className="px-4 sm:px-6 py-3 text-right text-slate-400 text-sm">—</td>
        <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm font-semibold text-slate-900">
          {hidePrices ? '***' : (row.amount || 0).toFixed(2)}
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-4 sm:px-6 py-3">
        <span className="font-medium text-slate-900 text-sm">{row.label}</span>
      </td>
      <td className="px-4 sm:px-6 py-3 text-right">
        {readOnlyAmount ? (
           <span className="font-mono text-sm text-slate-800">{hidePrices ? '***' : (row.amount || 0).toFixed(2)}</span>
        ) : (
          <Input
            type="number"
            min="0"
            className="w-24 ml-auto text-right"
            value={row.amount || ''}
            onChange={e => onAmountChange(row.costField, e.target.value)}
          />
        )}
      </td>
      <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm text-slate-600">
        {hidePrices ? '***' : row.hourly.toFixed(2)}
      </td>
      <td className="px-4 sm:px-6 py-3 text-right">
        <Input
          type="number"
          min="0"
          className="w-20 ml-auto text-right"
          value={row.hoursUsed || ''}
          onChange={e => onHoursChange(row.hoursField, e.target.value)}
        />
      </td>
      <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm font-semibold text-slate-900">
        {hidePrices ? '***' : row.total.toFixed(2)}
      </td>
    </tr>
  );
}
