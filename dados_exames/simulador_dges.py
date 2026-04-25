import pandas as pd
import json
import os
import re
from tqdm import tqdm

MAPA_EXAMES = {
    "02  Biologia e Geologia": "Biologia_Geologia", "04  Economia": "Economia_A",
    "06  Filosofia": "Filosofia", "07  Física e Química": "Fisica_Quimica_A",
    "09  Geografia": "Geografia_A", "10  Geometria Descritiva": "Geometria_Descritiva_A",
    "11  História": "Historia_A", "16  Matemática": "Matematica_A", 
    "19  Matemática A": "Matematica_A", "17  Mat. Apl. Ciências Soc.": "MACS",
    "18  Português": "Portugues", "03  Desenho": "Desenho_A",
    "12  Hist. da Cultura e Artes": "HCA", "13  Inglês": "Ingles",
    "14  Português (639)": "Portugues", "01  Alemão": "Alemao",
    "05  Espanhol": "Espanhol_Continuacao", "08  Francês": "Frances", "15  Latim": "Latim_A"
}

def obter_distrito_curso(codigo_instituicao):
    cod = str(codigo_instituicao)[:2]
    mapa = {
        "03": "Braga", "05": "Coimbra", "07": "Lisboa", "08": "Lisboa",
        "09": "Porto", "11": "Lisboa", "33": "Coimbra", "35": "Leiria", 
        "36": "Lisboa", "38": "Porto", "40": "Setúbal"
    }
    return mapa.get(cod, "Outro")

def extrair_pesos(formula_str):
    if not formula_str: return 0.5, 0.5
    percentagens = re.findall(r'(\d+)%', str(formula_str))
    if len(percentagens) >= 2: return int(percentagens[0])/100, int(percentagens[1])/100
    return 0.5, 0.5 

def organizar_conjuntos(provas_lista):
    conjuntos, atual = [], []
    for item in provas_lista:
        if item.lower() == "ou":
            if atual: conjuntos.append(atual)
            atual = []
        elif item.lower() != "e":
            coluna = MAPA_EXAMES.get(item.strip())
            if coluna: atual.append(coluna)
    if atual: conjuntos.append(atual)
    return conjuntos

def simular_ano(ano):
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    df_alunos = pd.read_csv(os.path.join(pasta_atual, f'populacao_virtual_{ano}.csv'))
    
    with open(os.path.join(pasta_atual, 'cursos_detalhes.json'), 'r', encoding='utf-8') as f:
        cursos_regras = json.load(f)
    with open(os.path.join(pasta_atual, f'dados_dges_{ano}.json'), 'r', encoding='utf-8') as f:
        dados_vagas = json.load(f)
        
    caminho_pesos = os.path.join(pasta_atual, 'pesos_cursos.json')
    pesos_magnetismo = {}
    if os.path.exists(caminho_pesos):
        with open(caminho_pesos, 'r') as f:
            pesos_magnetismo = json.load(f)
        
    info_vagas = {f"{c['codigo_instituicao']}-{c['codigo_curso']}": {
        'vagas': c.get('vagas_iniciais', 0),
        'nota_real': c.get('fases', {}).get('fase_1', {}).get('nota')
    } for c in dados_vagas}

    colunas_existentes = set(df_alunos.columns)
    cursos_processados = []
    
    for c in cursos_regras:
        chave = f"{c['codigo_instituicao']}-{c['codigo_curso']}"
        if chave not in info_vagas or info_vagas[chave]['vagas'] <= 0: continue
        
        peso_sec, peso_exm = extrair_pesos(c.get('formula_nota', ""))
        conjuntos = organizar_conjuntos(c.get('provas_ingresso', []))
        conjuntos_validos = [conj for conj in conjuntos if all(ex in colunas_existentes for ex in conj)]
        if not conjuntos_validos: continue
            
        nota_base_real = info_vagas[chave]['nota_real'] if info_vagas[chave]['nota_real'] else 95.0
            
        cursos_processados.append({
            'chave': chave, 'nome': c.get('nome_curso'), 'vagas': info_vagas[chave]['vagas'],
            'nota_real': info_vagas[chave]['nota_real'], 'peso_sec': peso_sec, 'peso_exm': peso_exm,
            'conjuntos_provas': conjuntos_validos,
            'distrito': obter_distrito_curso(c['codigo_instituicao']),
            'desirabilidade_base': nota_base_real,
            'magnetismo': pesos_magnetismo.get(chave, 1.0)
        })

    # FASE 1: FICHAS DE CANDIDATURA ORGÂNICAS
    lista_candidaturas = []
    for curso in tqdm(cursos_processados, desc=f"A gerar Fichas de Candidatura ({ano})", leave=False):
        scores_maximos = pd.Series(-1.0, index=df_alunos.index)
        for conj in curso['conjuntos_provas']:
            has_exams = df_alunos[conj].notna().all(axis=1)
            if has_exams.any():
                media_exames = df_alunos.loc[has_exams, conj].mean(axis=1)
                score_temp = (df_alunos.loc[has_exams, 'Nota_Interna'] * curso['peso_sec']) + (media_exames * curso['peso_exm'])
                scores_maximos = pd.concat([scores_maximos, score_temp], axis=1).max(axis=1)
        
        validos_mask = scores_maximos >= 95.0
        if not validos_mask.any(): continue
            
        df_valido = df_alunos[validos_mask][['Aluno_ID', 'Distrito']].copy()
        df_valido['Curso'] = curso['chave']
        df_valido['Score_Base'] = scores_maximos[validos_mask]
        df_valido['Desirabilidade_Curso'] = curso['desirabilidade_base']
        
        df_valido['Geo_Bonus'] = df_valido['Distrito'].apply(lambda d: 1.02 if d == curso['distrito'] else 1.0)
        
        # A MAGIA DA PREFERÊNCIA: O aluno atira aos cursos que se alinham com o seu potencial!
        df_valido['Distancia'] = (df_valido['Desirabilidade_Curso'] - df_valido['Score_Base']).abs()
        df_valido['Score_Preferencia'] = (200.0 - df_valido['Distancia']) * df_valido['Geo_Bonus']
        
        df_valido['Score_Competicao'] = df_valido['Score_Base'] * curso['magnetismo']
        
        lista_candidaturas.append(df_valido[['Aluno_ID', 'Curso', 'Score_Competicao', 'Score_Base', 'Score_Preferencia']])

    df_todas = pd.concat(lista_candidaturas, ignore_index=True)
    
    # ❌ O LIMITE DE -15 FOI APAGADO AQUI! Já não precisamos de paredes de cimento.

    # O aluno envia as suas 6 melhores apostas (safety schools + dream schools orgânicas)
    df_todas = df_todas.sort_values(['Aluno_ID', 'Score_Preferencia'], ascending=[True, False])
    fichas_dges = df_todas.groupby('Aluno_ID').head(6)
    
    opcoes_alunos = fichas_dges.groupby('Aluno_ID')['Curso'].apply(list).to_dict()
    scores_dit = fichas_dges.set_index(['Aluno_ID', 'Curso'])[['Score_Competicao', 'Score_Base']].to_dict('index')
    
    # FASE 2: GALE-SHAPLEY
    estudantes_livres = set(opcoes_alunos.keys())
    tentativas = {aluno: 0 for aluno in estudantes_livres}
    colocacoes = {c['chave']: [] for c in cursos_processados} 
    vagas_dict = {c['chave']: c['vagas'] for c in cursos_processados}
    
    with tqdm(total=len(estudantes_livres), desc="A correr Gale-Shapley (Efeito Dominó)", leave=False) as pbar:
        while estudantes_livres:
            candidaturas_ronda = {c['chave']: [] for c in cursos_processados}
            for aluno in list(estudantes_livres):
                idx = tentativas[aluno]
                if idx < len(opcoes_alunos[aluno]):
                    curso_alvo = opcoes_alunos[aluno][idx]
                    s_comp = scores_dit[(aluno, curso_alvo)]['Score_Competicao']
                    s_base = scores_dit[(aluno, curso_alvo)]['Score_Base']
                    candidaturas_ronda[curso_alvo].append((s_comp, s_base, aluno))
                else:
                    estudantes_livres.remove(aluno)
                    pbar.update(1)
                    
            estudantes_livres.clear()
            for chave, novos_cand in candidaturas_ronda.items():
                if novos_cand:
                    todos = colocacoes[chave] + novos_cand
                    todos.sort(key=lambda x: x[0], reverse=True)
                    vagas = vagas_dict[chave]
                    colocacoes[chave] = todos[:vagas]
                    rejeitados = todos[vagas:]
                    for r in rejeitados:
                        aluno_rej = r[2]
                        tentativas[aluno_rej] += 1
                        estudantes_livres.add(aluno_rej)

    # FASE 3: RESULTADOS
    resultados = []
    for curso in cursos_processados:
        chave = curso['chave']
        vencedores = colocacoes[chave]
        if len(vencedores) > 0:
            nota_corte = round(min(v[1] for v in vencedores), 1)
        else:
            nota_corte = 95.0
            
        erro = round(nota_corte - curso['nota_real'], 1) if curso['nota_real'] else None
        resultados.append({'Curso': curso['nome'], 'Codigo': chave, 'Nota_Real': curso['nota_real'], 'Nota_Simulada': nota_corte, 'Erro': erro})

    df_res = pd.DataFrame(resultados)
    df_res.to_csv(os.path.join(pasta_atual, f'resultados_simulacao_{ano}.csv'), index=False)
    return df_res

if __name__ == "__main__":
    simular_ano("2024")