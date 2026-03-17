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

try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get('https://rf4game.com/records/weekly/region/EN/')
    time.sleep(8)

    subtables = driver.find_elements(By.CSS_SELECTOR, '.records_subtable')
    print(f'Subtablas: {len(subtables)}')

    # Imprimir HTML completo de las primeras 2 subtablas
    for i, st in enumerate(subtables[:2]):
        html = st.get_attribute('innerHTML') or ''
        print(f'\n====== SUBTABLE {i} ======')
        print(html[:2000])

    driver.quit()

except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

import json
from datetime import datetime
output = {'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), 'records': []}
with open('records.json', 'w') as f:
    json.dump(output, f)
