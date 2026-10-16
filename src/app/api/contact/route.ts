import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  // Anti-abuse: 5 contact messages per 10 minutes per IP (counted before
  // validation so invalid-payload floods are throttled too).
  const rl = await checkRateLimit(request, "contact", 5, 600);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "نام باید حداقل ۲ حرف باشد";
    if (!EMAIL_RE.test(email)) errors.email = "ایمیل معتبر نیست";
    if (subject.length < 3) errors.subject = "موضوع باید حداقل ۳ حرف باشد";
    if (message.length < 10) errors.message = "پیام باید حداقل ۱۰ حرف باشد";
    if (message.length > 5000) errors.message = "پیام بیش از حد طولانی است";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "اطلاعات فرم معتبر نیست", errors },
        { status: 400 }
      );
    }

    const id = await store.createMessage({ name, email, subject, message });

    return NextResponse.json({
      ok: true,
      id,
      message: "پیام شما با موفقیت ثبت شد. به‌زودی پاسخ می‌دهم!",
    });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json({ error: "خطای سرور در ثبت پیام" }, { status: 500 });
  }
}
