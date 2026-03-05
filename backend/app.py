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

    # Lasketaan arvojen määrät ensimmäisestä tekstisarakkeesta pylväskaaviota varten
    bar_data = {}
    if text_cols:
        counts = df[text_cols[0]].value_counts().head(10)
        bar_data = {
            "label": text_cols[0],
            "labels": counts.index.tolist(),
            "values": counts.values.tolist()
        }

    # Lasketaan numeerisen sarakkeen summa doughnut-kaaviota varten
    doughnut_data = {}
    if text_cols and numeric_cols:
        grouped = df.groupby(text_cols[0])[numeric_cols[0]].sum().head(8)
        doughnut_data = {
            "label": numeric_cols[0] + " by " + text_cols[0],
            "labels": grouped.index.tolist(),
            "values": grouped.values.tolist()
        }

    result = {
        "filename": file.filename,
        "numeric_columns": numeric_cols,
        "text_columns": text_cols,
        "bar_data": bar_data,
        "doughnut_data": doughnut_data
    }

    return jsonify(result)


# Käynnistetään serveri
if __name__ == "__main__":
    app.run(debug=True)