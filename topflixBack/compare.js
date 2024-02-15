const fs = require('fs').promises;
const movies = require('./movies.json');
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
        }

        } catch (error) {
            console.error('Error', error);
        }
    }
    
    listarPeliculas(directorioPeliculas);