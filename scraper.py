import json
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

records = []
seen = set()

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
                style = div.get_attribute('style')
                img_pez = 'https:' + re.search(r"url\('(.+?)'\)", style).group(1)
            except Exception as e1:
                img_pez = ''
                print(f"Error img_pez: {e1}")
            try:
                div = cols[3].find_element(By.CSS_SELECTOR, '.bait_icon')
                senuelo = div.get_attribute('title').split(';')[0].strip()
                style = div.get_attribute('style')
                img_senuelo = 'https:' + re.search(r"url\('(.+?)'\)", style).group(1)
            except Exception as e2:
                senuelo = ''
                img_senuelo = ''
                print(f"Error senuelo: {e2}")
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
