const path = require('path');

const tvsFolder = '/home/tomas/series';

const getTv = (req, res) => {
  const serie = req.params.serie;
  const temporada = req.params.temporada;
  const capitulo = req.params.capitulo;
  const videoPath = path.join(tvsFolder, serie, temporada, capitulo);

  if (!serie || !videoPath) {
    return res.status(404).send('Video not found.');
  }

  res.sendFile(videoPath);
};

module.exports = {
  getTv
};