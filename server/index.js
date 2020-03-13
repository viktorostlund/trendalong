const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

server.listen(2000);
let players;
let games;

// app.get('/api/:query', async (req, res) => {
//     const answer = await getNewsNumber(req.params.query);
//     res.json(answer);
// });

io.on('connection', async (socket) => {
    players = JSON.parse(await readFile('players.json'));
    games = JSON.parse(await readFile('games.json'));
    socket.emit('server send', { players, games });
    socket.on('client send', async (updatedData) => {
        const dataToSave = updatedData;
        for (let i = 0; i < dataToSave.games.length; i++) {
            const game = dataToSave.games[i];
            const lastAnswer = game.answers[game.answers.length - 1];
            if (!lastAnswer.points) {
                const apiKey = '73903bc158da44cea3011831d9e322c3';
                const points = await axios.get(`http://newsapi.org/v2/everything?q=${lastAnswer.text}&apiKey=${apiKey}`).then(res => res.data.totalResults);
                dataToSave.games[i].answers[dataToSave.games[i].answers.length - 1].points = Math.ceil(points / 30000) + lastAnswer.text.length;
            }
        }
        await writeFile('players.json', JSON.stringify(dataToSave.players));
        await writeFile('games.json', JSON.stringify(dataToSave.games));
    });
});

// app.listen(3000);

// const getNewsNumber = async (query) => {
//     const apiKey = '73903bc158da44cea3011831d9e322c3';
//     const result = await axios.get(`http://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`).then(res => res.data.totalResults);
//     return result;
// }
