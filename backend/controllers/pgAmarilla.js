const Nightmare = require('nightmare');
var Web = require('../models/web');


class PgAmarilla {
    constructor() {
            this.busqueda = '';
            this.urlPgResultados = '';
            this.pgResultados = {};
            this.contadorLinksPgResultados = 0;
            this.contadorLinksObjeto = 0;
            this.objetoAInsertar = {};
            this.links = [];
        }
        //solo busca y obtiene el total de resultado, el numero de paginas, etc
    BuscarEnWeb(busqueda) {

        var nightmare = Nightmare({ show: false })

        nightmare
            .goto('https://www.paginasamarillas.es/search')
            .type('#what', busqueda)
            .click('#btnFind')
            .wait('.listado-item')
            .inject('js', 'node_modules/jquery/dist/jquery.min.js')
            .evaluate(() => {
                return window.location.href;
            })
            .end()
            .then((urlPgResultados) => {
                this.urlPgResultados = urlPgResultados;
                this.ObtenerLinks();

            })
            .catch(error => {
                console.error('Search failed:', error);
            })
    }
    ObtenerLinks() {
        var nightmare = Nightmare({ show: false })
        nightmare
            .goto(this.urlPgResultados)
            .inject('js', 'node_modules/jquery/dist/jquery.min.js')
            .wait('.listado-item')
            .evaluate(() => {
                var devolver = {};
                var links = [];
                var objeto = $('body').attr('data-analytics');
                objeto = JSON.parse(objeto);
                var nResults = objeto.search.numResults;
                var itemsPorPagina = objeto.products.length;
                var nPaginas = Math.ceil(parseInt(nResults) / parseInt(itemsPorPagina));
                var urlActual = window.location.href;
                //var urlPgResultados = window.location.href;
                var urlPgSiguiente = $('.pagination .fa.icon-flecha-derecha').parent().attr('href');
                var urlSugerencia = $('div.content:nth-child(2) > p:nth-child(1) > a:nth-child(1)').attr('href');

                $('.envio-consulta a').each(function() {
                    links.push($(this).attr('href'));
                });
                devolver = {
                    links,
                    nResults,
                    itemsPorPagina,
                    nPaginas,
                    urlActual,
                    urlPgSiguiente,
                    urlSugerencia
                }
                return devolver;

            })
            .end()
            .then((objeto) => {

                if (objeto.urlPgSiguiente != undefined) {
                    this.urlPgResultados = objeto.urlPgSiguiente;
                    this.links = objeto.links;
                    this.CrearObjeto();

                }
                //solo hay un pagina si se cumple ésta funcion
                else if (this.contadorLinksPgResultados == 0) {
                    this.urlPgResultados = objeto.urlActual;
                    this.links = objeto.links;
                    this.CrearObjeto();
                } else if (objeto.urlSugerencia != undefined) {
                    this.urlPgResultados = objeto.urlSugerencia;
                    this.links = objeto.links;
                    this.CrearObjeto();
                }
                console.log(this.contadorLinksPgResultados);


                //this.urlPgResultados = objeto.urlPgResultados;


            })
            .catch(error => {
                console.error('Search failed:', error);
            })
    }
    CrearObjeto() {
        //console.log(objeto);
        var nightmare = Nightmare({ show: false })

        nightmare
            .goto(this.links[this.contadorLinksObjeto])
            //.type('#search_form_input_homepage', 'github nightmare')
            //.click('#search_button_homepage')
            //.inject('js', 'node_modules/jquery/dist/jquery.min.js')
            .wait('#bloqueInfo')
            .evaluate(() => {

                var servicios = [];
                var redesSociales = [];
                var objeto = {};
                objeto = $('#toTop').next().attr('data-business');
                objeto = JSON.parse(objeto);
                var web = {};

                //obtener los servicios
                $('#bloqueInfo li').each(function() {
                    servicios.push($(this).text());

                });
                //obtener las redes sociales
                $('.socialNetworks li a').each(function() {
                    var socialObj = {};
                    socialObj.nombre = $(this).attr('class');
                    socialObj.link = $(this).attr('href');

                    redesSociales.push(socialObj);

                });
                //obtener el objeto que será insertado en la base de datos
                web.email = objeto.customerMail || '';
                web.actividad = objeto.info.activity || '';
                web.direccion = objeto.info.businessAddress || '';
                web.funte = $('.logo').attr('title');
                web.pais = 'España';
                web.estado_mailchimp = 0;
                web.usuario = 'ADMIN';
                web.fuente_id = objeto.info.id || '';
                web.nombre = objeto.info.name || '';
                web.telefono = objeto.info.phone || '';
                web.localidad = objeto.location.locality || '';
                web.provincia = objeto.location.province || '';
                web.web = objeto.mapInfo.adWebEstablecimiento || '';
                web.servicios = JSON.stringify(servicios);
                web.redes_sociales = JSON.stringify(redesSociales);

                return web;
            })
            .end()
            .then((web) => {

                if (this.contadorLinksObjeto < this.links.length - 1) {
                    this.contadorLinksObjeto++;
                    this.InsertarEnDB(web);
                    this.CrearObjeto();
                } else if (this.contadorLinksObjeto == this.links.length - 1) {
                    this.contadorLinksObjeto = 0;
                    this.contadorLinksPgResultados++;
                    this.ObtenerLinks();
                }
            })
            .catch(error => {
                console.error('Search failed:', error);
            })
    }
    InsertarEnDB(objeto) {
        //console.log(objeto);

        var web = new Web(objeto);
        //comprueba si el Objeto está insertado en la base de datos
        Web.findOne({ fuente_id: objeto.fuente_id }, function(err, webAbuscar) {
            if (err) {
                return;
            }
            if (!webAbuscar) {
                //Si el objeto no existe, lo inserta en la DB
                web.save((err, web) => {
                    if (err) {
                        return;
                    }
                    console.log("Objeto insertado");
                });
            } else {
                console.log("El objeto ya está insertado en la DB");
            }
            return true;
        });
    }
}
module.exports = PgAmarilla;