import { NextResponse } from "next/server";
import { createEntity, isEmail, pickFields } from "@/lib/base44";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const data = pickFields(body, { name: 200, email: 320, company: 200, service_interest: 100, message: 5000 });

  if (!data.name || !data.message || !isEmail(data.email)) {
    return NextResponse.json({ error: "Please provide your name, a valid email and a message." }, { status: 400 });
  }

  try {
    await createEntity("Inquiry", { ...data, service_interest: data.service_interest || "General Inquiry" });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not send your inquiry." }, { status: 502 });
  }
}
