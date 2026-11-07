import { NextResponse } from "next/server";

import {
  DeleteObjectsCommand,
  HeadObjectCommand,
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

  if (ids.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhum arquivo selecionado.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: files, error: filesError } =
    await supabase
      .from("files")
      .select(
        "id, name, provider, provider_file_id, provider_path"
      )
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
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
          "Um ou mais arquivos nao foram encontrados na lixeira.",
      },
      {
        status: 404,
      }
    );
  }

  const invalido = files.some(
    (file) =>
      file.provider !== "b2" ||
      !file.provider_path
  );

  if (invalido) {
    return NextResponse.json(
      {
        error:
          "Um ou mais arquivos nao possuem dados validos do storage.",
      },
      {
        status: 400,
      }
    );
  }

  const b2 = createB2Client();
  const bucket = getB2BucketName();

  const objetos: Array<{
    Key: string;
    VersionId: string;
  }> = [];

  for (const file of files) {
    const metadata = await b2.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: file.provider_path!,
      })
    );

    const versionId =
      metadata.VersionId ||
      file.provider_file_id;

    if (!versionId) {
      return NextResponse.json(
        {
          error:
            `Nao foi possivel identificar a versao de ${file.name}.`,
        },
        {
          status: 502,
        }
      );
    }

    objetos.push({
      Key: file.provider_path!,
      VersionId: versionId,
    });
  }

  const response = await b2.send(
    new DeleteObjectsCommand({
      Bucket: bucket,

      Delete: {
        Objects: objetos,
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
            message: item.Message,
          })
        ),
      },
      {
        status: 502,
      }
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
          "O arquivo foi removido do storage, mas houve erro ao remover o registro: " +
          deleteError.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: ids.length,
  });
}
