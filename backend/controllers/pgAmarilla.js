var Nightmare = require("nightmare");
var Web = require("../models/web");
class PgAmarilla {
    constructor() {
        this.nightmare = Nightmare({ show: false });

    }
}

module.exports = PgAmarilla;