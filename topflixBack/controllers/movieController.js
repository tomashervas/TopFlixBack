const path = require('path');

const moviesFolder = '/mnt/HDD1TB/peliculas';

const getVideo = (req, res) => {
  const movie = req.params.movie;
  const videoPath = path.join(moviesFolder, movie);

  if (!movie || !videoPath) {
    return res.status(404).send('Video not found.');
  }

  res.sendFile(videoPath);
};

module.exports = {
  getVideo,
};