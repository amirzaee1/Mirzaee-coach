export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getWeekStart(): string {
  const now = new Date();
  // Persian week starts on Saturday (JS day 6)
  const day = now.getDay(); // 0=Sun, 6=Sat
  const daysFromSaturday = (day + 1) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - daysFromSaturday);
  return `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
}

export function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function toJalali(date: Date): [number, number, number] {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let g_d_no =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400);
  for (let i = 0; i < gm - 1; i++) g_d_no += g_days_in_month[i];
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) g_d_no++;
  g_d_no += gd;
  let j_d_no = g_d_no - 79;
  const j_np = Math.floor(j_d_no / 12053);
  j_d_no %= 12053;
  let jy = 979 + 33 * j_np + 4 * Math.floor(j_d_no / 1461);
  j_d_no %= 1461;
  if (j_d_no >= 366) {
    jy += Math.floor((j_d_no - 1) / 365);
    j_d_no = (j_d_no - 1) % 365;
  }
  let i = 0;
  for (; i < 11 && j_d_no >= j_days_in_month[i]; i++) j_d_no -= j_days_in_month[i];
  return [jy, i + 1, j_d_no + 1];
}

const JALALI_MONTHS = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
];

export function formatJalaliDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const [jy, jm, jd] = toJalali(date);
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

export function formatJalaliDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const [jy, jm, jd] = toJalali(date);
  return `${jd}/${jm}/${jy}`;
}

export function formatJalaliDateTime(isoString: string): string {
  const date = new Date(isoString);
  const [jy, jm, jd] = toJalali(date);
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}،  ساعت ${h}:${min}`;
}

export function getTodayJalali(): string {
  return formatJalaliDate(getTodayDate());
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('fa-IR');
  return n.toFixed(1).replace(/\.?0+$/, '').replace('.', '٫');
}

export function formatToman(n: number): string {
  return n.toLocaleString('fa-IR') + ' تومان';
}
