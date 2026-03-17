import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

records = []

try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get('https://rf4game.com/records/weekly/region/EN/')
    time.sleep(8)

    all_rows = driver.find_elements(By.CSS_SELECTOR, '.records .row')
    print(f'Total filas: {len(all_rows)}')

    current_fish    = None
    current_img_pez = None
    rank            = 0

    for row in all_rows:
        cls  = row.get_attribute('class') or ''
        text = row.text.strip()

        # Fila vacía — saltar
        if not text:
            continue

        # Separar columnas por el separador visual | o por elementos internos
        # El texto viene como: "Peso | Ubicacion | Señuelo | Jugador | Fecha"
        # o para header de pez: solo el nombre del pez
        parts = [p.strip() for p in text.split('|')]

        # Detectar si es encabezado global (Fish | Weight | Location...)
        if parts[0].lower() in ('fish', 'pez'):
            continue

        # Detectar si es nombre de pez solo (1 parte o nombre sin kg)
        # Los datos de jugador siempre tienen "kg" en la segunda columna
        if len(parts) == 1 or (len(parts) >= 2 and 'kg' not in parts[1] and 'g' not in parts[1]):
            # Es nombre de especie
            fish_name = parts[0]
            if fish_name and fish_name != current_fish:
                current_fish = fish_name
                rank = 0
                # Imagen del pez
                try:
                    current_img_pez = row.find_element(By.TAG_NAME, 'img').get_attribute('src') or ''
                except:
                    current_img_pez = ''
            continue

        # Es fila de jugador: Peso | Ubicacion | Señuelo | Jugador | Fecha
        if current_fish and len(parts) >= 4:
            rank += 1
            if rank > 5:
                continue

            # Imagen del señuelo
            img_senuelo = ''
            try:
                imgs = row.find_elements(By.TAG_NAME, 'img')
                if len(imgs) >= 2:
                    img_senuelo = imgs[1].get_attribute('src') or ''
                elif len(imgs) == 1:
                    img_senuelo = imgs[0].get_attribute('src') or ''
            except:
                pass

            # Imagen del pez (si no la tenemos aún)
            if not current_img_pez:
                try:
                    imgs = row.find_elements(By.TAG_NAME, 'img')
                    if imgs:
                        current_img_pez = imgs[0].get_attribute('src') or ''
                except:
                    pass

            records.append({
                'pez':         current_fish,
                'rank':        rank,
                'img_pez':     current_img_pez,
                'peso':        parts[0],
                'ubicacion':   parts[1] if len(parts) > 1 else '—',
                'señuelo':     parts[2] if len(parts) > 2 else '—',
                'img_senuelo': img_senuelo,
                'jugador':     parts[3] if len(parts) > 3 else '—',
                'fecha':       parts[4] if len(parts) > 4 else '—',
            })

    driver.quit()

    especies = len(set(r['pez'] for r in records))
    print(f'Records extraídos: {len(records)} de {especies} especies')
    if records:
        print('Ejemplo:', json.dumps(records[:3], ensure_ascii=False, indent=2))

except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

# ── Guardar JSON ──────────────────────────────────────────────────────────────
output = {
    'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'),
    'records': records
}

with open('records.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'records.json guardado con {len(records)} entradas')
