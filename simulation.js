
// DOM Elements
const form = document.getElementById('simulationForm');

// KPIs
const uiMedianRevenue = document.getElementById('medianRevenue');
const uiMedianROI = document.getElementById('medianROI');
const uiBreakEven = document.getElementById('breakEvenProb');
const uiVar95 = document.getElementById('var95');
const uiInsights = document.getElementById('insightsList');

// Chart Instances
let distChart = null;
let scatterChart = null;

// --- Constants & Benchmarks ---
const AVG_REV_PER_STREAM = 0.004;
const ANCILLARY_RATE_MEAN = 0.10;

const GENRE_BENCHMARKS = {
    pop: {
        multiplierMean: 0.0, // Stable baseline
        multiplierSigma: 0.8, // High variance (hit or miss)
        marketingEfficiency: 15,
        viralProb: 0.02 // Higher chance of viral
    },
    hiphop: {
        multiplierMean: 0.2, // Growth trend
        multiplierSigma: 0.6,
        marketingEfficiency: 18,
        viralProb: 0.015
    },
    rock: {
        multiplierMean: -0.1, // Harder to grow rapidly
        multiplierSigma: 0.3, // Very stable fanbase (low variance)
        marketingEfficiency: 8, // Ads work less well
        viralProb: 0.005
    },
    indie: {
        multiplierMean: 0.1,
        multiplierSigma: 0.4,
        marketingEfficiency: 12,
        viralProb: 0.01
    },
    custom: {
        multiplierMean: 0,
        multiplierSigma: 0.6,
        marketingEfficiency: 15,
        viralProb: 0.01
    }
};

let currentGenre = 'custom';

// --- Helper Math Functions ---

// Box-Muller transform for Normal Distribution
function randomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

// Log-Normal Distribution
function randomLogNormal(mu, sigma) {
    // mu and sigma are parameters of the underlying normal distribution
    return Math.exp(randomNormal(mu, sigma));
}

// Format Currency
const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

// --- Simulation Logic ---

function runSimulation(inputs) {
    const {
        socialFollowers,
        prevStreams,
        advance,
        marketing,
        contentBudget,
        iterations
    } = inputs;

    const totalInvestment = advance + marketing + contentBudget;
    const results = [];

    // Base Conversion Rate from History (Streams per Follower)
    // Avoid division by zero
    const baseConversion = socialFollowers > 0 ? (prevStreams / socialFollowers) : 20;

    for (let i = 0; i < iterations; i++) {
        // 1. Model Reach Volatility (Normal Dist)
        // Assume marketing increases reach but with diminishing returns and variance
        // Base reach is followers + some multiplier of marketing
        // Use Genre-specific efficiency
        const { multiplierMean, multiplierSigma, marketingEfficiency, viralProb } = GENRE_BENCHMARKS[currentGenre] || GENRE_BENCHMARKS.custom;

        const marketingReach = marketing * randomNormal(marketingEfficiency, 5);
        const organicReach = socialFollowers * randomNormal(1.0, 0.2);
        const totalReach = Math.max(0, organicReach + marketingReach);

        // 2. Model Performance/Viral Multiplier (Log-Normal)
        // Adjust mu/sigma based on Genre
        const performanceMultiplier = randomLogNormal(multiplierMean, multiplierSigma);

        // 3. Viral Spike Event (Bernoulli)
        const isViral = Math.random() < viralProb;
        const viralMultiplier = isViral ? randomNormal(5, 1) : 1;

        // 4. Calculate Final Streams
        let streams = totalReach * baseConversion * performanceMultiplier * viralMultiplier;

        // Cap streams at realistic global max if needed, but let's let it run high
        streams = Math.max(0, streams);

        // 5. Financials
        const streamRevenue = streams * AVG_REV_PER_STREAM;

        // Ancillary (Merch/Sync) - modelled as variable % of stream revenue
        const ancillaryPct = randomNormal(ANCILLARY_RATE_MEAN, 0.05);
        const ancillaryRevenue = streamRevenue * Math.max(0, ancillaryPct);

        const totalRevenue = streamRevenue + ancillaryRevenue;
        const profit = totalRevenue - totalInvestment;
        const roi = (profit / totalInvestment) * 100;

        results.push({
            revenue: totalRevenue,
            profit: profit,
            roi: roi,
            streams: streams
        });
    }

    return results;
}

// --- Analysis & Visualization ---

function analyzeResults(results, totalInvestment) {
    // Sort by Profit for Percentiles
    results.sort((a, b) => a.profit - b.profit);

    const n = results.length;
    const medianProfit = results[Math.floor(n * 0.5)].profit;
    const medianRevenue = results[Math.floor(n * 0.5)].revenue;
    const medianROI = results[Math.floor(n * 0.5)].roi;

    // Break Even: Count how many have profit > 0
    const breakEvenCount = results.filter(r => r.profit > 0).length;
    const breakEvenProb = (breakEvenCount / n) * 100;

    // VaR (5th Percentile) - The "Safe" worst case
    const var95 = results[Math.floor(n * 0.05)].profit;

    // Update UI
    uiMedianRevenue.innerText = currencyFmt.format(medianRevenue);
    uiMedianROI.innerText = medianROI.toFixed(1) + '%';
    uiMedianROI.style.color = medianROI > 0 ? 'var(--success-color)' : 'var(--danger-color)';
    uiBreakEven.innerText = breakEvenProb.toFixed(1) + '%';
    uiVar95.innerText = currencyFmt.format(var95);

    // Generate Insights
    const maxProfit = results[n - 1].profit;
    uiInsights.innerHTML = `
        <li><strong>Risk Assessment:</strong> There is a ${(100 - breakEvenProb).toFixed(1)}% chance of losing money on this specific deal structure.</li>
        <li><strong>Downside Protection:</strong> In the worst 5% of scenarios, you lose at least ${currencyFmt.format(Math.abs(var95))}.</li>
        <li><strong>Upside Potential:</strong> The top 1% of outcomes generate over ${currencyFmt.format(results[Math.floor(n * 0.99)].profit)}.</li>
    `;

    return { medianProfit, var95 };
}

function renderCharts(results) {
    // Histogram Logic
    // Create bins for Profit
    const profits = results.map(r => r.profit);
    const min = Math.min(...profits);
    const max = Math.max(...profits);
    const binCount = 40;
    const range = max - min;
    const binSize = range / binCount;

    const bins = new Array(binCount).fill(0);
    const labels = [];

    // Fill Bins
    profits.forEach(p => {
        const binIndex = Math.min(Math.floor((p - min) / binSize), binCount - 1);
        bins[binIndex]++;
    });

    // Create Labels (Midpoints)
    for (let i = 0; i < binCount; i++) {
        const val = min + (i * binSize) + (binSize / 2);
        labels.push(currencyFmt.format(val));
    }

    // Colors: Green for profit, Red for loss
    const bgColors = labels.map(l => {
        // Hacky parsing to check sign, or just calculate center value again
        const val = min + (labels.indexOf(l) * binSize);
        return val >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)';
    });

    // Destroy old charts if exist
    if (distChart) distChart.destroy();
    if (scatterChart) scatterChart.destroy();

    // 1. Distribution Chart
    const ctx = document.getElementById('distributionChart').getContext('2d');
    distChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: bins,
                backgroundColor: bgColors,
                borderWidth: 0,
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Distribution of Profit/Loss Outcomes', color: '#fff' },
                legend: { display: false }
            },
            scales: {
                x: { ticks: { display: false }, grid: { display: false } }, // Hide messy x labels
                y: { display: false }
            }
        }
    });

    // 2. ROI vs Streams Scatter (Sample of 500 max to save perf)
    const scatterData = results
        .filter((_, i) => i % Math.max(1, Math.floor(results.length / 300)) === 0)
        .map(r => ({ x: r.streams, y: r.roi }));

    const ctx2 = document.getElementById('roiScatterChart').getContext('2d');
    scatterChart = new Chart(ctx2, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'ROI vs Streams',
                data: scatterData,
                backgroundColor: 'rgba(99, 102, 241, 0.5)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'ROI vs Stream Count', color: '#fff' },
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'logarithmic',
                    title: { display: true, text: 'Streams (Log Scale)', color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: 'ROI (%)', color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

// Handler
document.getElementById('genreSelect').addEventListener('change', (e) => {
    currentGenre = e.target.value;
    // visual feedback or auto-fill logic could go here if we were changing evident input fields
    // For now, it changes internal constants used in the simulation run

    // Auto-trigger run
    form.dispatchEvent(new Event('submit'));
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputs = {
        socialFollowers: parseFloat(document.getElementById('socialFollowers').value),
        prevStreams: parseFloat(document.getElementById('prevStreams').value),
        advance: parseFloat(document.getElementById('advance').value),
        marketing: parseFloat(document.getElementById('marketing').value),
        contentBudget: parseFloat(document.getElementById('contentBudget').value),
        iterations: parseInt(document.getElementById('iterations').value)
    };

    const results = runSimulation(inputs);
    const totalInvestment = inputs.advance + inputs.marketing + inputs.contentBudget;

    analyzeResults(results, totalInvestment);
    renderCharts(results);
});

// Run automatically on load for demo
window.addEventListener('DOMContentLoaded', () => {
    form.dispatchEvent(new Event('submit'));
});
