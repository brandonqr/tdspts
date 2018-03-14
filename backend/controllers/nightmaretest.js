const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: true })

nightmare
    .goto('https://duckduckgo.com')
    .type('#search_form_input_homepage', 'github nightmare')
    .click('#search_button_homepage')
    .inject('js', 'node_modules/jquery/dist/jquery.min.js')
    .wait('#r1-0 a.result__a')
    .evaluate(() => {

    })
    .end()
    .then((objeto) => {

    })
    .catch(error => {
        console.error('Search failed:', error)
    })