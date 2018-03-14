var express = require('express');
var app = express();
//importar el modelo web
var Web = require('../models/web');
//importar clase pgAmarilla
var Kompass = require('../controllers/kompass');

k = new Kompass();


app.post('/', (req, res, next) => {

    k.Login();

    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente - paginas amarillas'
    });
});

module.exports = app;