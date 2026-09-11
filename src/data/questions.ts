import { Question } from '../types';

export const bancoDeQuestoes: Question[] = [
    {
        id: "q1",
        tipo: "diagramacao",
        topico: "Estrutura de um Argumento (Cap 1)",
        enunciado: "Analise o argumento disjuntivo abaixo e classifique suas partes estruturais (Premissas e Conclusão):",
        frases: [
            { id: "f1", texto: "Hoje é segunda-feira ou terça-feira." },
            { id: "f2", texto: "Hoje não é segunda-feira." },
            { id: "f3", texto: "Portanto, hoje é terça-feira." }
        ],
        resposta_esperada: { "f1": "P", "f2": "P", "f3": "C" }
    },
    {
        id: "q2",
        tipo: "diagramacao",
        topico: "Argumentos Indutivos (Cap 2)",
        enunciado: "Identifique as premissas e a conclusão no seguinte argumento hipotético:",
        frases: [
            { id: "f1", texto: "Todos os marcianos são bons beijadores." },
            { id: "f2", texto: "Algumas coisas com várias bocas são bons beijadores." },
            { id: "f3", texto: "Alguns marcianos têm várias bocas." }
        ],
        resposta_esperada: { "f1": "P", "f3": "P", "f2": "C" }
    },
    {
        id: "q3",
        tipo: "tabela_verdade",
        topico: "Cálculo Proposicional - Conjunção (Cap 3)",
        enunciado: "Preencha a coluna final para a tabela-verdade da Conjunção (P ∧ Q):",
        variaveis: ["P", "Q"],
        linhas: [
            { valores: ["V", "V"], id: "l1" },
            { valores: ["V", "F"], id: "l2" },
            { valores: ["F", "V"], id: "l3" },
            { valores: ["F", "F"], id: "l4" }
        ],
        expressao: "P ∧ Q",
        resposta_esperada: ["V", "F", "F", "F"]
    },
    {
        id: "q4",
        tipo: "tabela_verdade",
        topico: "Cálculo Proposicional - Condicional (Cap 3)",
        enunciado: "Resolva a tabela-verdade para o Condicional Modificado (P → ~Q):",
        variaveis: ["P", "Q", "~Q"],
        linhas: [
            { valores: ["V", "V", "F"], id: "l1" },
            { valores: ["V", "F", "V"], id: "l2" },
            { valores: ["F", "V", "F"], id: "l3" },
            { valores: ["F", "F", "V"], id: "l4" }
        ],
        expressao: "P → ~Q",
        resposta_esperada: ["F", "V", "V", "V"]
    },
    {
        id: "q5",
        tipo: "formalizacao",
        topico: "Formalização Proposicional (Cap 4)",
        enunciado: "Traduza o raciocínio: 'Se abril precede maio, então abril precede maio e maio segue abril.'",
        dicas: ["A: Abril precede maio", "S: Maio segue abril"],
        teclado_virtual: ["~", "∧", "∨", "→", "↔"],
        resposta_esperada: "A → (A ∧ S)"
    },
    {
        id: "q6",
        tipo: "formalizacao",
        topico: "Lógica de Predicados (Cap 7)",
        enunciado: "Usando quantificadores, formalize a proposição categórica Universal Afirmativa: 'Todo peculatário é repulsivo.'",
        dicas: ["P: é peculatário", "R: é repulsivo", "x: variável individual"],
        teclado_virtual: ["∀", "∃", "~", "∧", "∨", "→"],
        resposta_esperada: "∀x(Px → Rx)"
    }
];
