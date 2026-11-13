"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import {
  LATE_NIGHT_RATE,
  OVERTIME_RATE,
  PAYROLL_STAFF,
  calcEmploymentInsurance,
  minutesToHM,
  summarizeAttendance,
  summarizeIncentive,
  type AttendanceForPay,
  type SaleForPay,
} from "@/lib/payroll";

// 給与明細（管理者）／今月の自分（スタッフ）
// 打刻（staff_attendance）と売上（sales）から、docs/給与計算ルール.md のルールで計算する。

type AttendanceRow = AttendanceForPay & { id: number; staff_id: string; staff_name: string };

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start: `${month}-01`, end: next };
}

function payDay(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}年1月10日` : `${y}年${m + 1}月10日`;
}

function yen(value: number) {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

export default function SalaryPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [staffName, setStaffName] = useState(Object.keys(PAYROLL_STAFF)[0]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [sales, setSales] = useState<SaleForPay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 手で入れる項目（管理者のみ）
  const [commute, setCommute] = useState("0");
  const [incomeTax, setIncomeTax] = useState("0");
  const [incentiveAdjust, setIncentiveAdjust] = useState("0");

  useEffect(() => {
    if (localStorage.getItem("gymup_logged_in") !== "true") {
      window.location.href = "/login";
      return;
    }
    setIsAdmin(localStorage.getItem("gymup_user_role") === "admin");
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const { start, end } = monthRange(month);
        const [attendanceRes, salesRes] = await Promise.all([
          fetchAllRows<AttendanceRow>((from, to) =>
            supabase
              .from("staff_attendance")
              .select("id, staff_id, staff_name, work_date, clock_in, clock_out, total_work_minutes, overtime_minutes, late_night_minutes")
              .eq("staff_name", staffName)
              .gte("work_date", start)
              .lt("work_date", end)
              .order("work_date", { ascending: true })
              .order("id", { ascending: true })
              .range(from, to)
          ),
          fetchAllRows<SaleForPay>((from, to) =>
            supabase
              .from("sales")
              .select("id, reservation_id, staff_name, store_name, sale_type, memo")
              .eq("staff_name", staffName)
              .gte("sale_date", start)
              .lt("sale_date", end)
              .order("id", { ascending: true })
              .range(from, to)
          ),
        ]);
        if (attendanceRes.error) throw attendanceRes.error;
        if (salesRes.error) throw salesRes.error;
        if (!alive) return;
        setAttendance(attendanceRes.data);
        setSales(salesRes.data);
      } catch (e) {
        console.error(e);
        if (alive) setError(e instanceof Error ? e.message : "読み込みに失敗しました。");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [month, staffName]);

  const config = PAYROLL_STAFF[staffName];
  const work = useMemo(() => summarizeAttendance(attendance), [attendance]);
  const incentive = useMemo(
    () => summarizeIncentive(staffName, sales, config.incentive),
    [staffName, sales, config]
  );

  const wage = config.hourlyWage;
  const basePay = Math.round((work.baseMinutes / 60) * wage);
  const overtimePay = Math.round((work.overtimeMinutes / 60) * wage * OVERTIME_RATE);
  const lateNightPay = Math.round((work.lateNightMinutes / 60) * wage * LATE_NIGHT_RATE);
  const incentivePay = incentive.amount + Number(incentiveAdjust || 0);
  const commutePay = Number(commute || 0);
  const taxable = basePay + incentivePay + overtimePay + lateNightPay;
  const gross = taxable + commutePay;
  const employmentInsurance = calcEmploymentInsurance(gross);
  const tax = Number(incomeTax || 0);
  const deductions = employmentInsurance + tax;
  const net = gross - deductions;

  return (
    <main style={pageStyle} className="salary-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .salary-page { background: #fff !important; padding: 0 !important; }
          .payslip { box-shadow: none !important; border: 1px solid #000 !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>SALARY</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>{isAdmin ? "給与明細" : "今月の自分"}</h1>
          </div>
          <Link href="/attendance" style={linkStyle}>勤怠管理へ</Link>
        </div>

        <section className="no-print" style={cardStyle}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={fieldStyle}>
              <span>月</span>
              <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span>スタッフ</span>
              <select value={staffName} onChange={(e) => setStaffName(e.target.value)} style={inputStyle}>
                {Object.keys(PAYROLL_STAFF).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            {isAdmin ? (
              <>
                <label style={fieldStyle}>
                  <span>通勤手当（実費）</span>
                  <input type="number" value={commute} onChange={(e) => setCommute(e.target.value)} style={inputStyle} />
                </label>
                <label style={fieldStyle}>
                  <span>源泉所得税（甲欄・扶養0人）</span>
                  <input type="number" value={incomeTax} onChange={(e) => setIncomeTax(e.target.value)} style={inputStyle} />
                </label>
                <label style={fieldStyle}>
                  <span>インセンティブの調整（±）</span>
                  <input type="number" value={incentiveAdjust} onChange={(e) => setIncentiveAdjust(e.target.value)} style={inputStyle} />
                </label>
              </>
            ) : null}
          </div>
          {isAdmin ? (
            <div style={noteStyle}>
              源泉所得税は「給与所得の源泉徴収税額表（月額表）」の甲欄・扶養0人で、課税対象額 {yen(taxable - employmentInsurance)}（課税支給 − 雇用保険）の行を見て入力してください。
            </div>
          ) : null}
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {loading ? <div style={cardStyle}>読み込み中...</div> : (
          <>
            {work.missingClockOut > 0 || incentive.unknownMinutes > 0 ? (
              <div className="no-print" style={warnStyle}>
                {work.missingClockOut > 0 ? <div>退勤の打刻がない日が {work.missingClockOut}日 あります（計算に入っていません）。</div> : null}
                {incentive.unknownMinutes > 0 ? <div>施術時間が分からない売上が {incentive.unknownMinutes}件 あります（インセンティブ0円で計算）。必要なら調整欄で足してください。</div> : null}
              </div>
            ) : null}

            <section className="payslip" style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #0f172a", paddingBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>{isAdmin ? "給与明細書" : "今月の勤務とインセンティブ"}（{Number(month.slice(5))}月分）</h2>
                <div style={{ textAlign: "right", fontSize: 13 }}>
                  {isAdmin ? <div>（支払日 {payDay(month)}）</div> : null}
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{staffName} 殿</div>
                </div>
              </div>

              <Block title="勤怠">
                <Row label="出勤日数" value={`${work.workDays}日`} />
                <Row label="出勤時間" value={minutesToHM(work.totalMinutes)} />
                <Row label="残業時間" value={minutesToHM(work.overtimeMinutes)} />
                <Row label="深夜残業" value={minutesToHM(work.lateNightMinutes)} />
              </Block>

              <Block title="施術">
                {incentive.byMinutes.map(([minutes, count]) => (
                  <Row key={minutes} label={`${minutes}分`} value={`${count}件`} />
                ))}
                <Row label="指名" value={`${incentive.nominationCount}件`} />
                <Row label="回数券の販売" value={`${incentive.ticketSaleCount}件`} />
                {config.incentive.stores?.length ? <Row label="対象店舗" value={config.incentive.stores.join("・")} /> : null}
              </Block>

              {isAdmin ? (
                <>
                  <Block title="支給">
                    <Row label={`基本給（${minutesToHM(work.baseMinutes)} × ${wage}円）`} value={yen(basePay)} />
                    <Row label="インセンティブ" value={yen(incentivePay)} />
                    <Row label={`残業手当（×${OVERTIME_RATE}）`} value={yen(overtimePay)} />
                    <Row label={`深夜残業（×${LATE_NIGHT_RATE}）`} value={yen(lateNightPay)} />
                    <Row label="通勤非課税" value={yen(commutePay)} />
                    <Row label="総支給額" value={yen(gross)} strong />
                  </Block>
                  <Block title="控除">
                    <Row label="雇用保険" value={yen(employmentInsurance)} />
                    <Row label="源泉所得税" value={yen(tax)} />
                    <Row label="控除合計" value={yen(deductions)} strong />
                  </Block>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 4px", borderTop: "2px solid #0f172a", fontSize: 18, fontWeight: 800 }}>
                    <span>差引支給額</span>
                    <span>{yen(net)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
                    <span>（事業所名）株式会社LTB</span>
                    <span>今月もご苦労様でした。</span>
                  </div>
                </>
              ) : (
                <Block title="見込み">
                  <Row label="インセンティブ" value={yen(incentive.amount)} strong />
                </Block>
              )}
            </section>

            {isAdmin ? (
              <button className="no-print" type="button" onClick={() => window.print()} style={printButtonStyle}>
                印刷・PDFで保存
              </button>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 6 }}>{title}</div>
      <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", fontWeight: strong ? 800 : 500, fontSize: 14 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "24px 16px 80px", background: "#f1f5f9", color: "#0f172a" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
const fieldStyle: CSSProperties = { display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" };
const inputStyle: CSSProperties = { minHeight: 40, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
const noteStyle: CSSProperties = { marginTop: 10, fontSize: 12, color: "#64748b" };
const warnStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 13, display: "grid", gap: 4 };
const errorStyle: CSSProperties = { padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b" };
const linkStyle: CSSProperties = { padding: "8px 14px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const printButtonStyle: CSSProperties = { minHeight: 46, borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" };
