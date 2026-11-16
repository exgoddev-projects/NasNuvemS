type PastaSimples = {
  id: string;
  name: string;
  parent_id: string | null;
};

/**
 * Retorna o caminho ate a pasta mae informada, por exemplo:
 * "Meus arquivos › Imagens". Passe o parent_id da pasta
 * que voce quer descrever.
 */
export function caminhoDaPasta(
  parentId: string | null,
  pastas: PastaSimples[]
) {
  const porId = new Map<string, PastaSimples>(
    pastas.map((pasta): [string, PastaSimples] => [
      pasta.id,
      pasta,
    ])
  );

  const nomes: string[] = [];
  const visitadas = new Set<string>();
  let atual = parentId ? porId.get(parentId) : undefined;

  while (atual && !visitadas.has(atual.id)) {
    visitadas.add(atual.id);
    nomes.unshift(atual.name);

    atual = atual.parent_id
      ? porId.get(atual.parent_id)
      : undefined;
  }

  return ["Meus arquivos", ...nomes].join(" › ");
}
