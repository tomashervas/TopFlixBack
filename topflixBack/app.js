const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const movieRoutes = require('./routes/movieRoutes');
const tvRoutes = require('./routes/tvRoutes');
const verifyToken = require('./middlewares/verifyToken');
const dotenv = require('dotenv');

dotenv.config();


const app = express();
app.use(cors())
const PORT = process.env.PORT || 3435;

app.use(morgan('dev'));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Configurar rutas para los videos
app.use('/tv',verifyToken, tvRoutes);
app.use('/movies',verifyToken, movieRoutes);

const options = {
  key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN}/privkey.pem`),
  cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN}/fullchain.pem`),
};

const server = https.createServer(options, app);
// const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en el puerto ${PORT}`);
});