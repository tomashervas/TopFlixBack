const readline = require('readline');
const fs = require('fs').promises;
const dotenv = require('dotenv');
const axios = require('axios');
const {getRating} = require('./seedmovies')
const generateToken = require('./lib/jwt');

const movies = require('./movies.json');

dotenv.config();


console.log('Total peliculas:', movies.length);
//let filteredMovies= []

const askQuestion = async (question) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve, reject) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function getMoviesTMDB(name) {
    const res = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=es&query=${name}`);
    return res.data.results
}

const main = async () => {
    const searchedMovie = await askQuestion('Introduce el nombre de la película: ')
    console.log('input:', searchedMovie);
    let exactMovie = movies.find((movie) => movie.title.toLowerCase().trim() === searchedMovie.toLowerCase().trim());
    exactMovie && console.log('Pelicula encontrada:', exactMovie.title)
    if( !exactMovie ) {
        const filteredMovies = movies.filter((movie) => movie.title.toLowerCase().includes(searchedMovie.toLowerCase()))
        if (filteredMovies.length > 0) {
            console.log(`Se encontraron ${filteredMovies.length} coincidencias:`);
            filteredMovies.forEach((movie, index) => {
                console.log(`(${index}) ${movie.title}`);
            })
            const selectedIndex = await askQuestion('Escriba el indice de la película que desea actualizar:  ')
            exactMovie = filteredMovies[Number(selectedIndex)]
            exactMovie && console.log(`Ha seleccionado ${filteredMovies[Number(selectedIndex)].title}`)
            
        } else {
            console.log('No se encontraron coincidencias');
            return
        }
    }
    const moviesToSave = movies.filter((movie) => movie.idTMDB !== exactMovie.idTMDB)
    console.log(moviesToSave.length)
    
    const moviesAPI = await getMoviesTMDB(exactMovie.name)
    
    if (moviesAPI.length === 0) {
        return console.log("No se encontro en TMDB " + exactMovie.title + ", comprueba en postman que exista")
    }
    
    moviesAPI.forEach((movie, index) => console.log(`(${index})`, 'Titulo:', movie.title, 'release_date:', movie.release_date,'overview:', movie.overview.substring(0, 150)));
    
    const selectedMovieIndex = await askQuestion('Escriba el indice de la nueva película a guardar:  ')
    console.log('Pelicula seleccionada:', moviesAPI[Number(selectedMovieIndex)].title)

    const movieRes = await axios.get(`https://api.themoviedb.org/3/movie/${moviesAPI[Number(selectedMovieIndex)].id}?api_key=${process.env.TMDB_API_KEY}&language=es&append_to_response=images,videos,release_dates,credits`);

    const movieData = movieRes.data
    const genres = movieData.genres.map((genre) => {
        return genre.name
    })

    const rating = getRating(movieData)
    const director = movieData.credits.crew.filter(i => i.job == 'Director').map(i => i.name)
    const cast = movieData.credits.cast.slice(0, 20).map(item => {
        return { name: item.name, character: item.character }
    })
    const images = (movieData.images.posters && movieData.images.posters.length > 0) ? movieData.images.posters.map(item => process.env.BASE_IMG_TMDB + item.file_path) : [process.env.BASE_IMG_TMDB + movieData.poster_path]

    const movieDB = {
        idTMDB: movieData.id,
        name: exactMovie.name,
        title: movieData.title,
        overview: movieData.overview,
        videoUrl: exactMovie.videoUrl,
        thumbnailUrl: process.env.BASE_IMG_TMDB + movieData.poster_path,
        backdropUrl: movieData.backdrop_path ? process.env.BASE_IMG_TMDB + movieData.backdrop_path : null,
        images,
        director,
        cast,
        genres,
        release_date: movieData.release_date,
        vote_average: movieData.vote_average,
        duration: movieData.runtime,
        content_rating: rating,
        budget: movieData.budget,
        revenue: movieData.revenue,
        tagline: movieData.tagline,
        trailer: movieData.videos.results[0] ? process.env.BASE_URL_VIDEO_YOUTUBE_A + movieData.videos.results[0].key + process.env.BASE_URL_VIDEO_YOUTUBE_B : null
    }
    
    const token = generateToken(process.env.ADMIN);

    //console.log(movieDB)

    const res = await axios.put(`${process.env.DOMAIN_SEED}/api/seedmovie/${exactMovie.idTMDB}`, movieDB, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (res.status === 200) moviesToSave.push(movieDB)
    console.log("Guardado en DB: " + res.data.name  + " id: " + res.data.id)

    //moviesToSave.push(movieDB)

    //Save the updated array to a new json file
    fs.writeFile('./movies.json', JSON.stringify(moviesToSave, null, 2)).then(() => {
        console.log('Archivo actualizado con éxito');
        const movies = require('./movies.json')
        console.log(' Total peliculas despues:', movies.length);

    }).catch((error) => {
        console.error('Error al escribir el archivo:', error);
    })
}

main();
