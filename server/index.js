const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let words = ['hej', 'kul', 'bra'];

server.listen(2000);

//Current game
app.get('/api/:query', async (req, res) => {
    const answer = await getNewsNumber(req.params.query);
    res.json(answer);
});

io.on('connection', function (socket) {
    setInterval(() => {
        socket.emit('current score', words);
    }, 1000);
    socket.on('player answer', function (answer) {
        //Calculate points för length of word and trendiness based on API
        words.push(answer);
        const jsonWords = JSON.stringify(words);
        fs.appendFile('db.json', jsonWords, () => console.log('Hej') );
    });
});

app.listen(3000);

const getNewsNumber = async (query) => {
    const apiKey = '73903bc158da44cea3011831d9e322c3';
    const result = await axios.get(`http://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`).then(res => res.data.totalResults);
    return result;
}
