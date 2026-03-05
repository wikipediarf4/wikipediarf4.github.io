import json
import re
import os
import hashlib
import requests
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Carpeta donde se guardan las imágenes
IMG_DIR = 'img_records'
os.makedirs(IMG_DIR, exist_ok=True)

records = []
seen = set()

def extraer_url(style):
    match = re.search(r"url\(['\"]?(.+?)['\"]?\)", style)
    return 'https:' + match.group(1) if match else ''

def descargar_imagen(url):
    """Descarga una imagen y la guarda localmente. Devuelve la ruta local."""
    if not url:
        return ''
    try:
        # Nombre de archivo basado en hash de la URL
        nombre = hashlib.md5(url.encode()).hexdigest() + '.png'
        ruta = os.path.join(IMG_DIR, nombre)
        # Si ya existe, no la descargamos de nuevo
        if not os.path.exists(ruta):
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://rf4game.com/'
            }
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                with open(ruta, 'wb') as f:
                    f.write(r.content)
            else:
                return ''
        return f'img_records/{nombre}'
    except Exception as e:
        print(f'Error descargando imagen {url}: {e}')
        return ''

try:
    driver = webdriver.Chrome(options=options)
    driver.get('https://rf4game.com/records/weekly/region/EN/')
    time.sleep(5)
    rows = driver.find_elements(By.CSS_SELECTOR, '.records .row')
    print(f"Filas encontradas: {len(rows)}")

    for row in rows:
        cols = row.find_elements(By.CSS_SELECTOR, '.col')
        if len(cols) >= 5:
            pez = cols[0].text.strip()
            if pez in ('', 'Fish'):
                continue
            key = (pez, cols[1].text.strip(), cols[4].text.strip())
            if key in seen:
                continue
            seen.add(key)

            try:
                div = cols[0].find_element(By.CSS_SELECTOR, '.item_icon')
                img_pez_url = extraer_url(div.get_attribute('style'))
                img_pez = descargar_imagen(img_pez_url)
            except:
                img_pez = ''

            try:
                div = cols[3].find_element(By.CSS_SELECTOR, '.bait_icon')
                senuelo = div.get_attribute('title').split(';')[0].strip()
                img_senuelo_url = extraer_url(div.get_attribute('style'))
                img_senuelo = descargar_imagen(img_senuelo_url)
            except:
                senuelo = ''
                img_senuelo = ''

            records.append({
                'pez':         pez,
                'img_pez':     img_pez,
                'peso':        cols[1].text.strip(),
                'ubicacion':   cols[2].text.strip(),
                'señuelo':     senuelo,
                'img_senuelo': img_senuelo,
                'jugador':     cols[4].text.strip(),
                'fecha':       cols[5].text.strip() if len(cols) > 5 else '—'
            })

    driver.quit()
except Exception as e:
    print(f'Error: {e}')

output = {
    'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'),
    'records': records
}

with open('records.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'Guardados {len(records)} records')
