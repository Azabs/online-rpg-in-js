const playerSocket = io();//playerSocket es todo el codigo del front-end que van a poder enviar los eventos al servidor

//cargamos la tabla que hace de mapa en el html y el color predeterminado del fondo
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

//Esta matriz ES EL MAPA, lo que significa que si se cambian 
//los números de la matriz, también va a cambiar el mapa en la página.
//0 = el jugador y los proyectiles pueden cruzar esta celda
//1 = el jugador y los proyectiles NO pueden cruzar esta celda
//2 = el jugador no puede cruzar esta celda pero los proyectiles SI
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

//Configuración inicial del jugador
var player = new Player('J'); //creo al jugador

//Envio el jugador recién creado y vació al servidor
playerSocket.emit('player:onConnection', {
    player: player
});
//Recibo los datos del jugador que me dé el servidor, y los datos del mapa
playerSocket.on('server:newPlayerPosition', function(data){
    player = data.player;
    mapArray = data.map;
    GenerateMap();
});

//Aparece el jugador en el mapa
map.children[player.position.x].children[player.position.y].innerHTML = player.name;
map.children[player.position.x].children[player.position.y].style.backgroundColor = player.color;

//Genera las paredes (1) y pozos (2) del mapa
//i = columna
//f = fila
function GenerateMap(){
    for (var i = 0; i < map.children.length; i++) {
        for (var f = 0; f < map.children[i].children.length; f++) {
    
            switch(mapArray[i][f]){
                case 1:
                    map.children[i].children[f].style.backgroundColor = 'black';
                    map.children[i].children[f].innerHTML = '';
                    break;
                case 2:
                    map.children[i].children[f].style.backgroundColor = 'darkred';
                    map.children[i].children[f].innerHTML = '';
                    break;
                case player.name:
                    map.children[i].children[f].style.backgroundColor = player.color;
                    break;
                default:
                    map.children[i].children[f].style.backgroundColor = defaultBgColor;
                    break;
            }

            map.children[i].children[f].innerHTML = mapArray[i][f];
        }
    }
}

//Función que se encarga de que el jugador se mueva
function MovePlayer(direction){

    //Nota: optimizar esto, la forma en la que está escrito hace que se envíen un montón de datos innecesarios
    //al server cuando un jugador se choca con una pared.

    mapArray[player.position.x][player.position.y] = 0;
    map.children[player.position.x].children[player.position.y].innerHTML = '';
    map.children[player.position.x].children[player.position.y].style.backgroundColor = defaultBgColor;

    switch(direction){
        case 'ArrowUp':
            if(player.position.x > 0 && mapArray[player.position.x - 1][player.position.y] == 0)
                player.position.x--;
            break;

        case 'ArrowDown':
            if(player.position.x < map.children.length - 1 && mapArray[player.position.x + 1][player.position.y] == 0)
                player.position.x++;
            break;

        case 'ArrowLeft':
            if(player.position.y > 0 && mapArray[player.position.x][player.position.y - 1] == 0)
                player.position.y--;
            break;

        case 'ArrowRight':
            //Acá estoy suponiendo que el largo del mapa va a ser igual al alto del mapa
            //si estos valores difieron, POR FAVOR, escribí mejor esto.
            if(player.position.y < map.children.length - 1 && mapArray[player.position.x][player.position.y + 1] == 0) 
                player.position.y++;
            break;
    }

    mapArray[player.position.x][player.position.y] = player.name;
    map.children[player.position.x].children[player.position.y].innerHTML = player.name;
    map.children[player.position.x].children[player.position.y].style.backgroundColor = player.color;

    //Envio la posición nueva del jugador al servidor
    playerSocket.emit('player', {
        player: player,
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

