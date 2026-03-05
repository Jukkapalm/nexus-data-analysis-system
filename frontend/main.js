// Näkymien vaihto
function showView(name) {

    // Ensin piilotetaan kaikki näkymät
    document.querySelectorAll(".view").forEach(v => {
        v.classList.remove("active");
    });

    // Poistetaan aktiivinen tila kaikilta nav-linkeiltä
    document.querySelectorAll(".nav-item-link").forEach(l => {
        l.classList.remove("active");
    });

    // Näytetään valittu näkymä
    document.getElementById("view-" + name).classList.add("active");

    // Merkitään oikea nav-linkki aktiiviseksi
    const navMap = {
        dashboard: 0,
        import: 1,
        analysis: 2,
        merge: 3,
        reports: 4
    };
    document.querySelectorAll(".nav-item-link")[navMap[name]].classList.add("active");
}

// Dropzone toiminnallisuus
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const filesList = document.getElementById("filesList");
const filesEmpty = document.getElementById("filesEmpty");
const analyzingBox = document.getElementById("analyzingBox");
const analyzingLog = document.getElementById("analyzingLog");

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    handleFiles(Array.from(e.dataTransfer.files));
});

fileInput.addEventListener("change", (e) => {
    handleFiles(Array.from(e.target.files));
});

// Tiedostojen käsittely
function handleFiles(files) {
    const allowed = [".xlsx", ".xls", ".csv"];
    const valid = files.filter(f => 
        allowed.some(ext => f.name.toLowerCase().endsWith(ext))
    );

    if (valid.length === 0) return;
    
    // Lähetetään jokainen tiedosto backendille
    valid.forEach(file => {
        showAnalyzing(file.name);

        const formData = new FormData();
        formData.append("file", file);

        // Lähetetään tiedosto uploadille
        fetch("http://127.0.0.1:5000/api/upload", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            console.log("Backend vastasi:", data);
            addFileToList(data.filename, data.rows + "rows");
            updateDashboard(data);
        })
        .catch(err => {
            console.error("Virhe:", err);
        });

        // Lähetetään tiedosto analyysille
        const formData2 = new FormData();
        formData2.append("file", file);

        fetch("http://127.0.0.1:5000/api/analyze", {
            method: "POST",
            body: formData2
        })
        .then(res => res.json())
        .then(data => {
            console.log("Analyze vastasi:", data);
            // Tallennetaan analyysitylos muistiin
            window.analysisData = data;
        })
        .catch(err => console.error("Analyze virhe:", err));
    });
}

// Analyzing animaatio
function showAnalyzing(filename) {
    analyzingBox.style.display = "block";
    analyzingLog.innerHTML = "";

    const logs = [
        { text: "> initializing data parser...", delay: 0, cls: "log-line" },
        { text: "> reading file structure...", delay: 500, cls: "log-line" },
        { text: "> validating data integrity...", delay: 1000, cls: "log-line active" },
        { text: "> mapping columns and rows...", delay: 1600, cls: "log-line active" },
        { text: '> ' + filename + ' — OK',          delay: 2200, cls: 'log-line success' },
        { text: '> import complete.',               delay: 2700, cls: 'log-line success' },
    ];

    logs.forEach(log => {
        setTimeout(() => {
            const line = document.createElement("div");
            line.className = log.cls;
            line.textContent = log.text;
            line.style.animation = "fadeIn 0.3s ease forwards";
            analyzingLog.appendChild(line);
        }, log.delay);
    });

    setTimeout(() => {
        analyzingBox.style.display = "none";
        analyzingLog.innerHTML = "";
    }, 4500);
}

// Lisää tiedoston listaan
function addFileToList(name, size) {
    filesEmpty.style.display = "none";
    const ext = name.split(".").pop().toLowerCase();
    const icon = ext === "csv" ? "bi-filetype-csv" : "bi-file-earmark-spreadsheet";
    const item = document.createElement("div");
    item.className = "file-item";
    item.style.animation = "fadeIn 0.3s ease forwards";
    item.innerHTML = `
        <i class="bi ${icon} file-item-icon"></i>
        <div class="file-item-name">${name}</div>
        <div class="file-item-meta">${size}</div>
        <div class="file-item-status">✓ LOADED</div>
        <button class="file-item-remove" onclick="removeFile(this)"><i class="bi bi-x"></i></button>
    `;
    filesList.appendChild(item);
}

// Poista tiedosto listasta
function removeFile(btn) {
    btn.closest(".file-item").remove();
    if (filesList.children.length === 0) {
        filesEmpty.style.display = "block";
    }
}

// Lataa sample data
function loadSampleData() {
    const samples = [
        { name: "neo_tokyo-corps_2077.csv", size: "42 KB" },
        { name: "blackmarket_transactions.xlsx", size: "128 KB" },
    ];

    analyzingBox.style.display = "block";
    analyzingLog.innerHTML = "";

    const logs = [
        { text: '> loading sample dataset...', delay: 0, cls: 'log-line' },
        { text: '> decrypting data streams...', delay: 500, cls: 'log-line active' },
        { text: '> neo_tokyo_corps_2077.csv — OK', delay: 1200, cls: 'log-line success' },
        { text: '> blackmarket_transactions.xlsx — OK', delay: 1800, cls: 'log-line success' },
        { text: '> sample data loaded.', delay: 2400, cls: 'log-line success' },
    ];

    logs.forEach(log => {
        setTimeout(() => {
            const line = document.createElement("div");
            line.className = log.cls;
            line.textContent = log.text;
            line.style.animation = "fadeIn 0.3s ease forwards";
            analyzingLog.appendChild(line);
        }, log.delay);
    });

    setTimeout(() => {
        analyzingBox.style.display = "none";
        analyzingLog.innerHTML = "";
        samples.forEach(f => addFileToList(f.name, f.size));
    }, 3500);
}

// Apufunktio: tiedostokoko luettavaan muotoon
function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Päivittää dashboard stat-kortit ladatun datan perusteella
function updateDashboard(data) {

    // Ladattujen tiedostojen määrä
    const loadedCount = document.getElementById("filesList").children.length;
    document.getElementById("stat-datasets").textContent = loadedCount;

    // Rvimäärä
    document.getElementById("stat-records").textContent = data.rows;

    // Viimeisin tiedosto
    document.getElementById("stat-lastimport").textContent = data.filename;

    // System status
    document.getElementById("stat-status").textContent = "ACTIVE";

    // Poistetaan inactive-tyyli ja piilotetaan empty-state
    document.querySelectorAll("#view-dashboard .stat-value").forEach(el => {
        el.classList.remove("inactive");
    });
    document.querySelector("#view-dashboard .empty-state").style.display = "none";
}

// Chart.js globaalit asetukset
Chart.defaults.color = "#555577";
Chart.defaults.borderColor = "rgba(0,255,255,0.08)";
Chart.defaults.font.family = "JetBrains Mono";
Chart.defaults.font.size = 10;

// Värit kaavioisiin
const CHART_COLORS = ["#00ffff", "#9d00ff", "#ff0066", "#00ff88", "#ffcc00", "#ff6600", "#00aaff", "#ff00aa"];

// Kaavio-instanssit
let barChart = null;
let doughnutChart = null;

// Piirtää kaaviot analysis datasta
function renderCharts(data) {

    // Näytetään kaaviot ja piilotetaan empty state
    document.getElementById("analysis-empty").style.display = "none";
    document.getElementById("analysis-content").style.display = "block";

    // Tuhotaan vanhat kaaviot jos olemassa
    if (barChart) barChart.destroy();
    if (doughnutChart) doughnutChart.destroy();

    // Pylväskaavio
    if (data.bar_data && data.bar_data.labels) {
        document.getElementById("barChartTitle").textContent =
            "// " + data.bar_data.label.toUpperCase();

        barChart = new Chart(document.getElementById("barChart"), {
            type: "bar",
            data: {
                labels: data.bar_data.labels,
                datasets: [{
                    data: data.bar_data.values,
                    backgroundColor: CHART_COLORS.map(c => c + "66"),
                    borderColor: CHART_COLORS,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: "rgba(0,255,255,0.06)" }, ticks: { color: "#555577" } },
                    y: { grid: { color: "rgba(0,255,255,0.06)" }, ticks: { color: "#555577" } }
                }
            }
        });
    }

    // Doughnut kaavio
    if (data.doughnut_data && data.doughnut_data.labels) {
        document.getElementById("doughnutChartTitle").textContent =
            "// " + data.doughnut_data.label.toUpperCase();

        doughnutChart = new Chart(document.getElementById("doughnutChart"), {
            type: "doughnut",
            data: {
                labels: data.doughnut_data.labels,
                datasets: [{
                    data: data.doughnut_data.values,
                    backgroundColor: CHART_COLORS.map(c => c + "99"),
                    borderColor: CHART_COLORS,
                    borderWidth: 1,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#555577",
                            boxWidth: 10,
                            padding: 8,
                            font: { size: 9 }
                        }
                    }
                }
            }
        });
    }
}

// Piirretään kaaviot kun Analysis-näkymä avataan
const originalShowView = showView;
window.showView = function(name) {
    originalShowView(name);
    if (name === "analysis" && window.analysisData) {
        setTimeout(() => renderCharts(window.analysisData), 50);
    }
}