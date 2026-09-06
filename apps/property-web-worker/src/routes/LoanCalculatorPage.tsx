import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BIG4_INTEREST_SNAPSHOT,
  averageBig4AnnualRate,
  estimateLoanPayment,
  loanPrincipalFromCash,
} from "@ancu/shared";
import "./ToolsPage.css";

export default function LoanCalculatorPage() {
  const avgRate = averageBig4AnnualRate();
  const [priceTy, setPriceTy] = useState(4);
  const [cashTy, setCashTy] = useState(1);
  const [termYears, setTermYears] = useState(20);
  const [rate, setRate] = useState(avgRate);

  const principal = loanPrincipalFromCash(priceTy, cashTy);
  const estimate = useMemo(
    () =>
      estimateLoanPayment({
        principalTy: principal,
        annualRatePercent: rate,
        termYears,
      }),
    [principal, rate, termYears],
  );

  return (
    <div className="container loan-page">
      <header className="page-header">
        <p>
          <Link to="/tools">← Công cụ</Link>
        </p>
        <h1>Tính khoản vay</h1>
        <p>
          Ước tính trả góp cố định theo công thức amortizing. Lãi suất tham chiếu Big 4 —
          cập nhật thủ công, không phải báo giá ngân hàng.
        </p>
      </header>

      <form className="loan-form" onSubmit={(e) => e.preventDefault()}>
        <label className="loan-field">
          <span>Giá căn (tỷ VND)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={priceTy}
            onChange={(e) => setPriceTy(Number(e.target.value))}
          />
        </label>
        <label className="loan-field">
          <span>Vốn tự có (tỷ VND)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={cashTy}
            onChange={(e) => setCashTy(Number(e.target.value))}
          />
        </label>
        <label className="loan-field">
          <span>Kỳ hạn (năm)</span>
          <input
            type="number"
            min={1}
            max={35}
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
          />
        </label>
        <label className="loan-field">
          <span>Lãi suất (%/năm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
      </form>

      <div className="loan-result" aria-live="polite">
        <h2>Kết quả ước tính</h2>
        {estimate ? (
          <dl>
            <div>
              <dt>Số vay</dt>
              <dd>{principal.toFixed(2)} tỷ</dd>
            </div>
            <div>
              <dt>Trả hàng tháng</dt>
              <dd>~{estimate.monthlyPaymentTrieu.toFixed(1)} triệu</dd>
            </div>
            <div>
              <dt>Tổng lãi</dt>
              <dd>~{estimate.totalInterestTy.toFixed(2)} tỷ</dd>
            </div>
            <div>
              <dt>Tổng phải trả</dt>
              <dd>~{estimate.totalRepaidTy.toFixed(2)} tỷ</dd>
            </div>
          </dl>
        ) : (
          <p>Nhập giá và vốn hợp lệ để xem ước tính.</p>
        )}
        <p className="loan-source">
          {BIG4_INTEREST_SNAPSHOT.labelVi}: {BIG4_INTEREST_SNAPSHOT.sourceNoteVi}
        </p>
        <ul className="loan-banks">
          {BIG4_INTEREST_SNAPSHOT.rates.map((b) => (
            <li key={b.code}>
              {b.shortName}: {b.annualRatePercent}%/năm
            </li>
          ))}
        </ul>
      </div>

      <div className="invest-actions">
        <Link to="/tools/investment" className="btn btn-secondary">
          Phân tích phù hợp
        </Link>
        <Link to="/projects" className="btn btn-ghost">
          Xem dự án
        </Link>
      </div>
    </div>
  );
}
