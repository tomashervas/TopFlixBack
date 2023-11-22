const express = require('express');
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});