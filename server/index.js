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

//Current game
app.get('/api/:query', async (req, res) => {
    const answer = await getNewsNumber(req.params.query);
    res.json(answer);
});

io.on('connection', async (socket) => {
    players = JSON.parse(await readFile('db.json'));
    socket.emit('all players', players);
    // setInterval(() => {
    //     socket.emit('all players', players);
    // }, 1000);
    socket.on('player answer', async (updatedPlayersList) => {
        //Calculate points for length of word and trendiness based on API
        players = updatedPlayersList;
        await writeFile('db.json', JSON.stringify(players));
        // socket.emit('all players', players);
    });
});

app.listen(3000);

const getNewsNumber = async (query) => {
    const apiKey = '73903bc158da44cea3011831d9e322c3';
    const result = await axios.get(`http://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`).then(res => res.data.totalResults);
    return result;
}
