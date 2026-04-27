import os
import json
import pandas as pd
from tqdm import tqdm
from gerador_populacao import gerar_populacao
from simulador_dges import simular_ano

# 🚀 HIPERPARÂMETROS CALIBRADOS
ALPHA = 0.008  # Reduzido ligeiramente: mais suave, impede capotamentos
BETA = 0.5     # Inércia cortada: a IA esquece o pânico pandémico mais rápido

def iniciar_treino(anos_treino):
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_pesos = os.path.join(pasta_atual, 'pesos_cursos.json')
    
    if not os.path.exists(caminho_pesos):
        with open(caminho_pesos, 'w', encoding='utf-8') as f:
            json.dump({}, f)
            
    print("🤖 A iniciar a Rede de Treino (Machine Learning Controlado)...")
    
    velocidades = {}
    
    for ano in tqdm(anos_treino, desc="Evolução do Treino", unit="ano"):
        tqdm.write(f"\n{'='*40}")
        tqdm.write(f"🗓️ A PROCESSAR ANO: {ano}")
        tqdm.write(f"{'='*40}")
        
        tqdm.write("1. A gerar população...")
        gerar_populacao(ano, 75000)
        
        tqdm.write("2. A simular colocações...")
        resultados = simular_ano(ano)
        
        df_validos = resultados.dropna(subset=['Erro']).copy()
        
        if df_validos.empty:
            tqdm.write("⚠️ Nenhum dado válido para treinar neste ano.")
            continue
            
        erro_medio = df_validos['Erro'].abs().mean()
        tqdm.write(f"📊 Erro Médio Absoluto neste ano: {erro_medio:.2f}")
        
        tqdm.write("3. A ajustar Pesos Neurais (Backpropagation)...")
        with open(caminho_pesos, 'r', encoding='utf-8') as f:
            pesos_atuais = json.load(f)
            
        for _, row in df_validos.iterrows():
            codigo = row['Codigo']
            erro = row['Erro']
            peso_atual = pesos_atuais.get(codigo, 1.0)
            
            if codigo not in velocidades:
                velocidades[codigo] = 0.0
                
            # 🚀 CLIPPING DO ERRO: Impede a IA de entrar em pânico extremo.
            # Se o erro for de 30 valores, a máquina reage como se fosse "apenas" de 15.
            erro_controlado = max(-15.0, min(erro, 15.0))
                
            velocidades[codigo] = (BETA * velocidades[codigo]) + (ALPHA * erro_controlado)
            
            # 🚀 CLIPPING DA VELOCIDADE: Impede alterações bruscas de um ano para o outro
            velocidades[codigo] = max(-0.15, min(velocidades[codigo], 0.15))
            
            novo_peso = peso_atual - velocidades[codigo]
            
            pesos_atuais[codigo] = max(0.0, min(novo_peso, 3.0)) 
            
        with open(caminho_pesos, 'w', encoding='utf-8') as f:
            json.dump(pesos_atuais, f, indent=4, ensure_ascii=False)
            
    print("\n✅ TREINO CONCLUÍDO! O ficheiro pesos_cursos.json tem agora o DNA do Ensino Superior.")

if __name__ == "__main__":
    anos = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"] 
    iniciar_treino(anos)