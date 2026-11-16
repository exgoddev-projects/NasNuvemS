# ☁️ NasNuvemS

**NasNuvemS** é um projeto de NAS pessoal na nuvem, criado para oferecer uma interface simples para armazenar, organizar, visualizar e gerenciar arquivos usando serviços de armazenamento em nuvem.

⚠️ **Projeto em desenvolvimento**

O NasNuvemS ainda está sendo desenvolvido e não deve ser considerado uma versão final ou pronta para produção. Funcionalidades, arquitetura, interface e integrações podem mudar durante o desenvolvimento.

## 🚀 Estado atual

O projeto já possui suporte a:

- autenticação de usuários;
- pastas e subpastas;
- upload de arquivos;
- armazenamento privado;
- mover e renomear arquivos;
- seleção múltipla;
- download individual;
- download múltiplo;
- favoritos;
- arquivos recentes;
- busca;
- lixeira de arquivos e pastas;
- restauração;
- exclusão definitiva;
- visualização de imagens;
- reprodução de vídeos;
- reprodução de áudio;
- visualização de PDFs.

## 🗂️ Organização dos arquivos

O NasNuvemS separa a organização lógica dos arquivos do armazenamento físico.

As pastas visíveis para o usuário são gerenciadas pelo banco de dados. Mover um arquivo entre pastas não exige mover fisicamente os bytes no provedor de armazenamento.

Essa arquitetura também prepara o projeto para trabalhar futuramente com múltiplos provedores de armazenamento.

## 🛠️ Tecnologias

O projeto utiliza atualmente:

- **Next.js**
- **React**
- **TypeScript**
- **Supabase**
    - autenticação;
    - PostgreSQL;
    - Row Level Security (RLS).
- **Backblaze B2**
    - armazenamento privado de objetos;
    - API compatível com S3.
- **AWS SDK for JavaScript**
- **Vercel**
- **Tailwind CSS**

## 🔐 Segurança

Arquivos enviados ao storage permanecem privados.

O projeto utiliza URLs temporárias assinadas para permitir acesso controlado a previews e mídia sem tornar permanentemente públicos os objetos armazenados.

Credenciais e segredos ficam fora do repositório e não devem ser adicionados ao Git.

O arquivo .env.example serve apenas como referência das variáveis necessárias. Credenciais reais devem permanecer em .env.local ou em mecanismos seguros de configuração do ambiente.

## 🗑️ Lixeira

A exclusão normal utiliza um modelo de *soft delete*.

Isso permite:

1. mover arquivos e pastas para a Lixeira;
2. visualizar itens excluídos;
3. restaurar itens;
4. excluir definitivamente quando necessário.

A exclusão definitiva também remove os objetos correspondentes do armazenamento físico.

## 🧭 Próximos objetivos

Algumas das próximas etapas planejadas incluem:

- drag\-and\-drop;
- movimentação mais natural de arquivos e pastas;
- melhorias de interface;
- suporte a múltiplos provedores de armazenamento;
- múltiplas contas/providers;
- roteamento inteligente de armazenamento;
- evolução das políticas de backup e lixeira.

## 💻 Desenvolvimento local

Instale as dependências:

npm ci

Crie seu .env.local a partir das variáveis documentadas em .env.example.

Execute em desenvolvimento:

npm run dev

Depois abra:

[http://localhost:3000](http://localhost:3000)

Para validar o build:

npm run build \-\- \-\-webpack

## 📌 Status

**Em desenvolvimento ativo.**

Este repositório representa o progresso atual do NasNuvemS. Ainda haverá mudanças antes de uma versão considerada estável para uso final.


