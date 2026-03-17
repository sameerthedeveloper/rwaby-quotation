import { useState, useEffect } from 'react';
import { Settings, Save, FolderOpen, Trash2, CheckCircle, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import CostTable from '@/components/cost/CostTable';
import CostSummary from '@/components/cost/CostSummary';
import { useCostCalculator } from '@/hooks/useCostCalculator';
import {
  saveWorkshopCostTemplate,
  getWorkshopCostTemplates,
  deleteWorkshopCostTemplate,
  getActiveTemplateSettings,
  setActiveTemplateSettings
} from '@/services/firestoreService';

export default function AdminSettings() {
  const calc = useCostCalculator();
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fetchedTemplates = await getWorkshopCostTemplates();
      setTemplates(fetchedTemplates);
      const activeId = await getActiveTemplateSettings();
      setActiveTemplateId(activeId);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) { alert('Enter a template name'); return; }
    setIsSaving(true);
    try {
      await saveWorkshopCostTemplate({ name: templateName, ...calc.getSnapshot() });
      setTemplateName('');
      alert('Template saved!');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplateForEdit = (t) => {
    calc.loadData(t);
    setTemplateName(t.name);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template completely?')) return;
    try { 
      await deleteWorkshopCostTemplate(id); 
      if (activeTemplateId === id) {
         await setActiveTemplateSettings(null);
         setActiveTemplateId(null);
      }
      loadData(); 
    }
    catch (e) { console.error(e); }
  };

  const handleSetActive = async (id) => {
    try {
      await setActiveTemplateSettings(id);
      setActiveTemplateId(id);
      alert('Active template updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to set active template');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-slate-900">Admin Settings: Cost Templates</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Template Manager */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Manage Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {templates.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No templates found.</p>
              ) : (
                <div className="space-y-3">
                  {templates.map(t => (
                    <div 
                      key={t.id} 
                      className={`p-3 rounded-lg border flex flex-col gap-3 transition-colors ${activeTemplateId === t.id ? 'border-green-500 bg-green-50/30' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{t.name}</h4>
                          <span className="text-xs text-slate-500 font-mono">Base Cost: {t.workshopTotal?.toFixed(2) || 0} OMR</span>
                        </div>
                        {activeTemplateId === t.id && (
                          <span className="flex items-center text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3 mr-1" /> Active
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {activeTemplateId !== t.id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs h-7 border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleSetActive(t.id)}
                          >
                            Set Active
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs h-7"
                          onClick={() => handleLoadTemplateForEdit(t)}
                        >
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteTemplate(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <CardTitle className="text-base">Template Editor</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Template name"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-48 h-9"
                />
                <Button size="sm" onClick={handleSaveTemplate} disabled={isSaving || !templateName.trim()}>
                  <Save className="h-4 w-4 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 bg-slate-50/50">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Configure Base Pricing</h3>
                <CostTable
                  hourlyRows={calc.hourlyRows}
                  fixedRows={calc.fixedRows}
                  onCostChange={calc.updateCost}
                  onHoursChange={calc.updateHours}
                  onFixedChange={calc.updateFixed}
                  workshopTotal={calc.workshopTotal}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Configure Default Margin</h3>
                <CostSummary
                  workshopTotal={calc.workshopTotal}
                  margin={calc.margin}
                  finalPrice={calc.finalPrice}
                  profit={calc.profit}
                  onMarginChange={calc.setMargin}
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
