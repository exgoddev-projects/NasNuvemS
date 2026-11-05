import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const pastasPadrao = [
  "Documentos",
  "Imagens",
  "Vídeos",
  "Músicas",
  "Downloads",
  "Backups",
];

export async function POST() {
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

  const { data: existentes, error: selectError } =
    await supabase
      .from("folders")
      .select("name")
      .eq("user_id", user.id)
      .is("parent_id", null);

  if (selectError) {
    return NextResponse.json(
      { error: selectError.message },
      { status: 500 }
    );
  }

  const nomesExistentes = new Set(
    (existentes ?? []).map((pasta) => pasta.name)
  );

  const novasPastas = pastasPadrao
    .filter((nome) => !nomesExistentes.has(nome))
    .map((nome) => ({
      user_id: user.id,
      name: nome,
      parent_id: null,
    }));

  if (novasPastas.length > 0) {
    const { error: insertError } =
      await supabase
        .from("folders")
        .insert(novasPastas);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    folders: pastasPadrao,
  });
}
