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
    rows = driver.find_elements(By.CSS_SELECTOR, '.records .row')
    print(f"Filas encontradas: {len(rows)}")
    if rows:
        first = rows[0]
        cols = first.find_elements(By.CSS_SELECTOR, '.col')
        print(f"Columnas en fila 0: {len(cols)}")
        for i, col in enumerate(cols):
            print(f"  col[{i}]: '{col.text.strip()}'")
            imgs = col.find_elements(By.TAG_NAME, 'img')
            for img in imgs:
                print(f"    img src: {img.get_attribute('src')}")
    driver.quit()
except Exception as e:
    print(f'Error: {e}')

print('Guardados 0 records (modo debug)')
with open('records.json', 'w', encoding='utf-8') as f:
    json.dump({'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), 'records': []}, f)
