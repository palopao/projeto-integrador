import os
import glob
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from scipy import stats

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..')

ANOS = list(range(2017, 2026))

CORES_ANOS = {
    2017: '#1f77b4', 2018: '#ff7f0e', 2019: '#2ca02c',
    2020: '#d62728', 2021: '#9467bd', 2022: '#8c564b',
    2023: '#e377c2', 2024: '#7f7f7f', 2025: '#bcbd22',
}


def carregar_dados():
    frames = []
    for ano in ANOS:
        path = os.path.join(SCRIPT_DIR, f'resultados_simulacao_completo_{ano}.csv')
        if not os.path.exists(path):
            continue
        df = pd.read_csv(path)
        df['Ano'] = ano
        frames.append(df)
    if not frames:
        raise FileNotFoundError("Nenhum CSV encontrado")
    df_all = pd.concat(frames, ignore_index=True)
    df_all = df_all[df_all['Nota_Real'].notna() & df_all['Nota_Simulada'].notna()].copy()
    df_all['AbsErro'] = (df_all['Nota_Simulada'] - df_all['Nota_Real']).abs()
    return df_all


# ─────────────────────────────────────────────────────────────────────────────
#  hist_erros.png
# ─────────────────────────────────────────────────────────────────────────────
def plot_hist_erros(df_all, out_path):
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))
    fig.suptitle('Distribuição do Erro Absoluto — Simulador (2017-2025)',
                 fontsize=15, fontweight='bold', y=1.01)

    C_BLUE   = '#4472C4'
    C_ORANGE = '#ED7D31'
    C_GRAY   = '#A9A9A9'
    C_RED    = '#C00000'

    for ax, fase, fase_label, cor_label in zip(
            axes, [1, 2], ['Fase 1', 'Fase 2'], ['#2B5FC7', '#D4A017']):

        df = df_all[df_all['Fase'] == fase]['AbsErro'].values
        n  = len(df)

        # Bins of width 2, up to 60
        bins = np.arange(0, 62, 2)
        counts, edges = np.histogram(df, bins=bins)
        pcts = counts / n * 100
        centers = (edges[:-1] + edges[1:]) / 2

        # Colour each bar
        colors = []
        for c in centers:
            if c <= 5:
                colors.append(C_BLUE)
            elif c <= 10:
                colors.append(C_ORANGE)
            else:
                colors.append(C_GRAY)

        ax.bar(centers, pcts, width=1.8, color=colors, edgecolor='white', linewidth=0.4)

        # Cumulative line (right axis)
        ax2 = ax.twinx()
        sorted_errs = np.sort(df)
        cum_pct = np.arange(1, len(sorted_errs) + 1) / len(sorted_errs) * 100
        # Sample ~20 points for the line
        idx = np.linspace(0, len(sorted_errs) - 1, 20, dtype=int)
        ax2.plot(sorted_errs[idx], cum_pct[idx],
                 color=C_RED, marker='o', markersize=4,
                 linewidth=2, zorder=5)
        ax2.set_ylim(0, 105)
        ax2.set_ylabel('% Cumulativa', color=C_RED, fontsize=11)
        ax2.tick_params(axis='y', labelcolor=C_RED)

        # Vertical dashed lines
        ax.axvline(5, color=C_BLUE,   linestyle='--', linewidth=1.5, alpha=0.8)
        ax.axvline(10, color=C_ORANGE, linestyle='--', linewidth=1.5, alpha=0.8)

        ax.set_xlim(-1, 62)
        ax.set_xlabel('Erro Absoluto (pontos 0–200)', fontsize=11)
        ax.set_ylabel('% de Cursos', fontsize=11)
        ax.set_title(fase_label, fontsize=14, fontweight='bold', color=cor_label)
        ax.grid(axis='y', linestyle='--', alpha=0.4)

        # Stats box
        mae  = np.mean(df)
        pct5  = (df <= 5).mean() * 100
        pct10 = (df <= 10).mean() * 100
        ax.text(0.5, -0.14,
                f'MAE = {mae:.1f} pts     {pct5:.0f}% ≤ 5 pts     {pct10:.0f}% ≤ 10 pts',
                transform=ax.transAxes, ha='center', fontsize=11,
                bbox=dict(boxstyle='round,pad=0.4', facecolor='white', edgecolor='#555'))

    # Legend
    patches = [
        mpatches.Patch(color=C_BLUE,   label='Erro ≤ 5 pts'),
        mpatches.Patch(color=C_ORANGE, label='5 < Erro ≤ 10 pts'),
        mpatches.Patch(color=C_GRAY,   label='Erro > 10 pts'),
    ]
    fig.legend(handles=patches, loc='lower center', ncol=3,
               fontsize=11, frameon=True, bbox_to_anchor=(0.5, -0.06))

    plt.tight_layout()
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Guardado: {out_path}")


# ─────────────────────────────────────────────────────────────────────────────
#  mae_por_ano.png
# ─────────────────────────────────────────────────────────────────────────────
def plot_mae_por_ano(df_all, out_path):
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))
    fig.suptitle('Precisão do Simulador DGES por Ano (2017-2025)',
                 fontsize=15, fontweight='bold')

    C_GREEN_SOL = '#00B0A0'
    C_GREEN_DAS = '#00C866'

    configs = [
        (axes[0], 1, 'Fase 1', '#2B5FC7', '#4472C4', 9),
        (axes[1], 2, 'Fase 2', '#D4A017', '#ED7D31', 30),
    ]

    for ax, fase, label, cor_label, cor_bar, ylim_bar in configs:
        anos_disp, maes, pct5s, pct10s = [], [], [], []
        for ano in ANOS:
            sub = df_all[(df_all['Fase'] == fase) & (df_all['Ano'] == ano)]
            if len(sub) == 0:
                continue
            anos_disp.append(ano)
            maes.append(sub['AbsErro'].mean())
            pct5s.append((sub['AbsErro'] <= 5).mean() * 100)
            pct10s.append((sub['AbsErro'] <= 10).mean() * 100)

        x = np.arange(len(anos_disp))

        # Bars (MAE)
        bars = ax.bar(x, maes, color=cor_bar, width=0.55, zorder=2)
        for bar, v in zip(bars, maes):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.1,
                    f'{v:.1f}', ha='center', va='bottom', fontsize=8.5)

        ax.set_xticks(x)
        ax.set_xticklabels(anos_disp, fontsize=10)
        ax.set_xlabel('Ano', fontsize=11)
        ax.set_ylabel('MAE (pontos)', fontsize=11)
        ax.set_ylim(0, ylim_bar)
        ax.set_title(label, fontsize=14, fontweight='bold', color=cor_label)
        ax.grid(axis='y', linestyle='--', alpha=0.4, zorder=0)

        # Average horizontal line
        mae_medio = np.mean(maes)
        ax.axhline(mae_medio, color=cor_bar, linestyle='--', linewidth=1.5,
                   alpha=0.7, label=f'MAE médio: {mae_medio:.2f} pts')

        # COVID annotation on 2020
        if 2020 in anos_disp:
            idx20 = anos_disp.index(2020)
            ax.annotate('COVID-19',
                        xy=(idx20, maes[idx20]),
                        xytext=(idx20 + 0.6, maes[idx20] + ylim_bar * 0.07),
                        fontsize=8, color='#D4A017',
                        arrowprops=dict(arrowstyle='-', color='#D4A017', lw=1))

        # Right axis — % within interval
        ax2 = ax.twinx()
        ax2.plot(x, pct5s,  color=C_GREEN_SOL, marker='o', linewidth=2,
                 markersize=5, label='≤ 5 pts (%)')
        ax2.plot(x, pct10s, color=C_GREEN_DAS, marker='s', linewidth=2,
                 markersize=5, linestyle='--', label='≤ 10 pts (%)')
        ax2.set_ylim(0, 130)
        ax2.set_ylabel('Cursos dentro do intervalo (%)', color=C_GREEN_SOL, fontsize=10)
        ax2.tick_params(axis='y', labelcolor=C_GREEN_SOL)

        # Combined legend — place outside plot area to avoid overlap
        handles1, labels1 = ax.get_legend_handles_labels()
        handles2, labels2 = ax2.get_legend_handles_labels()
        ax2.legend(handles1 + handles2, labels1 + labels2,
                   loc='upper right', fontsize=8, framealpha=0.9)

    plt.tight_layout()
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Guardado: {out_path}")


# ─────────────────────────────────────────────────────────────────────────────
#  scatter_real_vs_simulado.png
# ─────────────────────────────────────────────────────────────────────────────
def plot_scatter(df_all, out_path):
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))
    fig.suptitle('Real vs. Simulado — Simulador DGES (2017-2025)',
                 fontsize=15, fontweight='bold')

    cor_labels = ['#2B5FC7', '#D4A017']

    for ax, fase, label, cor_label in zip(axes, [1, 2], ['Fase 1', 'Fase 2'], cor_labels):
        df = df_all[df_all['Fase'] == fase].copy()

        # Scatter per year
        for ano in ANOS:
            sub = df[df['Ano'] == ano]
            if len(sub) == 0:
                continue
            ax.scatter(sub['Nota_Real'], sub['Nota_Simulada'],
                       color=CORES_ANOS[ano], s=8, alpha=0.35, label=str(ano), zorder=3)

        # Axis limits
        lo = max(90, df['Nota_Real'].min() - 5)
        hi = min(205, max(df['Nota_Real'].max(), df['Nota_Simulada'].max()) + 5)
        ax.set_xlim(lo, hi)
        ax.set_ylim(lo, hi)

        # Perfect prediction line
        ax.plot([lo, hi], [lo, hi], color='#00B0A0', linestyle='--',
                linewidth=1.8, label='Previsão Perfeita', zorder=4)

        # Global linear regression
        slope, intercept, r, _, _ = stats.linregress(df['Nota_Real'], df['Nota_Simulada'])
        r2 = r ** 2
        mae = df['AbsErro'].mean()
        x_line = np.array([lo, hi])
        ax.plot(x_line, slope * x_line + intercept, color='#E00030',
                linewidth=1.5,
                label=f'Reg. Linear (r²={r2:.2f} | MAE={mae:.1f})', zorder=5)

        ax.set_title(label, fontsize=14, fontweight='bold', color=cor_label)
        ax.set_xlabel('Nota Real (pontos 0–200)', fontsize=11)
        ax.set_ylabel('Nota Simulada (pontos 0–200)', fontsize=11)
        ax.grid(True, linestyle='--', alpha=0.35, zorder=0)
        ax.set_aspect('equal', adjustable='box')
        ax.legend(fontsize=7.5, ncol=2, loc='upper left',
                  framealpha=0.9, markerscale=1.5)

    plt.tight_layout()
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Guardado: {out_path}")


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("A carregar dados…")
    df_all = carregar_dados()
    print(f"Total de registos: {len(df_all)}")

    plot_hist_erros(df_all, os.path.join(OUTPUT_DIR, 'hist_erros.png'))
    plot_mae_por_ano(df_all, os.path.join(OUTPUT_DIR, 'mae_por_ano.png'))
    plot_scatter(df_all, os.path.join(OUTPUT_DIR, 'scatter_real_vs_simulado.png'))

    print("\nPronto!")
