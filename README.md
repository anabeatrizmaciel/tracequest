# TraceQuest — Front-end completo

Front-end React/Vite baseado no protótipo do TraceQuest.

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente `http://localhost:5173`).

## Fluxos implementados

### Estudante
- escolha de perfil
- login
- início
- missões
- detalhe da missão
- desafio 1 (associação RF ↔ CT, com estado real)
- feedback 1 (erro/acerto)
- desafio 2 (cobertura)
- feedback 2 (erro/acerto)
- desafio 3 (evidência faltante)
- feedback 3 (erro/acerto)
- missão concluída
- progresso
- conquistas

### Professora
- login
- dashboard
- lista de exercícios
- criação de exercício — etapa 1
- definição das relações esperadas — etapa 2
- resultados da turma
- resultado individual

## Importante

Este pacote é **front-end**: os dados ainda são simulados em React. Ele já está estruturado para depois conectar a uma API Django.

## Logo e mascote reais

A identidade está desenhada em CSS para o projeto funcionar sem arquivos externos. Para usar os arquivos oficiais, crie:

- `src/assets/tracequest-logo.png` (ou `.svg`)
- `src/assets/trace-mascote.png`

Depois substitua o componente `Brand` e os elementos `.trace-mascot`, `.hero-mascot` e `.complete-mascot` no `App.jsx` por `<img>` usando esses assets.

## Observação sobre Figma

O front-end segue a paleta, hierarquia, linguagem, estrutura de navegação e os fluxos do protótipo. Durante esta execução, a conta Figma atingiu o limite de chamadas MCP, então as telas que não puderam ser reabertas individualmente foram reconstruídas a partir do mapa do protótipo e dos padrões já extraídos das telas principais.
