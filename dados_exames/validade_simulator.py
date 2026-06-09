import json
import os
import sys
import glob
import random
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from tqdm import tqdm

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

try:
    from gerador_populacao import gerar_populacao
    from simulador_dges import simular_ano
    SIMULADOR_DISPONIVEL = True
except ImportError as e:
    print(f"Não foi possível importar o simulador: {e}")
    print("O gráfico será gerado só com a Suavização Exponencial.")
    SIMULADOR_DISPONIVEL = False


# ═════════════════════════════════════════════════════════════════════════════
#  ALGORITMO BASELINE — Suavização Exponencial + Regressão à Média
#  (réplica exacta de validate_predictions.py / examDataService.ts)
# ═════════════════════════════════════════════════════════════════════════════
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


# ═════════════════════════════════════════════════════════════════════════════
#  CARREGAR DADOS REAIS DA DGES
# ═════════════════════════════════════════════════════════════════════════════
def carregar_dados(data_dir):
    all_data   = {}
    json_files = glob.glob(os.path.join(data_dir, "dados_dges_*.json"))
    years      = sorted([
        int(os.path.basename(f).split('_')[-1].split('.')[0])
        for f in json_files
    ])

    for year in years:
        path = os.path.join(data_dir, f"dados_dges_{year}.json")
        with open(path, 'r', encoding='utf-8') as f:
            for entry in json.load(f):
                cid = f"{entry['codigo_instituicao']}-{entry['codigo_curso']}"
                if cid not in all_data:
                    all_data[cid] = {}
                fases = entry.get('fases', {})
                all_data[cid][year] = {
                    'f1': fases.get('fase_1', {}).get('nota'),
                    'f2': fases.get('fase_2', {}).get('nota'),
                    'f3': fases.get('fase_3', {}).get('nota'),
                }
    return all_data, years


# ═════════════════════════════════════════════════════════════════════════════
#  BACKTESTING — SUAVIZAÇÃO EXPONENCIAL
# ═════════════════════════════════════════════════════════════════════════════
def backtest_exp_smoothing(all_data, years, fase_key='f1'):
    """
    Devolve {ano: [desvios_absolutos]} para a fase especificada de cada curso.
    Desvio absoluto = |previsto - real|  (sempre >= 0)
    O sinal (previsto - real) é guardado separadamente para análise de viés.
    """
    errors_by_year  = {} 
    bias_by_year    = {} 
    test_years      = years[2:]

    for target_year in test_years:
        desvios  = []
        bias     = []
        for cid, history in all_data.items():
            prev = [y for y in years if y < target_year and y in history]
            if len(prev) < 2 or target_year not in history:
                continue

            actual = history[target_year][fase_key]
            if actual is None:
                continue

            hist_vals = [history[y][fase_key] for y in prev]
            preds     = predict_phase(hist_vals, prev, steps=1)
            if preds:
                desvio = preds[0]['predicted'] - actual  
                desvios.append(abs(desvio))          
                bias.append(desvio)        

        if desvios:
            errors_by_year[target_year] = desvios
            bias_by_year[target_year]   = bias

    return errors_by_year, bias_by_year


# ═════════════════════════════════════════════════════════════════════════════
#  BACKTESTING — SISTEMA DE SIMULAÇÃO
#  Para cada ano-alvo T:
#    1. Reseta pesos_cursos.json
#    2. Chama iniciar_treino() do treinador_ia com anos < T
#    3. Lê o CSV de resultados do ano-alvo (já existente ou simula)
#    4. Calcula desvios absolutos
# ═════════════════════════════════════════════════════════════════════════════
try:
    from treinador_ia import iniciar_treino
    TREINADOR_DISPONIVEL = True
except ImportError as e:
    print(f"Não foi possível importar treinador_ia: {e}")
    TREINADOR_DISPONIVEL = False


def encontrar_csvs(years):
    """
    Procura os CSVs de resultados em várias localizações possíveis.
    Devolve {ano: caminho_csv} apenas para os anos encontrados.
    """
    pastas_candidatas = [
        SCRIPT_DIR,
        os.path.join(SCRIPT_DIR, 'resultados'),
        os.path.join(SCRIPT_DIR, 'output'),
        os.path.join(SCRIPT_DIR, '..'),
    ]
    encontrados = {}
    for year in years:
        nome = f'resultados_simulacao_completo_{year}.csv'
        for pasta in pastas_candidatas:
            caminho = os.path.join(pasta, nome)
            if os.path.exists(caminho):
                encontrados[year] = caminho
                break
    return encontrados


def ler_csv_resultados(csv_path, fase_num=1):
    """Lê um CSV de resultados, filtra pela fase especificada e garante coluna Desvio."""
    df = pd.read_csv(csv_path)
    if 'Fase' in df.columns:
        df = df[df['Fase'] == fase_num].copy()
    if 'Nota_Real' in df.columns and 'Nota_Simulada' in df.columns:
        df['Desvio'] = df['Nota_Simulada'] - df['Nota_Real']
    return df


def ajustar_pesos_com_csvs(anos_treino, csvs_existentes, pesos_path):
    """
    Replica exactamente a lógica de ajuste de pesos do treinador_ia.py,
    mas usando apenas os CSVs já existentes em disco — nunca gera nem simula.
    Usa os mesmos hiperparâmetros (ALPHA, BETA, clippings) do treinador_ia.
    """
    # Importa hiperparâmetros directamente do treinador_ia
    from treinador_ia import ALPHA, BETA

    velocidades = {}

    for ano_t in anos_treino:
        if ano_t not in csvs_existentes:
            tqdm.write(f"CSV não encontrado para {ano_t} — a saltar ano de treino")
            continue

        try:
            df_res = pd.read_csv(csvs_existentes[ano_t])
        except Exception as e:
            tqdm.write(f"Erro ao ler CSV de {ano_t}: {e}")
            continue

        df_val = df_res.dropna(subset=['Erro']) if 'Erro' in df_res.columns else df_res.dropna(subset=['Nota_Real', 'Nota_Simulada'])
        if 'Erro' not in df_val.columns:
            df_val = df_val.copy()
            df_val['Erro'] = df_val['Nota_Simulada'] - df_val['Nota_Real']

        with open(pesos_path, 'r', encoding='utf-8') as f:
            pesos = json.load(f)

        for _, row in df_val.iterrows():
            codigo = row['Codigo']
            erro   = row['Erro']
            if codigo not in velocidades:
                velocidades[codigo] = 0.0
            erro_c = max(-15.0, min(erro, 15.0))
            velocidades[codigo] = max(-0.15, min(
                BETA * velocidades[codigo] + ALPHA * erro_c, 0.15))
            pesos[codigo] = max(0.0, min(
                pesos.get(codigo, 1.0) - velocidades[codigo], 3.0))

        with open(pesos_path, 'w', encoding='utf-8') as f:
            json.dump(pesos, f)


def backtest_simulador(all_data, years, num_estudantes=30000, fase_num=1):
    """
    Backtesting limpo do sistema de simulação.

    Para cada ano-alvo T:
      1. Reseta pesos_cursos.json  →  sem conhecimento do futuro
      2. Ajusta pesos com CSVs já existentes de anos < T
         (mesma lógica do treinador_ia, sem gerar nem simular)
      3. Lê CSV do ano-alvo já existente
      4. Calcula desvios absolutos |Nota_Simulada - Nota_Real| para a fase alvo

    Nunca gera nova população nem nova simulação — usa sempre os
    ficheiros resultados_simulacao_completo_YYYY.csv em disco.
    """
    if not TREINADOR_DISPONIVEL:
        print("  (treinador_ia não disponível — a saltar)")
        return {}

    csvs_existentes = encontrar_csvs(years)
    if not csvs_existentes:
        print("Nenhum CSV encontrado. Corre primeiro o treinador_ia.py.")
        return {}

    print(f"CSVs encontrados para os anos: {sorted(csvs_existentes.keys())}")

    pesos_path   = os.path.join(SCRIPT_DIR, 'pesos_cursos.json')
    pesos_backup = None

    if os.path.exists(pesos_path):
        with open(pesos_path, 'r', encoding='utf-8') as f:
            pesos_backup = f.read()

    errors_by_year = {}
    test_years     = [y for y in years[2:] if y in csvs_existentes]

    if not test_years:
        print("Nenhum ano-alvo tem CSV disponível.")
        return {}

    for target_year in tqdm(test_years, desc="Backtesting Simulador", unit="ano"):
        anos_treino = {y: csvs_existentes[y] for y in years
                       if y < target_year and y in csvs_existentes}

        # ── 1. Reset de pesos ─────────────────────────────────────────────
        with open(pesos_path, 'w', encoding='utf-8') as f:
            json.dump({}, f)

        # ── 2. Ajusta pesos com CSVs existentes de anos anteriores ────────
        tqdm.write(f"\n  → Treino com anos {sorted(anos_treino.keys())} para prever {target_year}…")
        ajustar_pesos_com_csvs(anos_treino, anos_treino, pesos_path)

        # ── 3. Lê CSV do ano-alvo ─────────────────────────────────────────
        tqdm.write(f"  → A usar CSV existente para {target_year}…")
        try:
            df_sim = ler_csv_resultados(csvs_existentes[target_year], fase_num=fase_num)
        except Exception as e:
            tqdm.write(f" Erro ao ler CSV de {target_year}: {e}")
            continue

        # ── 4. Calcula desvios absolutos para a fase especificada ────────
        df_eval = df_sim.dropna(subset=['Nota_Real', 'Nota_Simulada'])
        df_eval = df_eval.copy()
        df_eval['Desvio'] = df_eval['Nota_Simulada'] - df_eval['Nota_Real']
        erros = df_eval['Desvio'].abs().tolist()

        if erros:
            errors_by_year[target_year] = erros
            mae = np.mean(erros)
            tqdm.write(f" {target_year}: MDA simulador = {mae:.2f} (N={len(erros)})")

    # Restaura pesos originais
    if pesos_backup is not None:
        with open(pesos_path, 'w', encoding='utf-8') as f:
            f.write(pesos_backup)
    else:
        with open(pesos_path, 'w', encoding='utf-8') as f:
            json.dump({}, f)

    return errors_by_year


# ═════════════════════════════════════════════════════════════════════════════
#  MÉTRICAS
# ═════════════════════════════════════════════════════════════════════════════
def summarise(errors_by_year):
    ys      = sorted(errors_by_year.keys())
    means   = [np.mean(errors_by_year[y])   for y in ys]
    medians = [np.median(errors_by_year[y]) for y in ys]
    stds    = [np.std(errors_by_year[y])    for y in ys]
    ns      = [len(errors_by_year[y])       for y in ys]
    return ys, means, medians, stds, ns


# ═════════════════════════════════════════════════════════════════════════════
#  GRÁFICO COMPARATIVO
# ═════════════════════════════════════════════════════════════════════════════
# ═════════════════════════════════════════════════════════════════════════════
#  GRÁFICO COMPARATIVO — estilo validate_predictions.py
# ═════════════════════════════════════════════════════════════════════════════
def plot_comparison(errors_exp, errors_sim, fase_label="Fase 1"):
    C_EXP    = '#2563eb'   # azul  — Suavização Exponencial
    C_SIM    = '#e11d48'   # rosa  — Simulador
    C_MED_E  = '#10b981'   # verde — mediana Exp.
    C_MED_S  = '#f59e0b'   # âmbar — mediana Sim.
    C_DOTS   = '#94a3b8'   # cinzento — pontos individuais

    years_e, means_e, medians_e, stds_e, _ = summarise(errors_exp)
    has_sim = bool(errors_sim)
    if has_sim:
        years_s, means_s, medians_s, stds_s, _ = summarise(errors_sim)

    # ── max para o ylim (mesmo critério do validate_predictions.py: cap 50) ─
    all_errs = [e for v in errors_exp.values() for e in v]
    if has_sim:
        all_errs += [e for v in errors_sim.values() for e in v]
    y_max = min(max(all_errs), 50)

    n_plots = 1 + (1 if has_sim else 0)
    fig, axes = plt.subplots(1, n_plots, figsize=(12 * n_plots, 7),
                             sharey=True)
    if n_plots == 1:
        axes = [axes]

    # ────────────────────────────────────────────────────────────────────────
    #  Painel esquerdo — Suavização Exponencial
    # ────────────────────────────────────────────────────────────────────────
    ax = axes[0]
    plot_years_e = sorted(errors_exp.keys())

    for year in plot_years_e:
        errs   = errors_exp[year]
        x_vals = [year + random.uniform(-0.15, 0.15) for _ in errs]
        ax.scatter(x_vals, errs, alpha=0.1, color=C_DOTS, s=10,
                   label='Desvio por Curso' if year == plot_years_e[0] else '')

    ax.plot(years_e, means_e,   marker='o', color=C_EXP,   linewidth=2,
            label='Desvio Médio Absoluto')
    ax.plot(years_e, medians_e, marker='s', color=C_MED_E, linewidth=2,
            linestyle='--', label='Desvio Mediano')

    ax.set_ylim(0, y_max)
    ax.set_title(f'Suavização Exponencial ({fase_label})\nDistribuição do Desvio Absoluto (Backtesting)',
                 fontsize=13, pad=12)
    ax.set_xlabel('Ano Validado', fontsize=12)
    ax.set_ylabel('Desvio Absoluto (Pontos na escala 0–200)', fontsize=12)
    ax.grid(True, linestyle='--', alpha=0.6)
    ax.legend()
    ax.text(plot_years_e[0], y_max * 0.90,
            "* Pontos cinzentos representam cursos individuais.\n"
            "* Outliers extremos (>50 pts) omitidos da escala visual.",
            fontsize=9, style='italic',
            bbox=dict(facecolor='white', alpha=0.8))

    # ────────────────────────────────────────────────────────────────────────
    #  Painel direito — Sistema de Simulação
    # ────────────────────────────────────────────────────────────────────────
    if has_sim:
        ax2 = axes[1]
        plot_years_s = sorted(errors_sim.keys())

        for year in plot_years_s:
            errs   = errors_sim[year]
            x_vals = [year + random.uniform(-0.15, 0.15) for _ in errs]
            ax2.scatter(x_vals, errs, alpha=0.1, color=C_DOTS, s=10,
                        label='Desvio por Curso' if year == plot_years_s[0] else '')

        ax2.plot(years_s, means_s,   marker='o', color=C_SIM,   linewidth=2,
                 label='Desvio Médio Absoluto')
        ax2.plot(years_s, medians_s, marker='s', color=C_MED_S, linewidth=2,
                 linestyle='--', label='Desvio Mediano')

        ax2.set_ylim(0, y_max)
        ax2.set_title(f'Sistema de Simulação ({fase_label})\nDistribuição do Desvio Absoluto (Backtesting)',
                      fontsize=13, pad=12)
        ax2.set_xlabel('Ano Validado', fontsize=12)
        ax2.grid(True, linestyle='--', alpha=0.6)
        ax2.legend()
        ax2.text(plot_years_s[0], y_max * 0.90,
                 "* Pontos cinzentos representam cursos individuais.\n"
                 "* Outliers extremos (>50 pts) omitidos da escala visual.",
                 fontsize=9, style='italic',
                 bbox=dict(facecolor='white', alpha=0.8))

    # ── Título global ─────────────────────────────────────────────────────
    mda_e = np.mean([e for v in errors_exp.values() for e in v])
    if has_sim:
        mda_s   = np.mean([e for v in errors_sim.values() for e in v])
        winner  = "Suavização Exponencial" if mda_e <= mda_s else "Sistema de Simulação"
        suptitle = (f"[{fase_label}] MDA global: Suavização Exponencial = {mda_e:.2f} pts  |  "
                    f"Simulador = {mda_s:.2f} pts  →  Vencedor: {winner}")
    else:
        suptitle = f"[{fase_label}] MDA global (Suavização Exponencial): {mda_e:.2f} pts  |  Simulador: não disponível"

    fig.suptitle(suptitle, fontsize=12, y=1.01)
    plt.tight_layout()

    out = os.path.join(SCRIPT_DIR, f'comparacao_simulador_vs_exp_{fase_label.lower().replace(" ", "_")}.png')
    plt.savefig(out, dpi=150, bbox_inches='tight')
    print(f"\nGráfico guardado em: {out}")
    return out


# ═════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════════════════
def main():
    # ── Encontrar pasta de dados ──────────────────────────────────────────
    candidates = ['']
    data_dir   = next(
        (os.path.join(SCRIPT_DIR, p) for p in candidates
         if os.path.exists(os.path.join(SCRIPT_DIR, p))),
        None
    )
    if not data_dir:
        # Tenta na pasta actual
        data_dir = next(
            (p for p in candidates if os.path.exists(p)), None
        )
    if not data_dir:
        print("Erro: pasta dados_dges_YYYY.json não encontrada.")
        return

    print(f"Dados encontrados em: {data_dir}")
    all_data, years = carregar_dados(data_dir)
    print(f"Anos disponíveis: {years}")

    for f_num in [1, 2, 3]:
        f_key = f'f{f_num}'
        f_label = f"Fase {f_num}"
        
        print(f"\n{'='*60}")
        print(f" 🔍 ANALISANDO {f_label.upper()}")
        print(f"{'='*60}")

        # ── Backtesting Suavização Exponencial ───────────────────────────────
        print(f"\nA correr backtesting ({f_label}) — Suavização Exponencial…")
        errors_exp, bias_exp = backtest_exp_smoothing(all_data, years, fase_key=f_key)

        # Imprime tabela
        print(f"\n{'─'*58}")
        print(f"{'Ano':<8} {'MDA Exp.':>10} {'Mediana':>10} {'Viés Médio':>12} {'N':>6}")
        print('─' * 58)
        for y in sorted(errors_exp.keys()):
            e   = errors_exp[y]
            b   = bias_exp[y]
            mda = np.mean(e)
            med = np.median(e)
            vies = np.mean(b)
            print(f"{y:<8} {mda:>10.2f} {med:>10.2f} {vies:>+12.2f} {len(e):>6}")
        print(f"{'GLOBAL':<8} {np.mean([e for v in errors_exp.values() for e in v]):>10.2f}")

        # ── Backtesting Simulador ────────────────────────────────────────────
        print(f"\nA correr backtesting ({f_label}) — Sistema de Simulação…")
        errors_sim = backtest_simulador(all_data, years, num_estudantes=30000, fase_num=f_num)

        if errors_sim:
            print(f"\n{'─'*62}")
            print(f"{'Ano':<8} {'MDA Exp.':>10} {'MDA Sim.':>10} {'N':>8}  Vencedor")
            print('─' * 62)
            for y in sorted(set(errors_exp) & set(errors_sim)):
                me = np.mean(errors_exp[y])
                ms = np.mean(errors_sim[y])
                win = 'Exp.' if me <= ms else 'Sim.'
                print(f"{y:<8} {me:>10.2f} {ms:>10.2f} {len(errors_sim[y]):>8}  {win}")

            mda_e = np.mean([e for v in errors_exp.values() for e in v])
            mda_s = np.mean([e for v in errors_sim.values() for e in v])
            print('─' * 62)
            print(f"{'GLOBAL':<8} {mda_e:>10.2f} {mda_s:>10.2f}")
            print(f"\n{'Simulador vence' if mda_s < mda_e else 'Suavização Exponencial vence'}")

        # ── Gráfico ───────────────────────────────────────────────────────────
        plot_comparison(errors_exp, errors_sim, fase_label=f_label)




if __name__ == "__main__":
    main()