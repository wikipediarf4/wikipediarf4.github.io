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

    rows = driver.find_elements(By.CSS_SELECTOR, '.records .row:not(.header)')
    print(f"Filas encontradas: {len(rows)}")

    if rows:
        row = rows[0]
        print("CLASES DE FILA:", row.get_attribute('class'))
        print("HTML FILA:", row.get_attribute('innerHTML')[:500])

    for row in rows:
        cols = row.find_elements(By.CSS_SELECTOR, '.cell')
        if len(cols) >= 5:
            records.append({
                'pez':       cols[0].text.strip(),
                'peso':      cols[1].text.strip(),
                'ubicacion': cols[2].text.strip(),
                'señuelo':   cols[3].text.strip(),
                'jugador':   cols[4].text.strip(),
                'fecha':     cols[5].text.strip() if len(cols) > 5 else '—'
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
