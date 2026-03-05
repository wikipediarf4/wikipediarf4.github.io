import requests
import json
from datetime import datetime

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://rf4game.com/records/weekly/region/EN/',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
}

records = []
try:
    url = 'https://rf4game.com/wp-admin/admin-ajax.php?action=best'
    res = requests.get(url, headers=headers, timeout=15)
    print(f'Status: {res.status_code}')
    print(f'Response: {res.text[:500]}')
    data = res.json()
    if isinstance(data, list):
        for item in data:
            records.append(item)
    elif isinstance(data, dict):
        records = data.get('data', data.get('records', []))
except Exception as e:
    print(f'Error: {e}')

output = {
    'updated': datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'),
    'records': records
}

with open('records.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'Guardados {len(records)} records')
