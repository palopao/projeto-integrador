1. Módulo de Geração Sintética (gerador_populacao.py)

    Distribuição DGEEC (Perfis de Estudo): Os alunos são divididos em percentagens exatas ditadas pelo Ministério da Educação (Ciências/Saúde, Engenharias, Economia, Humanidades e Artes), garantindo que os exames certos são feitos pelas pessoas certas.

    Geolocalização: Os alunos recebem um "Distrito" de residência baseado em censos populacionais (com maioria em Lisboa, Porto, Braga, etc.), vital para as lógicas de afinidade geográfica.

    O "DNA Académico" (Percentil Beta): Para garantir que um génio a Matemática A também tem notas de topo a Física (Correlação Positiva), o sistema atribui um percentil base usando uma Distribuição Beta. Os alunos extraem as suas notas dos dados reais em função deste "DNA".

    Curva de Gauss (Notas Internas): Para espelhar a realidade do Ensino Secundário, onde existe a chamada "inflação de excelência", a nota interna final é calculada aplicando uma curva de Gauss rigorosa sobre a média dos exames nacionais, criando a elite universitária necessária para preencher os cursos de topo.

2. Motor de Simulação e Matching (simulador_dges.py)

    Criação da Ficha de Candidatura (Preferências Orgânicas): Em vez de todos os alunos tentarem ir para Medicina (o que gerava Model Collapse), cada aluno virtual gera uma lista orgânica com um máximo de 6 opções. A lista é ordenada por um Score_Preferencia que tem em conta:

        A nota de candidatura do aluno para aquele curso específico.

        A distância entre a nota do aluno e a nota de corte histórica do curso (Filtro de "Bom Senso": alunos não se candidatam a cursos para os quais não têm média).

        Bónus Geográfico (um bónus suave de afinidade se o curso for no distrito do aluno).

    O Efeito Dominó (Gale-Shapley): O processamento é feito em rondas. Todos os alunos concorrem em simultâneo à sua 1.ª opção. As faculdades trancam os melhores alunos e rejeitam os restantes. Os rejeitados "caem" para a sua 2.ª opção, o que obriga essa faculdade a reavaliar e expulsar os piores. O dominó continua pelo país inteiro até o sistema estabilizar de forma matematicamente perfeita.

3. Treinador de Inteligência Artificial (treinador_ia.py)

    Loop de Épocas: O treinador percorre a base de dados ano após ano (ex: 2017 a 2024), gerando populações e simulando colocações dinamicamente.

    Mecanismo de Backpropagation (Magnetismo): No fim de cada ano, o algoritmo avalia a diferença (Erro Absoluto) entre a nota de corte real da DGES e a nota simulada.

    Função de Atualização: Utilizando uma Learning Rate (α), a IA ajusta o peso neural de cada curso no ficheiro pesos_cursos.json (ex: Novo_Peso=Peso_Atual−(Erro×α)). Se um curso simulado teve notas muito baixas, o seu "Magnetismo" aumenta, tornando-o mais atrativo na ficha de candidatura dos alunos no ano seguinte.