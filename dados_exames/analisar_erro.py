import pandas as pd
import os

def analisar_erro_fase1(ano):
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_ficheiro = os.path.join(pasta_atual, f'resultados_simulacao_completo_{ano}.csv')
    
    if not os.path.exists(caminho_ficheiro):
        print(f"❌ Ficheiro não encontrado: {caminho_ficheiro}")
        return

    # 1. Carregar os resultados completos
    df = pd.read_csv(caminho_ficheiro)
    
    # 2. Filtrar apenas pela Fase 1
    df_fase1 = df[df['Fase'] == 1].copy()
    
    # 3. Limpar valores nulos (caso existam cursos sem nota real)
    df_fase1 = df_fase1.dropna(subset=['Erro'])
    
    # 4. Calcular o Erro Médio Absoluto
    erro_medio = df_fase1['Erro'].abs().mean()
    
    print(f"{"="*40}")
    print(f"📊 ANÁLISE DE RESULTADOS - ANO {ano} (FASE 1)")
    print(f"{"="*40}")
    print(f"-> Cursos analisados na Fase 1: {len(df_fase1)}")
    print(f"-> Erro Médio Absoluto (MAE): {erro_medio:.2f} valores")
    print(f"{"="*40}\n")

if __name__ == "__main__":
    analisar_erro_fase1("2024")