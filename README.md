# Nexus-data-analysis-system

Data-analysointi dashboard, jolla yhdistellaan ja visualisoidaan dataa Excel- ja CSV- tiedostoista

## Teknologiat

-Frontend: HTML, CSS, JavaScript, Booststrap

-Backend: Python + Flask

-Datan käsittely: Pandas

## Toiminnallisuudet

-Excel (.xlsx, .xls) ja CSV-tiedostojen lataus

-Datan visualisointi ja analysointi

-Useiden tiedostojen yhdistely

-Valmis demo-data

-Vain desktop versio

## Tietoturva

-Hyväksytään vain .xlsx, .xls, .csv tiedostot

-Tiedostokoon rajoitus asetettu

-Tiedostonimet sanitoidaan secure_filename():lla

-Data escapetaan ennen HTML-renderöintiä
