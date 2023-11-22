const fs = require('fs').promises;
// const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const movies = require('./movies.json');
// const moviesGenres = require('./genres_movies_es.json');

dotenv.config();
console.log('antes: ', movies.length)

async function getMovieData(name, movies) {
    if (movies.length !== 0) {
        const existingMovie = movies.find(m => m.name === name);
        if (existingMovie) return
    }
    const res = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=es&query=${name}`);
    const movie = res.data.results[0];
    if (!movie) return
    const movieData = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.TMDB_API_KEY}&language=es&append_to_response=images,videos,release_dates,credits`);
    //console.log("Datos de TMDB", movieData.data.release_dates.results[0].release_dates)
    return movieData.data
}

function getRating(movie) {
    const isoCodes = ["ES", "DE", "FR", "GB", "US"];
    let rating = null;
    for (const iso of isoCodes) {
        const release = movie.release_dates.results.find(item => item.iso_3166_1 === iso);
        if (!release) continue
        for (const date of release.release_dates) {
            rating = date.certification
            if (rating) break
        }
        if (rating) break
    }

    if (rating === 'TP' || rating === 'G' || rating === 'T' ) rating = 0
    else if (rating === 'PG' ) rating = 7
    else if (rating === 'PG-13' ) rating = 13
    else if (rating === 'R' ) rating = 16
    else if (rating === 'NC-17' ) rating = 18
    else rating = Number(rating)

    if(rating === 'NaN') rating = 18
    if(rating === 'null') rating = 18
    if(!rating) rating = 18

    console.log("rating", rating)
    return rating
}
const directorioPeliculas = '/mnt/disconas/peliculas';

async function listarPeliculas(directorio) {

    try {
        const files = await fs.readdir(directorio);

        for (const file of files) {
            if (!file.includes('.mp4')) continue

            const regex = /^(.+?)[\(\[]/;

            const match = file.match(regex);
            const nombrePelicula = match ? match[1] : file
            const sinExt = nombrePelicula.replace(/\.(avi|mp4|mkv)/, '')
            const sinPuntos = sinExt.replace(/\./g, ' ')

            const movie = await getMovieData(sinPuntos, movies);

            if (!movie) continue

            const genres = movie.genres.map((genre) => {
                return genre.name
            })

            const rating = getRating(movie)
            const director = movie.credits.crew.filter(i => i.job == 'Director').map(i => i.name)
            const cast = movie.credits.cast.slice(0, 20).map(item => {
                return { name: item.name, character: item.character }
            })
            const images = (movie.images.posters && movie.images.posters.length > 0) ? movie.images.posters.map(item => process.env.BASE_IMG_TMDB + item.file_path) : [process.env.BASE_IMG_TMDB + movie.poster_path]

            const movieDB = {
                idTMDB: movie.id,
                name: sinPuntos,
                title: movie.title,
                overview: movie.overview,
                videoUrl: process.env.BASE_URL + file,
                thumbnailUrl: process.env.BASE_IMG_TMDB + movie.poster_path,
                backdropUrl: movie.backdrop_path ? process.env.BASE_IMG_TMDB + movie.backdrop_path : null,
                images,
                director,
                cast,
                genres,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                duration: movie.runtime,
                content_rating: rating,
                budget: movie.budget,
                revenue: movie.revenue,
                tagline: movie.tagline,
                trailer: movie.videos.results[0] ? process.env.BASE_URL_VIDEO_YOUTUBE_A + movie.videos.results[0].key + process.env.BASE_URL_VIDEO_YOUTUBE_B : null
            }
            movies.push(movieDB)
        }

        const res = await axios.post('http://localhost:3000/api/seedmovies', movies);
        console.log(res)

        console.log('despues: ', movies.length)
        fs.writeFile('./movies.json', JSON.stringify(movies, null, 2)).then(() => {
            console.log('Archivo actualizado con éxito');

        }).catch((error) => {
            console.error('Error al escribir el archivo:', error);
        })
    } catch (error) {
        console.error('Error', error);
    }
}

listarPeliculas(directorioPeliculas);

