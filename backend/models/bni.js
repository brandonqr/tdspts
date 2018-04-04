var mongose = require("mongoose");
var Schema = mongose.Schema;

var bniSchema = new Schema({
    nombre: { type: String },
    palabras_clave: { type: String },
    empresa: { type: String },
    telefono: { type: String },
    direccion: { type: String },
    ciudad: { type: String },
    pais: { type: String },
    cp: { type: String },
    fuente_id: { type: Number }
});
module.exports = mongose.model("BniSchema", bniSchema);