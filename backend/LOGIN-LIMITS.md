# Diagnóstico do envio de acesso por e-mail

## Evidência observada

Logs de Auth do projeto confirmam HTTP 429 com código over_email_send_rate_limit em /otp, após envios pelo remetente padrão do Supabase. Não é um erro de cadastro dos produtos. Também houve login válido, leitura de /user com HTTP 200 e posterior tentativa de reutilizar link inválido/expirado.

A conta da proprietária está com e-mail confirmado. O endereço solicitado pelo frontend é o admin.html da vitrine. Os logs recentes mostram esse retorno correto, enquanto eventos antigos mostravam localhost. A conexão MCP atual não oferece leitura/alteração das configurações administrativas de Auth (Site URL, allowlist ou taxa configurada). Portanto, o diagnóstico do limite usa códigos e remetente dos registros, mais a documentação oficial; não afirma ter consultado o valor numérico na configuração do projeto.

Documentação:
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-smtp

O remetente embutido permite dois e-mails de autenticação por hora por projeto. Para maior capacidade de envio, configurar SMTP próprio ou Send Email Hook mantendo as proteções. Não aumentar limites arbitrariamente, usar credenciais no site ou repetir pedidos como teste. A conexão de um serviço de e-mail exige participação da proprietária; nenhuma credencial foi solicitada nesta correção.

## Correção no painel

- Distingue limite de e-mail por projeto de excesso genérico de pedidos.
- Respeita Retry-After em segundos ou data HTTP quando o cabeçalho for disponibilizado ao navegador.
- Sem prazo informado: sugere 60 minutos para over_email_send_rate_limit e 60 segundos para outros HTTP 429, sempre identificados como estimativa, não como horário garantido de liberação.
- Após envio confirmado: intervalo preventivo de 60 segundos entre pedidos.
- Após resposta perdida por falha de rede: intervalo preventivo, sem declarar que o e-mail foi enviado.
- Temporizador e horário local visíveis; botão bloqueado durante a espera.
- Guarda somente prazo, tipo e marcador de estimativa no localStorage; nenhum e-mail, token ou senha é persistido. As proteções reais continuam no servidor.
- Atualizar a página ou terminar outra operação do painel não reativa o botão prematuramente.
- Nunca reenvia automaticamente; orienta abrir o e-mail mais recente e não reutilizar links já consumidos.
- Ao terminar o prazo, informa que uma nova tentativa continua sujeita à confirmação do serviço.

## Verificação

Doze testes locais passaram, incluindo as sete verificações anteriores de catálogo e mais cinco de limite/reenvio/erros. As respostas de Auth nos testes são simuladas. A consulta ao banco real confirmou três produtos ativos, dois com foto e dois com link; nenhuma linha de produto foi alterada.

Nenhum e-mail real foi disparado para testes, para preservar a quota. Não foi possível completar uma nova autenticação na caixa de entrada da proprietária. Os registros já mostram que uma autenticação real anterior funcionou, mas isso não certifica a nova tentativa após o limite. A configuração completa de SMTP e a retomada do login precisam de verificação posterior.


## Entrada por senha disponível

Os registros mais recentes continuaram retornando over_email_send_rate_limit; encerrar o contador local não libera a quota do servidor. A consulta de Auth verificou apenas que a conta está confirmada e possui encrypted_password não vazio, sem ler seu valor. Isso não prova que a proprietária conhece uma senha utilizável: contas passwordless podem ter credenciais internas. Nunca pedir senha na conversa, tentar adivinhar nem substituir a senha administrativamente sem um processo seguro.

O painel agora oferece o fluxo padrão do Supabase Auth POST /auth/v1/token?grant_type=password e confere is_vitrine_admin antes de liberar edição. A senha é digitada somente no painel HTTPS, enviada ao Supabase e removida do campo; não é persistida no armazenamento do site. A quota de envio de e-mails não se aplica a esse pedido. As proteções de tentativa de senha permanecem ativas, com espera separada quando houver HTTP 429. O link por e-mail continua como alternativa, sujeito à quota original.

Quinze testes simulados passaram, incluindo login por senha, rejeição de conta não autorizada, limpeza do campo, senha inválida e ausência de envio de e-mail. Nenhum login real com senha foi feito nesta execução. A proprietária precisa confirmar se conhece a senha e fazer um único teste no celular; se não conhecer, orientar a recuperação com segurança sem criar mecanismo alternativo de redefinição de senha.
