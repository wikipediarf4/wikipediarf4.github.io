export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const PROJECT_ID = 'charlasrf4';
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/clips/${id}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Clip no encontrado');
    const data = await response.json();
    
    const fields = data.fields || {};
    const title = fields.description?.stringValue || 'Clipuy 🎬';
    const image = fields.mediaUrl?.stringValue || 'https://wikipediarf4.github.io/1.png';
    const videoUrl = fields.mediaUrl?.stringValue || '';
    const siteUrl = `https://wikipediarf4.github.io/?clip=${id}`;

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="Mirá este clip en Clipuy 🎬" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="720" />
  <meta property="og:image:height" content="1280" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:type" content="video.other" />
  <meta property="og:video" content="${videoUrl}" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:site_name" content="Clipuy" />
  <meta http-equiv="refresh" content="0;url=${siteUrl}" />
  <script>window.location.href="${siteUrl}"</script>
</head>
<body></body>
</html>`);

  } catch (e) {
    res.redirect(302, 'https://wikipediarf4.github.io');
  }
}
