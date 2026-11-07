import { NextResponse } from "next/server";
import {
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

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
      { error: "Usuario nao autenticado." },
      { status: 401 }
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

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Nenhum arquivo selecionado." },
      { status: 400 }
    );
  }

  const { data: files, error: filesError } =
    await supabase
      .from("files")
      .select(
        "id, provider, provider_file_id, provider_path"
      )
      .eq("user_id", user.id)
      .in("id", ids);

  if (filesError) {
    return NextResponse.json(
      { error: filesError.message },
      { status: 500 }
    );
  }

  if (!files || files.length !== ids.length) {
    return NextResponse.json(
      {
        error:
          "Um ou mais arquivos nao foram encontrados.",
      },
      { status: 404 }
    );
  }

  const invalido = files.some(
    (file) =>
      file.provider !== "b2" ||
      !file.provider_path ||
      !file.provider_file_id
  );

  if (invalido) {
    return NextResponse.json(
      {
        error:
          "Um ou mais arquivos nao possuem dados completos do storage.",
      },
      { status: 400 }
    );
  }

  const b2 = createB2Client();

  const response = await b2.send(
    new DeleteObjectsCommand({
      Bucket: getB2BucketName(),

      Delete: {
        Objects: files.map((file) => ({
          Key: file.provider_path!,
          VersionId: file.provider_file_id!,
        })),

        Quiet: false,
      },
    })
  );

  if (
    response.Errors &&
    response.Errors.length > 0
  ) {
    return NextResponse.json(
      {
        error:
          "O storage nao conseguiu excluir um ou mais arquivos.",
        details: response.Errors.map(
          (item) => ({
            key: item.Key,
            code: item.Code,
          })
        ),
      },
      { status: 502 }
    );
  }

  const { error: deleteError } =
    await supabase
      .from("files")
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

  if (deleteError) {
    return NextResponse.json(
      {
        error:
          "Os arquivos foram removidos do storage, mas houve erro ao remover os metadados: " +
          deleteError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: ids.length,
  });
}
