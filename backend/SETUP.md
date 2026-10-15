# Estado da ativação

Projeto conectado: rwjelyrvhsecryqeqeik. Esquema vitrine_private e bucket vitrine-photos aplicados; três produtos migrados com histórico. site-config.json contém apenas URL e chave publishable pública.

A proprietária foi cadastrada em vitrine_private.owner_emails com o e-mail informado na conversa, sem expor esse endereço neste repositório. is_vitrine_admin consulta auth.users pelo auth.uid(), exige e-mail confirmado e confere a lista privada ou o UUID autorizado em admins. Cadastro público não concede administração automaticamente.

## Único ajuste inicial de retorno

A ferramenta Supabase disponível não oferece alteração da configuração de Auth. No Dashboard, Authentication → URL Configuration → Site URL precisa ser definido como https://clara159321-glitch.github.io/minha-vitrine-shein/admin.html . Não pedir senha, token ou chave secreta à proprietária.

A entrada usa Magic Link padrão, com create_user:true para permitir o primeiro acesso por confirmação de e-mail. O login confirma a sessão em /auth/v1/user e a autorização em is_vitrine_admin. Fragmentos de autenticação são removidos do endereço antes de carregar o catálogo. Não há senha nem persistência de token em disco. A documentação antiga que exigia alterar template OTP não se aplica ao fluxo atual.

Após a proprietária concluir o primeiro login, validar cadastro real com upload, leitura pública, edição e exclusão de um item claramente de teste. O SQL de autorização e a migração foram exercitados no banco real; os testes completos de interface ainda usam serviço simulado. Não afirmar que login/envio real funcionam sem verificar essa etapa.

## Verificações já realizadas

- Catálogo ativo inicializado com três registros.
- Hash e tamanho das imagens migradas preservados.
- Bucket público com limite de 3 MB e formatos JPEG, PNG e WebP.
- Anônimos não executam gravações; autenticados sem autorização são rejeitados.
- Papel autenticado não lê tabela de autorização privada.
- Sete testes de aplicação simulados passam.

O Advisor sinaliza funções SECURITY DEFINER intencionalmente expostas como RPCs: leitura pública deliberada e gravações com verificação explícita de proprietária. Tabelas privadas têm RLS sem políticas, sem concessões diretas a clientes, por isso geram informações de acesso negado por padrão. Não conceder acesso amplo para silenciar esses avisos. A função rls_auto_enable é preexistente ao projeto da vitrine e não foi alterada.

Recuperação: catálogos originais no diretório recovery/ e snapshots em vitrine_private.history. Exclusão é arquivamento; imagens não são apagadas nem sobrescritas pelo painel.
