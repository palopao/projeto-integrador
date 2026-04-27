import pandas as pd
import json
import os
import re
import random
import numpy as np
import math
from tqdm import tqdm
from collections import deque

ALVOS_FORENSE = ["7110-9875", "7220-9504", "0300-9002"]
log_forense = []

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

def limpar_nome_exame(nome):
    nome = str(nome).lower().replace("  ", " ").strip()
    if "biologia" in nome and "geologia" in nome: return "Biologia_Geologia"
    if "física" in nome and "química" in nome: return "Fisica_Quimica_A"
    if "economia" in nome: return "Economia_A"
    if "filosofia" in nome: return "Filosofia"
    if "geometria descritiva" in nome: return "Geometria_Descritiva_A"
    if "matemática a" in nome: return "Matematica_A"
    if "matemática" in nome: return "Matematica_A"
    if "geografia" in nome: return "Geografia_A"
    if "cultura e artes" in nome or "hca" in nome: return "HCA"
    if "história" in nome: return "Historia_A"
    if "ciências soc" in nome or "macs" in nome: return "MACS"
    if "português" in nome: return "Portugues"
    if "desenho" in nome: return "Desenho_A"
    if "inglês" in nome: return "Ingles"
    if "espanhol" in nome: return "Espanhol_Continuacao"
    if "alemão" in nome: return "Alemao"
    if "francês" in nome: return "Frances"
    if "latim" in nome: return "Latim_A"
    return None

def organizar_conjuntos(provas_lista):
    if not provas_lista: return [["Portugues"]] 
    conjuntos, atual = [], []
    if isinstance(provas_lista, str): provas_lista = re.split(r'\s+ou\s+', provas_lista, flags=re.IGNORECASE)
    for item in provas_lista:
        if " e " in str(item).lower():
            partes = str(item).lower().split(" e ")
            sub_atual = [limpar_nome_exame(p) for p in partes if limpar_nome_exame(p)]
            if sub_atual: conjuntos.append(sub_atual)
        else:
            c = limpar_nome_exame(item)
            if c: atual.append(c)
            elif str(item).lower().strip() == "ou":
                if atual: conjuntos.append(atual)
                atual = []
    if atual: conjuntos.append(atual)
    if not conjuntos: return [["Portugues"]] 
    return conjuntos

def get_valid_nota(nota):
    if pd.isna(nota) or str(nota).strip() == "" or float(nota) >= 200.0: return None
    return float(nota)

def processar_curso_vectorizado(curso, df_alunos, fase, colunas, margem, nota_alvo):
    n_inicial = len(df_alunos)
    best_scores = np.full(n_inicial, -1.0, dtype=np.float32)
    
    passou_exames = np.zeros(n_inicial, dtype=bool)
    for conj in curso['conjuntos_provas']:
        c_fase = [f"{ex}_F1" for ex in conj] 
        if not all(c in colunas for c in c_fase): continue
        m = df_alunos[c_fase].notna().all(axis=1).values
        passou_exames = passou_exames | m
        if not m.any(): continue
        media_ex = df_alunos.loc[m, c_fase].mean(axis=1).values
        sc = (df_alunos.loc[m, 'Nota_Interna'].values * curso['peso_sec'] + media_ex * curso['peso_exm']).astype(np.float32)
        current_bests = best_scores[m]
        best_scores[m] = np.where(sc > current_bests, sc, current_bests)

    # O "Magnetismo" Neural ajusta a percepção de prestígio do curso
    mag_bonus = (curso['magnetismo'] - 1.0) * 15.0 
    prestigio_adaptado = curso['desirabilidade_base'] + mag_bonus

    # Filtro básico
    f_mask = passou_exames & (best_scores >= 94.9) & (best_scores >= (nota_alvo - margem))
    
    if fase > 1:
        # Apenas não deixamos as pessoas que já entraram num bom curso candidatarem-se a cursos fracos (Pára-quedas)
        is_placed = df_alunos['Nota_Atual'].values > 0.0
        is_upgrade = prestigio_adaptado >= (df_alunos['Nota_Atual'].values - 2.0)
        f_mask = f_mask & (~is_placed | is_upgrade)
        
    if not f_mask.any(): return None
    
    df_res = pd.DataFrame({
        'Aluno_ID': df_alunos.loc[f_mask, 'Aluno_ID'].astype(str).values,
        'Distrito': df_alunos.loc[f_mask, 'Distrito'].values,
        'Score_Base': best_scores[f_mask]
    })
    df_res['Curso'] = curso['chave']
    df_res['Score_Competicao'] = df_res['Score_Base'] 
    
    # 🚀 REGRESSO ÀS ORIGENS: A tua fórmula simples, elegante e simétrica!
    distancia = np.abs(prestigio_adaptado - df_res['Score_Base'])
    base_pref = 200.0 - distancia
    
    mesmo_distrito = (df_res['Distrito'] == curso['distrito']) & (df_res['Distrito'] != 'Outro')
    geo_bonus = np.where(mesmo_distrito, 5.0, 0.0) 
    ruido_vocacional = np.random.normal(0, 4.0, size=len(df_res))
    
    df_res['Score_Pref'] = base_pref + geo_bonus + ruido_vocacional
        
    return df_res[['Aluno_ID', 'Curso', 'Score_Competicao', 'Score_Base', 'Score_Pref']]

def simular_ano(ano):
    global log_forense
    log_forense = [f"INÍCIO FORENSE - ANO {ano}"]
    path = os.path.dirname(os.path.abspath(__file__))
    df = pd.read_parquet(os.path.join(path, f'populacao_virtual_{ano}.parquet'))
    df['Aluno_ID'] = df['Aluno_ID'].astype(str)
    df['Nota_Interna'] = df['Nota_Interna'].astype(np.float32)
    col_existentes = set(df.columns)
    
    np.random.seed(int(ano)) 
    # 🚀 CORREÇÃO DO BALDE FURADO: 96% da população entra logo na Fase 1 como na vida real.
    df['Fase_Entrada'] = np.random.choice([1, 2, 3], size=len(df), p=[0.96, 0.03, 0.01])
    df['Nota_Atual'] = 0.0
    
    with open(os.path.join(path, 'cursos_detalhes.json'), 'r', encoding='utf-8') as f: regs = json.load(f)
    with open(os.path.join(path, f'dados_dges_{ano}.json'), 'r', encoding='utf-8') as f: vags = json.load(f)
    p_mapa = os.path.join(path, 'mapa_distritos.json')
    mapa_distritos = json.load(open(p_mapa, encoding='utf-8')) if os.path.exists(p_mapa) else {}
    p_path = os.path.join(path, 'pesos_cursos.json')
    pesos = json.load(open(p_path, encoding='utf-8')) if os.path.exists(p_path) else {}
    
    info = {f"{c['codigo_instituicao']}-{c['codigo_curso']}": {
        'v_ini': c.get('vagas_iniciais', 0), 
        'nota_f1': get_valid_nota(c.get('fases', {}).get('fase_1', {}).get('nota')),
        'nota_f2': get_valid_nota(c.get('fases', {}).get('fase_2', {}).get('nota')),
        'nota_f3': get_valid_nota(c.get('fases', {}).get('fase_3', {}).get('nota'))
    } for c in vags}

    cursos = []
    for c in regs:
        ch = f"{c['codigo_instituicao']}-{c['codigo_curso']}"
        cod_inst = c['codigo_instituicao']
        if ch not in info: continue
        nota_ref = info[ch]['nota_f1']
        if not nota_ref: nota_ref = info[ch]['nota_f2']
        if not nota_ref: nota_ref = info[ch]['nota_f3']
        if not nota_ref: nota_ref = 100.0 
        distrito_curso = mapa_distritos.get(cod_inst, {}).get("distrito", "Outro")
        cursos.append({
            'chave': ch, 'nome': c['nome_curso'], 'v_ini': info[ch]['v_ini'],
            'nota_f1_hist': info[ch]['nota_f1'], 'nota_f2_hist': info[ch]['nota_f2'], 'nota_f3_hist': info[ch]['nota_f3'],
            'peso_sec': 0.5, 'peso_exm': 0.5, 'conjuntos_provas': organizar_conjuntos(c.get('provas_ingresso', [])),
            'distrito': distrito_curso, 'desirabilidade_base': nota_ref, 'magnetismo': pesos.get(ch, 1.0)
        })

    vagas_atuais = {c['chave']: c['v_ini'] for c in cursos}
    colocados_totais = {} 
    resultados_finais = []
    notas_corte_simuladas = {c['chave']: c['desirabilidade_base'] for c in cursos}
    curso_to_desirabilidade = {c['chave']: c['desirabilidade_base'] for c in cursos}
    
    for fase in [1, 2, 3]:
        log_forense.append(f"\n==================== FASE {fase} ====================")
        margem = 15.0 if fase == 1 else (25.0 if fase == 2 else 35.0)
        
        pool_fase = df[df['Fase_Entrada'] <= fase].copy()
        
        if fase == 1:
            df_cand = pool_fase
        else:
            aluno_nota_atual = {a: curso_to_desirabilidade.get(c, 0.0) for a, c in colocados_totais.items()}
            pool_fase['Nota_Atual'] = pool_fase['Aluno_ID'].map(aluno_nota_atual).fillna(0.0)
            
            mask_nao_colocado = pool_fase['Nota_Atual'] == 0.0
            mask_subaproveitado = (pool_fase['Nota_Interna'] > (pool_fase['Nota_Atual'] + 3.0)) & (~mask_nao_colocado)
            taxa_sorteio = 0.05 if fase == 2 else 0.02
            sorteio = np.random.rand(len(pool_fase)) < taxa_sorteio
            
            df_cand = pool_fase[mask_nao_colocado | (mask_subaproveitado & sorteio)].copy()

        cand_list = []
        for c in tqdm(cursos, desc=f"Cálculos Fase {fase}", leave=False):
            tem_dges = c[f'nota_f{fase}_hist'] is not None
            v_efetivas = max(1, vagas_atuais[c['chave']]) if tem_dges else vagas_atuais[c['chave']]
            if v_efetivas <= 0: continue
            
            alvo = notas_corte_simuladas[c['chave']]
            if alvo <= 95.0: alvo = c['desirabilidade_base']
                
            res = processar_curso_vectorizado(c, df_cand, fase, col_existentes, margem, alvo)
            if res is not None: cand_list.append(res)
            
        if not cand_list: 
            for c in cursos:
                if c[f'nota_f{fase}_hist'] is not None:
                    resultados_finais.append({'Fase': fase, 'Curso': c['nome'], 'Codigo': c['chave'], 'Nota_Real': c[f'nota_f{fase}_hist'], 'Nota_Simulada': 95.0})
            continue
        
        df_todas = pd.concat(cand_list, ignore_index=True)
        
        # Elimina preferências aberrantes
        df_todas = df_todas[df_todas['Score_Pref'] > 0.0]
        
        limite_opcoes = 6 
        fichas = df_todas.sort_values(['Aluno_ID', 'Score_Pref'], ascending=[True, False]).groupby('Aluno_ID').head(limite_opcoes)
        
        opcoes = fichas.groupby('Aluno_ID')['Curso'].apply(list).to_dict()
        scores = fichas.set_index(['Aluno_ID', 'Curso'])[['Score_Competicao', 'Score_Base']].to_dict('index')
        
        for ch in ALVOS_FORENSE:
            fichas_com_curso = sum(1 for f in opcoes.values() if ch in f)
            log_forense.append(f"-> [A HORA DA VERDADE] O Curso {ch} entrou na Ficha Limitada a {limite_opcoes} de quantas pessoas?: {fichas_com_curso}")
        
        livres = deque(opcoes.keys())
        tentativas = {a: 0 for a in livres}
        alocados = {c['chave']: [] for c in cursos}
        
        while livres:
            a = livres.popleft()
            if tentativas[a] < len(opcoes[a]):
                c_id = opcoes[a][tentativas[a]]
                sc = scores[(a, c_id)]
                alocados[c_id].append((sc['Score_Competicao'], sc['Score_Base'], a))
                alocados[c_id].sort(key=lambda x: x[0], reverse=True)
                
                tem_dges = next(cr for cr in cursos if cr['chave'] == c_id)[f'nota_f{fase}_hist'] is not None
                v_limite = max(1, vagas_atuais[c_id]) if tem_dges else vagas_atuais[c_id]
                
                if len(alocados[c_id]) > v_limite:
                    exp = alocados[c_id].pop()[2]
                    tentativas[exp] += 1
                    livres.append(exp)

        for c in cursos:
            ch = c['chave']
            venc = alocados[ch]
            tem_dges = c[f'nota_f{fase}_hist'] is not None
            
            if ch in ALVOS_FORENSE:
                log_forense.append(f"\n[CURSO: {ch}]")
                log_forense.append(f"Vagas disponíveis antes de G-S: {vagas_atuais[ch]}")
                v_lim_debug = max(1, vagas_atuais[ch]) if tem_dges else vagas_atuais[ch]
                log_forense.append(f"Limite Vagas Usado no G-S: {v_lim_debug}")
                log_forense.append(f"Total de alunos alocados: {len(venc)}")
                if venc: log_forense.append(f"Notas Base: {[round(v[1], 1) for v in venc]}")
            
            if venc:
                nota_c = round(min(v[1] for v in venc), 1)
                notas_corte_simuladas[ch] = nota_c 
            else:
                nota_c = 95.0
                
            if ch in ALVOS_FORENSE: log_forense.append(f"Nota de Corte Calculada: {nota_c}")
                
            if venc or tem_dges:
                resultados_finais.append({'Fase': fase, 'Curso': c['nome'], 'Codigo': ch, 'Nota_Real': c[f'nota_f{fase}_hist'], 'Nota_Simulada': nota_c})
            
            for _, _, a_id in venc:
                if a_id in colocados_totais: vagas_atuais[colocados_totais[a_id]] += 1
                colocados_totais[a_id] = ch
                vagas_atuais[ch] -= 1
                
            if venc: vagas_atuais[ch] += math.ceil(len(venc) * 0.05)
            
            if ch in ALVOS_FORENSE: log_forense.append(f"Vagas transferidas: {vagas_atuais[ch]}")

    with open(os.path.join(path, 'debug_forense.txt'), 'w', encoding='utf-8') as f: f.write("\n".join(log_forense))
    if not resultados_finais: return pd.DataFrame(columns=['Curso', 'Codigo', 'Nota_Real', 'Nota_Simulada', 'Erro'])
    
    df_res_completo = pd.DataFrame(resultados_finais)
    df_res_completo['Nota_Simulada'] = df_res_completo['Nota_Simulada'].round(1)
    df_res_completo['Erro'] = (df_res_completo['Nota_Simulada'] - df_res_completo['Nota_Real']).round(1)
    
    df_res_completo.to_parquet(os.path.join(path, f'resultados_simulacao_completo_{ano}.parquet'), index=False)
    df_res_completo.to_csv(os.path.join(path, f'resultados_simulacao_completo_{ano}.csv'), index=False)
    
    df_f1 = df_res_completo[df_res_completo['Fase'] == 1].drop(columns=['Fase']).copy()
    df_f1.to_csv(os.path.join(path, f'resultados_simulacao_{ano}.csv'), index=False)
    return df_f1

if __name__ == "__main__":
    simular_ano("2017")