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

def extract_bg_image(style):
    m = re.search(r"background-image:\s*url\(['\"]?([^'\")\s]+)['\"]?\)", style or '')
    if m:
        url = m.group(1)
        if url.startswith('//'):
            url = 'https:' + url
        return url
    return ''

try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get('https://rf4game.com/records/weekly/region/EN/')
    time.sleep(8)

    # Usar records_subtable — cada bloque es UN pez con su top5
    # Row 01, 07, 09... tienen clase "row" y dentro tienen un records_subtable completo
    subtables = driver.find_elements(By.CSS_SELECTOR, '.records_subtable')
    print(f'Subtablas encontradas: {len(subtables)}')

    for subtable in subtables:
        # Nombre e imagen del pez — en el header de la subtabla
        pez = ''
        img_pez = ''
        try:
            header = subtable.find_element(By.CSS_SELECTOR, '.row.header')
            fish_col = header.find_element(By.CSS_SELECTOR, '.col.fish')
            pez = fish_col.find_element(By.CSS_SELECTOR, '.text').text.strip()
            icon_style = fish_col.find_element(By.CSS_SELECTOR, '.item_icon').get_attribute('style') or ''
            img_pez = extract_bg_image(icon_style)
        except:
            continue

        if not pez:
            continue

        # Filas de jugadores — todas las .row que NO son .header dentro de esta subtabla
        player_rows = subtable.find_elements(By.CSS_SELECTOR, '.row:not(.header)')
        rank = 0
        for row in player_rows:
            try:
                peso = row.find_element(By.CSS_SELECTOR, '.col.weight').text.strip().replace('\u00a0', ' ')
            except:
                continue
            if not peso:
                continue

            rank += 1
            if rank > 5:
                break

            ubicacion = '—'
            try:
                ubicacion = row.find_element(By.CSS_SELECTOR, '.col.location').text.strip()
            except:
                pass

            senuelo = '—'
            img_senuelo = ''
            try:
                bait_el = row.find_element(By.CSS_SELECTOR, '.col.bait')
                senuelo = bait_el.find_element(By.CSS_SELECTOR, '.text').text.strip()
                icon_style = bait_el.find_element(By.CSS_SELECTOR, '.item_icon').get_attribute('style') or ''
                img_senuelo = extract_bg_image(icon_style)
            except:
                try:
                    senuelo = row.find_element(By.CSS_SELECTOR, '.col.bait').text.strip()
                except:
                    pass

            jugador = '—'
            try:
                jugador = row.find_element(By.CSS_SELECTOR, '.col.player').text.strip()
            except:
                pass

            fecha = '—'
            try:
                fecha = row.find_element(By.CSS_SELECTOR, '.col.date').text.strip()
            except:
                pass

            records.append({
                'pez':         pez,
                'rank':        rank,
                'img_pez':     img_pez,
                'peso':        peso,
                'ubicacion':   ubicacion,
                'señuelo':     senuelo,
                'img_senuelo': img_senuelo,
                'jugador':     jugador,
                'fecha':       fecha,
            })

    driver.quit()

    especies = len(set(r['pez'] for r in records))
    print(f'Records extraídos: {len(records)} de {especies} especies')
    print('Ejemplo (primeros 6):')
    print(json.dumps(records[:6], ensure_ascii=False, indent=2))

except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

output = {
    'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'),
    'records': records
}

with open('records.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'records.json guardado con {len(records)} entradas')
