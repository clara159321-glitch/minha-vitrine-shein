> A opção recomendada agora é ENTRAR COM GITHUB: gratuita, sem SMTP ou domínio próprio para o login. O botão está preparado, mas ainda é necessário registrar e autorizar o aplicativo GitHub no Supabase uma única vez. Não foi certificado o login real. Veja backend/GITHUB-LOGIN.md. As alternativas anteriores não são obrigatórias.

> Atualização de acesso: a entrada principal agora é por e-mail e senha, usando o Supabase Auth e a mesma autorização de proprietária. O link de e-mail é opcional e mantém sua cota. O teste real de senha no celular ainda precisa ser confirmado pela proprietária; veja backend/LOGIN-LIMITS.md. Nenhuma senha foi lida ou alterada.

# Minha Vitrine — painel simples no celular

Vitrine: https://clara159321-glitch.github.io/minha-vitrine-shein/
Painel: https://clara159321-glitch.github.io/minha-vitrine-shein/admin.html

## Como cadastrar a próxima roupa

Após a conexão inicial:
1. Abra o painel e entre com seu e-mail e a senha do acesso à vitrine. Não envie sua senha nesta conversa.
2. Toque em “Escolher foto da galeria”.
3. Preencha nome, preço, link de afiliada da SHEIN e categoria.
4. Toque em PUBLICAR PRODUTO e aguarde a mensagem “Publicado!”.

O produto aparece na vitrine sem baixar arquivos e sem entrar no GitHub. Para mudar uma roupa, toque em Editar; para removê-la, toque em Excluir e confirme.

## Conexão do Supabase

O projeto Supabase foi conectado. Banco, histórico privado, armazenamento de fotos e permissões foram aplicados. As três roupas foram copiadas para o catálogo ativo, preservando fotos e links. A configuração pública do site contém somente a URL e uma chave publishable, nunca service_role ou senha.

O acesso da proprietária é autorizado por uma lista privada no banco, comparada com o e-mail confirmado de auth.users; nenhuma decisão usa user_metadata. A conta pode ser criada pelo fluxo de confirmação de e-mail, mas somente o e-mail previamente autorizado recebe administração.

Pendente para o primeiro acesso: no Supabase Authentication → URL Configuration, definir Site URL como https://clara159321-glitch.github.io/minha-vitrine-shein/admin.html . Depois, abrir o painel, informar o e-mail autorizado e tocar em RECEBER LINK DE ACESSO. No e-mail, tocar em Confirm your email ou Log in para retornar ao painel. Não há necessidade de alterar templates HTML para essa entrada. A personalização de configurações de Auth não está disponível nas ferramentas conectadas desta sessão.

O painel valida a sessão e a autorização no servidor, remove os dados de acesso do endereço e mantém a sessão somente em memória. Não solicita outra senha nem grava tokens no armazenamento do navegador. Nenhuma senha ou chave secreta deve ser enviada na conversa.

A configuração de retorno por e-mail e o primeiro login real precisam ser confirmados pela proprietária. Não foi certificado o botão PUBLICAR PRODUTO com uma sessão real do navegador nesta execução.

## Migração segura dos catálogos

products.json é o único catálogo estático oficial. Ele agora reúne três roupas únicas:
- Macacão feminino preto de um ombro só SHEIN BAE, ID 73513430, referência R$ 108,68. Foto e link continuam pendentes porque faltam nos originais.
- Vestido midi bege de um ombro só, referência R$ 83,90, com foto e link preservados.
- Conjunto de top bandeau e saia longa, referência R$ 193,99, com foto e link preservados.

products .json tinha duas cópias exatamente iguais do conjunto, com IDs diferentes. A duplicata idêntica foi consolidada usando o ID presente em products (3).json. Nenhuma fonte original foi apagada; os arquivos antigos continuam preservados e há cópias exatas em recovery/catalogos-originais/. Consulte recovery/migration-report.json para os hashes e a decisão de migração.

O catálogo do serviço agora é a fonte compartilhada da vitrine; a versão estática fica como recuperação inicial. Uma lista vazia no serviço permanece vazia, sem ressuscitar produtos excluídos. Erros no serviço geram aviso, sem recorrer silenciosamente a um catálogo antigo.

## Recuperação e segurança

O serviço verifica a proprietária no servidor em cada gravação. Pessoas que apenas visitam o site não podem alterar produtos. Mudanças usam controle de versão para evitar sobrescrever uma edição feita em outra tela. A exclusão é um arquivamento; o histórico privado preserva as versões anteriores e os arquivos de imagem não são apagados pelo painel. Alterações podem ser recuperadas pela administração do serviço.

Novas fotos são reduzidas no celular e enviadas ao armazenamento público de imagens; as fotos existentes embutidas nos catálogos são preservadas. Somente a proprietária pode enviar imagens. Produtos e fotos da vitrine são públicos por definição.

## Validação

Execute node tests/catalog.test.cjs. Sete cenários de teste cobrem migração, validação dos campos, acesso, inicialização, cadastro, edição, exclusão, conflito de versão, perda de conexão/resposta e renderização dos três produtos. O serviço desses testes é simulado: não substitui o teste com Supabase real após conectar.

As duas fotos existentes foram decodificadas e verificadas como JPEGs válidos. Os links SHEIN foram preservados, mas não foi possível verificar o destino externo neste ambiente. A tentativa de iniciar Chromium para QA visual foi bloqueada pelo sandbox; não há validação visual no Chrome Android nesta execução. O funcionamento real de login, envio de fotos e gravação será verificado após a conexão inicial.

## Desenvolvimento e publicação

Sem compilação ou dependências no navegador. GitHub Pages continua servindo a raiz da main, com .nojekyll preservado. Não há mudança na configuração de hospedagem. Para prévia: python3 -m http.server 8000 nesta pasta; abrir http://localhost:8000. Evite abrir por file://.

Detalhes para quem concluir a conexão: backend/SETUP.md.

