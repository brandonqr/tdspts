const Nightmare = require("nightmare");
var BniWeb = require("../models/bni");
class Bni {
    constructor() {
        this.nightmare = Nightmare({ show: false });
        this.contador = 7;
    }
    Login() {
        this.nightmare
            .goto("https://www.bniconnectglobal.com/web/open/login")
            .type("#j_username", "invertiaweb")
            .type("#j_password", "20iWeb17")
            .click("#Submit")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .wait(5000)
            .screenshot("algo.png")
            .evaluate(() => {
                return true;

            })
            // .end()
            .then(algo => {
                this.RecorrerUsuarios(`https://www.bniconnectglobal.com/web/secure/networkHome?userId=${this.contador}`);
            })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    RecorrerUsuarios(url) {
        var recorre = new Promise((resolve, reject) => {
            this.nightmare
                .goto(url)
                .inject("js", "node_modules/jquery/dist/jquery.min.js")
                .screenshot("algo1.png")
                .evaluate(() => {
                    var nombre = $("#columnworkingonn > h1:nth-child(1)").text() || "";
                    var objeto = {};
                    if (nombre) {
                        var palabras_clave = "";
                        try {
                            palabras_clave = $("label[for='memberKeywords']").children()[1].innerText || "";
                        } catch (error) {
                            palabras_clave = "";
                        }
                        var empresa = "";
                        try {
                            empresa = $("label[for='memberCompanyName']").children()[1].innerText || "";
                        } catch (error) {
                            empresa = "";
                        }

                        var telefono = "";
                        try {
                            telefono = $("label[for='memberPhoneNumber']").children()[1].innerText || "";
                        } catch (error) {
                            telefono = "";
                        }

                        var direccion = "";
                        try {
                            direccion = $("label[for='memberAddressLine1']").children()[1].innerText || "";
                        } catch (error) {
                            direccion = "";
                        }
                        var web = "";
                        try {
                            web = $("label[for='memberWebsite']").children()[1].innerText || "";
                        } catch (error) {
                            web = "";
                        }

                        var ciudad = "";
                        try {
                            ciudad = $("label[for='memberCity']").children()[1].innerText || "";
                        } catch (error) {
                            ciudad = "";
                        }
                        var pais = "";
                        try {
                            pais = $("label[for='memberCountry']").children()[1].innerText || "";
                        } catch (error) {
                            pais = "";
                        }

                        var cp = "";
                        try {
                            cp = $("label[for='memberZipCode']").children()[1].innerText || "";
                        } catch (error) {
                            cp = "";
                        }
                        var email = "";
                        try {
                            email = $("label[for='memberEmail']").children()[1].innerText || "";
                        } catch (error) {
                            email = "";
                        }
                        var fuente_id = $("#homeUserId").val();
                        objeto = { nombre, email, web, palabras_clave, empresa, telefono, direccion, ciudad, pais, cp, fuente_id };
                    } else {
                        objeto = undefined;
                    }

                    return objeto;

                })
                // .end()
                .then(bni => {
                    if (bni != undefined)
                        resolve(bni) //el ojeto que devuelve despues de scrapear
                    else
                        reject('La web no existe');
                    //               
                })
                .catch(error => {
                    console.error("Search failed:", error);
                });
        })
        recorre.then(objeto => {
            this.InsertarEnDB(objeto);

            this.contador++;
            this.RecorrerUsuarios(`https://www.bniconnectglobal.com/web/secure/networkHome?userId=${this.contador}`);

        }).catch(hapetao => {
            console.log(hapetao + " Redirigiendo al siguiente id");
            this.contador++;
            this.RecorrerUsuarios(`https://www.bniconnectglobal.com/web/secure/networkHome?userId=${this.contador}`);
        });


    }
    InsertarEnDB(producto) {
        var productoModel = new BniWeb(producto);
        //comprueba si el Objeto está insertado en la base de datos
        BniWeb.findOne({ fuente_id: producto.fuente_id }, function(
            err,
            productoABuscar
        ) {
            if (err) {
                return;
            }
            if (!productoABuscar) {
                //Si el objeto no existe, lo inserta en la DB
                productoModel.save((err, producto) => {
                    if (err) {
                        return;
                    }
                    console.log(`Se ha insertado`);
                });
            } else {
                console.log(`ya se encuentra en la base de datos`);
            }

            return true;
        });
    }

}
module.exports = Bni;