import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

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

  const folderId =
    typeof body.folderId === "string"
      ? body.folderId
      : "";

  const fileName =
    typeof body.fileName === "string"
      ? body.fileName.trim()
      : "";

  const contentType =
    typeof body.contentType === "string" &&
    body.contentType
      ? body.contentType
      : "application/octet-stream";

  if (!folderId || !fileName) {
    return NextResponse.json(
      { error: "Dados do upload invalidos." },
      { status: 400 }
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

  const safeName = fileName
    .replace(/[\/\\]/g, "_")
    .slice(0, 180);

  const objectKey =
    `users/${user.id}/files/${randomUUID()}-${safeName}`;

  const b2 = createB2Client();

  const command = new PutObjectCommand({
    Bucket: getB2BucketName(),
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(
    b2,
    command,
    {
      expiresIn: 900,
    }
  );

  return NextResponse.json({
    uploadUrl,
    objectKey,
  });
}
