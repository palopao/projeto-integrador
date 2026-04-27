1. Módulo de Geração Sintética (gerador_populacao.py)

    Distribuição DGEEC (Perfis de Estudo): Os alunos são divididos em percentagens exatas ditadas pelo Ministério da Educação (Ciências/Saúde, Engenharias, Economia, Humanidades e Artes), garantindo que os exames certos são feitos pelas pessoas certas.

    Geolocalização: Os alunos recebem um "Distrito" de residência baseado em censos populacionais, vital para as lógicas de afinidade geográfica.

    O "DNA Académico" (Percentil Beta): Para garantir que um génio a Matemática A também tem notas de topo a Física (Correlação Positiva), o sistema atribui um percentil base usando uma Distribuição Beta.

    Curva de Gauss (Notas Internas): Para espelhar a "inflação de excelência" do Ensino Secundário, a nota interna final é calculada aplicando uma curva de Gauss rigorosa sobre a média dos exames nacionais.

2. Motor de Simulação e Matching (simulador_dges.py)

    Fases da DGES e Dinâmica Populacional: O motor simula as 3 Fases reais de acesso. 96% dos alunos entram no mercado na Fase 1. As Fases 2 e 3 herdam as vagas sobrantes e são disputadas por alunos não colocados e pelos "Inconformados Inteligentes" (alunos colocados que tentam mudar de curso, condicionados a só o fazerem se a sua nota interna for manifestamente superior ao curso onde ficaram).

    Criação Orgânica da Ficha (Cálculo de Preferência): O Score de preferência abandona a lógica estática e avalia:

        Atratividade Dinâmica: O prestígio histórico do curso adaptado ao peso gerado pela Inteligência Artificial.

        Penalização Exponencial e Escudo de Sobrequalificação: Impede o "Turismo de Génios" (alunos de 190 roubarem vagas de pós-laborais de 130 como plano B). Alunos recusam-se a descer mais de 2.5 valores abaixo da sua média.

        Filtro de Dignidade: Cursos que atingem scores nulos de interesse são expurgados da ficha de até 6 opções do aluno.

    O Efeito Dominó (Gale-Shapley): Todos os alunos concorrem em simultâneo. As faculdades trancam os melhores e rejeitam os restantes. Os rejeitados "caem" para a 2.ª opção, obrigando essa faculdade a reavaliar e expulsar os piores. O dominó percorre o país até estabilizar matematicamente.

3. Treinador de Inteligência Artificial (treinador_ia.py)

    Online Learning e Quebras Estruturais: O treinador percorre a base de dados cronologicamente (ex: 2017 a 2024), adaptando-se ano a ano a choques sistémicos, como a inflação pandémica de 2020.

    Backpropagation com Momentum: Para evitar o Overfitting a anomalias de um ano isolado, a rede neural utiliza inércia matemática para atualizar o Magnetismo (peso neural) de cada curso:

        vnovo​=β⋅vatual​+α⋅erro

        Pesonovo​=Pesoatual​−vnovo​
        Onde α é a Learning Rate e β é o Momentum, ambos sujeitos a Clipping (limitação de gradiente) para impedir que a IA entre em pânico com oscilações bruscas nos exames nacionais. Os resultados ficam guardados no pesos_cursos.json