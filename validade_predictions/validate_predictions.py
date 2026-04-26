import json
import os
import glob
import matplotlib.pyplot as plt
import random

def predict_phase(values, years, steps=1):
    """
    Réplica exata da função predictPhase em examDataService.ts
    """
    # Filtra valores nulos (mesmo comportamento do .filter no TS)
    clean = [(y, v) for y, v in zip(years, values) if v is not None]
    
    if len(clean) < 2:
        return None
    
    ys = [p[1] for p in clean]
    mean = sum(ys) / len(ys)
    
    # Suavização exponencial (Alpha 0.5)
    alpha = 0.5
    smoothed = ys[0]
    for i in range(1, len(ys)):
        smoothed = alpha * ys[i] + (1 - alpha) * smoothed
    
    last_year = clean[-1][0]
    predictions = []
    
    for i in range(1, steps + 1):
        year = last_year + i
        
        # Regressão à média progressiva
        weight_to_mean = min(0.15 * i, 0.6)
        predicted_raw = (1 - weight_to_mean) * smoothed + weight_to_mean * mean
        
        # Clamp entre 0 e 200
        predicted = max(0, min(200, predicted_raw))
        
        predictions.append({
            'year': year,
            'predicted': round(predicted * 10) / 10
        })
    
    return predictions

def main():
    # Tenta encontrar a pasta de dados (public/data ou data)
    possible_paths = ['public/data', 'src/public/data', 'data']
    data_dir = next((p for p in possible_paths if os.path.exists(p)), None)

    if not data_dir:
        print("Erro: Não foi possível encontrar a pasta com os ficheiros JSON (dados_dges_YYYY.json)")
        return

    # Carregar todos os anos disponíveis
    all_data = {}
    json_files = glob.glob(f"{data_dir}/dados_dges_*.json")
    years = sorted([int(os.path.basename(f).split('_')[-1].split('.')[0]) for f in json_files])
    
    print(f"--- Iniciando Validação de Algoritmo ---")
    print(f"Anos detetados: {years}")
    
    for year in years:
        with open(f"{data_dir}/dados_dges_{year}.json", 'r', encoding='utf-8') as f:
            year_data = json.load(f)
            for entry in year_data:
                # Identificador único do curso por instituição e código
                course_id = f"{entry['codigo_instituicao']}-{entry['codigo_curso']}"
                if course_id not in all_data:
                    all_data[course_id] = {}
                
                fases = entry.get('fases', {})
                all_data[course_id][year] = {
                    'f1': fases.get('fase_1', {}).get('nota'),
                    'f2': fases.get('fase_2', {}).get('nota'),
                    'f3': fases.get('fase_3', {}).get('nota')
                }

    # Backtesting: Prever o ano N usando apenas dados de anos < N
    # Precisamos de pelo menos 2 anos prévios para o algoritmo funcionar
    test_years = years[2:] 
    all_errors_by_year = {}

    for target_year in test_years:
        year_errors = []
        for course_id, history in all_data.items():
            # Anos disponíveis antes do ano alvo
            prev_years = [y for y in years if y < target_year and y in history]
            if len(prev_years) < 2:
                continue
            
            # Verifica se o curso existe no ano que queremos validar
            if target_year not in history:
                continue
                
            actual_fases = history[target_year]
            
            for phase_key in ['f1', 'f2', 'f3']:
                actual_val = actual_fases[phase_key]
                if actual_val is None:
                    continue
                
                # Histórico desta fase específica
                phase_history = [history[y][phase_key] for y in prev_years]
                
                # Executa a previsão para 1 passo à frente
                preds = predict_phase(phase_history, prev_years, steps=1)
                if preds:
                    predicted_val = preds[0]['predicted']
                    error = abs(predicted_val - actual_val)
                    year_errors.append(error)
        
        if year_errors:
            all_errors_by_year[target_year] = year_errors
            mae = sum(year_errors) / len(year_errors)
            print(f"Ano {target_year}: MAE = {mae:.2f} | Mediana = {sorted(year_errors)[len(year_errors)//2]:.2f} (N={len(year_errors)})")

    # Geração do Gráfico
    if not all_errors_by_year:
        print("Erro: Não foram gerados dados de validação suficientes.")
        return

    plt.figure(figsize=(12, 7))
    
    plot_years = sorted(all_errors_by_year.keys())
    means = []
    medians = []

    for year in plot_years:
        errors = all_errors_by_year[year]
        
        # Adiciona ruído no eixo X (jitter) para os pontos não ficarem sobrepostos
        x_values = [year + random.uniform(-0.15, 0.15) for _ in errors]
        
        # Desenha os pontos (cada ponto é um erro de um curso/fase)
        plt.scatter(x_values, errors, alpha=0.1, color='#94a3b8', s=10, label='Erro por Curso' if year == plot_years[0] else "")
        
        means.append(sum(errors) / len(errors))
        medians.append(sorted(errors)[len(errors)//2])

    # Linha da Média (MAE)
    plt.plot(plot_years, means, marker='o', color='#2563eb', linewidth=2, label='Erro Médio (MAE)')
    
    # Linha da Mediana (mais robusta a outliers)
    plt.plot(plot_years, medians, marker='s', color='#10b981', linewidth=2, linestyle='--', label='Erro Mediano')

    # Análise de Outliers: Limitar o gráfico para melhor visualização (ex: até 40 pontos de erro)
    # Se houver erros de 100 pontos, eles "esmagam" o gráfico.
    current_max = max([max(errs) for errs in all_errors_by_year.values()])
    plt.ylim(0, min(current_max, 50)) 
    
    plt.title('Distribuição do Erro de Previsão por Curso (Backtesting)', fontsize=14, pad=20)
    plt.xlabel('Ano Validado', fontsize=12)
    plt.ylabel('Desvio Absoluto (Pontos na escala 0-200)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend()
    
    # Adicionar nota sobre outliers
    plt.text(plot_years[0], plt.ylim()[1]*0.9, 
             "* Pontos cinzentos representam cursos individuais.\n* Outliers extremos (>50 pts) omitidos da escala visual.", 
             fontsize=9, style='italic', bbox=dict(facecolor='white', alpha=0.8))

    plt.savefig('desvio_previsoes_por_ano.png')
    print(f"\nSucesso! O gráfico foi guardado em: {os.getcwd()}/desvio_previsoes_por_ano.png")

if __name__ == "__main__":
    main()