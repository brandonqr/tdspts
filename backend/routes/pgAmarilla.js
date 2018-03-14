var express = require('express');
var app = express();
//importar el modelo web
var Web = require('../models/web');
//importar clase pgAmarilla
var PgAmarilla = require('../controllers/pgAmarilla');

p = new PgAmarilla();


app.post('/', (req, res, next) => {
    console.log();
    var busqueda = req.body.busqueda;

    p.BuscarEnWeb(busqueda);

    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente - paginas amarillas'
    });
});

module.exports = app;