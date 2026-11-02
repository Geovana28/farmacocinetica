# 💊 Simulador de Farmacocinética PK/PD

Simulador de concentração plasmática multi-dose com janela terapêutica, presets de medicamentos reais e modelo de 1-compartimento com eliminação de primeira ordem.

## 🚀 Funcionalidades

- **Variabilidade Interindividual por Monte Carlo** — Simulação com distribuição log-normal para Clearance ($CL$) e Volume de Distribuição ($V_d$) com bandas de confiança 90%.
- **Estimativa Inversa de Parâmetros (Bayesian Parameter Fitting)** — Recuperação de parâmetros biológicos individuais a partir de coletas plasmáticas esparsas com ruído experimental.
- **5 Presets de Medicamentos** — Amoxicilina, Paracetamol, Ibuprofeno, Teofilina, Gentamicina (IV)
- **Vias de Administração** — Oral (absorção $k_a$) e IV Bolus (direto)
- **Janela Terapêutica** — MEC (mínima eficaz) e MTC (mínima tóxica) dinâmicas
- **KPIs Clínicos** — $C_{\max}$, $C_{\min}$, $C_{ss}$ médio, tempo para steady-state e risco de toxicidade

## 🧮 Modelagem Matemática & Farmacometria

### 1. Modelo Monocompartimental com Eliminação de 1ª Ordem

$$C(t) = \sum_{k=0}^{N-1} \frac{F \cdot D \cdot k_a}{V_d (k_a - k_e)} \left( e^{-k_e (t - k\tau)} - e^{-k_a (t - k\tau)} \right) \cdot \mathbb{I}(t \ge k\tau)$$

### 2. Variabilidade Inter-Individual Estocástica (Monte Carlo PK)

$$CL_i = \theta_{CL} \cdot \exp(\eta_i), \quad \eta_i \sim \mathcal{N}(0, \, \omega_{CL}^2)$$

Gera as bandas de incerteza da concentração plasmática na população de pacientes, calculando a probabilidade de escape terapêutico ou toxicidade renal/hepática.

### 3. Problema Inverso (Ajuste Não-Linear por Mínimos Quadrados / MAP Bayesiano)

$$\hat{\theta} = \arg\min_{\theta} \sum_{j=1}^{M} \left( \frac{C_{\text{obs}}(t_j) - C_{\text{pred}}(t_j; \theta)}{\sigma_j} \right)^2 + (\theta - \theta_{\text{prior}})' \Omega^{-1} (\theta - \theta_{\text{prior}})$$

## 🛠️ Tecnologias

- JavaScript Vanilla (ES6+)
- Chart.js + Annotation Plugin
- CSS3 com design premium
- Google Fonts (Inter, JetBrains Mono)

## 📦 Como Executar

Abra `index.html` no navegador — Chart.js carregado via CDN.

## 📁 Estrutura

```
farmacocinetica/
├── index.html    # Layout e controles
├── script.js     # Motor farmacocinético
└── style.css     # Design premium dark theme
```

## ⚠️ Hipóteses do Modelo e Limitações

1. **Modelo Monocompartimental Homogêneo**: Assume equilíbrio instantâneo de distribuição no volume aparente $V_d$ ($\text{L}$), não modelando redistribuição periférica lenta (que exigiria modelos bicompartimentais ou tricompartimentais).
2. **Cinética Linear de Primeira Ordem**: Assume que tanto a absorção ($k_a$ em $\text{h}^{-1}$) quanto a eliminação ($k_e = CL/V_d$ em $\text{h}^{-1}$) são proporcionais à concentração (não saturáveis), não aplicando cinética de Michaelis-Menten observada em fármacos como a fenitoína.
3. **Finalidade Educacional**: Simulador matemático para ensino de farmacometria e modelagem biomédica; não deve ser utilizado para prescrição ou ajuste posológico clínico real.

---

Desenvolvido por **Geovana** | Distribuído sob Licença MIT (`LICENSE`) | [Portfólio](../portfolio/index.html)
