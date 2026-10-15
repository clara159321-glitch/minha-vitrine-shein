# Minha Vitrine — painel simples no celular

Vitrine: https://clara159321-glitch.github.io/minha-vitrine-shein/
Painel: https://clara159321-glitch.github.io/minha-vitrine-shein/admin.html

## Como cadastrar a próxima roupa

Após a conexão inicial:
1. Abra o painel e entre com o código enviado ao seu e-mail autorizado.
2. Toque em “Escolher foto da galeria”.
3. Preencha nome, preço, link de afiliada da SHEIN e categoria.
4. Toque em PUBLICAR PRODUTO e aguarde a mensagem “Publicado!”.

O produto aparece na vitrine sem baixar arquivos e sem entrar no GitHub. Para mudar uma roupa, toque em Editar; para removê-la, toque em Excluir e confirme.

## Uma única configuração inicial ainda necessária

O Supabase precisa ser conectado nesta conversa e configurado para a proprietária. Depois da conexão, a preparação técnica será feita com o esquema em backend/supabase.sql. Abra o painel e siga “Vamos conectar sua publicação”. Quando a conexão estiver pronta, entre com seu e-mail e o código recebido e toque em ATIVAR MEU CATÁLOGO uma única vez. Essa ativação transfere as três roupas preservando fotos e links.

O arquivo site-config.json está intencionalmente sem conexão enquanto não houver projeto autorizado. Por isso, a vitrine já apresenta os três produtos pelo catálogo oficial, mas o painel ainda não pode gravar publicações reais. Não há botão que finja salvar localmente nem exportação para baixar.

Somente URL do projeto e chave pública publishable/anon ficam na configuração. Não coloque service_role, chave secreta, senha ou token de GitHub nesse arquivo. O código de acesso é temporário; a sessão fica em memória e exige novo login após recarregar a página.

## Migração segura dos catálogos

products.json é o único catálogo estático oficial. Ele agora reúne três roupas únicas:
- Macacão feminino preto de um ombro só SHEIN BAE, ID 73513430, referência R$ 108,68. Foto e link continuam pendentes porque faltam nos originais.
- Vestido midi bege de um ombro só, referência R$ 83,90, com foto e link preservados.
- Conjunto de top bandeau e saia longa, referência R$ 193,99, com foto e link preservados.

products .json tinha duas cópias exatamente iguais do conjunto, com IDs diferentes. A duplicata idêntica foi consolidada usando o ID presente em products (3).json. Nenhuma fonte original foi apagada; os arquivos antigos continuam preservados e há cópias exatas em recovery/catalogos-originais/. Consulte recovery/migration-report.json para os hashes e a decisão de migração.

Depois de ativado, o catálogo do serviço passa a ser a fonte compartilhada da vitrine; a versão estática fica como recuperação inicial. Uma lista vazia no serviço permanece vazia, sem ressuscitar produtos excluídos. Erros no serviço geram aviso, sem recorrer silenciosamente a um catálogo antigo.

## Recuperação e segurança

O serviço verifica a proprietária no servidor em cada gravação. Pessoas que apenas visitam o site não podem alterar produtos. Mudanças usam controle de versão para evitar sobrescrever uma edição feita em outra tela. A exclusão é um arquivamento; o histórico privado preserva as versões anteriores e os arquivos de imagem não são apagados pelo painel. Alterações podem ser recuperadas pela administração do serviço.

Novas fotos são reduzidas no celular e enviadas ao armazenamento público de imagens; as fotos existentes embutidas nos catálogos são preservadas. Somente a proprietária pode enviar imagens. Produtos e fotos da vitrine são públicos por definição.

## Validação

Execute node tests/catalog.test.cjs. Sete cenários de teste cobrem migração, validação dos campos, acesso, inicialização, cadastro, edição, exclusão, conflito de versão, perda de conexão/resposta e renderização dos três produtos. O serviço desses testes é simulado: não substitui o teste com Supabase real após conectar.

As duas fotos existentes foram decodificadas e verificadas como JPEGs válidos. Os links SHEIN foram preservados, mas não foi possível verificar o destino externo neste ambiente. A tentativa de iniciar Chromium para QA visual foi bloqueada pelo sandbox; não há validação visual no Chrome Android nesta execução. O funcionamento real de login, envio de fotos e gravação será verificado após a conexão inicial.

## Desenvolvimento e publicação

Sem compilação ou dependências no navegador. GitHub Pages continua servindo a raiz da main, com .nojekyll preservado. Não há mudança na configuração de hospedagem. Para prévia: python3 -m http.server 8000 nesta pasta; abrir http://localhost:8000. Evite abrir por file://.

Detalhes para quem concluir a conexão: backend/SETUP.md.

