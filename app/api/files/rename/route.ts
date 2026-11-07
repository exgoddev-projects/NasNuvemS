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

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  if (!fileId || !name) {
    return NextResponse.json(
      {
        error: "Nome ou arquivo invalido.",
      },
      {
        status: 400,
      }
    );
  }

  if (name.length > 180) {
    return NextResponse.json(
      {
        error:
          "O nome do arquivo e muito longo.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: file } =
    await supabase
      .from("files")
      .select("id")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

  if (!file) {
    return NextResponse.json(
      {
        error: "Arquivo nao encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  const { error } =
    await supabase
      .from("files")
      .update({
        name,
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
    name,
  });
}
