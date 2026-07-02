import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPkPass, isWalletConfigured } from "@/lib/wallet";
import type { CustomerStats } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isWalletConfigured()) {
    return NextResponse.json(
      { error: "Apple Wallet no está configurado en este entorno." },
      { status: 503 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_stats")
    .select("*")
    .eq("id", id)
    .single<CustomerStats>();

  if (error || !data) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    const buffer = await buildPkPass({
      stats: data,
      qrMessage: `${appUrl}/${data.business_slug}/card/${data.id}`,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="lealtad-${data.member_no}.pkpass"`,
      },
    });
  } catch (err) {
    console.error("Error generando .pkpass:", err);
    return NextResponse.json(
      { error: "No se pudo generar el pase." },
      { status: 500 },
    );
  }
}
