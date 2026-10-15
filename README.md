# Minha Vitrine

Vitrine independente de afiliados da SHEIN, em português, feita com HTML, CSS e JavaScript sem dependências de build.

## Recursos

- Layout responsivo para celular e computador.
- Busca sem distinção de acentos, filtros por categoria e ordenação alfabética.
- Favoritos salvos no navegador (localStorage).
- Aviso de transparência sobre links de afiliada.
- Estados vazios, navegação por teclado e respeito à preferência de movimento reduzido.

## Visualizar

Abra index.html no navegador, ou execute na pasta do projeto:

```sh
python3 -m http.server 8000
```

Acesse http://localhost:8000. Nenhuma instalação ou compilação é necessária.

## Cadastrar produtos reais

Edite a lista products no final de index.html. Cada item possui id único, name, category, image, alt e affiliateUrl.

- Troque os exemplos pelos seus produtos, nomes e fotos reais, com direito de uso.
- image atualmente é um identificador do Unsplash. Para fotos de produtos, altere a atribuição img.src para usar a URL completa da foto cadastrada em image.
- Preencha affiliateUrl com seu link HTTPS de afiliada verificado da SHEIN. O botão abre em outra aba com rel="sponsored noopener noreferrer".
- Não use links comuns se a intenção é atribuir comissão: utilize o link fornecido pelo seu programa de afiliados.
- Atualize os textos de demonstração no catálogo, no contador de resultados e na seção sobre quando sua seleção real estiver pronta. Os exemplos não têm preços nem ofertas confirmadas.
- As categorias disponíveis são Todos, Moda, Acessórios, Casa e Beleza; altere a lista de categorias no script caso necessário.

As fotos atuais são ilustrativas do Unsplash e não representam produtos confirmados da SHEIN. Fontes são carregadas do Google Fonts. O site não solicita conta e não recebe pagamentos; favoritos ficam apenas no navegador do visitante.

## Hospedagem

O arquivo index.html pode ser publicado em qualquer hospedagem estática. Este repositório foi criado como privado; nenhuma hospedagem pública foi configurada. GitHub Pages em repositórios privados depende do plano da conta. Não torne o repositório público apenas para habilitar a hospedagem sem avaliar essa decisão.

## Verificação

JavaScript verificado com node --check. Validação visual e de navegação em navegador ainda não realizada neste ambiente.
