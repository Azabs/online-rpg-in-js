//Clase para los jugadores
//Esto es una mierda, hay que arreglarla después
class Player{
    
    constructor(name){
        this.name = name;
    }

    color;
    position = {
        x: 0,
        y: 0
    };
}

//Esta matriz ES EL MAPA, lo que significa que si se cambian 
//los números de la matriz, también va a cambiar el mapa en la página.
//0 = el jugador y los proyectiles pueden cruzar esta celda
//1 = el jugador y los proyectiles NO pueden cruzar esta celda
//2 = el jugador no puede cruzar esta celda pero los proyectiles SI
var mapArray=[
    [1,1,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,1],
    [0,0,0,1,1,0,0,0],
    [0,1,0,2,2,0,1,0],
    [0,1,0,2,2,0,1,0],
    [0,0,0,1,1,0,0,0],
    [1,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,1,1],
]

var players = [];//Array donde se guardan los jugadores conectados
var playerSocketID = [];
var connectedPlayers = 0;

//Proceso:
//Se inicia el servidor y se envia todo el contenido del front end al navegador
//Cuando el navegador se inicia tambien se carga el js del socket.io
//El cliente automaticamente se coencta al servidor
//Cuando un cliente se conecta se dispara el evento connection

const path = require('path'); //Modulo de express para usar rutas
const express = require('express'); //Require de express
const app = express(); //express(); devuelve un objeto que guardo en app y este contendra toda la configuracion de mi server

//setting
app.set('port', process.env.PORT || 3000); //Usa el puerto configurado o si no hay uno, usa el puerto 3000

//static files(Envio todos los archivos estaticos del front end al navegador, se llaman estaticos porque por lo general no cambian)
//__dirname devuelve la ruta del proyecto
//path.join sirve para concatenar y agrega una barra / o una contrabarra \ dependiendo de si estas en linux o en windows
app.use(express.static(path.join(__dirname, 'public'))) //Digo que nuesta aplicacion va a usar un modulo de express llamado static para enviar archivos estaticos, lo que se va a enviar es la ruta que le digas, en este caso la carpeta public

//Inicio usando el puerto configurado en app y lo guardo en la variable server una vez inicializado
const server = app.listen(app.get('port'), () => {
    console.log("server on port", app.get('port'));
});

const SocketIO = require('socket.io'); //Requiero el socket.io
//Socket.io necesita un servidor ya creado para hacer la conexion bidireccional
const io = SocketIO(server); //Le doy a SocketIO el server que se inicializo y guardo en la constante server

//Una vez inicializado todo comienzo ahora si con los websockets

//Aca lo que digo basicamente es, "Socket io cuando alguien se conecte ejecuta esta funcion"
io.on('connection', (socket) => { //socket es la variable de chat.js
    console.log('new connection', socket.id);

    //Comienzo a escuchar al evento chat:message, que va a recibir data
    socket.on('chat:message', (data) => { //Este evento se puede llamar desde el js del navegador y puede tener cualquier nombre
        io.sockets.emit('server:message', data); //Emito un evento a todos los sockets conectados con la informacion del mensaje y el username
    });
    //Al recibir el evento chat:typing
    socket.on('chat:typing', (data) => {
        socket.broadcast.emit('chat:typing', data); //Envio los datos a todos exepto a mi
    });

    //Cuando un jugador se conecta
    socket.on('player:onConnection', (data) => {

        var usedName = false;
        var i = 0;

        while(usedName==false && i < players.length){
            if(players[i].name == data.name)
                usedName = true;
            
            i++;
        }

        if(!usedName){
            var player = new Player(data.name);

            playerSocketID[connectedPlayers] = socket.id;
            players[connectedPlayers] = player;
            console.log('Nombre: ' + players[connectedPlayers].name + ' Index: ' + connectedPlayers);
            connectedPlayers++;

            do{
                var x = Math.floor((Math.random() * 7) + 0);
                var y = Math.floor((Math.random() * 7) + 0);
                console.log(x + ' ' + y);
            }while(mapArray[x][y] != 0);

            mapArray[x][y] = player.name;

            player.position.x = x//asigno la posición x inicial
            player.position.y = y; //asigno la posición y inicial
            player.color = 'rgb(' + Math.floor((Math.random() * 255) + 0) + ',' + Math.floor((Math.random() * 255) + 0) + ',' + Math.floor((Math.random() * 255) + 0) + ')'; //asigno el color del jugador

            //Emito un mensaje en el chat a todos los sockets, con el nombre del jugador
            io.sockets.emit('server:message', {
                username: '<i style="color:' + player.color + '">' + player.name + '</i>', 
                message: '<i>Se ha conectado</i>'
            });

            io.sockets.emit('server:createNewPlayer', {
                index: connectedPlayers,
                players: players,
                map: mapArray
            });
        }
        else{
            //Decirle al cliente que elija otro nombre
            console.log('Elegí otro nombre que ese ya está usado');
        }
    })

    //Cuando un jugador se mueve
    socket.on('player:move', (data) => {

        players[data.index].position.x = data.position.x;
        players[data.index].position.y = data.position.y;

        //se actualiza la posición nueva del jugador en la matriz
        mapArray = data.map;

        io.sockets.emit('server:newPlayerPosition', {
            map: mapArray
        });
    })

    socket.on("disconnect", () => {

        for(var i = 0 ; i < playerSocketID.length - 1 ; i++){
            if(socket.id == playerSocketID[i]){
                mapArray[players[i].position.x][players[i].position.y] = 0;
                players[i] = null;
            }
        }

        io.sockets.emit('server:playerDisconnected', {
            players: players,
            map: mapArray
        });
        console.log('se desconectó ' + socket.id);
    });
});