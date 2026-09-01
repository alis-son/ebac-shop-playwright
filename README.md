# EBAC Shop - Automacao com Playwright

Projeto de automacao E2E da loja EBAC Shop. Os testes exercitam a navegacao,
selecao de produtos, carrinho, checkout e confirmacao do pedido.

## Stack

- Node.js e npm
- TypeScript
- Playwright Test `@playwright/test`
- Navegadores Chromium, Firefox e WebKit
- Site testado: `http://lojaebac.ebaconline.art.br`

## Instalacao e execucao

Pre-requisitos: Node.js 18 ou superior e acesso a Internet, pois a aplicacao
testada e hospedada externamente.

```bash
cd ebac-shop-playwright
npm install
npm run install:browsers
npm test
```

Para executar apenas o conjunto de compra no Chromium:

```bash
npx playwright test tests/purchase --project=chromium --reporter=list
```

Para executar somente as validacoes do carrinho:

```bash
npx playwright test tests/purchase/cart-validations.spec.ts --project=chromium --reporter=list
```

Para acompanhar a execucao no navegador:

```bash
npm run test:headed
```

## Estrutura do projeto

```text
src/
	data/       Dados usados no checkout
	fixtures/   Fixtures compartilhadas do Playwright
	pages/      Page Objects: Home, Produto, Carrinho e Checkout
	utils/      Conversao e validacao de valores monetarios
tests/
	smoke/      Validacoes essenciais de navegacao e catalogo
	purchase/   Cenarios de carrinho, checkout e compra completa
docs/         Estrategia de teste e notas de investigacao
playwright.config.ts  Configuracao de projetos, relatorios e videos
```

## Cenarios automatizados

| ID | Cenario | Validacoes principais |
| --- | --- | --- |
| Smoke | Navegacao basica | Homepage, vitrine, links, imagens e titulo |
| Smoke | Selecao de produto | Pagina de detalhe, nome, preco, imagem e botao de compra |
| Smoke | Adicao ao carrinho | Produto, quantidade, preco, subtotal, total e pagina do carrinho |
| Smoke | Validacao matematica | Subtotal igual a preco unitario vezes quantidade |
| CT01 | Fluxo principal de compra | Produto, carrinho, checkout e confirmacao do pedido |
| CT02 | Produto no carrinho | Nome, quantidade e valores apresentados no carrinho |
| CT03 | Alteracao de quantidade | Quantidade atualizada e recalculo do subtotal |
| CT04-CT05 | Remocao e carrinho vazio | Remocao do item e mensagem de carrinho vazio |
| CT06 | Persistencia no checkout | Produto, quantidade e total no resumo do pedido |
| CT07 | Campos obrigatorios | Bloqueio da finalizacao sem nome e sobrenome |
| CT08 | Consistencia de valores | Quantidade e total consistentes entre carrinho e checkout |

## Analise de qualidade

### Cenarios mais criticos

- **CT01 - Fluxo principal de compra:** e o caminho que gera receita. Uma falha
	entre a escolha do produto e a confirmacao do pedido impede diretamente a
	conclusao da compra e afeta a confianca do cliente.
- **CT03 - Alteracao de quantidade e calculo do carrinho:** altera o valor a ser
	pago. O subtotal precisa respeitar a formula $subtotal = precoUnitario \times
	quantidade$ para evitar cobranca incorreta.
- **CT08 - Consistencia entre carrinho e checkout:** confirma que quantidade e
	total apresentados ao cliente nao mudam ao avancar no funil. Divergencias
	nessa transicao podem causar perda financeira, reclamacoes e abandono.
- **CT07 - Campos obrigatorios:** impede pedidos com dados incompletos, que
	inviabilizam faturamento, entrega ou contato com o cliente.
- **Remocao e carrinho vazio (CT04-CT05):** evita que itens removidos sejam
	mantidos indevidamente no pedido e que o cliente pague por produtos que nao
	deseja mais comprar.

### Cenarios possiveis, mas de menor prioridade inicial

- **Busca e filtros de catalogo:** podem ser automatizados para validar termo,
	preco e categoria, mas nao bloqueiam o fluxo principal enquanto a vitrine e a
	pagina de produto carregam corretamente.
- **Lista de desejos:** adicionar, remover e persistir favoritos sao cenarios
	validos para clientes recorrentes, porem nao impedem a compra imediata.
- **Cupom de desconto:** merece cobertura quando houver regra comercial,
	combinacoes de desconto ou alto volume de uso. Neste momento, o risco maior
	esta no calculo basico do carrinho e na conclusao do pedido.
- **Criacao de conta e login:** sao importantes para jornadas autenticadas,
	mas ficam depois da validacao da compra como visitante e dos dados de
	faturamento obrigatorios.
- **Responsividade e detalhes visuais:** verificacoes em diferentes resolucoes,
	textos, icones e layout podem ser feitas por teste visual. Elas entram em uma
	etapa posterior, pois nao validam diretamente regras de negocio do pedido.

### Riscos identificados durante o mapeamento

- **Estado do carrinho dependente de sessao:** cookies, armazenamento do
	navegador e dados remanescentes podem misturar itens entre execucoes. Os
	testes limpam o contexto e o carrinho quando o fluxo requer estado inicial
	controlado.
- **Atualizacoes assincronas do WooCommerce:** adicao de item, recalculo de
	quantidade e checkout usam AJAX. Validacoes devem aguardar o estado
	atualizado, nao apenas a acao de clique.
- **Elementos dinamicos e ocultos:** o campo de quantidade e alguns controles
	podem ser renderizados como elementos ocultos ou ser recriados apos uma
	atualizacao. Os Page Objects consultam o DOM no momento da acao para reduzir
	referencias desanexadas.
- **Diferencas entre navegadores:** Chromium, Firefox e WebKit podem reagir de
	forma distinta a elementos estilizados, especialmente checkbox de termos e
	botoes atualizados por JavaScript. Por isso, a suite cobre os tres projetos.
- **Ambiente externo e compartilhado:** a loja usada nos testes depende de rede
	e pode sofrer lentidao ou alteracoes de dados e interface. Videos, traces,
	screenshots e relatorio HTML sao gerados para diagnosticar falhas.

## Evidencias de execucao

O projeto gera evidencias automaticamente durante a execucao:

- Relatorio HTML: `playwright-report/index.html`
- Videos dos testes: `test-results/<nome-do-teste>/video.webm`
- Traces e screenshots de falhas: `test-results/<nome-do-teste>/`
- Saida detalhada do terminal: use `--reporter=list`

Depois de executar os testes, abra o relatorio com:

```bash
npx playwright show-report playwright-report
```

Para anexar as evidencias a entrega, compacte as pastas `playwright-report/` e
`test-results/` produzidas pela execucao mais recente. Videos e traces permitem
reproduzir visualmente falhas sem uma nova execucao.

## Entrega do codigo-fonte

Envie o link de um repositorio publico no GitHub ou GitLab contendo esta pasta,
ou compacte a pasta `ebac-shop-playwright` em um arquivo `.zip`. Nao inclua
`node_modules/`, pois as dependencias sao restauradas com `npm install`.

## Desafio de Investigação

**Cenário:** às vezes o cliente conclui o pagamento, mas o pedido não aparece em
"Meus Pedidos".

Minha primeira ação seria obter um caso real recente e correlacionar, pelo
identificador do pedido e horário, três evidências: a confirmação de pagamento,
o registro de criação/atualização do pedido no Backend e a resposta da consulta
que alimenta "Meus Pedidos" para a mesma conta.

A hipótese inicial é que o pagamento foi aprovado, mas existe uma falha de
consistência entre a confirmação do pagamento e a associação/atualização do
pedido para o cliente. Por exemplo, o webhook pode ter sido processado com
atraso, falhado, ou o pedido pode ter sido gravado sem o identificador correto
do usuário autenticado. Outra possibilidade é a consulta da tela filtrar por
status, conta ou período de forma incorreta.

Para reduzir a incerteza rapidamente, eu pediria ao time de Produto um exemplo
com número do pedido, e-mail/ID do cliente, horário e forma de pagamento. Com o
time de Backend, verificaria os logs desse mesmo intervalo e repetiria a
consulta de "Meus Pedidos" com a mesma sessão/conta. Se o pedido existir no
Backend, mas não na resposta da consulta, a investigação fica no fluxo de
visibilidade. Se não existir ou estiver com status inesperado, o foco passa a
ser a integração de pagamento e a criação/atualização do pedido.
