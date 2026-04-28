import yt_dlp
from flask import Flask, request, render_template_string, jsonify, Response
import requests
import os

app = Flask(__name__)

# --- MOTOR DE BÚSQUEDA ---
def buscar_estilo_dyta(query):
    ydl_opts = {
        'format': 'bestaudio/best',
        'extract_flat': True,
        'quiet': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        res = ydl.extract_info(f"ytsearch25:{query}", download=False)
        return [{
            'id': e.get('id'),
            'titulo': e.get('title'),
            'artista': e.get('uploader', 'Artista'),
            'url': f"https://www.youtube.com/watch?v={e.get('id')}",
            'miniatura': e.get('thumbnails')[-1]['url'] if e.get('thumbnails') else ''
        } for e in res['entries']]

def obtener_stream_veloz(video_url, es_video=False):
    formato = 'best[ext=mp4]/best' if es_video else 'bestaudio[ext=m4a]/bestaudio'
    ydl_opts = {'format': formato, 'quiet': True, 'noplaylist': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        return info.get('url'), info.get('title', 'DYTA_Music')

HTML_V15 = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #000; color: #fff; font-family: sans-serif; margin: 0; overflow-x: hidden; }
        .header { background: #bada55; padding: 12px 20px; display: flex; align-items: center; border-bottom: 3px solid #a2c13e; position: sticky; top: 0; z-index: 1000; }
        .logo { font-size: 22px; font-weight: bold; color: #fff; min-width: 250px; }
        .search-box { flex: 1; display: flex; gap: 10px; }
        input { flex: 1; padding: 10px; border-radius: 4px; border: none; }
        .btn-buscar { background: #00c853; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }

        .main-layout { display: flex; height: calc(100vh - 150px); }
        .sidebar { width: 350px; background: #111; overflow-y: auto; border-right: 1px solid #333; padding: 10px; }
        .song-item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #222; cursor: pointer; }
        .song-item:hover { background: #222; }
        .song-item img { width: 50px; height: 50px; border-radius: 4px; margin-right: 12px; }

        .player-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; padding: 20px; }
        #artist-cover { max-width: 450px; width: 90%; border-radius: 8px; display: block; }
        #video-frame { display: none; width: 95%; max-width: 800px; aspect-ratio: 16/9; }

        .bottom-bar { position: fixed; bottom: 0; width: 100%; background: #181818; padding: 15px; border-top: 1px solid #333; }
        .bar-content { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 20px; }
        audio { flex: 1; height: 35px; }
        .btn-orange { background: #ff8c00; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>

<div class="header">
    <div class="logo">DYTA MUSICA ONLINE</div>
    <div class="search-box">
        <input type="text" id="q" placeholder="Buscar artista o canción...">
        <button class="btn-buscar" onclick="buscar()">BUSCAR</button>
    </div>
</div>

<div class="main-layout">
    <div class="sidebar" id="results-list"></div>
    <div class="player-view">
        <img id="artist-cover" src="https://via.placeholder.com/800x450?text=DYTA+MUSICA">
        <video id="video-frame" controls autoplay></video>
        <h2 id="display-title" style="margin-top:20px; font-size:16px;"></h2>
    </div>
</div>

<div class="bottom-bar">
    <div class="bar-content">
        <div id="bar-title" style="width:200px; font-size:12px; color:#bada55; font-weight:bold;">DYTA V15</div>
        <audio id="audio-player" controls autoplay></audio>
        <button class="btn-orange" onclick="descargar(false)">MP3</button>
        <button class="btn-orange" onclick="descargar(true)">MP4</button>
    </div>
</div>

<script>
    let currentItem = null;

    async function buscar() {
        const query = document.getElementById('q').value;
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const list = document.getElementById('results-list');
        list.innerHTML = `<div style="color:#bada55; padding:10px; font-weight:bold;">${data.length} RESULTADOS</div>`;

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'song-item';
            div.innerHTML = `<img src="${item.miniatura}"><div><div>${item.titulo}</div><b style="color:#888; font-size:11px;">${item.artista}</b></div>`;
            div.onclick = () => reproducir(item);
            list.appendChild(div);
        });
    }

    async function reproducir(item) {
        currentItem = item;
        const audio = document.getElementById('audio-player');
        const video = document.getElementById('video-frame');
        const img = document.getElementById('artist-cover');
        
        // --- LIMPIEZA TOTAL: Apagamos TODO antes de cargar lo nuevo ---
        audio.pause();
        audio.src = "";
        video.pause();
        video.src = "";
        video.style.display = 'none';
        img.style.display = 'none';
        // -------------------------------------------------------------

        document.getElementById('bar-title').innerText = item.titulo;
        document.getElementById('display-title').innerText = item.titulo;

        const esV = item.titulo.toLowerCase().includes('video') || item.titulo.toLowerCase().includes('official');
        const res = await fetch(`/api/stream?url=${encodeURIComponent(item.url)}&video=${esV}`);
        const data = await res.json();

        if(esV) {
            video.style.display = 'block';
            video.src = data.stream;
            video.play();
        } else {
            img.style.display = 'block';
            img.src = item.miniatura;
            audio.src = data.stream;
            audio.play();
        }
    }

    function descargar(esV) {
        if(!currentItem) return;
        window.location.href = `/api/download?url=${encodeURIComponent(currentItem.url)}&video=${esV}`;
    }
</script>
</body>
</html>
"""

@app.route('/')
def index(): return render_template_string(HTML_V15)

@app.route('/api/search')
def api_search(): return jsonify(buscar_estilo_dyta(request.args.get('q')))

@app.route('/api/stream')
def api_stream():
    url, _ = obtener_stream_veloz(request.args.get('url'), request.args.get('video') == 'true')
    return jsonify({'stream': url})

@app.route('/api/download')
def api_download():
    url, titulo = obtener_stream_veloz(request.args.get('url'), request.args.get('video') == 'true')
    req = requests.get(url, stream=True)
    ext = ".mp4" if request.args.get('video') == 'true' else ".mp3"
    return Response(req.iter_content(chunk_size=131072), headers={
        "Content-Disposition": f"attachment; filename=\"{titulo}{ext}\"",
        "Content-Type": "application/octet-stream"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)