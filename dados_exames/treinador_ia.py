import os
import json
import pandas as pd
from tqdm import tqdm  # <-- AQUI ESTÁ A BARRA GLOBAL
from gerador_populacao import gerar_populacao
from simulador_dges import simular_ano

ALPHA = 0.002  

def iniciar_treino(anos_treino):
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_pesos = os.path.join(pasta_atual, 'pesos_cursos.json')
    
    if not os.path.exists(caminho_pesos):
        with open(caminho_pesos, 'w') as f:
            json.dump({}, f)
            
    print("🤖 A iniciar a Rede de Treino (Machine Learning)...")
    
    # Barra de Progresso principal que envolve todos os anos
    for ano in tqdm(anos_treino, desc="Evolução do Treino", unit="ano"):
        # Usamos tqdm.write em vez de print para não encravar a renderização das barras
        tqdm.write(f"\n{'='*40}")
        tqdm.write(f"🗓️ A PROCESSAR ANO: {ano}")
        tqdm.write(f"{'='*40}")
        
        tqdm.write("1. A gerar população...")
        gerar_populacao(ano, 60000)
        
        tqdm.write("2. A simular colocações...")
        resultados = simular_ano(ano)
        
        df_validos = resultados.dropna(subset=['Erro'])
        erro_medio = df_validos['Erro'].abs().mean()
        tqdm.write(f"📊 Erro Médio Absoluto neste ano: {erro_medio:.2f}")
        
        tqdm.write("3. A ajustar Pesos Neurais (Backpropagation)...")
        with open(caminho_pesos, 'r') as f:
            pesos_atuais = json.load(f)
            
        for _, row in df_validos.iterrows():
            codigo = row['Codigo']
            erro = row['Erro']
            peso_atual = pesos_atuais.get(codigo, 1.0)
            
            novo_peso = peso_atual - (erro * ALPHA)
            pesos_atuais[codigo] = max(0.5, min(novo_peso, 2.0)) 
            
        with open(caminho_pesos, 'w') as f:
            json.dump(pesos_atuais, f, indent=4)
            
    print("\n✅ TREINO CONCLUÍDO! O ficheiro pesos_cursos.json tem agora o DNA do Ensino Superior.")

if __name__ == "__main__":
    anos = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"] 
    iniciar_treino(anos)