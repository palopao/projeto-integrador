import json
import os
import random
import pandas as pd

def gerar_populacao(ano, num_estudantes=60000):
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_dados = os.path.join(pasta_atual, f'dados_modelo_decimal_{ano}.json')
    
    with open(caminho_dados, 'r', encoding='utf-8') as f:
        dados_exames = json.load(f)
        
    sacos_de_notas = {}
    todos_os_exames_do_ano = set()
    
    for registo in dados_exames:
        exame = registo.get("Exame_Unificado")
        nota = registo.get("Nota")
        quantidade = registo.get("Quantidade_Alunos")
        fase = registo.get("Fase")
        
        # Correção: Apanha "1", "1.0" ou "1ª Fase" para não falhar nenhum exame
        if "1" not in str(fase).lower(): continue
        
        if exame not in sacos_de_notas: sacos_de_notas[exame] = []
        sacos_de_notas[exame].extend([nota] * quantidade)
        todos_os_exames_do_ano.add(exame)
        
    for exame in sacos_de_notas:
        sacos_de_notas[exame].sort()
        
    perfis = [
        {"nome": "Ciencias_Saude", "peso": 0.20, "exames_obrigatorios": ["Matematica_A", "Biologia_Geologia", "Fisica_Quimica_A", "Portugues"], "exames_opcionais": []},
        {"nome": "Ciencias_Tech", "peso": 0.23, "exames_obrigatorios": ["Matematica_A", "Fisica_Quimica_A", "Portugues"], "exames_opcionais": ["Geometria_Descritiva_A", "Biologia_Geologia"]},
        {"nome": "Economia", "peso": 0.15, "exames_obrigatorios": ["Matematica_A", "Economia_A", "Portugues"], "exames_opcionais": ["Geografia_A", "MACS"]},
        {"nome": "Humanidades", "peso": 0.32, "exames_obrigatorios": ["Historia_A", "Portugues"], "exames_opcionais": ["Geografia_A", "MACS", "Literatura_Portuguesa", "Ingles"]},
        {"nome": "Artes", "peso": 0.10, "exames_obrigatorios": ["Desenho_A", "Portugues"], "exames_opcionais": ["Geometria_Descritiva_A", "HCA"]}
    ]
    
    distritos = ["Lisboa", "Porto", "Braga", "Setúbal", "Coimbra", "Faro", "Leiria", "Outro"]
    pesos_distritos = [0.28, 0.18, 0.09, 0.08, 0.05, 0.04, 0.04, 0.24]
    
    lista_todos_exames = list(todos_os_exames_do_ano)
    alunos = []
    
    for i in range(num_estudantes):
        aluno = {"Aluno_ID": f"{ano}_{i+1}"}
        aluno["Distrito"] = random.choices(distritos, weights=pesos_distritos)[0]
        
        percentil_aluno = random.betavariate(2.5, 1.2)
        
        r = random.random()
        peso_acumulado = 0
        perfil_escolhido = perfis[-1]
        for p in perfis:
            peso_acumulado += p["peso"]
            if r <= peso_acumulado:
                perfil_escolhido = p
                break
                
        exames_escolhidos = []
        for ex in perfil_escolhido["exames_obrigatorios"]:
            if ex in sacos_de_notas and len(sacos_de_notas[ex]) > 0: exames_escolhidos.append(ex)
                
        opcionais_validos = [ex for ex in perfil_escolhido["exames_opcionais"] if ex in sacos_de_notas and len(sacos_de_notas[ex]) > 0]
        if opcionais_validos: exames_escolhidos.append(random.choice(opcionais_validos))
            
        if random.random() < 0.05:
            exame_extra = random.choice(lista_todos_exames)
            if exame_extra not in exames_escolhidos and len(sacos_de_notas.get(exame_extra, [])) > 0:
                exames_escolhidos.append(exame_extra)
        
        notas_fase1 = []
        for exame in exames_escolhidos:
            p_exame = max(0.0, min(0.999, percentil_aluno + random.uniform(-0.08, 0.08)))
            idx = int(p_exame * len(sacos_de_notas[exame]))
            
            n1 = min(200, sacos_de_notas[exame][idx] + random.randint(12, 18))
            aluno[f"{exame}_F1"] = n1
            notas_fase1.append(n1)
            
            n2 = min(200, n1 + random.randint(-5, 15))
            aluno[f"{exame}_F2"] = n2
            
            n3 = min(200, max(n1, n2) + random.randint(-2, 10))
            aluno[f"{exame}_F3"] = n3
            
        if notas_fase1:
            media_exames = sum(notas_fase1) / len(notas_fase1)
            diferenca = random.gauss(25, 3)
            nota_interna = media_exames + diferenca
        else:
            nota_interna = random.gauss(165, 15)
            
        aluno["Nota_Interna"] = max(100, min(200, int(nota_interna)))
        alunos.append(aluno)
        
    df_populacao = pd.DataFrame(alunos)
    
    for exame in lista_todos_exames:
        for fase in [1, 2, 3]:
            col_name = f"{exame}_F{fase}"
            if col_name not in df_populacao.columns:
                df_populacao[col_name] = float('nan')
                
    caminho_saida = os.path.join(pasta_atual, f'populacao_virtual_{ano}.parquet')
    df_populacao.to_parquet(caminho_saida, index=False)
    return caminho_saida

if __name__ == "__main__":
    gerar_populacao("2024", 75000)