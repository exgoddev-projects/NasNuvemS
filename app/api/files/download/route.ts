import { NextResponse } from "next/server";
import {
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  PassThrough,
  Readable,
} from "node:stream";

import { ZipArchive } from "archiver";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

import {
  createClient,
} from "@/lib/supabase/server";


function nomeSeguro(name: string) {
  const sanitized = name
    .replace(/[\/\\:*?"<>|]/g, "_")
    .trim();

  return sanitized || "arquivo";
}

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

  const formData = await request.formData();

  const ids = Array.from(
    new Set(
      formData
        .getAll("ids")
        .filter(
          (id): id is string =>
            typeof id === "string" &&
            id.length > 0
        )
    )
  );

  if (ids.length === 0) {
    return NextResponse.json(
      {
        error: "Nenhum arquivo selecionado.",
      },
      {
        status: 400,
      }
    );
  }

  const { data: files, error } =
    await supabase
      .from("files")
      .select(
        "id, name, provider, provider_path"
      )
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

  if (!files || files.length !== ids.length) {
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

  const invalido = files.some(
    (file) =>
      file.provider !== "b2" ||
      !file.provider_path
  );

  if (invalido) {
    return NextResponse.json(
      {
        error:
          "Um ou mais arquivos usam um provider ainda nao suportado.",
      },
      {
        status: 400,
      }
    );
  }

  const b2 = createB2Client();
  const bucket = getB2BucketName();

  /*
   * Um único arquivo:
   * redireciona para uma URL privada temporária.
   */
  if (files.length === 1) {
    const file = files[0];

    const object = await b2.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: file.provider_path!,
      })
    );

    if (!object.Body) {
      return NextResponse.json(
        {
          error:
            "Nao foi possivel ler o arquivo.",
        },
        {
          status: 502,
        }
      );
    }

    const nodeStream = Readable.from(
      object.Body as AsyncIterable<Uint8Array>
    );

    const body = Readable.toWeb(
      nodeStream
    ) as ReadableStream<Uint8Array>;

    const encodedName =
      encodeURIComponent(file.name);

    return new Response(body, {
      headers: {
        "Content-Type":
          object.ContentType ||
          "application/octet-stream",

        "Content-Disposition":
          `attachment; filename*=UTF-8''${encodedName}`,

        "Cache-Control":
          "private, no-store",
      },
    });
  }

  /*
   * Vários arquivos:
   * cria um ZIP em streaming.
   */
  const output = new PassThrough();

  const archive = new ZipArchive({
    zlib: {
      level: 6,
    },
  });

  archive.pipe(output);

  archive.on("warning", (warning) => {
    console.warn(
      "Aviso durante a criacao do ZIP:",
      warning
    );
  });

  archive.on("error", (archiveError) => {
    console.error(
      "Erro durante a criacao do ZIP:",
      archiveError
    );

    output.destroy(archiveError);
  });

  void (async () => {
    try {
      const nomesUsados = new Map<string, number>();

      for (const file of files) {
        const response = await b2.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: file.provider_path!,
          })
        );

        if (!response.Body) {
          throw new Error(
            `Nao foi possivel ler ${file.name}.`
          );
        }

        const baseName = nomeSeguro(file.name);
        const count =
          nomesUsados.get(baseName) ?? 0;

        nomesUsados.set(
          baseName,
          count + 1
        );

        const zipName =
          count === 0
            ? baseName
            : `${count + 1}-${baseName}`;

        const nodeStream = Readable.from(
          response.Body as AsyncIterable<Uint8Array>
        );

        archive.append(
          nodeStream,
          {
            name: zipName,
          }
        );
      }

      await archive.finalize();
    } catch (downloadError) {
      const normalized =
        downloadError instanceof Error
          ? downloadError
          : new Error(
              "Falha ao preparar o download."
            );

      console.error(
        "Erro ao preparar ZIP:",
        normalized
      );

      archive.destroy(normalized);
      output.destroy(normalized);
    }
  })();

  const body = Readable.toWeb(
    output
  ) as ReadableStream<Uint8Array>;

  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        'attachment; filename="NasNuvemS-download.zip"',
      "Cache-Control":
        "private, no-store",
    },
  });
}
