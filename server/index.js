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

//Current game
app.get('/api/:query', async (req, res) => {
    const answer = await getNewsNumber(req.params.query);
    res.json(answer);
});

io.on('connection', async (socket) => {
    players = JSON.parse(await readFile('players.json'));
    games = JSON.parse(await readFile('games.json'));
    socket.emit('server send', { players, games });
    socket.on('client answer', async (updatedData) => {
        updatedData.games.forEach(game => {
            console.log(game.answers);
        });
        //Calculate points for length of word and trendiness based on API
        await writeFile('players.json', JSON.stringify(updatedData.players));
        await writeFile('games.json', JSON.stringify(updatedData.games));
    });
});

app.listen(3000);

const getNewsNumber = async (query) => {
    const apiKey = '73903bc158da44cea3011831d9e322c3';
    const result = await axios.get(`http://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`).then(res => res.data.totalResults);
    return result;
}
