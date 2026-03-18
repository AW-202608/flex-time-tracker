import { isWeekend, getMonth, getDate, getYear } from 'date-fns';
import * as JapaneseHolidays from 'japanese-holidays';

export interface ParsedTimeResult {
  startTime: string;
  endTime: string;
  actualMinutes: number;
  surplusDeficitMinutes: number;
}

/**
 * 全角および半角の時刻文字列を解析し、勤務時間を分単位で計算します。
 * Accepts formats like: 10:00-19:00, １０：００～１９：００
 */
export function parseWorkTime(input: string, breakMinutes?: number): ParsedTimeResult | null {
  if (!input) return null;

  // 全角文字を半角文字に変換する
  let normalized = input.replace(/[！-～]/g, (r) =>
    String.fromCharCode(r.charCodeAt(0) - 0xFEE0)
  );

  // さまざまなダッシュ/チルダ記号を標準ハイフンに変換します
  normalized = normalized.replace(/[ー〜~－]/g, '-').replace(/\s+/g, '');

  // 正規表現（HH:MM-HH:MM）を使用して時刻を抽出します。
  const regex = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
  const match = normalized.match(regex);

  if (!match) return null;

  const startH = parseInt(match[1], 10);
  const startM = parseInt(match[2], 10);
  const endH = parseInt(match[3], 10);
  const endM = parseInt(match[4], 10);

  // 時間の入力制限（32時以上、または60分以上の数値はエラーとする）
  if (startH >= 32 || startM >= 60 || endH >= 32 || endM >= 60) return null;

  // 5分単位ではない場合エラーとする
  if (startM % 5 !== 0 || endM % 5 !== 0) return null;

  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;

  // 終了時間が開始時間以下の場合はエラーとするチェックを追加
  if (endTotal <= startTotal) {
    return null;
  }

  // 休憩時間の設定（デフォルト値は60分とする）
  const BREAK_MINUTES = breakMinutes ?? 60;
  let actualMinutes = (endTotal - startTotal) - BREAK_MINUTES;

  // 労働時間が1時間未満（休憩を引いてマイナス）になる場合は、0分として扱う
  if (actualMinutes < 0) actualMinutes = 0;

  // 標準の労働時間は8時間（480分）と定義する
  const STANDARD_MINUTES = 8 * 60;
  const surplusDeficitMinutes = actualMinutes - STANDARD_MINUTES;

  const formatTime = (h: number, m: number) => {
    // Keep > 24 hours format if entered that way (e.g. 25:00)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return {
    startTime: formatTime(startH, startM),
    endTime: formatTime(endH, endM),
    actualMinutes,
    surplusDeficitMinutes
  };
}

/**
 * 分単位の数値を読みやすい文字列に変換します (例: 150 -> "2時間30分", -30 -> "-0時間30分")
 */
export function formatMinutes(minutes: number, showSign = false): string {
  const isNegative = minutes < 0;
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;

  let result = `${h}時間`;
  if (m > 0) result += `${m}分`;
  else result += `00分`;

  if (isNegative) return `-${result}`;
  if (showSign && minutes > 0) return `+${result}`;
  return result;
}

/**
 * 指定された日付が「休日」かどうかを判定します （土日、日本の祝日、年末年始 12/30～1/4 を含みます）
 */
export function isHoliday(date: Date): boolean {
  if (isWeekend(date)) return true;

  const month = getMonth(date) + 1; // 0-indexed to 1-indexed
  const day = getDate(date);

  // 年末年始の特別休暇（12月30日以降、または1月4日以前）かどうかをチェック
  if ((month === 12 && day >= 30) || (month === 1 && day <= 4)) {
    return true;
  }

  // ライブラリを使って「日本の国民の祝日」かどうかをチェック
  if (JapaneseHolidays.isHoliday(date)) {
    return true;
  }

  return false;
}

/**
 * 指定された年月における「標準の合計労働時間（分）」を計算します。
 */
export function getStandardWorkingMinutes(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    if (!isHoliday(date)) workingDays++;
  }
  return workingDays * 8 * 60;
}

/**
 * 今月の「現時点までの累計労働時間」を計算します。
 * - 入力済みの日は、その時間をそのまま使う
 * - 未入力の平日は、今日まで（または月末まで）を「8時間」として仮計算する
 */
export function getCumulativeActualMinutes(
  year: number,
  month: number,
  loggedDates: Set<string>,
  getActualMinutes: (dateStr: string) => number
): number {
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cutoffDay = isCurrentMonth ? today.getDate() : daysInMonth;

  let total = 0;
  for (let i = 1; i <= cutoffDay; i++) {
    const date = new Date(year, month - 1, i);
    if (isHoliday(date)) continue;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    if (loggedDates.has(dateStr)) {
      total += getActualMinutes(dateStr);
    } else {
      total += 8 * 60; // standard 8h for unlogged days
    }
  }
  return total;
}

/**
 * 今日（または月末）までに経過した「標準的な労働時間（分）」を計算します。
 */
export function getElapsedWorkingMinutes(year: number, month: number): number {
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cutoffDay = isCurrentMonth ? today.getDate() : daysInMonth;

  let workingDays = 0;
  for (let i = 1; i <= cutoffDay; i++) {
    const date = new Date(year, month - 1, i);
    if (!isHoliday(date)) workingDays++;
  }
  return workingDays * 8 * 60;
}
