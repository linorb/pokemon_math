@echo off
rem  פוקימון חשבון - הפעלה מקומית
rem  לחיצה כפולה על הקובץ תפתח את המשחק בדפדפן.
rem  חשוב: המשחק חייב לרוץ דרך שרת קטן (ולא בפתיחה ישירה של index.html),
rem  כי הוא בנוי ממודולים של JavaScript.
rem  פורט 8124 - כדי שאפשר יהיה להפעיל במקביל גם את לוחמי הדרקון (8123).

cd /d "%~dp0"
echo.
echo   Starting Pokemon Math...
echo   To close the game: close this black window.
echo.

start "" http://localhost:8124/index.html
python -m http.server 8124

if errorlevel 1 (
  echo.
  echo   Python was not found on this computer.
  echo   You can play online through GitHub Pages instead.
  pause
)
