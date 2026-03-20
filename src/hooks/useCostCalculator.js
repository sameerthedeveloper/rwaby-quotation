import { useState, useMemo } from 'react';
import {
  calculateHourlyCost,
  calculateItemTotals,
  calculateWorkshopCost,
  calculateFinalPrice,
} from '@/utils/costCalculator';

const INITIAL_COSTS = {
  machineCost: 0,
  rent: 0,
  laborCostPerDay: 51.92,
  electricityCost: 0,
};

const INITIAL_HOURS = {
  machineHours: 0,
  rentHours: 0,
  laborHours: 0,
  electricityHours: 0,
};

const INITIAL_FIXED = {
  laserCutting: 0,
  powderCoating: 0,
  wrapping: 0,
  bending: 0,
  accessories: 0,
};

/**
 * Custom hook that wires the cost calculator engine to React state.
 * Recomputes all totals whenever any input changes.
 */
export function useCostCalculator(initial = {}) {
  const [costs, setCosts] = useState({ ...INITIAL_COSTS, ...initial.costs });
  const [hours, setHours] = useState({ ...INITIAL_HOURS, ...initial.hours });
  const [fixedCosts, setFixedCosts] = useState({ ...INITIAL_FIXED, ...initial.fixedCosts });
  const [margin, setMargin] = useState(initial.margin || 0);

  const updateCost = (key, value) =>
    setCosts(prev => ({ ...prev, [key]: Number(value) || 0 }));

  const updateHours = (key, value) =>
    setHours(prev => ({ ...prev, [key]: Number(value) || 0 }));

  const updateFixed = (key, value) =>
    setFixedCosts(prev => ({ ...prev, [key]: Number(value) || 0 }));

  // ─── Derived calculations (memoized) ──────────────────────────
  const hourlyRates = useMemo(() => calculateHourlyCost(costs), [costs]);

  const itemTotals = useMemo(
    () => calculateItemTotals(hourlyRates, hours),
    [hourlyRates, hours]
  );

  const workshopResult = useMemo(
    () => calculateWorkshopCost(itemTotals, fixedCosts),
    [itemTotals, fixedCosts]
  );

  const priceResult = useMemo(
    () => calculateFinalPrice(workshopResult.workshopTotal, margin),
    [workshopResult.workshopTotal, margin]
  );

  // ─── Table rows for the UI ────────────────────────────────────
  const hourlyRows = useMemo(() => [
    { key: 'machine',     label: 'Machine (Per Hour)',          amount: costs.machineCost,       hourly: hourlyRates.machineHourly,     hoursUsed: hours.machineHours,     total: itemTotals.machineTotal,     costField: 'machineCost',    hoursField: 'machineHours' },
    { key: 'rent',        label: 'Workshop Rent (Per Hour)',    amount: costs.rent,              hourly: hourlyRates.rentHourly,        hoursUsed: hours.rentHours,        total: itemTotals.rentTotal,        costField: 'rent',           hoursField: 'rentHours' },
    { key: 'labor',       label: 'Labor Cost (Per Day)',       amount: costs.laborCostPerDay,   hourly: hourlyRates.laborHourly,       hoursUsed: hours.laborHours,       total: itemTotals.laborTotal,       costField: 'laborCostPerDay',hoursField: 'laborHours' },
    { key: 'electricity', label: 'Electricity (EB) (Per Hour)', amount: costs.electricityCost,   hourly: hourlyRates.electricityHourly, hoursUsed: hours.electricityHours, total: itemTotals.electricityTotal, costField: 'electricityCost',hoursField: 'electricityHours' },
  ], [costs, hourlyRates, hours, itemTotals]);

  const fixedRows = useMemo(() => [
    { key: 'laserCutting',  label: 'Laser Cutting',  amount: fixedCosts.laserCutting,  field: 'laserCutting' },
    { key: 'powderCoating', label: 'Powder Coating', amount: fixedCosts.powderCoating, field: 'powderCoating' },
    { key: 'wrapping',      label: 'Wrapping',       amount: fixedCosts.wrapping,      field: 'wrapping' },
    { key: 'bending',       label: 'Bending',        amount: fixedCosts.bending,       field: 'bending' },
    { key: 'accessories',   label: 'Accessories',    amount: fixedCosts.accessories,   field: 'accessories' },
  ], [fixedCosts]);

  // ─── Bulk load (from saved cost or template) ──────────────────
  const loadData = (data) => {
    if (data.costs)      setCosts({ ...INITIAL_COSTS, ...data.costs });
    if (data.hours)      setHours({ ...INITIAL_HOURS, ...data.hours });
    if (data.fixedCosts) setFixedCosts({ ...INITIAL_FIXED, ...data.fixedCosts });
    if (data.margin !== undefined) setMargin(data.margin);
  };

  // ─── Serialise state for Firestore ────────────────────────────
  const getSnapshot = () => ({
    costs,
    hours,
    fixedCosts,
    margin,
    hourlyRates,
    itemTotals,
    workshopTotal: workshopResult.workshopTotal,
    finalPrice: priceResult.finalPrice,
    profit: priceResult.profit,
  });

  return {
    // State
    costs, hours, fixedCosts, margin,
    // Updaters
    updateCost, updateHours, updateFixed, setMargin,
    // Computed
    hourlyRates, itemTotals, workshopResult, priceResult,
    workshopTotal: workshopResult.workshopTotal,
    finalPrice: priceResult.finalPrice,
    profit: priceResult.profit,
    // UI helpers
    hourlyRows, fixedRows,
    // Utils
    loadData, getSnapshot,
  };
}
