# LabelSim: Monte Carlo Investment Engine

**LabelSim** is a lightweight, client-side Monte Carlo simulation tool designed for music label executives to evaluate the risk and potential return of investing in artist projects.

It forecasts financial outcomes (Revenue, Net Profit, ROI) by running thousands of probabilistic scenarios based on historical data and deal inputs.

## 🚀 Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/PrinceOfPentapotamia/labelsim-monte-carlo.git
    ```
2.  **Run the app:**
    -   Simply open `index.html` in any modern web browser.
    -   No build step or server required (Vanilla JS/CSS).

## 🛠 Technical Architecture

The project is built with a "No-Build" philosophy for maximum portability and ease of modification.

*   **Core**: HTML5, CSS3 (Variables + Flexbox/Grid), ECMAScript 2020+.
*   **Dependencies**:
    *   `Chart.js` (loaded via CDN) for data visualization.
    *   `Google Fonts` (Outfit) for typography.
*   **Structure**:
    *   `index.html`: UI Structure and entry point.
    *   `style.css`: All styling, themes (Dark Mode), and responsive rules.
    *   `simulation.js`: Simulation engine, probability math, and chart rendering logic.

## 🧮 Simulation Logic

The engine uses **Monte Carlo methods** to model uncertainty. It does not predict the future but maps the probability of various outcomes.

### 1. Inputs (The Priors)
*   **Historical Data**: We anchor the simulation on the artist's *current* reality (Social Followers, Previous Streams) rather than arbitrary "Tiers".
*   **Genre Benchmarks**: Presets (Pop, Hip-Hop, Rock, Indie) adjust hidden variables:
    *   *Marketing Efficiency*: How effectively dollars translate to potential listeners.
    *   *Viral Probability*: Likelihood of a massive outlier event.
    *   *Variance*: How "hit-driven" the genre is.

### 2. The Algorithm (Per Iteration)
For each of the `N` runs (default 5,000):

1.  **Reach Calculation**:
    $$ Reach = (Followers \times N(1.0, \sigma)) + (Budget \times Efficiency \times N(1.0, \sigma)) $$
    *Models organic volatility and marketing dimishing returns.*

2.  **Performance Multiplier**:
    $$ M = LogNormal(\mu, \sigma) $$
    *Models how this specific project performs relative to the artist's baseline.*

3.  **Viral Event**:
    *Bernoulli trial ($p < 0.02$) triggering a massive multiplier spike (5x-10x).*

4.  **Financials**:
    *   **Streams** = Reach × Conversion × Multiplier
    *   **Revenue** = (Streams × $0.004) + Ancillary Income (Sync/Merch)
    *   **Profit** = Revenue - (Advance + Marketing + Content)

### 3. Aggregation
We calculate:
*   **Median ROI**: The 50th percentile outcome (most likely "centered" result).
*   **VaR (Value at Risk)**: The 5th percentile outcome (worst-case scenario).
*   **Break-Even Probability**: % of runs where Profit > $0.

## 📂 Project Structure

```
labelsim/
├── index.html        # Main dashboard
├── style.css         # Visual design system
├── simulation.js     # Logic & Math
└── README.md         # Documentation
```

## 🤝 Contributing
Since this is a single-file logical structure, feel free to edit `simulation.js` to tweak the probability distributions or add new financial metrics (e.g., Physical Sales).
