const io = require('socket.io')();
const cluster = require('cluster');

let playerDictionary = {} //<name>: player
let playerNames = [];
let nameDicionary = {}; // <id> : <name
let food = {
    x: 50, y: 50
}
/**
 * Inicializa uma conexao com um cliente
 */
io.on('connection', (client) => {
    
    // Otimiza uso de thread dando fork no inicio do processo
    cluster.fork();

    // Evento disparado ao se conectar com um cliente com sucesso
    client.on('subscribeToTime', (name) => {
        nameDicionary[client.id] = name;

        console.log('Cliente esta se inscrevendo com nick' + name);
        const player = {
            id: 1,
            name,
            x: 0,
            y: 0,
            rx: 0,
            ry: 0,
            score: 0
        };

        if(playerNames.indexOf(player.name) === -1) {
            playerDictionary[name] = player;
            playerNames.push(player.name);
        };
        // Emitir evento de sucesso ao estabelecer conexao
        client.emit(name, playerDictionary);
        // Emitir evento para os cliente atualizarem a posicao da comida no tabuleiro
        client.emit('food', food);
        //Emitir para todos os clients a movimentacao desse novo jogador para a posicao inicial
        io.sockets.emit('moved', playerDictionary);
    });

    // Quando o servidor recebe um evento de comida (quando o cliente come uma peca), disparar o evento para todos os outros clientes,
    // Para que estes atualizem seus tabuleiros
    client.on('eat', (message) => {
        food = message;
        io.sockets.emit('food', food);
    });

    // Quando o servidor receber um evento de movimentacao,
    // Notificar os outros clientes para que estes atualizem o tabuleiro
    client.on('move', (message) => {
        playerDictionary[message.name] = message;
        io.sockets.emit('moved', playerDictionary);
    });

    // Manter a conexao viva
    client.on('dontforgetme', (message) => {
        playerDictionary[message.name] = message;
    });

    // Evento que ocorre quando um cliente se desconecta
    client.on('disconnect', (message) => {
        playerDictionary = {};
        playerNames = [];
        nameDicionary = {};
        io.sockets.emit('moved', playerDictionary);
    });
});

const port = 8000;
io.listen(port);
console.log('Escutando na porta: ' + port);
