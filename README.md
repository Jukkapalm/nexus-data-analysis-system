# NEXUS Data Analysis System

Data-analysointi dashboard, jolla yhdistellaan ja visualisoidaan dataa Excel- ja CSV- tiedostoista

---

## Teknologiat

- **Frontend:** HTML, CSS, JavaScript, Bootstrap, Chart.js
- **Backend:** Python + Flask
- **Datan käsittely:** Pandas

---

## Toiminnallisuudet

- Excel (.xlsx, .xls) ja CSV-tiedostojen lataus drag & drop tai tiedostovalitsimella
- Datan visualisointi pylväs- ja doughnut-kaavioilla
- Useiden tiedostojen yhdistely (stack merge)
- Automaattinen vuositunnistus tiedostonimestä (esim. `data_2077.xlsx`)
- Trendi-analyysi — prosenttimuutos vuodesta toiseen
- Ryhmittely area- ja product-sarakkeiden mukaan osuuksineen
- Tiivistetty Excel/CSV-export — ryhmittely-, yhteenveto- ja trendi-välilehdet
- Valmis demo-data ladattavaksi
- Vain desktop-versio

---

## Tietoturva

- Hyväksytään vain .xlsx, .xls, .csv tiedostot
- Data escapetaan ennen HTML-renderöintiä
