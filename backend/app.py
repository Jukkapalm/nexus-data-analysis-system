from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os

# Luodaan Flask sovellus
app = Flask(__name__)

# Sallitaan frontend puhua backendille
CORS(app)

# Sallitut tiedostotyypit
ALLOWED_EXTENSIONS = {"xlsx", "xls", "csv"}

# Tarkistaa onko tiedostotyyppi sallittu
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Testataan että serveri toimii
@app.route("/")
def index():
    return "NEXUS ONLINE"

# Tiedoston lähetys ja analysointi
@app.route("/api/upload", methods=["POST"])
def upload_file():

    # Tarkistetaan että tiedosto löytyy requestista
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    # Tarkistetaan että tiedostotyyppi on sallittu
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    # Luetaan tiedosto Pandasilla
    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext == "csv":
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file)

    # Palautetaan perustiedot frontendille
    result = {
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "preview": df.head(5).to_dict(orient="records")
    }

    return jsonify(result)

# Analysoi data kaaviota varten
@app.route("/api/analyze", methods=["POST"])
def analyze_file():

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400
    
    # Luetaan tiedosto
    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext == "csv":
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file)

    # Etsitään numeeriset sarakkeet
    numeric_cols = df.select_dtypes(include="number").columns.tolist()

    # Etsitään teksti sarakkeet
    text_cols = df.select_dtypes(include="object").columns.tolist()

    # Käytetään valittua saraketta tai oletuksena ensimmäistä
    bar_column = request.form.get("bar_column", text_cols[0] if text_cols else None)
    doughnut_column = request.form.get("doughnut_column", text_cols[0] if text_cols else None)

    # Lasketaan arvojen määrät ensimmäisestä tekstisarakkeesta pylväskaaviota varten
    bar_data = {}
    if bar_column and bar_column in df.columns:
        counts = df[bar_column].value_counts().head(10)
        bar_data = {
            "label": bar_column,
            "labels": counts.index.tolist(),
            "values": counts.values.tolist()
        }

    # Lasketaan numeerisen sarakkeen summa doughnut-kaaviota varten
    doughnut_data = {}
    if doughnut_column and numeric_cols:
        grouped = df.groupby(doughnut_column)[numeric_cols[0]].sum().head(8)
        doughnut_data = {
            "label": numeric_cols[0] + " by " + doughnut_column,
            "labels": grouped.index.tolist(),
            "values": [round(float(v), 2) for v in grouped.values.tolist()]
        }

    result = {
        "filename": file.filename,
        "numeric_columns": numeric_cols,
        "text_columns": text_cols,
        "bar_data": bar_data,
        "doughnut_data": doughnut_data
    }

    return jsonify(result)

# Yhdistää useita tiedostoja
@app.route("/api/merge", methods=["POST"])
def merge_files():

    if "files[]" not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist("files[]")
    merge_type = request.form.get("merge_type", "stack")

    if len(files) < 2:
        return jsonify({"error": "At least 2 files required"}), 400
    
    # Luetaan kaikki tiedostot DataFrameiksi
    dataframes = []
    for file in files:
        if not allowed_file(file.filename):
            return jsonify({"error": f"Invalid file type: {file.filename}"}), 400
        ext = file.filename.rsplit(".", 1)[1].lower()
        if ext == "csv":
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        dataframes.append(df)

    # Yhdistetään DataFramet
    if merge_type == "stack":

        # Pinotaan päällekkäin
        merged = pd.concat(dataframes, ignore_index=True)
    else:
        # Yhdistetään yhteisen sarakkeen perusteella
        join_column = request.form.get("join_column")
        if not join_column:
            return jsonify({"error": "Join column required"}), 400
        merged = dataframes[0]
        for df in dataframes[1:]:
            merged = pd.merge(merged, df, on=join_column, how="outer")

    # Tallennetaan muistiin myöhempää käyttöä varten
    app.config["merged_data"] = merged.to_dict(orient="records")
    app.config["merged_columns"] = list(merged.columns)

    result = {
        "rows": len(merged),
        "columns": list(merged.columns),
        "preview": merged.head(10).to_dict(orient="records")
    }

    return jsonify(result)


# Käynnistetään serveri
if __name__ == "__main__":
    app.run(debug=True)