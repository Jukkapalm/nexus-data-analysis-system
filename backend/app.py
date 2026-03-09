from flask import Flask, request, jsonify, send_from_directory
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


@app.route("/")
def index():
    return send_from_directory("../frontend", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("../frontend", filename)

@app.route("/api/sample/<filename>")
def serve_sample(filename):
    return send_from_directory("../sample-data", filename)

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
    merged = pd.concat(dataframes, ignore_index=True)

    # Tallennetaan muistiin myöhempää käyttöä varten
    app.config["merged_data"] = merged.to_dict(orient="records")
    app.config["merged_columns"] = list(merged.columns)

    result = {
        "rows": len(merged),
        "columns": list(merged.columns),
        "preview": merged.head(100).fillna("").to_dict(orient="records")
    }

    return jsonify(result)

# Yrittää tunnistaa vuosiluvu tiedostonimestä (esim. "data_2077.xlsx" -> 2077)
def extract_year(filename):
    import re
    match = re.search(r"(20\d{2}|\d{4})", filename)
    return int(match.group(1)) if match else None

# Laskee prosenttimuutoksen kahdesta luvusta
def pct_change(old, new):
    if old == 0:
        return None
    return round((new - old) / abs(old) * 100, 1)

# Laskee yhteenvedon, trendit ja ryhmittelyt valituista sarakkeista
@app.route("/api/report", methods=["POST"])
def generate_report():

    if "files[]" not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist("files[]")
    selected_columns = request.form.getlist("columns[]")

    if not selected_columns:
        return jsonify({"error": "No columns selected"}), 400
    
    # Luetaan tiedostot ja yritetään tunnistaa vuosi nimestä
    dataframes = []
    for file in files:
        if not allowed_file(file.filename):
            return jsonify({"error": f"Invalid file type: {file.filename}"}), 400
        ext = file.filename.rsplit(".", 1)[1].lower()
        df = pd.read_csv(file) if ext == "csv" else pd.read_excel(file)
        df["__year__"] = extract_year(file.filename)
        dataframes.append(df)

    merged = pd.concat(dataframes, ignore_index=True)

    # Tunnistetaan vuodet järjestyksessä
    years = sorted(merged["__year__"].dropna().unique().tolist())
    has_years = len(years) >= 2

    # Numeeriset ja teksti sarakkeet valituista
    numeric_cols = [c for c in selected_columns if pd.api.types.is_numeric_dtype(merged[c])]
    text_cols = [c for c in selected_columns if not pd.api.types.is_numeric_dtype(merged[c])
                and c not in ("__year__", "__filename__")]
    
    # Trendi: vertaa vuosia numeerisille sarakkeille
    trends = []
    if has_years:
        y1, y2 = int(years[0]), int(years[-1])
        df1 = merged[merged["__year__"] == y1]
        df2 = merged[merged["__year__"] == y2]

        for col in numeric_cols:
            val1 = round(float(df1[col].sum()), 2)
            val2 = round(float(df2[col].sum()), 2)
            change = pct_change(val1, val2)
            trends.append({
                "column": col,
                "year1": y1,
                "year2": y2,
                "value1": val1,
                "value2": val2,
                "change": change,
                "direction": "up" if change and change > 0 else "down" if change and change < 0 else "flat"
            })

    # Rynmittely: laske summat per tekstisarake per vuosi
    groupings = []
    group_candidates = [c for c in text_cols if merged[c].nunique() <= 30]

    for group_col in group_candidates:
        if has_years:
            # Ryhmittele vuosittain
            rows = []
            all_groups = merged[group_col].dropna().unique().tolist()
            for grp in all_groups:
                row = {"group": grp}
                total_all = 0
                for yr in [int(y) for y in years]:
                    subset = merged[(merged["__year__"] == yr) & (merged[group_col] == grp)]
                    for col in numeric_cols:
                        val = round(float(subset[col].sum()), 2)
                        row[f"{col}_{yr}"] = val
                        total_all += val
                row["total"] = round(total_all, 2)
                rows.append(row)

            # Lasketaan prosenttimuutos per ryhmä jos kaksi vuotta
            if len(years) == 2:
                y1, y2 = int(years[0]), int(years[-1])
                for row in rows:
                    for col in numeric_cols:
                        v1 = row.get(f"{col}_{y1}", 0)
                        v2 = row.get(f"{col}_{y2}", 0)
                        row[f"{col}_change_pct"] = pct_change(v1, v2)

            # Järjestetään kokonaissumman mukaan
            rows.sort(key=lambda r: r["total"], reverse=True)

            # Lasketaan osuudet kokonaissummasta
            grand_total = sum(r["total"] for r in rows)
            for row in rows:
                row["share_pct"] = round(row["total"] / grand_total * 100, 1) if grand_total else 0

            groupings.append({
                "group_column": group_col,
                "years": [int(y) for y in years],
                "numeric_columns": numeric_cols,
                "rows": rows,
                "grand_total": round(grand_total, 2)
            })
        else:
            # Vain yksi tiedosto - yksinkertainen ryhmittely
            rows = []
            for col in numeric_cols:
                grouped = merged.groupby(group_col)[col].sum().sort_values(ascending=False)
                total = grouped.sum()
                for grp, val in grouped.items():
                    rows.append({
                        "group": grp,
                        col: round(float(val), 2),
                        "share_pct": round(float(val) / total * 100, 1) if total else 0
                    })
            groupings.append({
                "group_column": group_col,
                "numeric_columns": numeric_cols,
                "rows": rows
            })

    # Perustilastot yhdistetylle datalle
    stats = []
    for col in selected_columns:
        if col not in merged.columns:
            continue
        col_data = merged[col].dropna()
        if pd.api.types.is_numeric_dtype(col_data):
            stats.append({
                "column": col,
                "type": "numeric",
                "sum": round(float(col_data.sum()), 2),
                "average": round(float(col_data.mean()), 2),
                "min": round(float(col_data.min()), 2),
                "max": round(float(col_data.max()), 2),
                "count": int(col_data.count())
            })
        else:
            top_values = col_data.value_counts().head(3)
            stats.append({
                "column": col,
                "type": "text",
                "unique_count": int(col_data.nunique()),
                "top_values": top_values.index.tolist(),
                "top_counts": top_values.values.tolist()
            })
    
    result = {
        "total_rows": len(merged),
        "total_files": len(files),
        "has_years": has_years,
        "years": [int(y) for y in years],
        "stats": stats,
        "trends": trends,
        "groupings": groupings
    }

    # Tallennetaan muistiin exportia varten
    app.config["report_results"] = result
    app.config["report_merged"] = merged
    app.config["report_columns"] = selected_columns
    app.config["report_groupings"] = groupings

    return jsonify(result)

# Exporttaa tiivistetty kooste Excel tai csv tiedostoon
@app.route("/api/export", methods=["POST"])
def export_data():

    from io import BytesIO
    from flask import send_file

    export_format = request.form.get("format", "xlsx")

    groupings = app.config.get("report_groupings")
    result = app.config.get("report_results")

    if not groupings and not result:
        return jsonify({"error": "No report data available"}), 400
    
    buffer = BytesIO()

    if export_format == "csv":
        # CSV: ensimmäinen ryhmittely tai perustilastot
        if groupings:
            rows = groupings[0]["rows"]
            df_export = pd.DataFrame(rows)
        else:
            df_export = pd.DataFrame(result["stats"])

        df_export.to_csv(buffer, index=False, encoding="utf-8-sig")
        buffer.seek(0)
        return send_file(
            buffer,
            mimetype="text/csv",
            as_attachment=True,
            download_name="nexus_report.csv"
        )
    else:
        # Excel: yksi välilehti per ryhmittely + yhteenveto
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:

            # Välilehti per ryhmittely (esim. per area, per product)
            for grp in groupings:
                sheet_name = grp["group_column"][:31] # Excel max 31 merkkiä
                df_grp = pd.DataFrame(grp["rows"])
                df_grp.to_excel(writer, sheet_name=sheet_name, index=False)

            # Yhteenveto-välilehti perustilastoista
            if result and result.get("stats"):
                df_stats = pd.DataFrame(result["stats"])
                df_stats.to_excel(writer, sheet_name="summary", index=False)

            # Trendi-välilehti jos vertailuvuosia on
            if result and result.get("trends"):
                df_trends = pd.DataFrame(result["trends"])
                df_trends.to_excel(writer, sheet_name="trends", index=False)

        buffer.seek(0)
        return send_file(
            buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="nexus_report.xlsx"
        )

# Käynnistetään serveri
if __name__ == "__main__":
    app.run()