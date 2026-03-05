import json
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
try:
    driver = webdriver.Chrome(options=options)
    driver.get('https://rf4game.com/records/weekly/region/EN/')
    time.sleep(5)
print(driver.page_source[:3000])
    rows = driver.find_elements(By.CSS_SELECTOR, '.records .row.header')
    print(f"Filas encontradas: {len(rows)}")

    for row in rows:
        cols = row.find_elements(By.CSS_SELECTOR, '.col')
        if len(cols) >= 5:
            # Imagen del pez
            try:
                img_pez = cols[0].find_element(By.TAG_NAME, 'img').get_attribute('src')
            except:
                img_pez = ''

            # Imagen del señuelo
            try:
                img_senuelo = cols[3].find_element(By.TAG_NAME, 'img').get_attribute('src')
            except:
                img_senuelo = ''

            records.append({
                'pez':          cols[0].text.strip(),
                'img_pez':      img_pez,
                'peso':         cols[1].text.strip(),
                'ubicacion':    cols[2].text.strip(),
                'señuelo':      cols[3].text.strip(),
                'img_senuelo':  img_senuelo,
                'jugador':      cols[4].text.strip(),
                'fecha':        cols[5].text.strip() if len(cols) > 5 else '—'
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
