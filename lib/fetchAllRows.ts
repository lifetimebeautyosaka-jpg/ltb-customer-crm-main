// Supabase は1回の select で最大1000行しか返さない（プロジェクトの既定値）。
// 一覧や集計で全件が必要なときは、この関数で1000行ずつ .range() して最後まで読む。
// 並び順が同じ値で揺れるとページの境目で重複・欠落するので、order の最後に id を入れておくこと。
export const SUPABASE_PAGE_SIZE = 1000;

export async function fetchAllRows<T = any>(
  buildQuery: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<{ data: T[]; error: any }> {
  const all: T[] = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await buildQuery(
      from,
      from + SUPABASE_PAGE_SIZE - 1
    );

    if (error) return { data: all, error };

    const rows = data || [];
    all.push(...rows);

    if (rows.length < SUPABASE_PAGE_SIZE) break;
  }

  return { data: all, error: null };
}
