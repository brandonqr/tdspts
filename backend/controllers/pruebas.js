const Nightmare = require("nightmare");
var Web = require("../models/web");

class Pruebas {
    constructor() {
        this.nightmare = Nightmare({ show: true });
        this.Empezar();
        this.contadorPaginas = 0;
        this.url = `https://es.kompass.com/easybusiness#/detail/${this.contadorPaginas}/1`;
        this.jsonFinal = {};
        this.numeroDePaginas = 0;
    }
    Empezar() {
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
            .wait("#companies-table-content")
            .wait(5000)
            .click("#company-detail-link-0")
            .wait(".detail-company-selection")
            .evaluate(() => {})
            //.end()
            .then(() => {
                this.DescriptionTab();
            })
            .catch(error => {
                this.contadorPaginas++;
                this.DescriptionTab();
                console.error("Ha petado despues del login, pasando a siguiente pagina");
            });
    }
    DescriptionTab() {
            this.nightmare
                .goto(`https://es.kompass.com/easybusiness#/detail/${this.contadorPaginas}/1`)
                //.type('#search_form_input_homepage', 'github nightmare')
                //.click('#search_button_homepage')
                .inject("js", "node_modules/jquery/dist/jquery.min.js")
                //.wait("div.info:nth-child(2)")
                .wait(".detail-company-selection")
                //div.row-fluid:nth-child(4) > div:nth-child(2) > div:nth-child(1)
                .evaluate(() => {
                    var jsonFinal = {};
                    var nombre = $("#name-company > span:nth-child(1)").text();
                    var telefono = $("div.span3:nth-child(1) > span:nth-child(1) > a:nth-child(1)").text();
                    var direccion_tmp = $("div.info:nth-child(2) > div:nth-child(2) > span:nth-child(1)").text();
                    //var descripciones = $("div.detail-company-selection:nth-child(2) > div:nth-child(2) > div:nth-child(1)").children();
                    var descripcion = $(".activity-text > span:nth-child(1)").text();
                    var cp = direccion_tmp.split(" ")[0];
                    var poblacion = direccion_tmp
                        .replace(cp, "")
                        .trim();
                    var numeroDePaginas = parseInt($(".breadcrumb-companies-count").text());
                    var fuente_id = $(".span4 > span:nth-child(1)")
                        .text()
                        .split(":")[1]
                        .trim();

                    jsonFinal = { nombre, descripcion, telefono, cp, poblacion, fuente_id, numeroDePaginas };
                    return jsonFinal;
                })
                // .end()
                .then(objeto => {
                    this.jsonFinal.nombre = objeto.nombre;
                    this.jsonFinal.descripcion = objeto.descripcion;
                    this.jsonFinal.telefono = objeto.telefono;
                    this.jsonFinal.descripcion = objeto.descripcion;
                    this.jsonFinal.cp = objeto.cp;
                    this.jsonFinal.poblacion = objeto.poblacion;
                    this.jsonFinal.fuente_id = objeto.fuente_id;
                    this.numeroDePaginas = objeto.numeroDePaginas;
                    console.log("////////////////////////////////////////////////////////////////////");
                    console.log(`Descargando Datos ${this.contadorPaginas} de ${this.numeroDePaginas}`);
                    console.log("////////////////////////////////////////////////////////////////////");
                    console.log(this.numeroDePaginas);

                    if (this.contadorPaginas < this.numeroDePaginas) {
                        this.InsertarEnDb();
                        this.contadorPaginas++;
                        this.DescriptionTab();
                    } else {
                        this.Finalizar();
                    }
                })
                .catch(error => {
                    this.contadorPaginas++;
                    this.DescriptionTab();
                    console.error("Ha petado, pasando a siguiente pagina");
                });

        }
        /*
        DatosContacto() {
            this.nightmare
                .goto(this.url)
                .inject('js', 'node_modules/jquery/dist/jquery.min.js')
                .wait(500)
                .evaluate(() => {
                    var jsonFinal = {};
                    var fax = $("div.active:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)").text();
                    var email = $("div.active:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > a:nth-child(1)").text();
                    var web = $("#detail-website-link-0").text();
                    var direcciones = $("td.addressDetail:nth-child(1)").children();
                    var direccion = "";
                    $(direcciones).each(
                        function(index) {
                            direccion += direcciones[index].innerText + " ";
                        });
                    jsonFinal = {
                        fax,
                        email,
                        web,
                        direccion
                    }
                    return jsonFinal;
                })
                //.end()
                .then((objeto) => {
                    this.jsonFinal.fax = objeto.fax;
                    this.jsonFinal.email = objeto.email;
                    this.jsonFinal.web = objeto.web;
                    this.jsonFinal.direccion = objeto.direccion;
                    this.contadorPestanas++;
                    this.CifrasClave();
                })
                .catch(error => {
                    console.error('Search failed:', error);
                })
        }
        CifrasClave() {

            this.nightmare
                .goto(this.url)
                //.type('#search_form_input_homepage', 'github nightmare')
                //.click('#search_button_homepage')
                .inject("js", "node_modules/jquery/dist/jquery.min.js")
                .wait(500)
                .evaluate(() => {
                    var detallesCompania = $("div.active:nth-child(3) > div:nth-child(1)").children();
                    var detalleCompania = {};
                    $(detallesCompania).each(function(index) {
                        if (detallesCompania[index].className == "header with-line") {
                            detalleCompania[detallesCompania[index].innerText] = "";
                        } else {
                            detalleCompania[detallesCompania[index - 1].innerText] = detallesCompania[index].innerText;
                        }
                    });

                    return detalleCompania;
                })
                .end()
                .then(objeto => {
                    this.jsonFinal.detalleCompania = objeto.detalleCompania;
                    this.contadorPestanas++;
                    this.Actividades();
                })
                .catch(error => {
                    console.error("Search failed:", error);
                });
        }
        Actividades() {
            this.nightmare
                .goto(this.url)
                //.type('#search_form_input_homepage', 'github nightmare')
                //.click('#search_button_homepage')
                .inject("js", "node_modules/jquery/dist/jquery.min.js")
                .wait(500)
                .evaluate(() => {
                    var selecciones = $("div.tab-pane:nth-child(4) > div:nth-child(1)").children();
                    var seleccion = {};
                    $(selecciones).each(function(index) {
                        if (selecciones[index].className == "header with-line") {
                            seleccion[selecciones[index].innerText] = "";
                        } else {
                            seleccion[selecciones[index - 1].innerText] = selecciones[index].innerText;
                        }
                    });
                    return seleccion;
                })
                .end()
                .then(objeto => {
                    this.jsonFinal.seleccion = objeto.seleccion;
                    this.contadorPestanas++;
                    this.Dirigentes();

                })
                .catch(error => {
                    console.error("Search failed:", error);
                });
        }
        Dirigentes() {
            this.nightmare
                .goto(this.url)
                //.type('#search_form_input_homepage', 'github nightmare')
                //.click('#search_button_homepage')
                .inject("js", "node_modules/jquery/dist/jquery.min.js")
                .wait(500)
                .evaluate(() => {
                    var dirigentes = $("div.tab-pane:nth-child(6) > div:nth-child(1)").children();
                    var dirigente = {};
                    $(dirigentes).each(function(index) {
                        if (dirigentes[index].className == "header with-line") {
                            dirigente[dirigentes[index].innerText] = "";
                        } else {
                            dirigente[dirigentes[index - 1].innerText] = dirigentes[index].innerText;
                        }
                    });

                    return producto;
                })
                .end()
                .then(objeto => {
                    this.jsonFinal.dirigente = objeto.dirigente;



                    this.contadorPestanas = 0;
                    if (this.contadorPaginas < this.numeroDePaginas) {
                        this.InsertarEnDb();
                        this.contadorPaginas++;
                        this.DescriptionTab();
                    } else {
                        this.Finalizar();
                    }

                })
                .catch(error => {
                    console.error("Search failed:", error);
                });

        }*/
    InsertarEnDB() {
        var web = new Web(this.jsonFinal);
        //comprueba si el Objeto está insertado en la base de datos
        Web.findOne({ fuente_id: this.web.fuente_id }, function(err, webAbuscar) {
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
                console.error("Search failed:", error);
            });
    }

}

module.exports = Pruebas;