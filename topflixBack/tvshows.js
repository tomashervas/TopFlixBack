const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const tvshows = require('./tv.json');
dotenv.config();

const directorioSeries = '/home/tomas/series';
let tvshow = {}

async function getTvShowData(name, tvshows,) {
    if (tvshows.length !== 0) {
        const existingShow = tvshows.find(m => m.name === name);
        if (existingShow) {
            tvshow = existingShow
            return
        }
    }
    const res = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&language=es&query=${name}`);
    const tvshowRes = res.data.results[0];
    console.log('peticion')
    if (!tvshowRes) return
    const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${tvshowRes.id}?api_key=${process.env.TMDB_API_KEY}&language=es&append_to_response=images,videos,content_ratings`);
    const tvshowData = data
    const seasons_details = await Promise.all(tvshowData.seasons.map(async (season) => {
        const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${tvshowRes.id}/season/${season.season_number}?api_key=${process.env.TMDB_API_KEY}&language=es&region=ES`)
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
    return tvshowData
}

function getRating(tv) {
    const isoCodes = ["ES", "DE", "FR", "GB", "US"];
    for (const iso of isoCodes) {
        const content = tv.content_ratings.results.find(item => item.iso_3166_1 === iso);
        if (!content) continue
        return content.rating
    }
}

async function listarElementos(directorio) {
    try {
        const elementos = await fs.readdir(directorio);

        for (const elemento of elementos) {
            const elementoRuta = path.join(directorio, elemento);
            const stats = await fs.stat(elementoRuta);

            if (stats.isDirectory()) {
                if (elemento.toLowerCase().includes('temporada')) {
                    await listarElementos(elementoRuta);
                    continue
                }
                const tv = await getTvShowData(elemento, tvshows);
                if (!tv) {
                    await listarElementos(elementoRuta);
                    continue
                }
                const images = (tv.images.posters && tv.images.posters.length > 0) ? tv.images.posters.map(item => process.env.BASE_IMG_TMDB + item.file_path) : [process.env.BASE_IMG_TMDB + tv.poster_path]
                const rating = getRating(tv)
                tvshow = {
                    idTMDB: tv.id,
                    name: elemento,
                    nameShow: tv.name,
                    overview: tv.overview,
                    thumbnailUrl: process.env.BASE_IMG_TMDB + tv.poster_path,
                    backdropUrl: tv.backdrop_path ? process.env.BASE_IMG_TMDB + tv.backdrop_path : null,
                    images,
                    created_by: tv.created_by.map(item => item.name),
                    genres: tv.genres.map(item => item.name),
                    first_air_date: tv.first_air_date,
                    last_air_date: tv.last_air_date,
                    vote_average: tv.vote_average,
                    duration: tv.episode_run_time.length > 0 ? tv.episode_run_time[0] : tv.seasons_details[0].episodes[0].runtime,
                    content_rating: rating,
                    tagline: tv.tagline,
                    trailer: tv.videos.results[0] ? process.env.BASE_URL_VIDEO_YOUTUBE_A + tv.videos.results[0].key + process.env.BASE_URL_VIDEO_YOUTUBE_B : null,
                    seasons: tv.seasons_details
                }
                console.log('directory: ', tvshow.nameShow)
                //console.log(tvshow);
                //console.log(tvshow.seasons[0].episodes[0])
                // Llama de manera recursiva a la función para procesar el subdirectorio.
                tvshows.push(tvshow)
                await new Promise((resolve) => setTimeout(resolve, 500));
                await listarElementos(elementoRuta);
            } else {
                const regex = /(\d+)x(\d+)/;
                const match = regex.exec(elemento);
                if (!match) continue
                const [_, season, episode] = match
                const vUrl = process.env.BASE_URL_TV + elemento

                tvshows.find(s => s.idTMDB === tvshow.idTMDB).seasons.find(s => s.season_number === +season).episodes.find(e => e.episode_number === +episode).videoUrl = vUrl
                console.log(elemento + ' -> actualizado');

                // tvshow.seasons.find(s => s.season_number === +season).episodes.find(e => e.episode_number === +episode).videoUrl = vUrl

                // console.log(elemento, tvshow.seasons.find(s => s.season_number === +season).episodes.find(e => e.episode_number === +episode));
            }

        }
        //Store in the DB

    } catch (error) {
        console.error('Error', error);
    }
}

listarElementos(directorioSeries).then(() => {
    fs.writeFile('./tv.json', JSON.stringify(tvshows, null, 2)).then(() => {
        console.log('Archivo actualizado con éxito');
    
    }).catch((error) => {
        console.error('Error al escribir el archivo:', error);
    })
})