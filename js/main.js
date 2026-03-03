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
    showAnalyzing(valid[0].name);
    setTimeout(() => {
        valid.forEach(f => addFilesToList(f.name, formatSize(f.size)));
    }, 3000);
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
        <div class="file-item-status>✓ LOADED</div>
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