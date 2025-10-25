require( 'dotenv') .config();
const express = require( 'express'); //Framework Express para la creacion del servidor 
const cors = require ('cors'); // Permite solicitudes de otros dominios

const app = express ();

// Middlewares
app.use (cors());
app.use (express.json({limit: '2omb '})); //Recibe datos en formato JSON con limite 
app.use (express.urlencoded({extended: true,limit: '20mb '})); //Recibe datos codificados 

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/rol-permiso', require('./routes/roles_permisos.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));

module.exports = app;


