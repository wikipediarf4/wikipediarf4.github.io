import json
import re
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
    time.sleep(8)  # esperar que cargue todo el JS

    # ── DEBUG: guardar HTML para inspección ──────────────────────────────────
    html_source = driver.page_source
    with open('debug_page.html', 'w', encoding='utf-8') as f:
        f.write(html_source)
    print('HTML guardado en debug_page.html')

    # ── Imprimir estructura de las primeras filas para entender la página ────
    all_rows = driver.find_elements(By.CSS_SELECTOR, '.records .row')
    print(f'Total .records .row encontrados: {len(all_rows)}')
    for i, row in enumerate(all_rows[:25]):
        cls = row.get_attribute('class') or ''
        txt = row.text.strip().replace('\n', ' | ')[:120]
        ncols = len(row.find_elements(By.CSS_SELECTOR, '.cell'))
        print(f'  Row {i:02d} cols={ncols} class="{cls}" => "{txt}"')

    # ── Parsear top 5 por pez ─────────────────────────────────────────────────
    current_fish    = None
    current_img_pez = None
    rank            = 0

    for row in all_rows:
        cls  = row.get_attribute('class') or ''
        cols = row.find_elements(By.CSS_SELECTOR, '.cell')

        # Fila de encabezado de especie: tiene clase header o pocas celdas
        if 'header' in cls or len(cols) <= 2:
            txt = row.text.strip()
            if txt:
                current_fish = txt
                rank = 0
                try:
                    current_img_pez = row.find_element(By.TAG_NAME, 'img').get_attribute('src') or ''
                except:
                    current_img_pez = ''
            continue

        # Fila de jugador
        if len(cols) >= 5 and current_fish:
            rank += 1
            if rank > 5:
                continue

            img_senuelo = ''
            try:
                img_senuelo = cols[3].find_element(By.TAG_NAME, 'img').get_attribute('src') or ''
            except:
                pass

            if not current_img_pez:
                try:
                    current_img_pez = cols[0].find_element(By.TAG_NAME, 'img').get_attribute('src') or ''
                except:
                    pass

            records.append({
                'pez':         current_fish,
                'rank':        rank,
                'img_pez':     current_img_pez,
                'peso':        cols[0].text.strip(),
                'ubicacion':   cols[1].text.strip(),
                'señuelo':     cols[2].text.strip(),
                'img_senuelo': img_senuelo,
                'jugador':     cols[3].text.strip(),
                'fecha':       cols[4].text.strip() if len(cols) > 4 else '—',
            })

    driver.quit()
    print(f'\nRecords extraídos: {len(records)}')

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

especies = len(set(r['pez'] for r in records))
print(f'Guardados {len(records)} records de {especies} especies')
