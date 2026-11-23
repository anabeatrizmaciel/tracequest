# Roteiro de teste do TraceQuest

Tempo estimado: 30 a 40 minutos. Marque cada item com `[x]` e anote qualquer divergência na coluna “Observações” do final.

## 0. Preparação

1. Na raiz do projeto, abra o PowerShell e rode **do zero** (apaga dados antigos e cria a turma de demonstração):

   ```powershell
   .\iniciar.ps1 -Reset -Demo
   ```
2. Aguarde abrir <http://localhost:5173>. A API fica em `http://127.0.0.1:8000`.
3. Use sempre a senha **`tracequest`**:

| Perfil | E-mail |
| --- | --- |
| Professora | `camila@uea.edu.br` |
| Estudante | `ana@uea.edu.br` |

> Dica: para testar estudante e professora ao mesmo tempo, use uma janela anônima para um deles.

---

## 1. Acesso e segurança

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 1.1 | Abra `http://localhost:5173/aluno/inicio` **sem estar logado** | Redireciona para o login do estudante | [ ] |
| 1.2 | Abra `http://localhost:5173/professor/dashboard` sem login | Redireciona para o login da professora | [ ] |
| 1.3 | Em **Sou estudante**, entre com `ana@uea.edu.br` e senha errada (`abc`) | Mensagem “E-mail ou senha incorretos.” | [ ] |
| 1.4 | Em **Sou professora**, entre com `ana@uea.edu.br` / `tracequest` | Mensagem “Esta conta é de estudante…” | [ ] |
| 1.5 | Em **Sou estudante**, clique em “Ainda não tenho conta”, crie `teste1@uea.edu.br` com senha de 3 caracteres | Erro pedindo ao menos 6 caracteres | [ ] |
| 1.6 | Crie a conta com senha `abc123` | Entra direto no início; mostra “0 de 2” missões e +0 XP | [ ] |
| 1.7 | Menu do usuário (canto superior direito) → **Sair** | Volta à escolha de perfil. Ao voltar para `/aluno/inicio` pede login de novo | [ ] |
| 1.8 | Logado como estudante, abra `/professor/dashboard` | Você é levado de volta à área do estudante | [ ] |

---

## 2. Jornada do estudante (Ana)

Entre como **ana@uea.edu.br / tracequest**.

### 2.1 Início e missões

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.1.1 | Tela inicial | “Olá, Ana!”, `0 de 2` missões, `+0 XP`, `0 dias`, `0` conquistas, próxima pista “Primeiros Rastros” | [ ] |
| 2.1.2 | **Missões** | 2 missões: “Primeiros Rastros” (Disponível) e “Conectando Pontos” (**Bloqueada**, sem botão). “Caça à Cobertura” **não** aparece (é rascunho) | [ ] |
| 2.1.3 | Digite `ponto` na busca da página | Só aparece “Conectando Pontos” | [ ] |
| 2.1.4 | Tente abrir a missão bloqueada (`/aluno/missao/2`) | Volta para a lista de missões (não abre) | [ ] |

### 2.2 Missão 1 — “Primeiros Rastros” (1 desafio)

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.2.1 | Abra a missão → **Iniciar missão** | Desafio 1 com 3 requisitos e **4 testes**: CT01, CT02 e CT03 do gabarito e **CT04** (“Entrar com o e-mail e a senha de uma conta já cadastrada.”), que não pertence a nenhum requisito e é um distrator; **RF01 ↔ CT01 já vem ligado como exemplo**; os testes aparecem embaralhados e mostram “Esperado: …” | [ ] |
| 2.2.2 | Antes de selecionar um requisito, tente clicar num teste | Não faz nada (testes só liberam após escolher um RF) | [ ] |
| 2.2.3 | O botão **Verificar** com só 1 vínculo | Fica desabilitado | [ ] |
| 2.2.4 | **Resposta errada:** RF02 → CT03 e RF03 → CT02. Clique **Verificar** | Feedback “Quase! — revise as conexões” citando **RF02 ↔ CT03** e **RF03 ↔ CT02**, com o texto do teste escolhido e do requisito | [ ] |
| 2.2.5 | **Recarregue a página (F5)** no feedback | O mesmo feedback continua na tela | [ ] |
| 2.2.6 | **Tentar novamente** → ligue RF02 → CT02 e **RF03 → CT04** (o distrator) → **Verificar** | Feedback “Quase! — revise as conexões”, “2/3 relações corretas”, citando **RF03 ↔ CT04** e o texto do teste escolhido (“Entrar com o e-mail e a senha de uma conta já cadastrada”) | [ ] |
| 2.2.7 | **Tentar novamente** → ligue RF02 → CT02 e RF03 → CT03 → **Verificar** | “Boa investigação!” com a justificativa da professora (ex.: “CT02 força o e-mail duplicado…”) | [ ] |
| 2.2.8 | Em um requisito já ligado, clique nele de novo | O vínculo é desfeito e dá para escolher outro teste; **Limpar** volta ao exemplo | [ ] |
| 2.2.9 | **Concluir missão** | “Missão concluída”: **+100 XP**, 1/1 desafio, pontuação **50** (houve 2 erros antes do acerto), conquista “Primeiro Rastro” | [ ] |

### 2.3 Missão 2 — “Conectando Pontos” (3 desafios)

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.3.1 | **Missões** | “Primeiros Rastros” = Concluída; “Conectando Pontos” = **Disponível** | [ ] |
| 2.3.2 | Abra a missão → Iniciar. Na barra de endereço, tente ir direto a `/aluno/missao/2/desafio/3` | Você é devolvido ao **Desafio 1** (não dá para pular) | [ ] |
| 2.3.3 | **Desafio 1:** a tela mostra 3 requisitos e **3 testes** (CT01 a CT03, embaralhados; os demais testes cadastrados são evidências dos desafios 2 e 3 e não aparecem aqui). Ligue RF01 (exemplo), RF02 → CT02, RF03 → CT03 → Verificar | Acerto na primeira tentativa → **Continuar investigação** | [ ] |
| 2.3.4 | **Desafio 2 (cobertura de RF03):** o botão fica desabilitado até escolher uma opção. Escolha **Cobertura completa** → Verificar | Feedback de erro: “Um requisito pode ter casos de teste associados e ainda assim não estar completamente coberto.” | [ ] |
| 2.3.5 | **Tentar novamente** → **Cobertura parcial** → Verificar | Acerto, com a explicação cadastrada (CT03 e CT04 cobrem bloqueio e acesso negado) | [ ] |
| 2.3.6 | **Desafio 3 (evidência que falta):** escolha **CT05** → Verificar | Erro dizendo que CT05 não completa a cobertura e pista sobre o que acontece depois do bloqueio | [ ] |
| 2.3.7 | **Tentar novamente** → **CT06** → Verificar | “Resolvido!” com a explicação da professora | [ ] |
| 2.3.8 | **Concluir missão** | **+150 XP**, 3/3 desafios, pontuação **83** | [ ] |
| 2.3.9 | **Missão concluída** → Recarregue a página | Continua na mesma tela de conclusão, sem dar XP em dobro | [ ] |

### 2.4 Progresso e conquistas

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 2.4.1 | **Início** | `2 de 2` missões, `+250 XP`, `1 dia` de sequência, 5 conquistas | [ ] |
| 2.4.2 | **Progresso** | Progresso geral 100%; XP 250; taxa de acerto **50%** (8 tentativas); Relações RF ↔ CT **50%**, Cobertura **50%**, Evidência que falta **50%** | [ ] |
| 2.4.3 | **Conquistas** | **Desbloqueadas (5):** Primeiro Rastro, Conexão Perfeita, Detetive de Cobertura, Caçador de Evidências, Mestre da Trilha. **Bloqueada (1):** Sequência de 3 | [ ] |
| 2.4.4 | Missões → “Conectando Pontos” → **Rever desafios** | Abre o Desafio 1 novamente. A revisão não altera o XP nem a taxa de acerto (continuam **250 XP** e **50%**, 8 tentativas, como em 2.4.2). Não responda nada aqui, para não mudar os números da seção 3: o passo 3.4 testa errar de propósito em revisão | [ ] |

---

## 3. Acompanhamento da professora

Saia e entre como **camila@uea.edu.br / tracequest**.

### 3.1 Dashboard e resultados (refletem o que a Ana acabou de fazer)

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.1.1 | **Dashboard** | Alunos ativos **4 de 5** (a turma de 4 mais a conta `teste1`, criada no passo 1.6, que ainda não respondeu nada); atividades concluídas **70%** (7 de 10); média **80 pts**; maior dificuldade “Associação RF ↔ CT”; dificuldades: Cobertura parcial **18%**, Associação **45%**, Requisito sem teste **36%** | [ ] |
| 3.1.2 | “Atividades recentes” | Lista “Conectando Pontos” (4 estudantes, média **79**) e “Primeiros Rastros” (4 estudantes, média **81**) | [ ] |
| 3.1.3 | **Resultados** | 4 estudantes. Ana Beatriz: nota **66**, acertos de 1ª **1/4**, dificuldade “Associação RF ↔ CT”. Gabriela e Lucas: nota **96**. Pedro: nota **62** | [ ] |
| 3.1.4 | Filtre por exercício **Primeiros Rastros** | A tabela e os cartões recalculam (a Ana aparece com nota **50**, 0/1; Pedro com **75**; Gabriela e Lucas com **100**) | [ ] |
| 3.1.5 | **Exportar resumo (CSV)** | Baixa `resultados-tracequest.csv`; abre no Excel com nomes e notas corretos | [ ] |
| 3.1.6 | **Detalhes** da Ana | Pontuação **66**, taxa de acerto **50%**, acertos de primeira **1/4**. Análise por desafio: M1 D1 com **2 erros** antes do acerto; M2 D1 ✓ primeira tentativa; M2 D2 e D3 com 1 erro cada. Sugestão de revisão preenchida (“Reforce associação entre requisitos e testes”) | [ ] |
| 3.1.7 | **Ver respostas do estudante** | Lista as **8** respostas da Ana, marcando ✓/✗ com data e hora | [ ] |
| 3.1.8 | Detalhes do **Pedro** | Mostra mais erros em associação e na evidência que falta | [ ] |

### 3.2 Exercícios: publicar, criar e editar

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.2.1 | **Exercícios** | 3 exercícios; “Caça à Cobertura” em **Rascunho**; contadores de tentativas: “Primeiros Rastros” **7**, “Conectando Pontos” **19**, “Caça à Cobertura” **0** | [ ] |
| 3.2.2 | Busque `cobertura` | Só “Caça à Cobertura” | [ ] |
| 3.2.3 | **Criar exercício** → deixe o título vazio → Continuar → **Salvar e publicar** | Erro “Informe o título do exercício.” | [ ] |
| 3.2.4 | Preencha: título `Pagamento`, nível Iniciante, requisitos **RF01** “O cliente paga com cartão.” e **RF02** “O sistema emite recibo.”; testes **CT01** “Pagar com cartão válido.” (esperado “Pago.”) e **CT02** “Pagar e conferir o recibo.” (esperado “Recibo emitido.”) | Campos aceitam texto; “+ Adicionar” cria novas linhas com código automático | [ ] |
| 3.2.5 | Etapa 2: **+ Nova relação** duas vezes (RF01↔CT01 e RF02↔CT02). Em RF01↔CT01 escreva a justificativa “CT01 paga com cartão.” e **deixe em branco a justificativa de RF02↔CT02** | Selects só oferecem os códigos cadastrados | [ ] |
| 3.2.5a | Clique **Salvar e publicar** | Não publica; aparece o aviso “Revise antes de salvar:” com **“Relação RF02 ↔ CT02: informe a justificativa para publicar.”** (só essa mensagem), logo acima dos botões; você continua na etapa 2 | [ ] |
| 3.2.5b | Com o mesmo campo ainda em branco, clique **Salvar rascunho** | Volta à lista com “Pagamento” (EX-04) como **Rascunho**; rascunho aceita justificativa vazia | [ ] |
| 3.2.5c | Em “Pagamento” clique **Editar** → Continuar → na etapa 2, a justificativa de RF01↔CT01 aparece preenchida e a de RF02↔CT02 vazia. Escreva “CT02 confere o recibo.” na segunda | Campo aceita o texto | [ ] |
| 3.2.6 | Repita o **mesmo CT** (CT01) nas duas relações → **Salvar e publicar** | Erro informando que **CT01 aparece em mais de uma relação** (e, junto, o aviso de que são necessárias ao menos 2 relações) | [ ] |
| 3.2.7 | Volte a RF02↔CT02 e clique **Salvar e publicar** | Volta à lista com “Pagamento” **Publicado** | [ ] |
| 3.2.8 | **Publicar** em “Caça à Cobertura” | Passa para **Publicado** | [ ] |
| 3.2.9 | **Editar** “Pagamento” → troque o texto de uma justificativa → Salvar rascunho | Status volta para **Rascunho** (some para os estudantes) | [ ] |

### 3.3 O que a estudante vê depois (volte como Ana)

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.3.1 | **Missões** | “Caça à Cobertura” agora aparece (Disponível, pois as anteriores estão concluídas). “Pagamento” **não** aparece (rascunho) | [ ] |
| 3.3.2 | Início | Mostra `2 de 3` missões, `+250 XP`, **4** conquistas (“Mestre da Trilha” volta a ficar bloqueada até concluir a nova missão) e a próxima pista é “Caça à Cobertura” | [ ] |
| 3.3.3 | Jogue “Caça à Cobertura” (3 desafios). Desafio 1: a tela mostra 3 requisitos e 3 testes (os outros testes cadastrados são evidências dos desafios 2 e 3); ligue RF01↔CT01, RF02↔CT02, RF03↔CT03. Desafio 2 (RF02): erre com **Cobertura completa** e depois acerte com **Cobertura parcial**. Desafio 3: erre com **CT05** e acerte com **CT04** | Os feedbacks falam do **link que expira em 30 minutos** (conteúdo cadastrado nesse exercício); ao concluir: **+180 XP**, 3/3 desafios, pontuação **83**; Início mostra `3 de 3`, `+430 XP` e 5 conquistas | [ ] |
| 3.3.4 | Como professora, publique “Pagamento” (Exercícios → **Publicar**). Volte como Ana | “Pagamento” aparece como **Disponível**; o Desafio 1 mostra RF01↔CT01 como exemplo e só RF02 para ligar; ao acertar aparece a justificativa que você escreveu | [ ] |
| 3.3.5 | Volte à professora → **Resultados** | Ana Beatriz: nota **72**, acertos de 1ª **2/7**. Gabriela e Lucas continuam em **96** e Pedro em **62**. O dashboard mostra alunos ativos **4 de 5**, atividades concluídas **40%** (8 de 20, com 4 exercícios publicados), média **82 pts**, maior dificuldade “Associação RF ↔ CT”; dificuldades: Cobertura parcial **23%**, Associação **38%**, Requisito sem teste **38%** | [ ] |

### 3.4 Revisar um desafio não altera o desempenho

Use a conta `teste1@uea.edu.br` (senha `abc123`), criada no passo 1.6 e ainda sem respostas. Nesta conta o dashboard passa a ter 5 estudantes ativos; por isso este passo vem depois dos números da seção 3.1.

| # | Passo | Resultado esperado | OK |
| --- | --- | --- | --- |
| 3.4.1 | Entre como `teste1@uea.edu.br` / `abc123`. Missões → “Primeiros Rastros” → Iniciar. Acerte de primeira: RF02 → CT02 e RF03 → CT03 → **Verificar** → **Concluir missão** | “Missão concluída”: **+100 XP**, 1/1 desafio, pontuação **100** | [ ] |
| 3.4.2 | **Progresso** | Progresso geral **25%** (1 de 4 missões), XP **100**, taxa de acerto **100%** (**1** tentativa), Relações RF ↔ CT **100%** | [ ] |
| 3.4.3 | Missões → “Primeiros Rastros” → **Rever desafios**. No Desafio 1, erre de propósito **três vezes**: RF02 → CT03 e RF03 → CT02 → **Verificar** → **Tentar novamente**, repetindo | Cada tentativa mostra “Quase! — revise as conexões”. A missão continua concluída e nenhum XP é perdido | [ ] |
| 3.4.4 | **Progresso** de novo | **Idêntico** ao passo 3.4.2: XP **100**, taxa de acerto **100%** (**1** tentativa), Relações RF ↔ CT **100%**. Os três erros de revisão não entram na taxa de acerto | [ ] |
| 3.4.5 | Início | `1 de 4` missões, `+100 XP`, 2 conquistas (“Primeiro Rastro” e “Conexão Perfeita”) | [ ] |
| 3.4.6 | Saia e entre como professora. **Resultados** | “Teste Um”: nota **100**, acertos de 1ª **1/1**, dificuldade “**Sem erros**” (os erros de revisão não contam) | [ ] |
| 3.4.7 | **Detalhes** de “Teste Um” | Pontuação **100**, taxa de acerto **100%** (o mesmo valor do Progresso do estudante), acertos de primeira **1/1**; análise do Desafio 1: resposta correta na primeira tentativa; sugestão de revisão “Sem dificuldades registradas”, sem etiquetas de dificuldade | [ ] |
| 3.4.8 | **Ver respostas do estudante** | Lista **4** respostas (1 correta e 3 erradas): nenhuma tentativa é apagada, as de revisão continuam visíveis | [ ] |
| 3.4.9 | **Dashboard** | Alunos ativos **5 de 5**, atividades concluídas **45%**, média **85 pts**; dificuldades: Cobertura parcial **23%**, Associação **38%**, Requisito sem teste **38%**, iguais às do passo 3.3.5. Os três erros de revisão não entram nos percentuais | [ ] |

---

## 4. Verificações gerais

| # | Verificação | OK |
| --- | --- | --- |
| 4.1 | A busca do cabeçalho leva à lista de missões (estudante) ou de exercícios (professora) com o filtro aplicado | [ ] |
| 4.2 | Fechar e reabrir a aba mantém a sessão (até 7 dias) | [ ] |
| 4.3 | Reduzir a janela do navegador (tablet/celular) reorganiza o layout sem cortar o conteúdo | [ ] |
| 4.4 | Parar o backend (feche a janela do `iniciar.ps1`) e recarregar uma página mostra mensagem de erro amigável, sem tela branca | [ ] |
| 4.5 | Dados persistem após reiniciar os servidores (`.\iniciar.ps1` sem `-Reset`) | [ ] |

---

## 5. Critérios de aceite do núcleo (AP2)

- [ ] Acesso diferenciado para estudante e professora
- [ ] Cadastro de exercícios, requisitos, casos de teste e relações esperadas
- [ ] Atividades de associação, cobertura e evidência que falta com interação real
- [ ] Correção comparando a resposta com o gabarito da professora, com feedback explicativo
- [ ] Registro das tentativas
- [ ] Resultados registrados aparecem na área da professora

## Observações / problemas encontrados

| Passo | O que aconteceu | Gravidade |
| --- | --- | --- |
|  |  |  |
