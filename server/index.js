const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('hej');
});

app.get('/api/:query', async (req, res) => {
    const answer = await getNewsNumber(req.params.query);
    res.json(answer);
});

app.listen(3000);

const getNewsNumber = async (query) => {
    const apiKey = '73903bc158da44cea3011831d9e322c3';
    const result = await axios.get(`http://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`).then(res => res.data.totalResults);
    return result;
}
