import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://rf4game.com/'
}

records = []

try:
    url = 'https://rf4game.com/records/weekly/region/EN/'
    res = requests.get(url, headers=headers, timeout=15)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    rows = soup.select('table tr')
    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 4:
            records.append({
                'jugador': cols[0].get_text(strip=True),
                'pez':     cols[1].get_text(strip=True),
                'peso':    cols[2].get_text(strip=True),
                'carnada': cols[3].get_text(strip=True),
                'mapa':    cols[4].get_text(strip=True) if len(cols) > 4 else '—'
            })
except Exception as e:
    print(f'Error: {e}')

output = {
    'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'),
    'records': records
}

with open('records.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'Guardados {len(records)} records')
