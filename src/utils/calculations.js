/**
 * Utility functions for quotation calculations.
 * All functions return guaranteed numbers (fallback to 0).
 */

export const calculateCuttingTotal = (numberOfCuts, ratePerCut) => {
  const cuts = Number(numberOfCuts) || 0;
  const rate = Number(ratePerCut) || 0;
  return cuts * rate;
};

export const calculateBendingTotal = (numberOfBends, ratePerBend) => {
  const bends = Number(numberOfBends) || 0;
  const rate = Number(ratePerBend) || 0;
  return bends * rate;
};

export const calculateGrandTotal = (totalCutting, totalBending, extraCostsTotal) => {
  const cutting = Number(totalCutting) || 0;
  const bending = Number(totalBending) || 0;
  const extra = Number(extraCostsTotal) || 0;
  return cutting + bending + extra;
};

export const calculateBalanceAmount = (grandTotal, advanceReceived) => {
  const total = Number(grandTotal) || 0;
  const advance = Number(advanceReceived) || 0;
  // Ensure balance is never negative if advance is greater (though validation should prevent this)
  return Math.max(0, total - advance);
};
