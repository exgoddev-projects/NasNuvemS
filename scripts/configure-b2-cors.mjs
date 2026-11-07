import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
  override: true,
});

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Variavel ${name} nao configurada.`
    );
  }

  return value;
}

const keyId = required("B2_ADMIN_KEY_ID");
const applicationKey = required(
  "B2_ADMIN_APPLICATION_KEY"
);
const bucketName = required("B2_BUCKET_NAME");

try {
  // 1. Autoriza a chave administrativa
  const basic = Buffer.from(
    `${keyId}:${applicationKey}`
  ).toString("base64");

  const authResponse = await fetch(
    "https://api.backblazeb2.com/b2api/v4/b2_authorize_account",
    {
      headers: {
        Authorization: `Basic ${basic}`,
      },
    }
  );

  const auth = await authResponse.json();

  if (!authResponse.ok) {
    throw new Error(
      auth.message ||
        auth.code ||
        "Falha na autenticacao."
    );
  }

  const accountId = auth.accountId;
  const storage = auth.apiInfo?.storageApi;

  if (!storage?.apiUrl) {
    throw new Error(
      "API de armazenamento nao encontrada."
    );
  }

  const token = auth.authorizationToken;

  // 2. Localiza o bucket nasnuvems
  const listResponse = await fetch(
    `${storage.apiUrl}/b2api/v4/b2_list_buckets`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        bucketName,
      }),
    }
  );

  const listData =
    await listResponse.json();

  if (!listResponse.ok) {
    throw new Error(
      listData.message ||
        listData.code ||
        "Falha ao localizar bucket."
    );
  }

  const bucket = listData.buckets?.[0];

  if (!bucket) {
    throw new Error(
      `Bucket ${bucketName} nao encontrado.`
    );
  }

  // 3. Define CORS definitivo
  const corsRules = [
    {
      corsRuleName: "nasnuvems-local",
      allowedOrigins: [
        "http://localhost:3000",
      ],
      allowedHeaders: ["*"],
      allowedOperations: [
        "s3_put",
        "s3_get",
        "s3_delete",
        "s3_head",
        "s3_post",
      ],
      exposeHeaders: [
    "ETag",
    "x-amz-request-id",
    "x-amz-version-id",
],

      maxAgeSeconds: 3600,
    },
    {
      corsRuleName: "nasnuvems-production",
      allowedOrigins: [
        "https://nasnuvems.vercel.app",
      ],
      allowedHeaders: ["*"],
      allowedOperations: [
        "s3_put",
        "s3_get",
        "s3_delete",
        "s3_head",
        "s3_post",
      ],
      exposeHeaders: [
        "ETag",
        "x-amz-request-id",
      ],
      maxAgeSeconds: 3600,
    },
  ];

  // 4. Atualiza o bucket pela API nativa
  const updateResponse = await fetch(
    `${storage.apiUrl}/b2api/v4/b2_update_bucket`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        bucketId: bucket.bucketId,
        corsRules,
      }),
    }
  );

  const updateData =
    await updateResponse.json();

  if (!updateResponse.ok) {
    console.error("CORS ERRO:");
    console.error(
      updateData.code,
      updateData.message
    );
    process.exit(1);
  }

  console.log("CORS OK");
  console.log(
    "Bucket:",
    updateData.bucketName
  );

  for (
    const rule of updateData.corsRules ?? []
  ) {
    console.log(
      "Regra:",
      rule.corsRuleName
    );
    console.log(
      "Origens:",
      rule.allowedOrigins
    );
    console.log(
      "Operacoes:",
      rule.allowedOperations
    );
  }
} catch (error) {
  console.error("CORS ERRO:");

  console.error(
    error instanceof Error
      ? error.message
      : error
  );
}
