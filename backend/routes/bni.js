var express = require("express");
var app = express();
//importar clase pgAmarilla
var Bni = require("../controllers/bni");

b = new Bni();

app.post("/", (req, res, next) => {
    b.Login();

    res.status(200).json({
        ok: true,
        mensaje: "Peticion realizada correctamente - BNI"
    });
});

module.exports = app;