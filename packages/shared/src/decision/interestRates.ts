/**
 * Curated Big-4 bank home-loan rates (Vietnam), refreshed monthly.
 * Used for expected-interest estimates — not a live bank API quote.
 */

export type Big4BankCode = "vcb" | "ctg" | "bidv" | "agr";

export interface Big4BankRate {
  code: Big4BankCode;
  name: string;
  shortName: string;
  /** Preferential / new home-loan rate, % per year */
  annualRatePercent: number;
}

export interface MonthlyInterestSnapshot {
  /** YYYY-MM of the curated snapshot */
  month: string;
  labelVi: string;
  rates: Big4BankRate[];
  sourceNoteVi: string;
}

/** Latest curated snapshot — update this object when refreshing monthly. */
export const BIG4_INTEREST_SNAPSHOT: MonthlyInterestSnapshot = {
  month: "2026-09",
  labelVi: "Tháng 09/2026",
  rates: [
    {
      code: "vcb",
      name: "Vietcombank",
      shortName: "VCB",
      annualRatePercent: 7.8,
    },
    {
      code: "ctg",
      name: "VietinBank",
      shortName: "CTG",
      annualRatePercent: 8.0,
    },
    {
      code: "bidv",
      name: "BIDV",
      shortName: "BIDV",
      annualRatePercent: 7.9,
    },
    {
      code: "agr",
      name: "Agribank",
      shortName: "AGR",
      annualRatePercent: 8.1,
    },
  ],
  sourceNoteVi:
    "Lãi suất ưu đãi vay mua nhà tham chiếu Big 4 — cập nhật thủ công hàng tháng, không phải báo giá realtime từ ngân hàng.",
};

export function averageBig4AnnualRate(
  snapshot: MonthlyInterestSnapshot = BIG4_INTEREST_SNAPSHOT,
): number {
  const sum = snapshot.rates.reduce((s, r) => s + r.annualRatePercent, 0);
  return Math.round((sum / snapshot.rates.length) * 100) / 100;
}

export interface LoanEstimateInput {
  /** Principal in tỷ VND */
  principalTy: number;
  /** Annual interest rate percent, e.g. 7.9 */
  annualRatePercent: number;
  /** Loan term in years */
  termYears: number;
}

export interface LoanEstimate {
  principalTy: number;
  annualRatePercent: number;
  termYears: number;
  /** Estimated fixed monthly payment in triệu VND */
  monthlyPaymentTrieu: number;
  /** Total interest over the full term in tỷ VND */
  totalInterestTy: number;
  /** Total repaid (principal + interest) in tỷ VND */
  totalRepaidTy: number;
}

/**
 * Standard amortizing loan (equal monthly payment).
 * Returns null when inputs are non-positive or non-finite.
 */
export function estimateLoanPayment(
  input: LoanEstimateInput,
): LoanEstimate | null {
  const { principalTy, annualRatePercent, termYears } = input;
  if (
    !Number.isFinite(principalTy) ||
    !Number.isFinite(annualRatePercent) ||
    !Number.isFinite(termYears) ||
    principalTy <= 0 ||
    annualRatePercent < 0 ||
    termYears <= 0
  ) {
    return null;
  }

  const n = Math.round(termYears * 12);
  const monthlyRate = annualRatePercent / 100 / 12;
  const principalTrieu = principalTy * 1000;

  let monthlyPaymentTrieu: number;
  if (monthlyRate === 0) {
    monthlyPaymentTrieu = principalTrieu / n;
  } else {
    const factor = (1 + monthlyRate) ** n;
    monthlyPaymentTrieu =
      (principalTrieu * monthlyRate * factor) / (factor - 1);
  }

  const totalRepaidTrieu = monthlyPaymentTrieu * n;
  const totalInterestTrieu = totalRepaidTrieu - principalTrieu;

  return {
    principalTy,
    annualRatePercent,
    termYears,
    monthlyPaymentTrieu: Math.round(monthlyPaymentTrieu * 10) / 10,
    totalInterestTy: Math.round((totalInterestTrieu / 1000) * 100) / 100,
    totalRepaidTy: Math.round((totalRepaidTrieu / 1000) * 100) / 100,
  };
}

/** Loan needed after using available cash against an estimated property price. */
export function loanPrincipalFromCash(
  propertyPriceTy: number,
  availableCashTy: number,
): number {
  if (!Number.isFinite(propertyPriceTy) || !Number.isFinite(availableCashTy)) {
    return 0;
  }
  return Math.max(0, propertyPriceTy - Math.max(0, availableCashTy));
}
