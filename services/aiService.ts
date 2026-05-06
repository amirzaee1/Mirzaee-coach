import { GoogleGenAI } from '@google/genai';
import { RankedPerson } from '../types';
import { GEMINI_MODEL } from '../constants';
import { formatNumber } from '../utils/date';

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = (process.env.API_KEY ?? process.env.GEMINI_API_KEY) ?? '';
    if (!apiKey) throw new Error('کلید API یافت نشد');
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export type MessageStyle = 'competitive' | 'encouraging' | 'top-of-day' | 'weekly-fire';

export async function generateMotivationalMessage(
  topToday: RankedPerson[],
  topWeek: RankedPerson[],
  style: MessageStyle
): Promise<string> {
  const client = getAI();

  const todayLeader = topToday[0];
  const weekLeader = topWeek[0];
  const weekSecond = topWeek[1];
  const gap = weekLeader && weekSecond ? weekLeader.weekScore - weekSecond.weekScore : 0;

  const styleDesc =
    style === 'competitive' ? 'رقابتی و داغ — حس فوریت و رقابت ایجاد کن' :
    style === 'encouraging' ? 'تشویقی و الهام‌بخش — انگیزه اقدام بده' :
    style === 'top-of-day' ? 'تقدیر از نفر برتر امروز — اسمشو بزن' :
    'انگیزشی برای رقابت هفته — بگو هنوز بازی بازه';

  const prompt = `تو مدیر یک سازمان شبکه‌ای ایرانی هستی و می‌خوای یک پیام انگیزشی کوتاه برای گروه تلگرام/واتساپ تیمت بنویسی.

اطلاعات واقعی امروز:
- نفر اول امروز: ${todayLeader ? `${todayLeader.person.firstName} ${todayLeader.person.lastName} با ${formatNumber(todayLeader.todayScore)} امتیاز` : 'هنوز ثبتی نیست'}
- نفر اول هفته: ${weekLeader ? `${weekLeader.person.firstName} ${weekLeader.person.lastName} با ${formatNumber(weekLeader.weekScore)} امتیاز` : 'هنوز ثبتی نیست'}
- نفر دوم هفته: ${weekSecond ? `${weekSecond.person.firstName} ${weekSecond.person.lastName} با ${formatNumber(weekSecond.weekScore)} امتیاز` : '-'}
- فاصله نفر اول و دوم هفته: ${formatNumber(gap)} امتیاز
- تاپ ۵ هفته: ${topWeek.slice(0, 5).map((p, i) => `${i + 1}. ${p.person.firstName} (${formatNumber(p.weekScore)})`).join('، ')}

نوع پیام: ${styleDesc}

قوانین نوشتن:
- فارسی محاوره‌ای و زنده
- ۳ تا ۵ خط کوتاه
- از اسم واقعی افراد استفاده کن
- لحن رقابتی، آتشین، الهام‌بخش
- مناسب ارسال در پیام‌رسان
- از ایموجی مناسب استفاده کن
- هیچ توضیح یا مقدمه‌ای ندی — مستقیم متن پیام رو بنویس`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return response.text?.trim() ?? 'پیام تولید نشد';
}
