import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BIG4_INTEREST_SNAPSHOT,
  DEFAULT_LIFESTYLE,
  DEFAULT_LOAN_TERM_YEARS,
  PREFERENCE_HINTS_VI,
  PREFERENCE_LABELS_VI,
  averageBig4AnnualRate,
  estimateLoanPayment,
  preferredBedrooms,
  resolvePriorityOrder,
  withDerivedWeights,
  type HouseholdProfile,
  type LifestylePreferences,
  type VehiclePreference,
  type WfhCount,
} from "@ancu/shared";
import {
  loadLifestylePreferences,
  saveLifestylePreferences,
} from "../lib/lifestylePreferences";
import "./LifestylePreferencesForm.css";

const HOUSEHOLD_OPTIONS: { value: HouseholdProfile; label: string }[] = [
  { value: "solo", label: "Một mình" },
  { value: "couple", label: "Cặp đôi" },
  { value: "family_1_child", label: "Gia đình + 1 bé" },
  { value: "family_2_children", label: "Gia đình + 2 bé" },
];

type LifestylePreferencesFormProps = {
  value?: LifestylePreferences;
  onChange?: (prefs: LifestylePreferences) => void;
  compact?: boolean;
};

function formatTy(value: number): string {
  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });
}

function formatTrieu(value: number): string {
  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  });
}

export function LifestylePreferencesForm({
  value,
  onChange,
  compact = false,
}: LifestylePreferencesFormProps) {
  const [prefs, setPrefs] = useState<LifestylePreferences>(
    () => withDerivedWeights(value ?? loadLifestylePreferences()),
  );
  const [cashDraft, setCashDraft] = useState(() =>
    prefs.availableCashTy != null ? String(prefs.availableCashTy) : "",
  );
  const [loanAmountDraft, setLoanAmountDraft] = useState("");

  useEffect(() => {
    if (value) {
      const next = withDerivedWeights(value);
      setPrefs(next);
      setCashDraft((prev) => {
        const parsed = Number(prev.replace(",", "."));
        if (
          next.availableCashTy == null &&
          prev.trim() === ""
        ) {
          return prev;
        }
        if (
          next.availableCashTy != null &&
          Number.isFinite(parsed) &&
          parsed === next.availableCashTy
        ) {
          return prev;
        }
        return next.availableCashTy != null
          ? String(next.availableCashTy)
          : "";
      });
    }
  }, [value]);

  const update = useCallback(
    (next: LifestylePreferences) => {
      const normalized = withDerivedWeights(next);
      setPrefs(normalized);
      saveLifestylePreferences(normalized);
      onChange?.(normalized);
    },
    [onChange],
  );

  const priorityOrder = resolvePriorityOrder(prefs);
  const avgRate = averageBig4AnnualRate();
  const loanTermYears = prefs.loanTermYears ?? DEFAULT_LOAN_TERM_YEARS;
  const loanAmountTy = (() => {
    const trimmed = loanAmountDraft.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();

  const loanEstimate = useMemo(() => {
    if (loanAmountTy == null) return null;
    return estimateLoanPayment({
      principalTy: loanAmountTy,
      annualRatePercent: avgRate,
      termYears: loanTermYears,
    });
  }, [loanAmountTy, avgRate, loanTermYears]);

  const movePriority = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= priorityOrder.length) return;
    const next = [...priorityOrder];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    update({ ...prefs, priorityOrder: next });
  };

  const commitCashDraft = (raw: string = cashDraft) => {
    if (raw.trim() === "") {
      if (prefs.availableCashTy != null) {
        update({ ...prefs, availableCashTy: undefined });
      }
      return;
    }
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return;
    if (prefs.availableCashTy !== n) {
      update({ ...prefs, availableCashTy: n });
    }
  };

  const setLoanTerm = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    update({ ...prefs, loanTermYears: Math.round(n) });
  };

  return (
    <form
      className={`lifestyle-prefs${compact ? " lifestyle-prefs--compact" : ""}`}
      onSubmit={(e) => e.preventDefault()}
      aria-label="Ưu tiên của bạn"
    >
      <fieldset>
        <legend>Hộ gia đình</legend>
        <div className="lifestyle-prefs-options" role="radiogroup">
          {HOUSEHOLD_OPTIONS.map((opt) => (
            <label key={opt.value}>
              <input
                type="radio"
                name="household"
                checked={prefs.household === opt.value}
                onChange={() => update({ ...prefs, household: opt.value })}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="lifestyle-prefs-hint">
          Gợi ý khoảng {preferredBedrooms(prefs.household)} phòng ngủ
        </p>
      </fieldset>

      <fieldset>
        <legend>Làm việc tại nhà</legend>
        <select
          value={prefs.wfh}
          onChange={(e) =>
            update({ ...prefs, wfh: Number(e.target.value) as WfhCount })
          }
        >
          <option value={0}>Không</option>
          <option value={1}>1 người</option>
          <option value={2}>2 người</option>
        </select>
      </fieldset>

      <fieldset>
        <legend>Xe</legend>
        <select
          value={prefs.vehicle}
          onChange={(e) =>
            update({ ...prefs, vehicle: e.target.value as VehiclePreference })
          }
        >
          <option value="no_car">Không xe hơi</option>
          <option value="car">Có xe hơi</option>
        </select>
      </fieldset>

      <fieldset className="lifestyle-prefs-finance">
        <legend>Tài chính</legend>
        <label className="lifestyle-prefs-field">
          <span>Số tiền đang có</span>
          <div className="lifestyle-prefs-input-row">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ví dụ: 1.5"
              value={cashDraft}
              onChange={(e) => setCashDraft(e.target.value)}
              onBlur={() => commitCashDraft()}
              aria-describedby="cash-hint"
            />            <span className="lifestyle-prefs-suffix">tỷ VND</span>
          </div>
        </label>
        <p id="cash-hint" className="lifestyle-prefs-hint">
          Tiền mặt / tiền sẵn có để thanh toán — tách khỏi thông tin hộ gia đình
          và xe.
        </p>

        <div className="lifestyle-prefs-rates" aria-label="Lãi suất Big 4">
          <div className="lifestyle-prefs-rates-head">
            <strong>Lãi suất vay dự kiến</strong>
            <span>{BIG4_INTEREST_SNAPSHOT.labelVi}</span>
          </div>
          <p className="lifestyle-prefs-rate-avg">
            Trung bình Big 4: <strong>{avgRate}%/năm</strong>
          </p>
          <ul className="lifestyle-prefs-rate-list">
            {BIG4_INTEREST_SNAPSHOT.rates.map((bank) => (
              <li key={bank.code}>
                <span>{bank.shortName}</span>
                <em>{bank.annualRatePercent}%</em>
              </li>
            ))}
          </ul>
          <p className="lifestyle-prefs-hint">
            {BIG4_INTEREST_SNAPSHOT.sourceNoteVi}
          </p>
        </div>

        <label className="lifestyle-prefs-field">
          <span>Kỳ hạn vay giả định</span>
          <div className="lifestyle-prefs-input-row">
            <select
              value={loanTermYears}
              onChange={(e) => setLoanTerm(e.target.value)}
              aria-label="Kỳ hạn vay"
            >
              {[10, 15, 20, 25, 30].map((y) => (
                <option key={y} value={y}>
                  {y} năm
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="lifestyle-prefs-field">
          <span>Số tiền dự kiến vay thêm (tùy chọn)</span>
          <div className="lifestyle-prefs-input-row">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ví dụ: 2"
              value={loanAmountDraft}
              onChange={(e) => setLoanAmountDraft(e.target.value)}
              aria-describedby="loan-estimate"
            />
            <span className="lifestyle-prefs-suffix">tỷ VND</span>
          </div>
        </label>

        <p
          id="loan-estimate"
          className={
            loanEstimate
              ? "lifestyle-prefs-loan-example"
              : "lifestyle-prefs-hint"
          }
          role="status"
        >
          {loanEstimate ? (
            <>
              Ước tính với lãi {avgRate}%/năm trong {loanTermYears} năm: khoảng{" "}
              <strong>
                {formatTrieu(loanEstimate.monthlyPaymentTrieu)} tr/tháng
              </strong>
              , tổng lãi ~{formatTy(loanEstimate.totalInterestTy)} tỷ (gốc vay{" "}
              {formatTy(loanEstimate.principalTy)} tỷ
              {prefs.availableCashTy != null
                ? `, đã có ${formatTy(prefs.availableCashTy)} tỷ sẵn`
                : ""}
              ).
            </>
          ) : (
            "Nhập số tiền vay thêm để xem ước tính trả góp theo lãi suất Big 4."
          )}
        </p>
      </fieldset>

      <fieldset>
        <legend>Điều gì quan trọng hơn với bạn?</legend>
        <p className="lifestyle-prefs-hint">
          Sắp xếp thứ tự — mục trên cùng được ưu tiên khi xếp hạng dự án. Không
          cần kéo thanh số.
        </p>
        <ol className="lifestyle-prefs-rank" aria-label="Thứ tự ưu tiên">
          {priorityOrder.map((key, index) => (
            <li key={key} className="lifestyle-prefs-rank-item">
              <span className="lifestyle-prefs-rank-badge" aria-hidden="true">
                {index + 1}
              </span>
              <div className="lifestyle-prefs-rank-copy">
                <strong>{PREFERENCE_LABELS_VI[key]}</strong>
                <span>{PREFERENCE_HINTS_VI[key]}</span>
              </div>
              <div className="lifestyle-prefs-rank-actions">
                <button
                  type="button"
                  className="lifestyle-prefs-rank-btn"
                  aria-label={`Đưa ${PREFERENCE_LABELS_VI[key]} lên`}
                  disabled={index === 0}
                  onClick={() => movePriority(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="lifestyle-prefs-rank-btn"
                  aria-label={`Đưa ${PREFERENCE_LABELS_VI[key]} xuống`}
                  disabled={index === priorityOrder.length - 1}
                  onClick={() => movePriority(index, 1)}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>
      </fieldset>

      <fieldset>
        <legend>Nơi bạn thường đến (tùy chọn)</legend>
        <input
          type="text"
          placeholder="Ví dụ: Quận 1, trường học…"
          value={prefs.commuteLabel ?? ""}
          onChange={(e) =>
            update({
              ...prefs,
              commuteLabel: e.target.value || undefined,
            })
          }
        />
        <p className="lifestyle-prefs-hint">
          Chưa có định tuyến thời gian thực — bản đồ chỉ tính khoảng cách đường
          chim bay khi có tọa độ.
        </p>
      </fieldset>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setLoanAmountDraft("");
          setCashDraft("");
          update({
            ...DEFAULT_LIFESTYLE,
            weights: { ...DEFAULT_LIFESTYLE.weights },
            priorityOrder: [...(DEFAULT_LIFESTYLE.priorityOrder ?? [])],
          });
        }}
      >
        Đặt lại mặc định
      </button>
    </form>
  );
}
