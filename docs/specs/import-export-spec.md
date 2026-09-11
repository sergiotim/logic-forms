# [SPEC-005] Sistema de Importação e Exportação de Fases (Compartilhamento Offline)

## 1. Visão Geral
Como o sistema de **Lógica Dinâmica** opera de forma client-side (armazenando os dados no `localStorage` do navegador), não há um banco de dados centralizado em nuvem no momento. Para permitir que professores criem, compartilhem e utilizem fases criadas por outros docentes, precisamos de um mecanismo de **Exportação e Importação via arquivos `.json`**.

Esta especificação define como os dados relacionais são convertidos em um pacote portável ("Fase Hidratada") e como eles são mesclados de forma segura na máquina de destino sem causar corrupção de dados ou colisão de IDs.

---

## 2. Estrutura do Arquivo de Exportação ("Pacote Hidratado")
Internamente, a plataforma adota um modelo relacional (a Fase guarda apenas um array de `questionIds`, e os dados vivem no `questionBank`). No entanto, ao exportar, o arquivo precisa ser "hidratado". Isso significa que o sistema deve empacotar os metadados da(s) fase(s) e buscar os objetos completos de todas as questões associadas.

Para garantir máxima flexibilidade, o arquivo de exportação é desenhado para aceitar **uma ou múltiplas fases** (um "Módulo" ou "Pacote").

### Schema do Arquivo Exportado (Ex: `modulo-predicados.json`)
```json
{
  "metadata": {
    "version": 1,
    "type": "logica-dinamica:package_export",
    "exportedAt": "2026-09-11T12:00:00Z"
  },
  "phases": [
    {
      "titulo": "Exercícios de Predicados - Parte 1",
      "icone": "Brain",
      "originalQuestionIds": ["q_old_1", "q_old_2"]
    },
    {
      "titulo": "Exercícios de Predicados - Parte 2",
      "icone": "Target",
      "originalQuestionIds": ["q_old_3"]
    }
  ],
  "questions": [
    {
      "originalId": "q_old_1",
      "tipo": "formalizacao",
      "topico": "Lógica de Predicados",
      "enunciado": "Formalize: 'Todo peculatário é repulsivo.'",
      "resposta_esperada": "∀x(Px → Rx)"
    },
    {
      "originalId": "q_old_2",
      /* ... */
    },
    {
      "originalId": "q_old_3",
      /* ... */
    }
  ]
}
```
*Nota: Adicionamos o campo temporário `originalId` nas questões e `originalQuestionIds` nas fases apenas para o script de importação saber amarrar quem pertence a qual fase. Esses IDs antigos serão descartados ao entrar no novo localStorage.*

---

## 3. Fluxo de Exportação
1. No **Modo Editor**, o professor pode clicar em **"Exportar Fase"** (em uma fase específica) ou **"Exportar Todas"** (no cabeçalho da sidebar).
2. O sistema agrupa a(s) fase(s) solicitada(s).
3. Varre os `questionIds` de todas as fases selecionadas e extrai as cópias correspondentes do `questionBank`.
4. Atribui os `originalId` para manter a relação, monta o objeto JSON e aciona o download nativo do navegador.

---

## 4. Fluxo de Importação e Prevenção de Colisões
O desafio da importação em sistemas descentralizados é garantir que uma questão importada não sobrescreva acidentalmente uma questão que já existe na máquina de destino.

### Algoritmo de Importação Segura:
1. O usuário aciona a importação e fornece o arquivo `.json`.
2. O sistema valida a estrutura (`metadata.type === "logica-dinamica:package_export"`). 
3. **Mapeamento e Geração de Novos IDs:**
   - Cria um dicionário vazio para mapear os IDs: `idMap = {}`.
   - Para cada questão contida no array `questions` do JSON:
     1. Cria um **novo ID** único (ex: `crypto.randomUUID()`).
     2. Salva o mapeamento: `idMap[questao.originalId] = novoId`.
     3. Remove o `originalId`, atribui o `novoId` e insere a questão no `questionBank` local.
4. **Reconstrução das Fases:**
   - Para cada fase no array `phases` do JSON:
     1. Cria um **novo ID** único para a fase.
     2. Mapeia o array `originalQuestionIds` usando o `idMap` para obter os novos IDs locais.
     3. Cria o objeto da Fase referenciando as novas questões (salvando `questionIds`).
     4. Adiciona a nova Fase no final da lista de fases (`phases`) do estado global.
5. Persiste as alterações no `localStorage`.
6. Exibe um aviso de sucesso (`Feedback` toast de Sucesso indicando quantas fases foram importadas).

---

## 5. Interface de Usuário (UI/UX)
Para garantir uma boa usabilidade, o sistema de importação adotará as seguintes interfaces no Modo Editor (`PhaseSidebar`):

- **Botão de Importação Tradicional:** Um botão com ícone de upload (ex: `UploadCloud` do Lucide) no cabeçalho da barra lateral de fases. Ao clicar, um input `<input type="file" accept=".json" />` (invisível) é acionado.
- **Drag and Drop (Arrastar e Soltar):** A barra lateral de fases deve escutar eventos de `onDragOver` e `onDrop`. Se o professor arrastar um arquivo `.json` do explorador de arquivos do sistema operacional e soltar sobre a área da lista de fases, a importação é processada instantaneamente.
- **Feedback Visual:** Durante a leitura do arquivo, mostrar um breve estado de *loading*. Ao finalizar, piscar ou rolar a barra lateral até a nova fase recém-criada para mostrar que ela foi adicionada com sucesso.

