const readline = require('readline');
const fs = require('fs').promises;
const dotenv = require('dotenv');
const axios = require('axios');
const generateToken = require('./lib/jwt');

const tvs = require('./tv.json');

dotenv.config();


console.log('Total series:', tvs.length);
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

async function getTVsTMDB(name) {
    const res = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&language=es&query=${name}`);
    return res.data.results
}

function getRating(tv) {
    const isoCodes = ["ES", "DE", "FR", "GB", "US"];
    for (const iso of isoCodes) {
        const content = tv.content_ratings.results.find(item => item.iso_3166_1 === iso);
        if (!content) continue
        let rating = content.rating

        if (rating === 'TP' || rating === 'G' || rating === 'T') rating = 0
        else if (rating === 'PG') rating = 7
        else if (rating === 'PG-13') rating = 13
        else if (rating === 'R') rating = 16
        else if (rating === 'NC-17') rating = 18
        else rating = Number(rating)

        if (rating === 'NaN') rating = 18
        if(rating === 'null') rating = 18
        if(!rating) rating = 18

        console.log("rating", rating)
        return rating
    }
}

const main = async () => {
    const searchedTV = await askQuestion('Introduce el nombre de la serie: ')
    console.log('input:', searchedTV);
    let exactTV = tvs.find((tv) => tv.name.toLowerCase().trim() === searchedTV.toLowerCase().trim());
    exactTV && console.log('Serie encontrada:', exactTV.name)
    if( !exactTV ) {
        const filteredTVs = tvs.filter((tv) => tv.name.toLowerCase().includes(searchedTV.toLowerCase()))
        if (filteredTVs.length > 0) {
            console.log(`Se encontraron ${filteredTVs.length} coincidencias:`);
            filteredTVs.forEach((tv, index) => {
                console.log(`(${index}) ${tv.name}`);
            })
            const selectedIndex = await askQuestion('Escriba el indice de la serie que desea actualizar:  ')
            exactTV = filteredTVs[Number(selectedIndex)]
            exactTV && console.log(`Ha seleccionado ${filteredTVs[Number(selectedIndex)].name}`)
            
        } else {
            console.log('No se encontraron coincidencias');
            return
        }
    }
    const tvsToSave = tvs.filter((tv) => tv.idTMDB !== exactTV.idTMDB)
    console.log(tvsToSave.length)
    
    const tvsAPI = await getTVsTMDB(exactTV.name)
    
    if (tvsAPI.length === 0) {
        return console.log("No se encontro en TMDB " + exactTV.name + ", comprueba en postman que exista")
    }
    
    tvsAPI.forEach((tv, index) => console.log(`(${index})`, 'Titulo:', tv.name, 'release_date:', tv.first_air_date,'overview:', tv.overview.substring(0, 300)));
    
    const selectedTVIndex = await askQuestion('Escriba el indice de la nueva serie a guardar:  ')
    console.log('serie seleccionada:', tvsAPI[Number(selectedTVIndex)].name)

    const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${tvsAPI[Number(selectedTVIndex)].id}?api_key=${process.env.TMDB_API_KEY}&language=es&append_to_response=images,videos,content_ratings`);
    const tvshowData = data
    const seasons_details = await Promise.all(tvshowData.seasons.map(async (season) => {
        const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${tvsAPI[Number(selectedTVIndex)].id}/season/${season.season_number}?api_key=${process.env.TMDB_API_KEY}&language=es&region=ES`)
        const seasonToStore = {
            season_number: season.season_number,
            id_season: season.id,
            air_date: data.air_date,
            poster_path: process.env.BASE_IMG_TMDB + data.poster_path,
            episode_count: season.episode_count,
            name: data.name,
            overview: data.overview,
            episodes: data.episodes.map(episode => ({
                air_date: episode.air_date,
                episode_number: episode.episode_number,
                id_episode: episode.id,
                name: episode.name,
                overview: episode.overview,
                runtime: episode.runtime,
                season_number: episode.season_number,
                still_path: process.env.BASE_IMG_TMDB + episode.still_path,
                show_id: episode.show_id,
                videoUrl: null
            }))
        }
        return seasonToStore
    }))
    tvshowData.seasons_details = seasons_details

    const images = (tvshowData.images.posters && tvshowData.images.posters.length > 0) ? tvshowData.images.posters.map(item => process.env.BASE_IMG_TMDB + item.file_path) : [process.env.BASE_IMG_TMDB + tvshowData.poster_path]
    const rating = getRating(tvshowData)

    const tvshow = {
        idTMDB: tvshowData.id,
        name: exactTV.name,
        nameShow: tvshowData.name,
        overview: tvshowData.overview,
        thumbnailUrl: process.env.BASE_IMG_TMDB + tvshowData.poster_path,
        backdropUrl: tvshowData.backdrop_path ? process.env.BASE_IMG_TMDB + tvshowData.backdrop_path : null,
        images,
        created_by: tvshowData.created_by.map(item => item.name),
        genres: tvshowData.genres.map(item => item.name),
        first_air_date: tvshowData.first_air_date,
        last_air_date: tvshowData.last_air_date,
        vote_average: tvshowData.vote_average,
        duration: tvshowData.episode_run_time.length > 0 ? tvshowData.episode_run_time[0] : tvshowData.seasons_details[0].episodes[0].runtime,
        content_rating: rating,
        tagline: tvshowData.tagline,
        trailer: tvshowData.videos.results[0] ? process.env.BASE_URL_VIDEO_YOUTUBE_A + tvshowData.videos.results[0].key + process.env.BASE_URL_VIDEO_YOUTUBE_B : null,
        seasons: tvshowData.seasons_details
    }
    
    const token = generateToken(process.env.ADMIN);

    //console.log(movieDB)

    const res = await axios.put(`${process.env.DOMAIN_SEED}/api/tvshows/${exactTV.idTMDB}`, tvshow, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (res.status === 200) {
        tvsToSave.push(tvshow)
        console.log("Actualizado en DB: " + res.data.name  + " id: " + res.data.id)
    } else {
        console.log("Error al actualizar: " + res.data.name  + " id: " + res.data.id)
        return
    }

    //Save the updated array to a new json file
    fs.writeFile('./tv.json', JSON.stringify(tvsToSave, null, 2)).then(() => {
        console.log('Archivo actualizado con éxito');
        const tvs = require('./tv.json')
        console.log(' Total series despues:', tvs.length);

    }).catch((error) => {
        console.error('Error al escribir el archivo:', error);
    })
}

main();
