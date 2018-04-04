var Nightmare = require("nightmare");
var Web = require("../models/web");

class PgAmarilla {
    constructor() {
        this.nightmare = Nightmare({ show: true });
        this.contadorObjeto = 0;
        this.urlObjeto = '';
        this.linksResultados = [];
        this.web = {};
        this.urlPuebas = "https://www.paginasamarillas.es/search/bicicleta/all-ma/all-pr/all-is/all-ci/all-ba/all-pu/all-nc/1?what=bicicleta&qc=true";
        this.todosLosLinks = [];
    }
    Inicio(busqueda) {
        this.busqueda = busqueda;
        this.ObtenerUrlPrincipal();

        //this.RecorrerResultados();
        //this.ObtenerObjeto();


    }
    ObtenerUrlPrincipal() {
        this.nightmare
            .goto("https://www.paginasamarillas.es/search")
            .type("#what", this.busqueda)
            .click("#btnFind")
            .wait(".listado-item")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .evaluate(() => {
                //obtener variables globales como nResults,paginas, etc
                var data = {};
                var objeto = $("body").attr("data-analytics");
                objeto = JSON.parse(objeto);
                var nResults = objeto.search.numResults;
                var itemsPorPagina = objeto.products.length;
                var nPaginas = Math.ceil(parseInt(nResults) / parseInt(itemsPorPagina));
                var url = window.location.href;
                var urlSugerencia = $(
                    "div.content:nth-child(2) > p:nth-child(1) > a:nth-child(1)"
                ).attr("href");
                data = {
                    //nResults,
                    //itemsPorPagina,
                    nPaginas,
                    url,
                    urlSugerencia
                };
                return data;
            })
            //.end()
            .then(data => {



                if (data.urlSugerencia != null) {
                    console.log('hay sugerencia');
                    this.ObtenerUrlsDeSugerencia(data.urlSugerencia);

                } else {
                    console.log('no hay sugerencia');
                    this.GenerarLinks(data.url, data.nPaginas);
                }


            })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    GenerarLinks(url, nPaginas) {
        console.log('Generar Links');
        // Funciones y variables para poder partir la url, para poder generarlas bien
        var campos = url.split("/");
        var primeraParte = "";
        for (let i = 0; i < campos.length - 1; i++) {
            primeraParte += campos[i] + "/";
        }
        //var numero = campos[campos.length - 1].split("?")[0];
        var segundaParte = campos[campos.length - 1].split("?")[1];
        //for para llenar el array this.todosLosLinks
        for (let j = 1; j < nPaginas + 1; j++) {
            this.todosLosLinks.push(primeraParte + j + "?" + segundaParte);
        }

    }
    ObtenerUrlsDeSugerencia(url) {
        this.nightmare
            .goto(url)
            .wait(".listado-item")
            .evaluate(() => {
                var data = {};
                var objeto = $("body").attr("data-analytics");
                objeto = JSON.parse(objeto);
                var nResults = objeto.search.numResults;
                var itemsPorPagina = objeto.products.length;
                var nPaginas = Math.ceil(parseInt(nResults) / parseInt(itemsPorPagina));
                var url = window.location.href;
                data = {
                    nPaginas,
                    url
                }
                return data;
            })
            //.end()
            .then(data => {
                this.GenerarLinks(data.url, data.nPaginas);
            })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    RecorrerResultados() {
        this.nightmare
            .goto(this.urlPuebas)
            //.type("#search_form_input_homepage", "github nightmare")
            //.click("#search_button_homepage")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .wait(".central")
            .wait(1000)
            .evaluate(() => {
                var links = [];

                $('div.listado-item .envio-consulta a').each(function() {
                    links.push($(this).attr('href'));
                })
                return links;
            })
            //.end()
            .then(links => {
                this.linksResultados = links;
                this.contadorObjeto = 0;
                this.urlObjeto = this.linksResultados[this.contadorObjeto];
                this.ObtenerObjeto();
            })
            .catch(error => {
                console.error("Search failed:", error);
            });

    }
    ObtenerObjeto() {
        this.nightmare

            .goto(this.urlObjeto)
            .inject("js", "./node_modules/jquery/dist/jquery.min.js")
            .wait('#bloqueInfo')
            .evaluate(() => {
                var final = {};
                var servicios = [];
                var redesSociales = [];
                var objeto = $("#toTop").next().attr("data-business");
                $("#bloqueInfo li").each(function() {
                    servicios.push($(this).text());
                });
                //obtener las redes sociales
                $(".socialNetworks li a").each(function() {
                    var socialObj = {};
                    socialObj.nombre = $(this).attr("class");
                    socialObj.link = $(this).attr("href");

                    redesSociales.push(socialObj);
                });
                redesSociales = JSON.stringify(redesSociales);
                final = {
                    objeto,
                    servicios,
                    redesSociales
                }
                return final;
            })
            //.end()
            .then((data) => {
                data.objeto = JSON.parse(data.objeto);
                var web = {};

                web = {
                    fuente: "Paginas Amarillas",
                    fuente_id: data.objeto.info.id || "",
                    nombre: data.objeto.info.name || "",
                    actividad: data.objeto.info.activity || "",
                    telefono: data.objeto.info.phone || "",
                    email: data.objeto.customerMail || "",
                    web: data.objeto.mapInfo.adWebEstablecimiento || "",
                    provincia: data.objeto.location.province || "",
                    localidad: data.objeto.location.locality || "",
                    pais: "España",
                    direccion: data.objeto.info.businessAddress || "",
                    servicios: data.servicios,
                    redes_sociales: data.redesSociales
                }
                return web;
            })
            .then((web) => {
                this.web = web;
                this.InsertarEnDB();
                this.contadorObjeto++;

                if (this.linksResultados[this.contadorObjeto] != null) {
                    this.urlObjeto = this.linksResultados[this.contadorObjeto];
                    console.log(this.contadorObjeto);
                    //console.log(this.urlObjeto);
                    this.ObtenerObjeto();
                } else {
                    //ir a por el siguiente urlResultados

                }


                // console.log(data);
                //console.log('/////////////////////////////');
            })
            .catch(error => {
                console.error("Search failed:", error);
            });

    }
    InsertarEnDB() {
        var web = new Web(this.web);
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
}

module.exports = PgAmarilla;