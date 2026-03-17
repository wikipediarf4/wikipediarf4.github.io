import json
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
options.add_argument('--window-size=1920,1080')
options.binary_location = '/usr/bin/google-chrome'

records = []
seen = set()

def extraer_url(style):
    match = re.search(r"url\(['\"]?(.+?)['\"]?\)", style)
    return 'https:' + match.group(1) if match else ''

try:
    driver = webdriver.Chrome(options=options)
    driver.get('https://rf4game.com/records/weekly/region/EN/')
    time.sleep(8)
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
                img_pez = extraer_url(div.get_attribute('style'))
            except:
                img_pez = ''
            try:
                div = cols[3].find_element(By.CSS_SELECTOR, '.bait_icon')
                senuelo = div.get_attribute('title').split(';')[0].strip()
                img_senuelo = extraer_url(div.get_attribute('style'))
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
