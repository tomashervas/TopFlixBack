const express = require('express');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
const PORT = process.env.PORT || 3435;

// Configurar rutas para los videos
app.use('/movies', movieRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});