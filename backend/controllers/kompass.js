const Nightmare = require('nightmare');
var Web = require('../models/web');
class Kompass {
    constructor() {}
    Login() {
        const nightmare = Nightmare({ show: true })

        nightmare
            .goto('https://es.kompass.com/login?error=true')
            .type('#j_username', 'jordi@invertiaweb.com')
            .type('#j_password', '123456789@invertiaWeb')
            .click('#login_submit_button')
            .inject('js', 'node_modules/jquery/dist/jquery.min.js')
            .wait('.accountHomePanel')
            .goto('https://es.kompass.com/easybusiness#/')
            .wait('.result-default-value')
            .click('.criteria-tab-footer')
            .wait('#filter-menu-localisationgroup')
            .click('#filter-menu-localisationgroup')
            .wait('#localisation_SEARCH_TREE_ES')
            .click('#localisation_SEARCH_TREE_ES')
            .click('button.btn:nth-child(1)')
            .wait(3000)
            .screenshot('algo.png')
            // .wait('#companies-table-content')
            .click('#company-detail-link-0')
            .wait('div.detail-company-selection:nth-child(2)')
            .evaluate(() => {
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

            })
            .end()
            .then((objeto) => {
                console.log(objeto)

            })
            .catch(error => {
                console.error('Search failed:', error)
            })
    }


}
module.exports = Kompass;