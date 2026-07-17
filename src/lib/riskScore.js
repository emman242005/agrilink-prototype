export function computeRiskScore(loan) {
  if (!loan) return { score: 0, maxScore: 100, band: "unknown", breakdown: [] };

  const hasGuarantorPackage = loan.guarantor_consent_url && loan.guarantor_id_url;

  const items = [
    { label: "Proof of savings (passbook)", max: 15, earned: loan.passbook_url ? 15 : 0 },
    { label: "Land ownership document", max: 20, earned: loan.land_document_url ? 20 : 0 },
    { label: "Farm plan / project proposal", max: 15, earned: loan.farm_plan_url ? 15 : 0 },
    { label: "Farm record book", max: 5, earned: loan.farm_record_url ? 5 : 0 },
    { label: "Farm location sketch", max: 5, earned: loan.farm_sketch_url ? 5 : 0 },
    { label: "Cooperative / GIC membership", max: 5, earned: loan.cooperative ? 5 : 0 },
    { label: "Cooperative recommendation letter", max: 5, earned: loan.coop_letter_url ? 5 : 0 },
    { label: "Guarantor consent and ID on file", max: 20, earned: hasGuarantorPackage ? 20 : loan.guarantor1_name ? 10 : 0 },
    { label: "Collateral ownership document", max: 10, earned: loan.collateral_ownership_url ? 10 : 0 },
  ];

  const score = items.reduce((sum, i) => sum + i.earned, 0);
  const maxScore = items.reduce((sum, i) => sum + i.max, 0);

  let band = "high";
  if (score >= 80) band = "low";
  else if (score >= 55) band = "medium";

  return { score, maxScore, band, breakdown: items };
}

export const RISK_BAND_STYLES = {
  low: { label: "LOW RISK", className: "bg-forest/10 text-forest" },
  medium: { label: "MEDIUM RISK", className: "bg-gold/15 text-gold" },
  high: { label: "HIGH RISK", className: "bg-red-100 text-red-600" },
  unknown: { label: "NO DATA", className: "bg-sage/15 text-sage" },
};