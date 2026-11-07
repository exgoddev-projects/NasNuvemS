import { NextResponse } from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "Usuario nao autenticado.",
      },
      {
        status: 401,
      }
    );
  }

  const body = await request.json();

  const fileId =
    typeof body.fileId === "string"
      ? body.fileId
      : "";

  if (!fileId) {
    return NextResponse.json(
      {
        error: "Arquivo invalido.",
      },
      {
        status: 400,
      }
    );
  }

  const { error } =
    await supabase
      .from("files")
      .update({
        last_accessed_at:
          new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
