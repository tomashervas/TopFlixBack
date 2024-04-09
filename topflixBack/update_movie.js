const readline = require('readline');
const fs = require('fs').promises;
const movies = require('./movies copy.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log('Total peliculas:', movies.length);
//let filteredMovies= []

const askQuestion = async (question, readline) => {
    return new Promise((resolve, reject) => {
        readline.question(question, (answer) => {
            resolve(answer);
        });
    });
}

const main = async () => {
    const searchedMovie = await askQuestion('Introduce el nombre de la película: ', rl)
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
            const indiceSeleccionado = await askQuestion('Escriba el indice de la película que desea actualizar:  ', rl)
            exactMovie = filteredMovies[Number(indiceSeleccionado)]
            exactMovie && console.log(`Ha seleccionado ${filteredMovies[Number(indiceSeleccionado)].title}`)
            
        } else {
            console.log('No se encontraron coincidencias');
            rl.close();
            return
        }
    }
    rl.close();
    const moviesToSave = movies.filter((movie) => movie.idTMDB !== exactMovie.idTMDB)
    console.log(moviesToSave.length)

    // Save the updated array to a new json file
    fs.writeFile('./movies_pr.json', JSON.stringify(moviesToSave, null, 2)).then(() => {
        console.log('Archivo actualizado con éxito');
        const moviesPR = require('./movies_pr.json')
        console.log(' Total peliculas PR:', moviesPR.length);

    }).catch((error) => {
        console.error('Error al escribir el archivo:', error);
    })
}

main();

// rl.question('Introduce el nombre de la película: ', async (inputUsuario) => {
//     console.log('input:', inputUsuario);
//     const exactMovie = movies.find((movie) => movie.title.toLowerCase().trim() === inputUsuario.toLowerCase().trim());
//     exactMovie && console.log('Pelicula encontrada:', exactMovie.title)
//     if( !exactMovie ) {
//         filteredMovies = movies.filter((movie) => {
//             return  movie.title.toLowerCase().includes(inputUsuario.toLowerCase())
//         })
//         console.log(`Se encontraron ${filteredMovies.length} coincidencias:`);
//         filteredMovies.forEach((movie, index) => {
//             console.log(`(${index}) ${movie.title}`);
//         })
//         rl.question('Escriba el indice de la película:  ', async (indiceSeleccionado) => {
//             filteredMovies[Number(indiceSeleccionado)] && console.log(filteredMovies[Number(indiceSeleccionado)].title)
//         })
//     }
    
//     if (!exactMovie && filteredMovies.length === 0) {
//         console.log('No se encontraron coincidencias');
//     }
//     rl.close();
// })

