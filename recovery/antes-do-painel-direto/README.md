# Minha Vitrine SHEIN

Site estático responsivo, sem instalação ou compilação. Arquivos públicos na raiz: index.html, admin.html, products.json e assets/. .nojekyll evita processamento Jekyll.

## Produtos

Macacão feminino preto de um ombro só, SHEIN BAE: ID 73513430, referência R$ 108,68. Foto e link aguardando envio. Sem link não existe botão de compra ativo. O vestido bege anterior foi preservado com a imagem e o link enviados. Nenhuma oferta demonstrativa é exibida.

## Editar no celular

1. Abra admin.html pelo endereço publicado e toque em Editar ou Novo produto.
2. Preencha nome, preço de referência, ID SHEIN, categoria, foto e link de afiliada. Pode escolher uma foto JPG, PNG ou WebP de até 2 MB do celular. Campos de foto, preço, ID e link podem ficar vazios.
3. Toque em Salvar no rascunho. Isso salva somente neste navegador, não no site público.
4. Toque em Baixar products.json para publicar.
5. No GitHub, abra Code → main → Add file → Upload files (no celular pode estar em + ou ⋯). Envie o products.json baixado para a raiz, substituindo o anterior; mantenha o nome exato. Toque em Commit changes e confirme na main.
6. Aguarde o GitHub Pages atualizar. O editor também permite importar um JSON de backup.

O editor não solicita tokens ou senhas. Só quem tem permissão de escrita no GitHub pode publicar. Não há servidor de administração: visitantes podem abrir o formulário, mas só alteram os próprios rascunhos. O arquivo público products.json é a fonte do catálogo de todos. Fotos do celular são incorporadas no JSON; links HTTPS ou caminhos assets/ também são aceitos. Para muitos produtos, prefira hospedar fotos em assets/ para manter o catálogo leve.

## Ativar GitHub Pages

Abra https://github.com/clara159321-glitch/minha-vitrine-shein/settings/pages . Em Build and deployment → Source escolha Deploy from a branch. Em Branch selecione main e /(root), depois Save. Aguarde a implantação e confira o endereço exibido nessa página.

O repositório é privado. Se Pages exigir plano pago, é preciso um plano compatível ou escolher tornar o repositório público: Settings → General → Danger Zone → Change repository visibility → Change to public, e confirmar as instruções do GitHub. Essa escolha expõe o código e o histórico do repositório; não foi feita automaticamente. Depois volte a Settings → Pages e faça a configuração acima. No celular, abra o GitHub no navegador e, se Settings não aparecer na barra de abas, procure no menu ⋯; se necessário ative a versão para computador do navegador.

Endereço esperado após ativação, ainda não confirmado como publicado: https://clara159321-glitch.github.io/minha-vitrine-shein/
Editor após publicação: https://clara159321-glitch.github.io/minha-vitrine-shein/admin.html

## Prévia local

Execute python3 -m http.server 8000 nesta pasta e abra http://localhost:8000 . Não abra index.html diretamente via file://, pois o catálogo é carregado com fetch.

## Transparência

Preços são referências fornecidas, não promessas de oferta. Compras abrem o HTTPS de afiliada cadastrado, em outra aba com sponsored noopener noreferrer. Confira preço final e disponibilidade na SHEIN. Fotos e links devem corresponder ao produto; o link do vestido não foi reaproveitado para o macacão. Favoritos e rascunhos ficam no navegador. O site usa fontes do Google Fonts e imagem editorial do Unsplash; imagem editorial não é oferta.

## Verificação desta versão

Testes de lógica executados com Node: catálogo, formatação BRL, link exato do vestido, bloqueio da compra pendente, busca por ID e sem acentos, favoritos e estado vazio. Sintaxe do editor verificada. A tentativa de teste visual com Chromium foi bloqueada pelo sandbox (operação de socket não permitida). Não houve validação visual em celular nem confirmação de publicação.
