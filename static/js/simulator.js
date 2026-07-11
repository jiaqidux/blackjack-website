const cssFont = window.getComputedStyle(document.body).fontFamily;

const isMobile = window.innerWidth <= 500;
const fontSizes = {
    tick: isMobile ? 9 : 14,
    title: isMobile ? 11 : 16,
    legend: isMobile ? 10 : 14
};

// so renderEvolutionChart/renderResultsChart can destroy
// the previous chart before drawing a new one on re-run
let evolutionChart = null;
let resultsChart = null;

const strategyColors = {
    optimal: "#35bd86",
    random: "#fe4c40",
    dealer: "#0093ff"
};

// shorter labels on mobile so they don't crowd the legend/axis
const strategyLabels = {
    optimal: isMobile ? "Optimal" : "Optimal Strategy",
    random: "Random",
    dealer: isMobile ? "Dealer" : "Dealer's Strategy"
};

document.getElementById("runButton").addEventListener("click", runSimulator);

// hits /simulate, then feeds the same response into all three render functions
async function runSimulator() {
    const btn = document.getElementById("runButton");
    const loadingText = document.getElementById("loadingText");
    const numHands = document.getElementById("NInput").value;
    const resultsContainer = document.querySelector(".simulation-results");

    // clamp client-side so we don't even bother hitting the backend with an invalid N
    if (numHands > 100000) {
        alert("Please enter 100,000 rounds or fewer.");
        return;
    }

    btn.disabled = true;
    loadingText.style.display = "block";

    try {
        const response = await fetch(`/simulate?N=${numHands}`);
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        
        resultsContainer.style.display = "block";
        renderEvolutionChart(data);
        renderResultsChart(data);
        renderResultsTable(data);
    } catch (err) {
        console.error("Error when running simulator", err);
        alert("Error when runnin simulator. See console");
    } finally {
        btn.disabled = false;
        loadingText.style.display = "none";
    }
}

// line chart tracking net units over the course of the simulation, one line per strategy
function renderEvolutionChart(data) {
    const ctx = document.getElementById("evolutionChart");

    // all three strategies run the same N, so any history array's length works here
    const numRounds = data.optimal.history.length;
    const labels = Array.from({length: numRounds}, (_, i) => i + 1);

    const datasets = Object.keys(strategyLabels).map(key => ({
        label: strategyLabels[key],
        data: data[key].history,
        borderColor: strategyColors[key],
        backgroundColor: strategyColors[key],
        fill: false,
        pointRadius: 0, // history can be up to 100k points, so no per-point markers
        borderWidth: isMobile ? 1.5 : 2
    }));

    // destroy the old chart instance first, otherwise Chart.js just stacks a new
    // canvas render on top of the old one on every re-run
    if (evolutionChart) evolutionChart.destroy();

    evolutionChart = new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: "Number of Rounds", color: "#daa520", font: { family: cssFont, size: fontSizes.title } },
                    ticks: { color: "white", maxTicksLimit: isMobile ? 5 : 10, font: { family: cssFont, size: fontSizes.tick } },
                    grid: { color: "#1a4d3a", lineWidth: 2 }
                },
                y: {
                    title: { display: true, text: "Units", color: "#daa520", font: { family: cssFont, size: fontSizes.title } },
                    ticks: { color: "white", font: { family: cssFont, size: fontSizes.tick } },
                    grid: { color: "#1a4d3a", lineWidth: 2 }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white",
                        boxWidth: isMobile ? 12 : 20,
                        font: { family: cssFont, size: fontSizes.legend }
                    }
                }
            }
        }
    });
}

// grouped bar chart comparing wins/loses/draws across the three strategies
function renderResultsChart(data) {
    const ctx = document.getElementById("resultsChart");
    const strategies = Object.keys(strategyLabels);

    // one dataset per outcome, so bars group by strategy on the x-axis
    const datasets = ["Wins", "Loses", "Draws"].map((outcome, i) => ({
        label: outcome,
        data: strategies.map(key => data[key].results[outcome]),
        backgroundColor: ["#35bd86", "#fe4c40", "#0093ff"][i]
    }));

    if (resultsChart) resultsChart.destroy();

    resultsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: strategies.map(key => strategyLabels[key]),
            datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { color: "#daa520", font: { family: cssFont, size: fontSizes.tick } },
                    grid: { color: "#1a4d3a", lineWidth: 2 }
                },
                y: {
                    title: { display: true, text: "Number of Rounds", color: "#daa520", font: { family: cssFont, size: fontSizes.title } },
                    ticks: { color: "white", font: { family: cssFont, size: fontSizes.tick } },
                    grid: { color: "#1a4d3a", lineWidth: 2 }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white",
                        boxWidth: isMobile ? 12 : 20,
                        font: { family: cssFont, size: fontSizes.legend }
                    }
                }
            }
        }
    });
}

// numerical summary table, one row per strategy, net units colored by sign
function renderResultsTable(data) {
    const tbody = document.querySelector("#ResultsTable tbody");
    tbody.innerHTML = "";

    for (const key of Object.keys(strategyLabels)) {
        const r = data[key].results;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${strategyLabels[key]}</td>
            <td>${r.Wins}</td>
            <td>${r.Loses}</td>
            <td>${r.Draws}</td>
            <td>${r.Units > 0 ? "+" : ""}${r.Units}</td>
        `;
        const netUnitsCell = row.querySelector("td:last-child");
        const value = r.Units;

        if (value > 0) {
            netUnitsCell.classList.add("positive");
        } else if (value < 0) {
            netUnitsCell.classList.add("negative");
        } else {
            netUnitsCell.classList.add("zero");
        }

        tbody.appendChild(row);
    }
}