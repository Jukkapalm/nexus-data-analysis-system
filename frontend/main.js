// Custom alert selaimen oletusalertin sijaan
function nexusAlert(msg) {
    document.getElementById("nexusAlertMsg").textContent = msg;
    document.getElementById("nexusAlert").style.display = "flex";
}

function closeNexusAlert() {
    document.getElementById("nexusAlert").style.display = "none";
}

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
            window.lastUploadedFile = file;

            // Tallennetaan tiedosto listaan mergeä varten
            if (!window.uploadedFiles) window.uploadedFiles = [];
            window.uploadedFiles.push(file);
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

    // Täytetään sarakevalitsimet tekstisarakkeilla
    const barSelect = document.getElementById("barColumnSelect");
    const doughnutSelect = document.getElementById("doughnutColumnSelect");
    barSelect.innerHTML = "";
    doughnutSelect.innerHTML = "";

    data.text_columns.forEach(col => {
        barSelect.innerHTML += `<option value="${col}">${col.toUpperCase()}</option>`;
        doughnutSelect.innerHTML += `<option value="${col}">${col.toUpperCase()}</option>`;
    });

    // Piirretään kaaviot
    drawBarChart(data.bar_data);
    drawDoughnutChart(data.doughnut_data);
}

// Päivitä pylväskaavio valitun sarakkeen mukaan
function updateBarChart() {
    const col = document.getElementById("barColumnSelect").value;
    const file = window.lastUploadedFile;
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bar_column", col);

    fetch("http://127.0.0.1:5000/api/analyze", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => drawBarChart(data.bar_data));
}

// Päivitä doughnut valitun sarakkeen mukaan
function updateDoughnutChart() {
    const col = document.getElementById("doughnutColumnSelect").value;
    const file = window.lastUploadedFile;
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doughnut_column", col);

    fetch("http://127.0.0.1:5000/api/analyze", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => drawDoughnutChart(data.doughnut_data));
}

// Piirtää pylväskaavion
function drawBarChart(bar_data) {
    if (barChart) barChart.destroy();
    if (!bar_data || !bar_data.labels) return;

    document.getElementById("barChartTitle").textContent = "// " + bar_data.label.toUpperCase();

    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: bar_data.labels,
            datasets: [{
                data: bar_data.values,
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

// Piirtää doughnut kaavion
function drawDoughnutChart(doughnut_data) {
    if (doughnutChart) doughnutChart.destroy();
    if (!doughnut_data || !doughnut_data.labels) return;

    document.getElementById("doughnutChartTitle").textContent = "// " + doughnut_data.label.toUpperCase();

    doughnutChart = new Chart(document.getElementById("doughnutChart"), {
        type: "doughnut",
        data: {
            labels: doughnut_data.labels,
            datasets: [{
                data: doughnut_data.values,
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
                    labels: { color: "#555577", boxWidth: 10, padding: 8, font: { size: 9 } }
                }
            }
        }
    });
}

// Piirretään kaaviot kun Analysis-näkymä avataan
const originalShowView = showView;
window.showView = function(name) {
    originalShowView(name);
    if (name === "analysis" && window.analysisData) {
        setTimeout(() => renderCharts(window.analysisData), 50);
    }
}

// Data Merge toiminnallisuus
// Merge tyyppi - stack tai join
let currentMergeType = "stack";

// Päivittää merge tiedostolistan ladatuista tiedostoista
function updateMergeFileList() {
    const mergeFileList = document.getElementById("mergeFileList");
    const files = document.getElementById("filesList").children;

    // Jos tiedostoja alle 2 näytetään empty state
    if (files.length < 2) {
        document.getElementById("merge-empty").style.display ="block";
        document.getElementById("merge-content").style.display = "none";
        return;
    }

    // Näytetään merge sisältö
    document.getElementById("merge-empty").style.display = "none";
    document.getElementById("merge-content").style.display = "block";

    // Täytetään tiedostolista
    mergeFileList.innerHTML = "";
    Array.from(files).forEach(item => {
        const name = item.querySelector(".file-item-name").textContent;
        const div = document.createElement("div");
        div.className = "merge-file-item";
        div.innerHTML = `
            <input type="checkbox" value="${name}" onchange="toggleMergeFile(this)">
            <div class="merge-file-name">${name}</div>
        `;
        div.addEventListener("click", (e) => {
            if (e.target.type !== "checkbox") {
                const cb = div.querySelector("input");
                cb.checked = !cb.checked;
                toggleMergeFile(cb);
            }
        });
        mergeFileList.appendChild(div);
    });
}

// Valitun tiedoston korostus
function toggleMergeFile(checkbox) {
    const item = checkbox.closest(".merge-file-item");
    if (checkbox.checked) {
        item.classList.add("selected");
    } else {
        item.classList.remove("selected");
    }
}

// Vaihda merge tyyppi
function setMergeType(type) {
    currentMergeType = type;

    document.getElementById("btnStack").classList.toggle("active", type === "stack");
    document.getElementById("btnJoin").classList.toggle("active", type === "join");

    document.getElementById("mergeTypeDesc").textContent = type === "stack"
        ? "Pinoa tiedostot päällekkäin - samat sarakkeet yhdistyvät"
        : "Yhdistä tiedostot yhteisen sarakkeen perusteella";

    document.getElementById("joinColumnWrapper").style.display = type === "join" ? "block" : "none";

    // Täytetään join sarake valitsin analyysi datasta
    if (type === "join" && window.analysisData) {
        const joinSelect = document.getElementById("joinColumnSelect");
        joinSelect.innerHTML = "";
        const allCols = [
            ...window.analysisData.text_columns,
            ...window.analysisData.numeric_columns
        ];
        allCols.forEach(col => {
            joinSelect.innerHTML += `<option value="${col}">${col.toUpperCase()}</option>`;
        });
    }
}

// Suorita merge
function executeMerge() {
    const selected = Array.from(
        document.querySelectorAll("#mergeFileList input:checked")
    ).map(cb => cb.value);

    if (selected.length < 2) {
        nexusAlert("Valitse vähintään 2 tiedostoa!");
        return;
    }

    // Haetaan oikeat File-objektit muistista
    const filesToMerge = window.uploadedFiles
        ? window.uploadedFiles.filter(f => selected.includes(f.name))
        : [];

    if (filesToMerge.length < 2) {
        nexusAlert("Tiedostoja ei löydy muistista - lataa tiedostot uudelleen!");
        return;
    }

    const formData = new FormData();
    filesToMerge.forEach(f => formData.append("files[]", f));
    formData.append("merge_type", currentMergeType);

    if (currentMergeType === "join") {
        const joinCol = document.getElementById("joinColumnSelect").value;
        formData.append("join_column", joinCol);
    }

    // Näytetään loading tila
    document.getElementById("mergePreview").innerHTML = '<div class="merge-awaiting">// executing merge...</div>';
    document.getElementById("mergePreviewBadge").textContent = "PROCESSING";

    fetch("http://127.0.0.1:5000/api/merge", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log("Merge vastasi:", data);
        window.mergedData = data;
        renderMergePreview(data);
    })
    .catch(err => console.error("Merge virhe:", err));
}

// Renderöi merge esikatselu taulukkona
function renderMergePreview(data) {
    document.getElementById("mergePreviewBadge").textContent = data.rows + " ROWS / " + data.columns.length + " COLS";

    const container = document.getElementById("mergePreview");
    container.innerHTML = "";

    // Sarakevalitsimet
    const colSelector = document.createElement("div");
    colSelector.className = "col-selector";
    colSelector.innerHTML = `
        <div class="section-label mt-2">// SELECT COLUMNS FOR REPORT</div>
        <div id="columnCheckboxes" class="col-checkboxes"></div>
        <button class="execute-btn mt-2" onclick="sendToReports()">// SEND TO REPORTS</button>
    `;
    container.appendChild(colSelector);

    // Täytetään sarakevalitsimet
    const checkboxContainer = colSelector.querySelector("#columnCheckboxes");
    data.columns.forEach(col => {
        const label = document.createElement("label");
        label.className = "col-checkbox-item";
        label.innerHTML = `
            <input type="checkbox" value="${col}" checked>
            <span>${col.toUpperCase()}</span>
        `;
        checkboxContainer.appendChild(label);
    });

    // Esikatselu taulukko
    const wrapper = document.createElement("div");
    wrapper.className = "merge-preview-wrapper mt-3";

    const table = document.createElement("table");
    table.className = "merge-table";

    // Otsikkorivi
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr>" + 
        data.columns.map(col => 
            `<th>${col.toUpperCase()}</th>`
        ).join("") + "</tr>";
    table.appendChild(thead);

    // Datarivit
    const tbody = document.createElement("tbody");
    data.preview.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = data.columns.map(col => 
            `<td>${row[col] !== null && row[col] !== undefined ? row[col] : "-"}</td>`
        ).join("");
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    /*document.getElementById("mergePreview").innerHTML = "";
    document.getElementById("mergePreview").appendChild(wrapper);*/
}

// Päivitetään showView jotta merge lista päivittyy
const _showView = window.showView;
window.showView = function(name) {
    _showView(name);
    if (name === "merge") {
        updateMergeFileList();
    }
};

// lähettää valitut sarakkeet Reports-näkymään
function sendToReports() {
    const selected = Array.from(
        document.querySelectorAll("#columnCheckboxes input:checked")
    ).map(cb => cb.value);

    if (selected.length === 0) {
        nexusAlert("Valitse vähintään yksi sarake!");
        return;
    }

    const filesToMerge = window.uploadedFiles 
        ? window.uploadedFiles.filter(f => 
            Array.from(document.querySelectorAll("#mergeFileList input:checked"))
                .map(cb => cb.value)
                .includes(f.name)
        )
        : [];

    if (filesToMerge.length < 2) {
        nexusAlert("Tiedostoja ei löydy muistista!");
        return;
    }

    const formData = new FormData();
    filesToMerge.forEach(f => formData.append("files[]", f));
    selected.forEach(col => formData.append("columns[]", col));

    fetch("http://127.0.0.1:5000/api/report", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log("Report vastasi:", data);
        window.reportData = data;
        window.reportFiles = filesToMerge;
        window.reportColumns = selected;
        showView("reports");
    })
    .catch(err => console.error("Report virhe:", err));
}

// Reports toiminnallisuus
// Export formaatti
let currentExportFormat = "xlsx";

// Vaihda export formaatti
function setExportFormat(format) {
    currentExportFormat = format;
    document.getElementById("btnXlsx").classList.toggle("active", format === "xlsx");
    document.getElementById("btnCsv").classList.toggle("active", format === "csv");
}

// Typewriter efekti
function typewriterEffect(lines, index = 0) {
    if (index >= lines.length) {
        document.getElementById("reportsBadge").textContent = "COMPLETE";
        return;
    }

    const terminal = document.getElementById("reportsTerminal");
    const line = lines[index];

    const div = document.createElement("div");
    div.className = line.cls;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;

    let charIndex = 0;
    const interval = setInterval(() => {
        div.textContent += line.text[charIndex];
        charIndex++;
        if (charIndex >= line.text.length) {
            clearInterval(interval);
            setTimeout(() => typewriterEffect(lines, index + 1), line.pause || 100);
        }
    }, 18);
}

// Rakentaa terminaali rivit report datasta
function buildReportLines(data) {
    const lines = [];

    lines.push({ text: "> NEXUS REPORT SYSTEM INITIALIZED...", cls: "t-line", pause: 200 });
    lines.push({ text: "> PROCESSING MERGED DATASET...", cls: "t-line", pause: 200 });
    lines.push({ text: "> ─────────────────────────────────", cls: "t-line", pause: 100 });
    lines.push({ text: `> TOTAL FILES MERGED: ${data.total_files}`, cls: "t-cyan", pause: 150 });
    lines.push({ text: `> TOTAL ROWS: ${data.total_rows.toLocaleString()}`, cls: "t-cyan", pause: 200 });
    lines.push({ text: "> ─────────────────────────────────", cls: "t-line", pause: 100 });

    data.stats.forEach(stat => {
        lines.push({ text: `> COLUMN: ${stat.column.toUpperCase()}`, cls: "t-cyan", pause: 150 });

        if (stat.type === "numeric") {
            lines.push({ text: `>   SUM:     ${stat.sum.toLocaleString()}`, cls: "t-value", pause: 100 });
            lines.push({ text: `>   AVERAGE: ${stat.average.toLocaleString()}`, cls: "t-value", pause: 100 });
            lines.push({ text: `>   MIN:     ${stat.min.toLocaleString()}`, cls: "t-value", pause: 100 });
            lines.push({ text: `>   MAX:     ${stat.max.toLocaleString()}`, cls: "t-value", pause: 150 });
        } else {
            lines.push({ text: `>   UNIQUE VALUES: ${stat.unique_count}`, cls: "t-value", pause: 100 });
            stat.top_values.forEach((val, i) => {
                lines.push({ text: `>   #${i + 1}: ${val} (${stat.top_counts[i]}x)`, cls: "t-value", pause: 80 });
            });
        }
        lines.push({ text: "> ─────────────────────────────────", cls: "t-line", pause: 100 });
    });

    lines.push({ text: "> REPORT COMPLETE.", cls: "t-success", pause: 0 });

    return lines;
}

// Näyttää report datan kirjoituskone-efektillä
function renderReports(data) {
    document.getElementById("reports-empty").style.display = "none";
    document.getElementById("reports-content").style.display = "block";

    const terminal = document.getElementById("reportsTerminal");
    terminal.innerHTML = "";
    document.getElementById("reportsBadge").textContent = "PROCESSING";

    const lines = buildReportLines(data);
    typewriterEffect(lines);
}

// Exporttaa data tiedostoon
function exportData() {
    const files = window.reportFiles;
    const columns = window.reportColumns;

    if (!files || !columns) {
        nexusAlert("Ei exportattavaa dataa — lähetä ensin data Reportsiin!");
        return;
    }

    const formData = new FormData();
    files.forEach(f => formData.append("files[]", f));
    columns.forEach(col => formData.append("columns[]", col));
    formData.append("format", currentExportFormat);

    fetch("http://127.0.0.1:5000/api/export", {
        method: "POST",
        body: formData
    })
    .then(res => res.blob())
    .then(blob => {
        // Luodaan latauslinkki
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nexus_report." + currentExportFormat;
        a.click();
        URL.revokeObjectURL(url);
    })
    .catch(err => console.error("Export virhe:", err));
}

// Päivitetään showView Reports-näkymälle
const __showView = window.showView;
window.showView = function(name) {
    __showView(name);
    if (name === "reports" && window.reportData) {
        setTimeout(() => renderReports(window.reportData), 50);
    }
};