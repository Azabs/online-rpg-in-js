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
app.use(express.static(path.join(__dirname, 'public_html'))) //Digo que nuesta aplicacion va a usar un modulo de express llamado static para enviar archivos estaticos, lo que se va a enviar es la ruta que le digas, en este caso la carpeta public

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
});