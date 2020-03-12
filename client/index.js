const loginContainer = document.querySelector('.login_container');
const playersContainer = document.querySelector('.players_container');
const gamesContainer = document.querySelector('.games_container');

const socket = io.connect('http://localhost:2000/');

let players = [];
let games = [];

const savedState = JSON.parse(localStorage.getItem('state'));
let loggedInAs = null;
if (savedState) {
    loggedInAs = savedState.loggedInAs;
}

const saveState = () => {
    localStorage.setItem('state', JSON.stringify({ loggedInAs: loggedInAs }));
};

const renderPlayers = () => {
    if (players.length) {
        let newPlayers = '<h3>All players</h3>';
        players.forEach((player, i) => {
            let currentButton = '';
            if (loggedInAs === null) {
                if (player.logged_in === false) {
                    currentButton = '<button class="button__player button--login">Log in</button>';
                } else if (player.logged_in === true) {
                    currentButton = '';
                }
            } else {
                if (loggedInAs === i) {
                    currentButton = '<button class="button__player button--logout">Log out</button>';
                } else if (player.ongoing_game !== null || players[loggedInAs].ongoing_game !== null) {
                    currentButton = '';
                } else {
                    currentButton = '<button class="button__player button--challenge">Challenge</button>';
                }
            }
            newPlayers += `<div>${player.name} ${player.points} ${currentButton}</div>`;
        });
        playersContainer.innerHTML = newPlayers;
    } else {
        playersContainer.innerHTML = 'There are currently no registered players.'
    }
}

const renderHeader = () => {
    if (loggedInAs) {
        document.querySelector('.player_icon').innerHTML = `Logged in as ${players[loggedInAs].name}`;
    }
}

const renderGames = () => {
        let gamesHtml = '';
        for (let i = 0; i < games.length; i++) {
            if (games[i].player1_id === loggedInAs || games[i].player2_id === loggedInAs) {
                gamesHtml += `
                    <div><h1>${players[games[i].player1_id].name} vs. ${players[games[i].player2_id].name}</h1></div>
                `;
                if (games[i].answers && games[i].answers.length) {
                    games[i].answers.forEach((answer, i) => {
                        gamesHtml += `<div>${players[answer.player].name}: ${answer.text} - ${answer.points}</div>`
                    })
                } else {
                    gamesHtml += `<div>There are no answers yet.</div>`
                }
                const ongoingGame = players[loggedInAs].ongoing_game;
                if (games[ongoingGame].answers && games[ongoingGame].answers.length > 5) {
                    const p1answers = games[ongoingGame].answers.filter((answer, i) => i % 2 === 0);
                    const p2answers = games[ongoingGame].answers.filter((answer, i) => i % 2 !== 0);
                    let p1score = 0;
                    let p2score = 0;
                    for (let i = 0; i < p1answers.length; i++) {
                        p1score += p1answers[i].points;
                    }
                    for (let i = 0; i < p2answers.length; i++) {
                        p2score += p2answers[i].points;
                    }
                    const winner = p1score > p2score ? players[games[ongoingGame].player1_id].name: players[games[ongoingGame].player2_id].name;
                    addScore(p1score, p2score, ongoingGame);
                    gamesHtml += `
                            <div>
                                <div><h3>Total: ${p1score} - ${p2score}</h3></div>
                                <div><h2>Winner: ${winner}</h2></div>
                                <button class="end_game__button">Close game</button
                            </div>
                        `
                } else {
                    if (games[i].player1_id === loggedInAs && games[i].answers.length % 2 === 0) {
                        gamesHtml += `
                            <form>
                                <input placeholder="Your word..."></input>
                                <button class="answer__button">Send</button>
                            </form>
                        `
                    } else if (games[i].player2_id === loggedInAs && games[i].answers.length % 2 !== 0) {
                        gamesHtml += `
                            <form>
                                <input placeholder="Your word..."></input>
                                <button class="answer__button">Send</button>
                            </form>
                        `
                    } else {
                        gamesHtml += `
                            <div>Waiting for your opponent...</div>
                        `
                    }
                }
            }
        }
        gamesContainer.innerHTML = gamesHtml;
    }
    

const createChallenge = (p1, p2) => {
    if (!p1.ongoing_game && !p2.ongoing_game) {
        games.push({player1_id: p1, player2_id: p2, answers: []});
        players[p1].ongoing_game = games.length - 1;
        players[p2].ongoing_game = games.length - 1;
    }
}

const addScore = (p1score, p2score, ongoingGame) => {
    players[games[ongoingGame].player1_id].points += p1score;
    players[games[ongoingGame].player2_id].points += p2score;
}

const addButtonListeners = () => {
    const allPlayerButtons = document.querySelectorAll('.button__player');
    if (allPlayerButtons.length) {
        for (let i = 0; i < allPlayerButtons.length; i++) {
            allPlayerButtons[i].addEventListener('click', (e) => {
                e.preventDefault();
                if (allPlayerButtons[i].classList.contains('button--challenge')) {
                    createChallenge(loggedInAs, i);
                    window.dispatchEvent(new Event('statechange'));
                } else if (allPlayerButtons[i].classList.contains('button--login')) {
                    loggedInAs = i;
                    saveState();
                    players[i].logged_in = true;
                    window.dispatchEvent(new Event('statechange'));
                } else if (allPlayerButtons[i].classList.contains('button--logout')) {
                    loggedInAs = null;
                    saveState();
                    players[i].logged_in = false;
                    window.dispatchEvent(new Event('statechange'));
                }
            });
        }
    }
    if (document.querySelector('.answer__button')) {
        const input = document.querySelector('input');
        document.querySelector('.answer__button').addEventListener('click', (e) => {
            e.preventDefault();
            const ongoingGame = players[loggedInAs].ongoing_game;
            games[ongoingGame].answers.push({player: loggedInAs, text: input.value});
            window.dispatchEvent(new Event('statechange'));
        });
    }
    if (document.querySelector('.end_game__button')) {
        document.querySelector('.end_game__button').addEventListener('click', (e) => {
            e.preventDefault();
            games.splice(players[loggedInAs].ongoing_game, 1);
            //Ordna så att ongoing game nollställs på båda spelare
            // players[loggedInAs].ongoingGame = null;
            // players[loggedInAs].ongoingGame.player2_id]].logged_in = null;
            window.dispatchEvent(new Event('statechange'));
        });
    }
}

const renderHtml = () => {
    renderPlayers();
    renderGames();
    addButtonListeners();
    renderHeader();
}

window.addEventListener('statechange', (e) => {
    console.log('Send: ', { players, games });
    e.preventDefault();
    socket.emit('client send', { players, games });
    renderHtml();
});

socket.on('server send', (data) => {
    players = data.players;
    games = data.games;
    renderHtml();
});
