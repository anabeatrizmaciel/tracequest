# Roteiro de teste do TraceQuest

Tempo estimado: 30 a 40 minutos.

Como usar: siga os passos na ordem. Em cada linha, compare o que apareceu na tela com a coluna "Resultado esperado" e marque a coluna OK. Se algo for diferente, anote na tabela do final. Os números dependem da ordem dos passos, por isso não pule etapas.

## 0. Preparação

1. Na pasta do projeto, abra o PowerShell e execute o comando abaixo. Ele apaga dados antigos e cria a turma de demonstração.

   ```powershell
   .\iniciar.ps1 -Reset -Demo
   ```
2. Aguarde o navegador abrir em <http://localhost:5173>. A API roda em `http://127.0.0.1:8000`.
3. A senha de todas as contas de demonstração é `tracequest`.

| Perfil | E-mail |
| --- | --- |
| Professora | `camila@uea.edu.br` |
| Estudante | `ana@uea.edu.br` |

Para usar estudante e professora ao mesmo tempo, abra uma das contas em uma janela anônima.

---

## 1. Acesso e segurança

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 1.1 | Abra `http://localhost:5173/aluno/inicio` sem estar logado | Abre o login do estudante | [ ] |
| 1.2 | Abra `http://localhost:5173/professor/dashboard` sem estar logado | Abre o login da professora | [ ] |
| 1.3 | Em "Sou estudante", entre com `ana@uea.edu.br` e a senha errada `abc` | Mensagem "E-mail ou senha incorretos." | [ ] |
| 1.4 | Em "Sou professora", entre com `ana@uea.edu.br` e `tracequest` | Mensagem "Esta conta é de estudante…" | [ ] |
| 1.5 | Em "Sou estudante", clique em "Ainda não tenho conta" e crie `teste1@uea.edu.br` com uma senha de 3 caracteres | Erro pedindo ao menos 6 caracteres | [ ] |
| 1.6 | Crie a conta com a senha `abc123` | Entra no início, com "0 de 2" missões e +0 XP | [ ] |
| 1.7 | No menu do usuário (canto superior direito), clique em Sair | Volta à escolha de perfil. Ao abrir `/aluno/inicio` de novo, pede login | [ ] |
| 1.8 | Entre como estudante e abra `/professor/dashboard` | Volta para a área do estudante | [ ] |

---

## 2. Jornada do estudante

Entre como `ana@uea.edu.br` com a senha `tracequest`.

### 2.1 Início e missões

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.1.1 | Veja a tela inicial | "Olá, Ana!", `0 de 2` missões, `+0 XP`, `0 dias`, `0` conquistas e próxima pista "Primeiros Rastros" | [ ] |
| 2.1.2 | Abra Missões | Duas missões: "Primeiros Rastros" (Disponível) e "Conectando Pontos" (Bloqueada, sem botão). "Caça à Cobertura" não aparece, porque é rascunho | [ ] |
| 2.1.3 | Digite `ponto` na busca | Só aparece "Conectando Pontos" | [ ] |
| 2.1.4 | Tente abrir a missão bloqueada pelo endereço `/aluno/missao/2` | Volta para a lista de missões | [ ] |

### 2.2 Missão 1: "Primeiros Rastros" (1 desafio)

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.2.1 | Abra a missão e clique em Iniciar missão | Desafio 1 com 3 requisitos e 4 testes: CT01, CT02 e CT03 fazem parte do gabarito, e CT04 ("Entrar com o e-mail e a senha de uma conta já cadastrada.") não pertence a nenhum requisito, então é uma alternativa errada. RF01 e CT01 já vêm ligados como exemplo. Os testes aparecem embaralhados e mostram "Esperado: …" | [ ] |
| 2.2.2 | Sem selecionar um requisito, clique em um teste | Nada acontece. Os testes só liberam depois de escolher um requisito | [ ] |
| 2.2.3 | Veja o botão Verificar com apenas 1 vínculo | Está desabilitado | [ ] |
| 2.2.4 | Ligue RF02 a CT03 e RF03 a CT02. Clique em Verificar | Feedback "Quase! Revise as conexões", citando RF02 ↔ CT03 e RF03 ↔ CT02, com o texto do teste escolhido e do requisito | [ ] |
| 2.2.5 | Recarregue a página (F5) | O mesmo feedback continua na tela | [ ] |
| 2.2.6 | Clique em Tentar novamente. Ligue RF02 a CT02 e RF03 a CT04. Clique em Verificar | Feedback "Quase! Revise as conexões", citando RF03 ↔ CT04 e o texto "Entrar com o e-mail e a senha de uma conta já cadastrada". Só RF03 aparece como errada | [ ] |
| 2.2.7 | Clique em Tentar novamente. Ligue RF02 a CT02 e RF03 a CT03. Clique em Verificar | "Boa investigação!" com a justificativa da professora (por exemplo, "CT02 força o e-mail duplicado…") | [ ] |
| 2.2.8 | Em um requisito já ligado, clique nele de novo | O vínculo é desfeito e dá para escolher outro teste. O botão Limpar volta ao exemplo | [ ] |
| 2.2.9 | Clique em Concluir missão | "Missão concluída": +100 XP, 1/1 desafio, pontuação 50 (2 erros antes do acerto) e conquista "Primeiro Rastro" | [ ] |

### 2.3 Missão 2: "Conectando Pontos" (3 desafios)

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.3.1 | Abra Missões | "Primeiros Rastros" aparece como Concluída e "Conectando Pontos" como Disponível | [ ] |
| 2.3.2 | Abra a missão e clique em Iniciar. Depois tente ir direto para `/aluno/missao/2/desafio/3` pelo endereço | Você volta ao Desafio 1. Não é possível pular desafios | [ ] |
| 2.3.3 | Desafio 1: a tela mostra 3 requisitos e 3 testes (CT01 a CT03, embaralhados). Os outros testes cadastrados são usados nos desafios 2 e 3 e não aparecem aqui. Ligue RF02 a CT02 e RF03 a CT03 (RF01 já é o exemplo). Clique em Verificar | Acerto de primeira. Aparece Continuar investigação | [ ] |
| 2.3.4 | Desafio 2 (cobertura de RF03): o botão fica desabilitado até escolher uma opção. Escolha Cobertura completa e clique em Verificar | Erro: "Um requisito pode ter casos de teste associados e ainda assim não estar completamente coberto." | [ ] |
| 2.3.5 | Clique em Tentar novamente, escolha Cobertura parcial e clique em Verificar | Acerto, com a explicação cadastrada (CT03 e CT04 cobrem o bloqueio e o acesso negado) | [ ] |
| 2.3.6 | Desafio 3 (evidência que falta): escolha CT05 e clique em Verificar | Erro dizendo que CT05 não completa a cobertura, com uma pista sobre o que acontece depois do bloqueio | [ ] |
| 2.3.7 | Clique em Tentar novamente, escolha CT06 e clique em Verificar | "Resolvido!" com a explicação da professora | [ ] |
| 2.3.8 | Clique em Concluir missão | +150 XP, 3/3 desafios e pontuação 83 | [ ] |
| 2.3.9 | Na tela de missão concluída, recarregue a página | Continua na mesma tela, sem dar XP em dobro | [ ] |

### 2.4 Progresso e conquistas

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.4.1 | Abra Início | `2 de 2` missões, `+250 XP`, `1 dia` de sequência e 5 conquistas | [ ] |
| 2.4.2 | Abra Progresso | Progresso geral 100%, XP 250, taxa de acerto 50% (8 tentativas), Relações RF ↔ CT 50%, Cobertura 50% e Evidência que falta 50% | [ ] |
| 2.4.3 | Abra Conquistas | Desbloqueadas (5): Primeiro Rastro, Conexão Perfeita, Detetive de Cobertura, Caçador de Evidências e Mestre da Trilha. Bloqueada (1): Sequência de 3 | [ ] |
| 2.4.4 | Em Missões, abra "Conectando Pontos" e clique em Rever desafios | Abre o Desafio 1 novamente. A revisão não altera o XP nem a taxa de acerto, que continuam em 250 XP e 50% (8 tentativas), como em 2.4.2. Não responda nada neste passo, para não mudar os números da seção 3. O passo 3.4 testa errar de propósito em uma revisão | [ ] |

---

## 3. Acompanhamento da professora

Saia da conta da Ana e entre como `camila@uea.edu.br` com a senha `tracequest`.

### 3.1 Dashboard e resultados (refletem o que a Ana fez)

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.1.1 | Abra o Dashboard | Alunos ativos: 4 de 5 (a turma de 4 mais a conta `teste1` do passo 1.6, que ainda não respondeu nada). Atividades concluídas: 70% (7 de 10). Média: 80 pts. Maior dificuldade: "Associação RF ↔ CT". Dificuldades: Cobertura parcial 18%, Associação 45% e Requisito sem teste 36% | [ ] |
| 3.1.2 | Veja "Atividades recentes" | "Conectando Pontos" (4 estudantes, média 79) e "Primeiros Rastros" (4 estudantes, média 81) | [ ] |
| 3.1.3 | Abra Resultados | 4 estudantes. Ana Beatriz: nota 66, acertos de 1ª 1/4 e dificuldade "Associação RF ↔ CT". Gabriela e Lucas: nota 96. Pedro: nota 62 | [ ] |
| 3.1.4 | Filtre por "Primeiros Rastros" | A tabela e os cartões são recalculados. Ana: nota 50 (0/1). Pedro: 75. Gabriela e Lucas: 100 | [ ] |
| 3.1.5 | Clique em Exportar resumo (CSV) | Baixa `resultados-tracequest.csv`, que abre no Excel com nomes e notas corretos | [ ] |
| 3.1.6 | Abra os Detalhes da Ana | Pontuação 66, taxa de acerto 50% e acertos de primeira 1/4. Análise por desafio: missão 1, desafio 1 com 2 erros antes do acerto; missão 2, desafio 1 certo de primeira; missão 2, desafios 2 e 3 com 1 erro cada. Sugestão de revisão: "Reforce associação entre requisitos e testes" | [ ] |
| 3.1.7 | Clique em Ver respostas do estudante | Lista as 8 respostas da Ana, com ✓ ou ✗, o resumo de cada uma (por exemplo "2/3 relações corretas"), data e hora | [ ] |
| 3.1.8 | Abra os Detalhes do Pedro | Mostra mais erros em associação e na evidência que falta | [ ] |

### 3.2 Exercícios: publicar, criar e editar

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.2.1 | Abra Exercícios | 3 exercícios, com "Caça à Cobertura" em Rascunho. Tentativas: "Primeiros Rastros" 7, "Conectando Pontos" 19 e "Caça à Cobertura" 0 | [ ] |
| 3.2.2 | Busque `cobertura` | Só aparece "Caça à Cobertura" | [ ] |
| 3.2.3 | Clique em Criar exercício, deixe o título vazio, clique em Continuar e depois em Salvar e publicar | Erro "Informe o título do exercício." | [ ] |
| 3.2.4 | Preencha: título `Pagamento`, nível Iniciante, requisitos RF01 "O cliente paga com cartão." e RF02 "O sistema emite recibo.", testes CT01 "Pagar com cartão válido." (esperado "Pago.") e CT02 "Pagar e conferir o recibo." (esperado "Recibo emitido.") | Os campos aceitam texto. O botão "+ Adicionar" cria linhas novas com código automático | [ ] |
| 3.2.5 | Na etapa 2, clique duas vezes em "+ Nova relação" (RF01 com CT01 e RF02 com CT02). Em RF01 e CT01 escreva a justificativa "CT01 paga com cartão." Deixe em branco a justificativa de RF02 e CT02 | As listas só oferecem os códigos cadastrados | [ ] |
| 3.2.6 | Clique em Salvar e publicar | Não publica. Aparece o aviso "Revise antes de salvar:" com a mensagem "Relação RF02 ↔ CT02: informe a justificativa para publicar." (só essa), acima dos botões. Você continua na etapa 2 | [ ] |
| 3.2.7 | Com o mesmo campo em branco, clique em Salvar rascunho | Volta à lista com "Pagamento" (EX-04) em Rascunho. O rascunho aceita justificativa vazia | [ ] |
| 3.2.8 | Em "Pagamento", clique em Editar e depois em Continuar. Na etapa 2, confira as justificativas e escreva "CT02 confere o recibo." na que está vazia | A de RF01 e CT01 aparece preenchida e a de RF02 e CT02 aparece vazia. O campo aceita o texto | [ ] |
| 3.2.9 | Na segunda relação, troque CT02 por CT01 (as duas ficam com CT01) e clique em Salvar e publicar | Erro informando que CT01 aparece em mais de uma relação. Junto vem o aviso de que são necessárias ao menos 2 relações | [ ] |
| 3.2.10 | Volte a RF02 com CT02 e clique em Salvar e publicar | Volta à lista com "Pagamento" Publicado | [ ] |
| 3.2.11 | Em "Caça à Cobertura", clique em Publicar | Passa para Publicado | [ ] |
| 3.2.12 | Edite "Pagamento", troque o texto de uma justificativa e clique em Salvar rascunho | O status volta para Rascunho e a missão some para os estudantes | [ ] |

### 3.3 O que a estudante vê depois (entre de novo como Ana)

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.3.1 | Abra Missões | "Caça à Cobertura" aparece como Disponível, porque as anteriores estão concluídas. "Pagamento" não aparece, porque é rascunho | [ ] |
| 3.3.2 | Abra Início | `2 de 3` missões, `+250 XP`, 4 conquistas ("Mestre da Trilha" volta a ficar bloqueada até concluir a nova missão) e próxima pista "Caça à Cobertura" | [ ] |
| 3.3.3 | Jogue "Caça à Cobertura". Desafio 1: a tela mostra 3 requisitos e 3 testes (os outros testes cadastrados são usados nos desafios 2 e 3). RF01 e CT01 já vêm ligados como exemplo. Ligue RF02 a CT02 e RF03 a CT03. Desafio 2 (RF02): erre com Cobertura completa e depois acerte com Cobertura parcial. Desafio 3: erre com CT05 e depois acerte com CT04 | Os feedbacks falam do link de redefinição de senha e do prazo dele (30 minutos), que é o conteúdo cadastrado nesse exercício. Ao concluir: +180 XP, 3/3 desafios e pontuação 83. O início mostra `3 de 3`, `+430 XP` e 5 conquistas | [ ] |
| 3.3.4 | Como professora, publique "Pagamento" (em Exercícios, clique em Publicar). Depois volte como Ana | "Pagamento" aparece como Disponível. Clique em Iniciar missão: o Desafio 1 mostra RF01 e CT01 como exemplo e só RF02 para ligar. Não responda, porque os números do passo 3.3.5 dependem disso | [ ] |
| 3.3.5 | Volte à professora e abra Resultados | Ana Beatriz: nota 72 e acertos de 1ª 2/7. Gabriela e Lucas continuam em 96 e Pedro em 62. O dashboard mostra alunos ativos 4 de 5, atividades concluídas 40% (8 de 20, com 4 exercícios publicados), média 82 pts e maior dificuldade "Associação RF ↔ CT". Dificuldades: Cobertura parcial 23%, Associação 38% e Requisito sem teste 38% | [ ] |

### 3.4 Revisar um desafio não altera o desempenho

Use a conta `teste1@uea.edu.br` (senha `abc123`), criada no passo 1.6 e ainda sem respostas. Com ela, o dashboard passa a ter 5 estudantes ativos. Por isso este bloco vem depois dos números da seção 3.1.

| # | O que fazer | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.4.1 | Entre como `teste1@uea.edu.br` com a senha `abc123`. Em Missões, abra "Primeiros Rastros" e clique em Iniciar. Acerte de primeira (RF02 com CT02 e RF03 com CT03), clique em Verificar e depois em Concluir missão | "Missão concluída": +100 XP, 1/1 desafio e pontuação 100 | [ ] |
| 3.4.2 | Abra Progresso | Progresso geral 25% (1 de 4 missões), XP 100, taxa de acerto 100% (1 tentativa) e Relações RF ↔ CT 100% | [ ] |
| 3.4.3 | Em Missões, abra "Primeiros Rastros" e clique em Rever desafios. No Desafio 1, erre de propósito três vezes: ligue RF02 a CT03 e RF03 a CT02, clique em Verificar e depois em Tentar novamente, repetindo | Cada tentativa mostra "Quase! Revise as conexões". A missão continua concluída e nenhum XP é perdido | [ ] |
| 3.4.4 | Abra Progresso de novo | Igual ao passo 3.4.2: XP 100, taxa de acerto 100% (1 tentativa) e Relações RF ↔ CT 100%. Os três erros da revisão não entram na taxa de acerto | [ ] |
| 3.4.5 | Abra Início | `1 de 4` missões, `+100 XP` e 2 conquistas ("Primeiro Rastro" e "Conexão Perfeita") | [ ] |
| 3.4.6 | Saia e entre como professora. Abra Resultados | "Teste Um": nota 100, acertos de 1ª 1/1 e dificuldade "Sem erros" (erros de revisão não contam) | [ ] |
| 3.4.7 | Abra os Detalhes de "Teste Um" | Pontuação 100, taxa de acerto 100% (o mesmo valor do Progresso do estudante) e acertos de primeira 1/1. Desafio 1 certo de primeira. Sugestão de revisão "Sem dificuldades registradas", sem etiquetas de dificuldade | [ ] |
| 3.4.8 | Clique em Ver respostas do estudante | Lista 4 respostas (1 certa e 3 erradas). Nenhuma tentativa é apagada, e as da revisão continuam visíveis | [ ] |
| 3.4.9 | Abra o Dashboard | Alunos ativos 5 de 5, atividades concluídas 45% e média 85 pts. Dificuldades: Cobertura parcial 23%, Associação 38% e Requisito sem teste 38%, iguais às do passo 3.3.5. Os três erros da revisão não entram nos percentuais | [ ] |

---

## 4. Verificações gerais

| # | Verificação | OK |
| --- | --- | --- |
| 4.1 | A busca do cabeçalho leva à lista de missões (estudante) ou de exercícios (professora), com o filtro aplicado | [ ] |
| 4.2 | Fechar e reabrir a aba mantém a sessão (por até 7 dias) | [ ] |
| 4.3 | Reduzir a janela do navegador (tablet ou celular) reorganiza o layout sem cortar o conteúdo | [ ] |
| 4.4 | Com o backend parado (feche a janela do `iniciar.ps1`), recarregar uma página mostra uma mensagem de erro clara, sem tela branca | [ ] |
| 4.5 | Os dados continuam depois de reiniciar os servidores com `.\iniciar.ps1` (sem `-Reset`) | [ ] |

---

## 5. Critérios de aceite do núcleo (AP2)

- [ ] Acesso diferenciado para estudante e professora
- [ ] Cadastro de exercícios, requisitos, casos de teste e relações esperadas
- [ ] Atividades de associação, cobertura e evidência que falta, com interação real
- [ ] Correção comparando a resposta com o gabarito da professora, com feedback explicativo
- [ ] Registro das tentativas
- [ ] Resultados registrados aparecem na área da professora

## Observações e problemas encontrados

| Passo | O que aconteceu | Gravidade |
| --- | --- | --- |
|  |  |  |
