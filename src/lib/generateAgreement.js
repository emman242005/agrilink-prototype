export function generateAgreementText(loan, farmerName) {
  const amount = Number(loan.amount_requested).toLocaleString();
  const rate = loan.interest_rate;
  const term = loan.term_months;
  const total = Math.round(Number(loan.amount_requested) * (1 + rate / 100)).toLocaleString();
  const monthly = Math.round((Number(loan.amount_requested) * (1 + rate / 100)) / term).toLocaleString();
  const today = new Date().toLocaleDateString();

  return `LOAN AGREEMENT

Date: ${today}
Borrower: ${farmerName}
Purpose: ${loan.purpose}

1. LOAN AMOUNT
The lender agrees to disburse ${amount} XAF to the borrower for the stated purpose.

2. INTEREST AND REPAYMENT
Interest is charged at ${rate}% over the loan term. Total repayable amount is ${total} XAF, repaid over ${term} months in installments of approximately ${monthly} XAF per month.

3. DISBURSEMENT
Funds will be sent to the borrower's registered mobile money account after both parties sign this agreement.

4. BORROWER OBLIGATIONS
The borrower agrees to repay each installment by its due date, to use the funds for the stated purpose, and to notify the lender promptly of any inability to make a scheduled payment.

5. DEFAULT
Failure to repay may affect the borrower's future access to credit through this platform and any partner institutions.

6. AGREEMENT
By signing below, both parties confirm they have read and agree to the terms above.`;
}