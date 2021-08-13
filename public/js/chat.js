//Cuando se require el modulo socket.io.js este crea la variable io que es accesible desde todo el html
const socket = io(); //Socket es todo el codigo del front-end que van a poder enviar los eventos al servidor

//Elementos del html
let chatForm = document.getElementById('chat-form');
let message = document.getElementById('message');
let username = document.getElementById('username');
let btn = document.getElementById('send');
let output = document.getElementById('output');
let actions = document.getElementById('actions');

var executionTime = 0;

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    //Si hay un mensaje y un nombre de usuario, entonces se envían los datos
    if(message.value && username.value){
        //Envio al servidor a traves de un evento llamado chat:message(puede tener cualquier nombre)
        //Los datos del mensaje y el username, los envio en un objeto porque solo se puede enviar una cosa
        socket.emit('chat:message', {
            message: message.value,
            username: username.value
        });

        message.value = '';
        executionTime = performance.now();
    }
});

//Estoy escuchando al evento chat:message que sera enviado desde el servidor
socket.on('server:message', function(data) {
    executionTime = (performance.now() - executionTime);
    console.log("Total execution time= " + executionTime + " ms");
    actions.innerHTML = ''; //Elimino el "Escribiendo mensaje"
    //Imprimo en pantalla dentro de una etiqueta P los datos recibidos  
    output.innerHTML += `<p>
    <strong>${data.username}: </strong>${data.message}
    </p>`;
});

message.addEventListener('keypress', function() { //Si estas escribiendo
    socket.emit('chat:typing', username.value); //Envio tu nombre al servidor en un evento
});

//Si escucho el evento chat typing
socket.on('chat:typing', function(data) {
    actions.innerHTML = `<p><em>${data} is writting</em></p>`;
});