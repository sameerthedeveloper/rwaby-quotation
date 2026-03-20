import { useState, useEffect } from 'react';
import { Calculator, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CostTable from '@/components/cost/CostTable';
import CostSummary from '@/components/cost/CostSummary';
import { useCostCalculator } from '@/hooks/useCostCalculator';
import {
  saveWorkshopCost,
  getActiveTemplateSettings,
  getWorkshopCostTemplate
} from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';

export default function WorkshopCostCalculator() {
  const calc = useCostCalculator();
  const { isAdmin } = useAuth();
  const isNormalUser = !isAdmin;
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [noActiveTemplate, setNoActiveTemplate] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState('');

  useEffect(() => { 
    loadActiveTemplate(); 
  }, []);

  const loadActiveTemplate = async () => {
    try {
      const activeId = await getActiveTemplateSettings();
      if (!activeId) {
        setNoActiveTemplate(true);
        setLoadingTemplate(false);
        return;
      }
      
      const templateData = await getWorkshopCostTemplate(activeId);
      if (templateData) {
        calc.loadData(templateData);
        setActiveTemplateName(templateData.name || '');
      } else {
        setNoActiveTemplate(true);
      }
    } catch (e) { 
      console.error('Failed to load active template:', e); 
      setNoActiveTemplate(true);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSaveCost = async () => {
    setIsSaving(true);
    try {
      await saveWorkshopCost(calc.getSnapshot());
      alert('Workshop cost calculation saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save cost.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingTemplate) {
    return <div className="p-8 text-center text-slate-500">Loading Configuration...</div>;
  }

  if (noActiveTemplate) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-amber-900">No Active Template Configured</h2>
            <p className="text-amber-800">
              The workshop cost calculator requires an active template to function. 
              Please ask an administrator to set the Active Template in the Admin Settings panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workshop Cost Calculator</h1>
            <p className="text-sm text-slate-500">Using template: <span className="font-semibold text-slate-700">{activeTemplateName}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleSaveCost} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" /> {isSaving ? 'Saving...' : 'Save Cost Calculation'}
          </Button>
        </div>
      </div>

      {/* Formula info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500">
            <strong>Hourly cost formulas:</strong>{' '}
            Machine = Amount ÷ 365 ÷ 8 &nbsp;|&nbsp; Labor = Amount ÷ 8 &nbsp;|&nbsp; Others = Amount ÷ 26 ÷ 8
          </p>
          {isNormalUser && (
            <p className="text-xs text-slate-400 mt-2 italic">
              Note: Base costs are locked by the administrator. Only input the <strong>Hours Used</strong>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cost Table (Read Only base amounts) */}
      <CostTable
        hourlyRows={calc.hourlyRows}
        fixedRows={calc.fixedRows}
        onCostChange={calc.updateCost}
        onHoursChange={calc.updateHours}
        onFixedChange={calc.updateFixed}
        workshopTotal={calc.workshopTotal}
        readOnlyAmount={isNormalUser}
        hidePrices={isNormalUser}
      />

      {/* Summary */}
      <CostSummary
        workshopTotal={calc.workshopTotal}
        margin={calc.margin}
        finalPrice={calc.finalPrice}
        profit={calc.profit}
        onMarginChange={calc.setMargin}
        readOnly={isNormalUser}
        hidePrices={isNormalUser}
      />
    </div>
  );
}
