var express = require("express");
var app = express();
//importar el modelo web
var Web = require("../models/web");
//importar clase pgAmarilla
var Pruebas = require("../controllers/pruebas");

app.post("/", (req, res, next) => {
    var busqueda = req.body.busqueda;
    req.body;
    p = new Pruebas();

    res.status(200).json({
        ok: true,
        mensaje: "Peticion realizada correctamente - paginas amarillas"
    });
});

module.exports = app;