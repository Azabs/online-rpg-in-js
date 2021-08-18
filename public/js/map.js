const playerSocket = io();//playerSocket es todo el codigo del front-end que van a poder enviar los eventos al servidor

//cargamos la tabla que hace de mapa en el html y el color predeterminado del fondo

var playerNameForm = document.getElementById('name-form');
var playerName = document.getElementById('name');
const map = document.getElementById('map').firstElementChild;
const defaultBgColor = 'rgba(0, 0, 0, 0)';

//Clase para los jugadores
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

//Esto es un placeholder para antes de que el cliente reciba el mapa desde el servidor
var mapArray=[
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
]

var players = [];//Esta variable guarda la posición de todos los jugadores creados
var playerIndex = null;//Es la posición en la que está el jugador que está controlando este cliente en la variable de arriba
var connectedPlayers;

playerNameForm.addEventListener('submit', function(e){
    e.preventDefault();
    //Envio el nombre del jugador al servidor para comprobar que no esté en uso
    playerSocket.emit('player:onConnection', {
        name: playerName.value
    });

})

//Recibo los datos del jugador que se acaba de crear
playerSocket.on('server:createNewPlayer', function(data){
    if (playerIndex == null){
        playerIndex = data.index - 1;
        playerNameForm.style.display = 'none';
    }
    
    connectedPlayers = data.index;
    players = data.players;
    mapArray = data.map;

    console.log('nombre: ' + players[playerIndex].name + ' index: ' + playerIndex);

    //Aparece el jugador en el mapa
    map.children[players[playerIndex].position.x].children[players[playerIndex].position.y].innerHTML = players[playerIndex].name;
    map.children[players[playerIndex].position.x].children[players[playerIndex].position.y].style.backgroundColor = players[playerIndex].color;

    GenerateMap();
});

//Recibo los datos del mapa
playerSocket.on('server:newPlayerPosition', function(data){
    mapArray = data.map;

    GenerateMap();
});

//Recibo los datos de quién se desconecta
playerSocket.on('server:playerDisconnected', function(data){
    //Hay que hacer que esto funcione
});

//Genera las paredes (1) y pozos (2) del mapa
//i = columna
//f = fila
function GenerateMap(){
    for (var i = 0; i < map.children.length; i++) { 
        for (var f = 0; f < map.children[i].children.length; f++) {
    
            //Esto es para los colores del mapa
            switch(mapArray[i][f]){
                case 1:
                    map.children[i].children[f].style.backgroundColor = 'black';
                    map.children[i].children[f].innerHTML = '';
                    break;
                case 2:
                    map.children[i].children[f].style.backgroundColor = 'darkred';
                    map.children[i].children[f].innerHTML = '';
                    break;
                default:
                    map.children[i].children[f].style.backgroundColor = defaultBgColor;
                    break;
            }

            //Esto es para los colores de los jugadores
            var j = 0;
            do{
                if(players[j].name == mapArray[i][f])
                    map.children[i].children[f].style.backgroundColor = players[j].color;
                
                j++;
            }while(j < players.length);

            map.children[i].children[f].innerHTML = mapArray[i][f];
        }
    }
}

//Función que se encarga de que el jugador se mueva
function MovePlayer(direction){

    //Nota: optimizar esto, la forma en la que está escrito hace que se envíen un montón de datos innecesarios
    //al server cuando un jugador se choca con una pared.

    mapArray[players[playerIndex].position.x][players[playerIndex].position.y] = 0;
    map.children[players[playerIndex].position.x].children[players[playerIndex].position.y].innerHTML = '';
    map.children[players[playerIndex].position.x].children[players[playerIndex].position.y].style.backgroundColor = defaultBgColor;

    switch(direction){
        case 'ArrowUp':
            if(players[playerIndex].position.x > 0 && mapArray[players[playerIndex].position.x - 1][players[playerIndex].position.y] == 0)
                players[playerIndex].position.x--;
            break;

        case 'ArrowDown':
            if(players[playerIndex].position.x < map.children.length - 1 && mapArray[players[playerIndex].position.x + 1][players[playerIndex].position.y] == 0)
                players[playerIndex].position.x++;
            break;

        case 'ArrowLeft':
            if(players[playerIndex].position.y > 0 && mapArray[players[playerIndex].position.x][players[playerIndex].position.y - 1] == 0)
                players[playerIndex].position.y--;
            break;

        case 'ArrowRight':
            //Acá estoy suponiendo que el largo del mapa va a ser igual al alto del mapa
            //si estos valores difieron, POR FAVOR, escribí mejor esto.
            if(players[playerIndex].position.y < map.children.length - 1 && mapArray[players[playerIndex].position.x][players[playerIndex].position.y + 1] == 0) 
                players[playerIndex].position.y++;
            break;
    }

    mapArray[players[playerIndex].position.x][players[playerIndex].position.y] = players[playerIndex].name;
    map.children[players[playerIndex].position.x].children[players[playerIndex].position.y].innerHTML = players[playerIndex].name;
    map.children[players[playerIndex].position.x].children[players[playerIndex].position.y].style.backgroundColor = players[playerIndex].color;

    //Envio la posición nueva del jugador al servidor
    playerSocket.emit('player:move', {
        position: {
            x: players[playerIndex].position.x,
            y: players[playerIndex].position.y,
        },
        index: playerIndex,
        map: mapArray
    });

    GenerateMap();
}

//Un simple listener que se fija que tecla apretás y la pasa a la función de movimiento
window.addEventListener('keydown', (e) => {
    if(e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowLeft' || e.key == 'ArrowRight'){
        e.preventDefault();
        MovePlayer(e.key);
    }
});

