const Nightmare = require('nightmare');
var Web = require('../models/web');
class Kompass {
    constructor() {
        this.nightmare = Nightmare({ show: false });
        this.contador = 0;
        this.url = `https://es.kompass.com/easybusiness#/detail/${this.contador}/1`;
        this.totalEmpresas = 0;
    }
    Login() {
        this.nightmare
            .goto("https://es.kompass.com/login?error=true")
            .type("#j_username", "jordi@invertiaweb.com")
            .type("#j_password", "123456789@invertiaWeb")
            .click("#login_submit_button")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .wait(".accountHomePanel")
            .goto("https://es.kompass.com/easybusiness#/")
            .wait(".result-default-value")
            .click(".criteria-tab-footer")
            .wait("#filter-menu-localisationgroup")
            .click("#filter-menu-localisationgroup")
            .wait("#localisation_SEARCH_TREE_ES")
            .click("#localisation_SEARCH_TREE_ES")
            .click("button.btn:nth-child(1)")
            .wait(3000)
            .screenshot("algo.png")
            // .wait('#companies-table-content')
            .click("#company-detail-link-0")
            .wait("div.detail-company-selection:nth-child(2)")
            .evaluate(() => {
                return $(".breadcrumb-companies-count").text();
                /*
                $('#company-tab-link-0').click();
                var jsonFinal = {};
                var nombre = $('#name-company > span:nth-child(1)').text();
                var telefono = $('div.span3:nth-child(1) > span:nth-child(1) > a:nth-child(1)').text();
                var addressLine2 = $('div.info:nth-child(2) > div:nth-child(2) > span:nth-child(1)').text();
                var descripciones = $('div.detail-company-selection:nth-child(2) > div:nth-child(2) > div:nth-child(1)').children();
                var descripcion = {};
                var jsonFinal = {
                    nombre,
                    telefono
                }
                return jsonFinal;
*/
            })
            // .end()
            .then(totalEmpresas => {
                this.totalEmpresas = parseInt(totalEmpresas);
                this.Empezar(this.url);
                this.contador++;
            })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    Empezar(url) {
        //console.log("empezar");
        this.nightmare
            .goto(url)
            .wait("div.active:nth-child(2) > div:nth-child(1)")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .evaluate(() => {
                var telefono = $(
                    "div.active:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)"
                ).text();
                var email = $(
                    "div.active:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > a:nth-child(1)"
                ).text();
                var web = $("#detail-website-link-0").text();
                var localidad_tmp = $(
                    "div.info:nth-child(2) > div:nth-child(2) > span:nth-child(1)"
                ).text();
                var localidad = localidad_tmp.replace(/[^0-9]/g, "");
                var provincia = localidad_tmp.replace(localidad, "").trim();
                var direccion = $("td.addressDetail:nth-child(1) > div:nth-child(1)")
                    .text()
                    .trim();
                var fuente = "Kompass";
                var fuente_id = $("div.span4:nth-child(3) > span:nth-child(1)")
                    .text()
                    .replace(/[^0-9]/g, "");
                var redes_sociales = JSON.stringify([]);
                var servicios = JSON.stringify([]);
                var nombre = $("#name-company > span:nth-child(1)").text();
                var actividad = $(".activity-text")
                    .text()
                    .trim();
                return {
                    telefono,
                    email,
                    web,
                    localidad,
                    provincia,
                    direccion,
                    fuente,
                    fuente_id,
                    redes_sociales,
                    servicios,
                    nombre,
                    actividad
                };
            })
            //.end()
            .then(objeto => {
                this.InsertarEnDB(objeto);
                this.contador++;
                console.log(`Guardando Empresa numero ${this.contador}: ${objeto.nombre} de 189744`)
                this.Empezar(
                    `https://es.kompass.com/easybusiness#/detail/${this.contador}/1`
                );
            })
            .catch(error => {
                if (this.contador < this.totalEmpresas) {
                    this.Empezar(`https://es.kompass.com/easybusiness#/detail/${this.contador}/1`);
                }

                //this.Finalizar();
            });
    }
    InsertarEnDB(web) {
        var web = new Web(web);
        //comprueba si el Objeto está insertado en la base de datos
        Web.findOne({ fuente_id: web.fuente_id }, function(err, webAbuscar) {
            if (err) {
                return;
            }
            if (!webAbuscar) {
                //Si el objeto no existe, lo inserta en la DB
                web.save((err, web) => {
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
    Finalizar() {
        this.nightmare
            //.goto(this.links[this.contadorLinksObjeto])
            .end()
            .then(() => {
                console.log("Ha finalizado");
            })
            .catch(error => {
                console.log("ha petado al finalizar");
                //console.error("Search failed:", error);
            });
    }
}
module.exports = Kompass;