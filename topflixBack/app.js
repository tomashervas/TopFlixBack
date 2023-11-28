const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const movieRoutes = require('./routes/movieRoutes');
const tvRoutes = require('./routes/tvRoutes');

const app = express();
app.use(cors())
const PORT = process.env.PORT || 3435;

app.use(morgan('dev'));

// Configurar rutas para los videos
app.use('/tv', tvRoutes);
app.use('/movies', movieRoutes);

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en el puerto ${PORT}`);
});