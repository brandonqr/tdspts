var Nightmare = require("nightmare");
var Web = require("../models/web");
class PgAmarilla {
    constructor() {
        this.nightmare = Nightmare({ show: false });
        this.todosLosLinks = [];
        this.contadorResultados = 0;
        this.contadorObjetos = 0;
        this.linksObjetos = [];
        this.web = {};
    }
    Busqueda(busqueda) {
        this.busqueda = busqueda;
        console.log("Incio");
        var that = this;
        this.nightmare
            .goto("https://www.paginasamarillas.es/")
            .type("#whatInput", busqueda)
            .click("#submitBtn")
            .wait(".listado-item")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .evaluate(() => {
                //Obtener urlPaginaActual y urlPaginaSugerencia.
                var url = window.location.href;
                var urlSugerencia = $(
                    "div.content:nth-child(2) > p:nth-child(1) > a:nth-child(1)"
                ).attr("href");
                var objeto = $("body").attr("data-analytics");
                return { url, urlSugerencia };
            })
            //.end()
            .then(objeto => {
                //ObtenerNPaginasUrl(objeto.url).then((value) => { console.log(value) });
                //ObtenerNPaginasUrl(objeto.urlSugerencia).then((value) => { console.log(value) });
                var url = "";
                if (objeto.urlSugerencia != null) {
                    Promise.all([
                        this.ObtenerNPaginasUrl(objeto.url),
                        this.ObtenerNPaginasUrl(objeto.urlSugerencia)
                    ]).then(function(arrayOfResults) {
                        for (let i = 0; i < arrayOfResults.length; i++) {
                            that.GenerarLinks(
                                arrayOfResults[i].url,
                                arrayOfResults[i].nPaginas
                            );
                        }
                        that.RecorrerResultados(
                            that.todosLosLinks[that.contadorResultados]
                        );
                    });
                } else {
                    this.ObtenerNPaginasUrl(objeto.url).then(result => {
                        this.GenerarLinks(result.url, result.nPaginas);
                        this.RecorrerResultados(
                            this.todosLosLinks[this.contadorResultados]
                        );
                    });
                }

                //console.log(objeto)
            })
            .catch(error => {
                //  console.error("Search failed:", error);
                console.log("ha petado en busqueda");
            });
    }
    ObtenerNPaginasUrl(url) {
        console.log("Obtener N Paginas Url");
        return new Promise((resolve, reject) => {
            this.nightmare
                .goto(url)
                .wait(".listado-item")
                .inject("js", "node_modules/jquery/dist/jquery.min.js")
                .evaluate(() => {
                    var objeto = $("body").attr("data-analytics");
                    objeto = JSON.parse(objeto);
                    var nResults = objeto.search.numResults;
                    var itemsPorPagina = objeto.products.length;
                    var nPaginas = Math.ceil(
                        parseInt(nResults) / parseInt(itemsPorPagina)
                    );
                    var url = window.location.href;
                    return { nPaginas, url };
                })
                // .end()
                .then(objeto => {
                    resolve(objeto);
                    console.log(objeto);
                })
                .catch(error => {
                    reject("Ha ocurrido un error en obtener Npaginas url");
                    //console.log("ha petado en busqueda");
                    //console.error("Search failed:", error);
                });
        });
    }
    GenerarLinks(url, nPaginas) {
        console.log("Generar Links");
        console.log(`url ${url} y nPaginas: ${nPaginas}`);

        // Funciones y variables para poder partir la url, para poder generarlas bien
        var campos = url.split("/");
        var primeraParte = "";
        for (var i = 0; i < campos.length - 1; i++) {
            primeraParte += campos[i] + "/";
        }
        //var numero = campos[campos.length - 1].split("?")[0];
        var segundaParte = campos[campos.length - 1].split("?")[1];
        //for para llenar el array this.todosLosLinks
        for (var j = 1; j < nPaginas + 1; j++) {
            this.todosLosLinks.push(primeraParte + j + "?" + segundaParte);
        }
    }
    RecorrerResultados(url) {
        console.log(
            `Descargando  ${this.contadorResultados} de  ${this.todosLosLinks.length}`
        );
        this.nightmare
            .goto(url)
            //.type("#search_form_input_homepage", "github nightmare")
            //.click("#search_button_homepage")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .wait(".central")
            .wait(1000)
            .evaluate(() => {
                var links = [];

                $("div.listado-item .envio-consulta a").each(function() {
                    links.push($(this).attr("href"));
                });
                return links;
            })
            //.end()
            .then(links => {
                this.linksObjetos = links;
                /*
                                                this.linksResultados = links;
                                                this.contadorObjeto = 0;
                                                this.urlObjeto = this.linksResultados[this.contadorObjeto];
                                                */
                //insertar

                if (this.linksObjetos[this.contadorObjetos] != null) {
                    this.ObtenerObjeto(this.linksObjetos[this.contadorObjetos]);
                    this.contadorResultados++;
                    //

                    //this.ObtenerObjeto();
                } else {
                    this.Finalizar();
                }
            })
            .catch(error => {
                //console.log("ha petado en Recorrer Resultados");
                this.Finalizar();

                //console.error("Search failed:", error);
            });
    }
    ObtenerObjeto(url) {
        this.nightmare

            .goto(url)
            .inject("js", "./node_modules/jquery/dist/jquery.min.js")
            .wait("#bloqueInfo")
            .evaluate(() => {
                var servicios = [];
                var redesSociales = [];
                var objeto = $("#toTop")
                    .next()
                    .attr("data-business");

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

                return { objeto, servicios, redesSociales };
            })
            //.end()
            .then(data => {
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
                };
                return web;
            })
            .then(web => {
                web = web;
                //console.log(links[contadorObjetos]);
                console.log(`Guardando Empresa ${web.nombre}`);
                this.InsertarEnDB(web);

                // InsertarEnDB();
                this.contadorObjetos++;

                if (this.linksObjetos[this.contadorObjetos] != null) {
                    //console.log(this.urlObjeto);
                    this.ObtenerObjeto(this.linksObjetos[this.contadorObjetos]);
                } else {
                    //ir a por el siguiente urlResultados
                    this.contadorObjetos = 0;
                    this.RecorrerResultados(this.todosLosLinks[this.contadorResultados]);
                }
            })
            .catch(error => {
                console.log("ha petado en obtener objeto, volviendo a iniciar");
                this.todosLosLinks = [];
                this.Busqueda(this.busqueda);


                // console.error("Search failed:", error);
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

module.exports = PgAmarilla;