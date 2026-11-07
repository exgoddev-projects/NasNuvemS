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

  const ids = Array.isArray(body.ids)
    ? Array.from(
        new Set(
          body.ids.filter(
            (id: unknown): id is string =>
              typeof id === "string" &&
              id.length > 0
          )
        )
      )
    : [];

  const favorite =
    typeof body.favorite === "boolean"
      ? body.favorite
      : null;

  if (
    ids.length === 0 ||
    favorite === null
  ) {
    return NextResponse.json(
      {
        error: "Dados invalidos.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: files, error: filesError } =
    await supabase
      .from("files")
      .select("id")
      .eq("user_id", user.id)
      .in("id", ids);

  if (filesError) {
    return NextResponse.json(
      {
        error: filesError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (
    !files ||
    files.length !== ids.length
  ) {
    return NextResponse.json(
      {
        error:
          "Um ou mais arquivos nao foram encontrados.",
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
        is_favorite: favorite,
      })
      .eq("user_id", user.id)
      .in("id", ids);

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
    updated: ids.length,
    favorite,
  });
}
