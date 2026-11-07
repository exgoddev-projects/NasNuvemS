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

  const destinationId =
    typeof body.destinationId === "string"
      ? body.destinationId
      : "";

  if (
    ids.length === 0 ||
    !destinationId
  ) {
    return NextResponse.json(
      {
        error:
          "Arquivos ou destino invalidos.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: destination } =
    await supabase
      .from("folders")
      .select("id")
      .eq("id", destinationId)
      .eq("user_id", user.id)
      .single();

  if (!destination) {
    return NextResponse.json(
      {
        error:
          "Pasta de destino nao encontrada.",
      },
      {
        status: 404,
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

  const { error: moveError } =
    await supabase
      .from("files")
      .update({
        folder_id: destinationId,
      })
      .eq("user_id", user.id)
      .in("id", ids);

  if (moveError) {
    return NextResponse.json(
      {
        error: moveError.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    ok: true,
    moved: ids.length,
  });
}
