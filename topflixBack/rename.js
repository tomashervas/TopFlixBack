const fs = require('fs').promises;
// const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const movies = require('./movies.json');
const moviesGenres = require('./genres_movies_es.json');

dotenv.config();
console.log('antes: ', movies.length)

async function getMovieData(name, movies) {
    if(movies.length !== 0){
        const existingMovie = movies.find(m => m.name === name);
        if(existingMovie) return
    }
    const res = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&language=es&query=${name}`);
    const movie = res.data.results[0];
    console.log("Datos de TMDB", movie)
    return movie
}

async function listarPeliculas() {
  const directorioPeliculas = '/home/tomas/peliculas';

  try {
    const files = await fs.readdir(directorioPeliculas);

    for (const file of files) {
      if(!file.includes('.mp4')) continue
        
      const regex = /^(.+?)[\(\[]/;

      const match = file.match(regex);
      const nombrePelicula = match ? match[1] : file
      const sinExt = nombrePelicula.replace(/\.(avi|mp4|mkv)/, '')
      const sinPuntos = sinExt.replace(/\./g, ' ')
    
      const movie = await getMovieData(sinPuntos, movies);

      if(!movie) continue

      const genres = movie.genre_ids.map((genre) => {
          const genreObj = moviesGenres.find((g) => g.id === genre)
          return genreObj.name
      })
      const movieDB = {
        idTMDB: movie.id,
        name: sinPuntos,
        title: movie.title,
        overview: movie.overview,
        videoUrl: process.env.BASE_URL + file,
        thumbnailUrl: process.env.BASE_IMG_TMDB + movie.poster_path,
        genres,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        duration: 0,
        rate: 'NR'
      }
      movies.push(movieDB)
    }
    console.log('despues: ', movies.length)
    fs.writeFile('./movies.json', JSON.stringify(movies, null, 2)).then(() => {
      console.log('Archivo actualizado con éxito');
    }).catch((error) => {
      console.error('Error al escribir el archivo:', error);
    })
  } catch (error) {
    console.error('Error al leer el directorio:', error);
  }
}

listarPeliculas();
