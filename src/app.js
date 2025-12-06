// src/app.js - VERSIÓN COMPLETA Y FUNCIONAL
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));


app.use('/api/fichas', require('./routes/fichas.routes'));
app.use('/api/programas', require('./routes/programas.routes'));
app.use('/api/instructores', require('./routes/instructor.routes'));
app.use('/api', require('./routes/sabana.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/rol-permiso', require('./routes/roles_permisos.routes'));
app.use('/api/pdf', require('./routes/pdf.routes'));
app.use('/api/planeaciones', require('./routes/planeaciones.routes')); // ✅ AHORA SÍ FUNCIONA

app.get('/api/health', (req, res) => {
  res.json({ 
    message: '✅ Backend funcionando correctamente', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

module.exports = app;