import { NextResponse } from "next/server";
import {
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

import {
  createClient,
} from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Usuario nao autenticado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const b2 = createB2Client();
    const bucket = getB2BucketName();

    const response = await b2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 10,
      })
    );

    return NextResponse.json({
      ok: true,
      provider: "backblaze-b2",
      bucket,
      objectCount:
        response.Contents?.length ?? 0,
    });
  } catch (error) {
    console.error(
      "Erro ao testar Backblaze B2:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      },
      {
        status: 500,
      }
    );
  }
}
