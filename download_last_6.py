import os
import requests
import time
from duckduckgo_search import DDGS

universities = {
    'adpu': 'Azərbaycan Dövlət Pedaqoji Universiteti logo png',
    'bsu': 'Bakı Slavyan Universiteti logo',
    'bqu': 'Bakı Qızlar Universiteti logo',
    'dia': 'Dövlət İdarəçilik Akademiyası Azərbaycan logo png',
    'oyu': 'Odlar Yurdu Universiteti logo',
    'bbu': 'Bakı Biznes Universiteti logo'
}

dest_dir = r"C:\Users\DUY\Desktop\dim-admission-assistant-platform\public\assets\logos"
os.makedirs(dest_dir, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download(url, dest):
    try:
        r = requests.get(url, headers=headers, stream=True, timeout=10)
        if r.status_code == 200:
            with open(dest, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
            print(f"Downloaded {os.path.basename(dest)}")
            return True
    except Exception as e:
        pass
    return False

def run():
    ddgs = DDGS()
    for uid, query in universities.items():
        dest = os.path.join(dest_dir, f"{uid}.png")
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            print(f"Skipping {uid}")
            continue
            
        print(f"Searching {uid}")
        try:
            results = list(ddgs.images(query, max_results=3))
            found = False
            for r in results:
                img_url = r['image']
                if download(img_url, dest):
                    found = True
                    break
        except Exception as e:
            print(f"Error {uid}")
        time.sleep(2)

if __name__ == "__main__":
    run()
