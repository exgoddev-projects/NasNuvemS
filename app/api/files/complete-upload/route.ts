import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Usuario nao autenticado." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const folderId =
    typeof body.folderId === "string"
      ? body.folderId
      : "";

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const mimeType =
    typeof body.mimeType === "string"
      ? body.mimeType
      : null;

  const sizeBytes =
    typeof body.sizeBytes === "number"
      ? body.sizeBytes
      : -1;

  const objectKey =
    typeof body.objectKey === "string"
      ? body.objectKey
      : "";

  const versionId =
    typeof body.versionId === "string"
      ? body.versionId
      : "";

  if (
    !folderId ||
    !name ||
    !objectKey ||
    !versionId ||
    sizeBytes < 0
  ) {
    return NextResponse.json(
      { error: "Dados do arquivo invalidos." },
      { status: 400 }
    );
  }

  const { data: folder } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .single();

  if (!folder) {
    return NextResponse.json(
      { error: "Pasta nao encontrada." },
      { status: 404 }
    );
  }

  const { data: file, error } =
    await supabase
      .from("files")
      .insert({
        user_id: user.id,
        folder_id: folderId,

        name,
        mime_type: mimeType,
        size_bytes: sizeBytes,

        provider: "b2",
        provider_file_id: versionId,
        provider_path: objectKey,
      })
      .select("id, name")
      .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    file,
  });
}
