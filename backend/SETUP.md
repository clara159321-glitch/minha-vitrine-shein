# Ativação do serviço de publicação

Este arquivo é para quem configura o serviço com as ferramentas conectadas. A proprietária não precisa editar código nem repetir esta configuração a cada produto.

Estado atual: integração Supabase sugerida, mas conexão ainda não confirmada. site-config.json permanece sem URL/chave; operações de escrita são bloqueadas e o catálogo estático oficial contém três produtos.

## Procedimento uma única vez

1. Confirmar a conexão do Supabase, listar projetos autorizados e usar um projeto apropriado à vitrine. Não iniciar plano pago sem instrução da proprietária.
2. Aplicar backend/supabase.sql como migração transacional. Ele cria catálogo privado, histórico, funções autorizadas e bucket público para fotos. Verificar que a migração executou por completo.
3. Criar/confirmar a conta da proprietária no Supabase Auth com o e-mail que ela informou nesta conversa. Não incluir o e-mail em arquivos do repositório. Utilizar a API administrativa oficial de Auth ou o painel de usuários; não inserir diretamente em auth.users.
4. Inserir o UUID dessa conta em vitrine_private.admins pela conexão administrativa. Exemplo com parâmetro real passado somente à ferramenta: INSERT INTO vitrine_private.admins(user_id) VALUES (<UUID verificado>) ON CONFLICT DO NOTHING. Não aceitar uma primeira reivindicação pública de propriedade.
5. Configurar e-mail OTP no Auth: template de Magic Link deve mostrar o código {{ .Token }} claramente em português. Envio e verificação usam /auth/v1/otp com create_user:false e /auth/v1/verify com type:email. A conta precisa existir antes do primeiro login. Confirmar duração e tamanho do OTP compatíveis com o painel (6 a 10 dígitos). Habilitar envio de e-mails para a proprietária; verificar restrições do remetente padrão. Se exigir remetente/SMTP próprio, orientar a conexão desse serviço sem publicar suas credenciais.
6. Configurar o Site URL do Auth para o endereço público da vitrine. Nenhuma senha administrativa ou segredo deve ser enviado ao navegador. A chave publishable/anon é uma identificação pública; o bloqueio de gravações está no servidor, não nessa chave.
7. Atualizar somente supabaseUrl e publishableKey em site-config.json usando os valores retornados pelo projeto autorizado. Recusar sb_secret_ e service_role. Não mover credenciais administrativas para arquivos ou argumentos de comandos.
8. Verificar com API real: visitante consegue ler get_vitrine_catalog e imagens, mas não inicializar, gravar nem arquivar; conta não autorizada também não pode gravar; somente o UUID autorizado pode operar. Verificar explicitamente as permissões das funções e as políticas de Storage.
9. Abrir o painel e solicitar à proprietária que receba/digite seu próprio código. Não pedir que ela cole código ou senha na conversa. Na primeira entrada, o botão ATIVAR MEU CATÁLOGO chama uma transação que copia os três produtos oficiais e marca a inicialização. Repetir a ativação é seguro e não duplica entradas. Validar os três IDs e hashes das imagens após a importação.
10. Com a sessão da proprietária, testar criar/editar/arquivar um item claramente identificado para teste, confirmar leitura pública após cada operação, preservar o histórico e remover o item de teste. Confirmar compressão e upload da foto no Android, além de conflito em duas abas e saída da sessão.
11. Conferir a publicação do GitHub Pages do commit com a configuração final. Não desabilitar Pages nem recriar o site.

## Recuperação

- Antes da ativação: produtos originais em recovery/catalogos-originais/ e commit indicado no relatório.
- Depois: vitrine_private.products guarda registros arquivados e vitrine_private.history guarda snapshots com autor e data. Nenhum usuário anônimo ou autenticado comum lê esse histórico.
- Uma recuperação deve verificar a versão atual antes de restaurar um snapshot, preservar a versão existente e incrementar version. Não apagar histórico nem imagens.
- Não recriar o catálogo estático quando o serviço retornar uma lista vazia: isso é um resultado válido após excluir todas as roupas.

## Limites de verificação até a conexão

A suíte usa serviço simulado e não executa o SQL real. A migração, o login por e-mail, as permissões e o Storage só podem ser certificados depois da aplicação no projeto conectado. No ambiente desta conversa, Chromium foi bloqueado e os destinos externos SHEIN não foram acessíveis pela ferramenta de navegação.

