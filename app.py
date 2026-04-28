import yt_dlp
from flask import Flask, request, render_template_string, jsonify, Response
import requests
import os
import webbrowser
from threading import Timer

app = Flask(__name__)

# --- MOTOR DE BÚSQUEDA ---
def buscar_estilo_dyta(query):
    ydl_opts = {
        'format': 'bestaudio/best',
        'extract_flat': True,
        'quiet': True,
        'nocheckcertificate': True,
        # Usamos un User-Agent de un navegador moderno para pasar desapercibidos
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            res = ydl.extract_info(f"ytsearch25:{query}", download=False)
            return [{
                'id': e.get('id'),
                'titulo': e.get('title'),
                'artista': e.get('uploader', 'Artista'),
                'url': f"https://www.youtube.com/watch?v={e.get('id')}",
                'miniatura': e.get('thumbnails')[-1]['url'] if e.get('thumbnails') else ''
            } for e in res.get('entries', [])]
    except Exception as e:
        print(f"Error en búsqueda: {e}")
        return []

def obtener_stream_veloz(video_url, es_video=False):
    # m4a es el formato más estable y compatible para streaming directo
    formato = 'best[ext=mp4]/best' if es_video else 'bestaudio[ext=m4a]/bestaudio/best'
    
    ydl_opts = {
        'format': formato,
        'quiet': True,
        'noplaylist': True,
        'nocheckcertificate': True,
        # TRUCO: Engañamos a YouTube simulando que somos la app de Android o iOS
        'extractor_args': {'youtube': {'player_client': ['android', 'ios', 'web'], 'skip': ['dash', 'hls']}},
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            return info.get('url'), info.get('title', 'DYTA_Music')
    except Exception as e:
        print(f"Error crítico en stream: {e}")
        return None, None

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
        input { flex: 1; padding: 10px; border-radius: 4px; border: none; outline: none; font-size: 16px; }
        .btn-buscar { background: #00c853; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }

        .main-layout { display: flex; height: calc(100vh - 150px); }
        .sidebar { width: 350px; background: #111; overflow-y: auto; border-right: 1px solid #333; padding: 10px; }
        .song-item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #222; cursor: pointer; transition: 0.2s; }
        .song-item:hover { background: #222; }
        .song-item img { width: 55px; height: 55px; border-radius: 4px; margin-right: 12px; object-fit: cover; }

        .player-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; padding: 20px; }
        #artist-cover { max-width: 400px; width: 85%; border-radius: 12px; box-shadow: 0 0 30px rgba(186, 218, 85, 0.15); display: block; }
        #video-frame { display: none; width: 95%; max-width: 750px; aspect-ratio: 16/9; border-radius: 8px; }

        .bottom-bar { position: fixed; bottom: 0; width: 100%; background: #181818; padding: 15px; border-top: 1px solid #333; }
        .bar-content { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 20px; }
        audio { flex: 1; height: 40px; }
        .btn-orange { background: #ff8c00; color: #fff; border: none; padding: 10px 18px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>

<div class="header">
    <div class="logo">DYTA MUSICA ONLINE</div>
    <div class="search-box">
        <input type="text" id="q" placeholder="¿Qué quieres escuchar hoy?" onkeypress="if(event.key==='Enter') buscar()">
        <button class="btn-buscar" onclick="buscar()">BUSCAR</button>
    </div>
</div>

<div class="main-layout">
    <div class="sidebar" id="results-list">
        <p style="text-align:center; color:#555; margin-top:50px;">Busca una canción...</p>
    </div>
    <div class="player-view">
        <img id="artist-cover" src="https://via.placeholder.com/800x450?text=DYTA+PLAYER">
        <video id="video-frame" controls autoplay></video>
        <h2 id="display-title" style="margin-top:20px; font-size:18px; text-align:center; color:#bada55;"></h2>
    </div>
</div>

<div class="bottom-bar">
    <div class="bar-content">
        <div id="bar-title" style="width:180px; font-size:11px; color:#aaa; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">DYTA V15</div>
        <audio id="audio-player" controls autoplay></audio>
        <button class="btn-orange" onclick="descargar(false)">MP3</button>
        <button class="btn-orange" onclick="descargar(true)">MP4</button>
    </div>
</div>

<script>
    let currentItem = null;

    async function buscar() {
        const query = document.getElementById('q').value;
        if(!query) return;
        const list = document.getElementById('results-list');
        list.innerHTML = '<p style="text-align:center;">Buscando...</p>';
        
        const res = await fetch(`/api/search?q=\${encodeURIComponent(query)}`);
        const data = await res.json();
        list.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'song-item';
            div.innerHTML = `<img src="\${item.miniatura}"><div><div style="font-size:14px;">\${item.titulo}</div><b style="color:#777; font-size:11px;">\${item.artista}</b></div>`;
            div.onclick = () => reproducir(item);
            list.appendChild(div);
        });
    }

    async function reproducir(item) {
        currentItem = item;
        const audio = document.getElementById('audio-player');
        const video = document.getElementById('video-frame');
        const img = document.getElementById('artist-cover');
        const title = document.getElementById('display-title');
        
        audio.pause(); video.pause();
        video.style.display = 'none'; img.style.display = 'block';
        title.innerText = "Conectando con YouTube...";
        img.src = "https://via.placeholder.com/800x450?text=Cargando+Audio...";

        const res = await fetch(`/api/stream?url=\${encodeURIComponent(item.url)}`);
        const data = await res.json();

        if(data.stream) {
            img.src = item.miniatura;
            title.innerText = item.titulo;
            document.getElementById('bar-title').innerText = item.titulo;
            audio.src = data.stream;
            audio.play().catch(() => alert("Error al reproducir. Intenta de nuevo."));
        } else {
            title.innerText = "Error: YouTube bloqueó este resultado.";
            alert("Bloqueo de YouTube. Prueba con otro video de la lista.");
        }
    }

    function descargar(esV) {
        if(!currentItem) return alert("Selecciona una canción primero");
        window.location.href = `/api/download?url=\${encodeURIComponent(currentItem.url)}&video=\${esV}`;
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
    url, _ = obtener_stream_veloz(request.args.get('url'))
    return jsonify({'stream': url})

@app.route('/api/download')
def api_download():
    url, titulo = obtener_stream_veloz(request.args.get('url'), request.args.get('video') == 'true')
    if not url: return "No se pudo obtener el enlace", 403
    req = requests.get(url, stream=True)
    ext = ".mp4" if request.args.get('video') == 'true' else ".mp3"
    return Response(req.iter_content(chunk_size=1024*128), headers={
        "Content-Disposition": f"attachment; filename=\"{titulo}{ext}\"",
        "Content-Type": "application/octet-stream"
    })

def abrir_navegador():
    webbrowser.open_new("https://dyta-musica-online.onrender.com")

if __name__ == '__main__':
    # Solo abre el navegador si NO estamos en Render (osea, en tu PC)
    if not os.environ.get('RENDER'):
        Timer(3, abrir_navegador).start()
    
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)