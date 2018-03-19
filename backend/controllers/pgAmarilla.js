const Nightmare = require("nightmare");
var Web = require("../models/web");

class PgAmarilla {
    constructor() {
            this.busqueda = "";
            this.nightmare = Nightmare({ show: true });
            this.data = {};
            this.todosLosLinks = [];
            this.haEntradoEnUrlSugerencia = false;
            this.url = '';
            this.links = [];
            this.contadorObjeto = 0;
            this.contadorTodosLosLinks = 0;
            this.contador = 0;
        }
        //solo busca y obtiene el total de resultado, el numero de paginas, etc
    BuscarEnWeb(busqueda) {
            console.log(`Buscando páginas con la busqueda ${busqueda}`)
            this.busqueda = busqueda;

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
                        nResults,
                        itemsPorPagina,
                        nPaginas,
                        url,
                        urlSugerencia
                    };
                    return data;
                })
                //.end()
                .then(data => {
                    this.data = data;
                    this.ObtenerTodosLosLinks();
                })
                .catch(error => {
                    console.error("Search failed:", error);
                });
        }
        //ObtenerTodosLosLinks hace un push a la variable this.todosLosLinks de todas las url de la busqueda
        //y tambien de todas las urls de sugerencias.
    ObtenerTodosLosLinks() {
        console.log('Obteniendo los links');

        //la variable haEntradoEnUrlSugerencia de activa cuando se ejecuta la funcion ActualizarDatos
        //sólo entro 1 vez en url sugerencia, porque siempre se repite (Error de la web)
        if (!this.haEntradoEnUrlSugerencia) {
            this.GenerarLinks(this.data.url);
            //si hay urlSugerencias, ejecutamos el if de abajo
            if (this.data.urlSugerencia != null) {
                this.ActualizarDatos();
            } else {
                this.ObtenerLinksUrlResultados();
            }

        }
        //saliendo del if ya tendré todos los links de la busqueda en la variable this.todosLosLinks
        //Inicializó el primer url


    }
    ObtenerLinksUrlResultados() {
        this.nightmare
            .goto(this.todosLosLinks[this.contadorTodosLosLinks])
            .wait(".listado-item")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .evaluate(() => {
                //obtener variables globales como nResults,paginas, etc
                var links = [];
                var objeto = $("body").attr("data-analytics");
                objeto = JSON.parse(objeto);
                //llenar
                $(".envio-consulta a").each(function() {
                    links.push($(this).attr("href"));
                });
                return links;
            })
            //.end()
            .then(links => {
                this.links = links;

                this.ObtenerObjeto();
                console.log(`Guardando link ${this.contador+1} de ${this.todosLosLinks.length}`);
                this.contador++;
            })
            .catch(error => {
                console.error("Search failed:", error);
            });

    }
    ObtenerObjeto() {
        this.nightmare
            .goto(this.links[this.contadorObjeto])
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .wait("#bloqueInfo")
            .evaluate(() => {
                var servicios = [];
                var redesSociales = [];
                var objeto = {};
                objeto = $("#toTop")
                    .next()
                    .attr("data-business");
                objeto = JSON.parse(objeto);
                var web = {};

                //obtener los servicios
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
                //obtener el objeto que será insertado en la base de datos
                web.email = objeto.customerMail || "";
                web.actividad = objeto.info.activity || "";
                web.direccion = objeto.info.businessAddress || "";
                web.funte = $(".logo").attr("title");
                web.pais = "España";
                web.estado_mailchimp = 0;
                web.usuario = "ADMIN";
                web.fuente_id = objeto.info.id || "";
                web.nombre = objeto.info.name || "";
                web.telefono = objeto.info.phone || "";
                web.localidad = objeto.location.locality || "";
                web.provincia = objeto.location.province || "";
                web.web = objeto.mapInfo.adWebEstablecimiento || "";
                web.servicios = JSON.stringify(servicios);
                web.redes_sociales = JSON.stringify(redesSociales);

                return web;
            })
            .then(web => {
                this.web = web;
                if (this.contadorTodosLosLinks < this.todosLosLinks.length - 1 || this.todosLosLinks.length == 1) {
                    if (this.contadorObjeto < this.links.length - 1 || this.todosLosLinks.length == 1) {
                        this.InsertarEnDB();

                        if (this.data.nResults != 1) {
                            this.contadorObjeto++;
                            this.ObtenerObjeto();
                        }


                    } else {
                        //reincio la variable this.contadorObjeto a 0, para volver a empezar
                        this.contadorObjeto = 0;
                        //cambiamos a la siguiente url
                        this.contadorTodosLosLinks++;
                        //y vuelvo a ejecutar la función recursivamente
                        this.ObtenerLinksUrlResultados();
                    }
                } else {
                    //finalizar
                    this.Finalizar();
                }
                if (this.data.nResults == 1) {
                    this.Finalizar();
                }

                //insertar en la base de datos
            })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    Finalizar() {
        this.nightmare
            //.goto(this.links[this.contadorLinksObjeto])
            .end()
            .then(() => { console.log('Ha finalizado') })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    InsertarEnDB() {

            var web = new Web(this.web);
            //comprueba si el Objeto está insertado en la base de datos
            Web.findOne({ fuente_id: this.web.fuente_id }, function(
                err,
                webAbuscar
            ) {
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
        //actualiza la varible this.datos
    ActualizarDatos() {
        this.nightmare
            .goto(this.data.urlSugerencia)
            //.type("#what", this.busqueda)
            //.click("#btnFind")
            .wait(".listado-item")
            .inject("js", "node_modules/jquery/dist/jquery.min.js")
            .evaluate(() => {
                this.haEntradoEnUrlSugerencia = true;
                //obtener variables globales como nResults,paginas, etc
                var data = {};
                var objeto = $("body").attr("data-analytics");
                objeto = JSON.parse(objeto);
                var nResults = objeto.search.numResults;
                var itemsPorPagina = objeto.products.length;
                var nPaginas = Math.ceil(parseInt(nResults) / parseInt(itemsPorPagina));
                var url = window.location.href;
                var urlSugerencia = $("div.content:nth-child(2) > p:nth-child(1) > a:nth-child(1)").attr("href");
                data = { nResults, itemsPorPagina, nPaginas, url, urlSugerencia };
                return data;
            })
            //.end()
            .then(data => {
                this.data = data;
                this.GenerarLinks(this.data.url);
                this.ObtenerLinksUrlResultados();
                console.log(`${this.todosLosLinks.length} links obtenidos`)
            })
            .catch(error => {
                console.error("Search failed:", error);
            });
    }
    GenerarLinks(url) {
        // Funciones y variables para poder partir la url, para poder generarlas bien
        var campos = url.split('/');
        var primeraParte = '';
        for (let i = 0; i < campos.length - 1; i++) {
            primeraParte += campos[i] + '/';
        }
        //var numero = campos[campos.length - 1].split("?")[0];
        var segundaParte = campos[campos.length - 1].split("?")[1];
        //for para llenar el array this.todosLosLinks
        for (let j = 1; j < this.data.nPaginas + 1; j++) {
            this.todosLosLinks.push(primeraParte + j + '?' + segundaParte);
        }

    }
}

module.exports = PgAmarilla;