import { supabase } from "@/lib/supabase";

// 変更の記録（誰が・いつ・何を消したり変えたりしたか）を audit_logs テーブルに残す。
// テーブルがまだない、または記録に失敗しても、元の操作は止めない（記録は補助）。
export async function logAudit(params: {
  action: "delete" | "update" | "insert" | "import";
  table: string;
  recordId?: string | number | null;
  detail?: Record<string, unknown>;
}) {
  try {
    const actor =
      (typeof window !== "undefined" &&
        `${localStorage.getItem("gymup_current_staff_name") || "不明"}（${localStorage.getItem("gymup_user_role") || "-"}）`) ||
      "不明";
    const { error } = await supabase.from("audit_logs").insert({
      action: params.action,
      table_name: params.table,
      record_id: params.recordId === null || params.recordId === undefined ? null : String(params.recordId),
      actor,
      detail: params.detail ?? null,
    });
    if (error) console.warn("audit log skipped:", error.message);
  } catch (e) {
    console.warn("audit log skipped:", e);
  }
}
