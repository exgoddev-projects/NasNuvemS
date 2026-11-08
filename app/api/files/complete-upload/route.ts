import { NextResponse } from "next/server";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

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
    sizeBytes < 0
  ) {
    return NextResponse.json(
      { error: "Dados do arquivo invalidos." },
      { status: 400 }
    );
  }

  // O objeto precisa estar na area do proprio usuario.
  const prefixoDoUsuario = `users/${user.id}/files/`;

  if (
    !objectKey.startsWith(prefixoDoUsuario) ||
    objectKey.includes("..")
  ) {
    return NextResponse.json(
      { error: "Arquivo invalido." },
      { status: 403 }
    );
  }

  // Confirma no B2 que o objeto existe e usa os dados reais dele.
  let tamanhoReal = sizeBytes;
  let versaoReal = versionId;
  let tipoReal = mimeType;

  try {
    const head = await createB2Client().send(
      new HeadObjectCommand({
        Bucket: getB2BucketName(),
        Key: objectKey,
      })
    );

    if (typeof head.ContentLength === "number") {
      tamanhoReal = head.ContentLength;
    }

    if (head.VersionId) {
      versaoReal = head.VersionId;
    }

    if (head.ContentType) {
      tipoReal = head.ContentType;
    }
  } catch {
    return NextResponse.json(
      { error: "Arquivo nao encontrado no storage." },
      { status: 400 }
    );
  }

  if (!versaoReal) {
    return NextResponse.json(
      { error: "O storage nao informou a versao do arquivo." },
      { status: 502 }
    );
  }

  const { data: folder } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
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
        mime_type: tipoReal,
        size_bytes: tamanhoReal,

        provider: "b2",
        provider_file_id: versaoReal,
        provider_path: objectKey,
      })
      .select("id, name")
      .single();

  if (error) {
    // 23505 = objeto ja registrado (indice unico em provider_path)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Este arquivo ja foi registrado." },
        { status: 409 }
      );
    }

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
