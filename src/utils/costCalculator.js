/**
 * Workshop Cost Calculator Engine
 * Reproduces the logic from the Excel costing sheet.
 *
 * Divisor rules (from Excel):
 *   Machine  → cost / 365 / 8  (365 days, 8 hrs/day)
 *   Others   → cost / 26  / 8  (26 working days, 8 hrs/day)
 */

// ─── Hourly Cost Calculation ────────────────────────────────────────
/**
 * Converts monthly/annual operational costs into per-hour rates.
 * @param {Object} costs - Raw cost inputs
 * @returns {Object} hourly rates for every line item
 */
export function calculateHourlyCost({
  machineCost = 0,
  rent = 0,
  laborMonthlySalary = 225,
  fabricatorMonthlySalary = 275,
  electricityCost = 0,
}) {
  return {
    machineHourly:     machineCost      / 365 / 8,
    rentHourly:        rent             / 26  / 8,
    laborHourly:       laborMonthlySalary / 26  / 8,
    fabricatorHourly:  fabricatorMonthlySalary / 26  / 8,
    electricityHourly: electricityCost  / 26  / 8,
  };
}

// ─── Item Total Calculation ─────────────────────────────────────────
export function calculateItemTotals(hourlyRates, hours, costs = {}) {
  const laborCount = Number(costs.laborCount) || 1;
  const fabricatorCount = Number(costs.fabricatorCount) || 1;

  return {
    machineTotal:     hourlyRates.machineHourly     * (hours.machineHours     || 0),
    rentTotal:        hourlyRates.rentHourly        * (hours.rentHours        || 0),
    laborTotal:       hourlyRates.laborHourly       * (hours.laborHours       || 0) * laborCount,
    fabricatorTotal:  hourlyRates.fabricatorHourly  * (hours.fabricatorHours  || 0) * fabricatorCount,
    electricityTotal: hourlyRates.electricityHourly * (hours.electricityHours || 0),
  };
}

// ─── Workshop Total ─────────────────────────────────────────────────
/**
 * Combines hourly-based totals with fixed operation costs.
 * @param {Object} itemTotals   - Output of calculateItemTotals
 * @param {Object} fixedCosts   - Direct-cost operations
 * @returns {{ workshopTotal: number, itemTotals: Object }}
 */
export function calculateWorkshopCost(itemTotals, fixedCosts = {}, extraCosts = []) {
  const {
    laserCutting  = 0,
    powderCoating = 0,
    wrapping      = 0,
    bending       = 0,
    accessories   = 0,
  } = fixedCosts;

  const extraTotal = extraCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const workshopTotal =
    itemTotals.machineTotal +
    itemTotals.rentTotal +
    itemTotals.laborTotal +
    (itemTotals.fabricatorTotal || 0) +
    itemTotals.electricityTotal +
    laserCutting +
    powderCoating +
    wrapping +
    bending +
    accessories +
    extraTotal;

  return {
    workshopTotal,
    itemTotals,
    fixedCosts: { laserCutting, powderCoating, wrapping, bending, accessories },
    extraCosts,
    extraTotal
  };
}

// ─── Final Price ────────────────────────────────────────────────────
/**
 * Calculates the selling price including margin/profit percentage.
 * @param {number} workshopTotal
 * @param {number} marginPercentage
 * @returns {{ finalPrice: number, profit: number }}
 */
export function calculateFinalPrice(workshopTotal, marginPercentage = 0) {
  const profit = workshopTotal * (marginPercentage / 100);
  const finalPrice = workshopTotal + profit;
  return { finalPrice, profit };
}
