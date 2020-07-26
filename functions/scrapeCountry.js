const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require("puppeteer")
const config = require("../config")

// Country list from https://github.com/i-rocky/country-list-js/
const countryNameList = require("../countryNameList")
module.exports = async(country) => {
    console.log(`scraping ${country} results...`)

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://eurovisionworld.com/eurovision/${country}`);

    const content = await page.content();
    const $ = cheerio.load(content)

    let table = $('.v_table > tbody')
    let infoTable = $('.voting_stat > tbody')

    const results = {
        country: `${country.charAt(0).toUpperCase()}${country.slice(1)}`,
        country_code: Object.keys(countryNameList).find(code => countryNameList[code].toLowerCase() === country.toLowerCase()),
        participations: 0,
        victories: 0,
        came_last: 0,
        nul_points: 0,
        results: []
    }

    infoTable.children("tr").each(function(i) {
        if (i == 0) {
            // number of participations
            results.participations = $(this).children("td:nth-child(2)").text()

        } else if (i == 1) {
            // number of victories
            const victories = $(this).children("td:nth-child(2)").text()
            if (victories !== "none")
                results.victories = victories

        } else if (i == 2) {
            // number of times it had came last
            const cameLast = $(this).children("td:nth-child(2)").text()
            if (cameLast !== 'never')
                results.came_last = cameLast

        } else if (i == 3) {
            // number of times it had received 0 points
            const nulPoints = $(this).children("td:nth-child(2)").text()
            if (nulPoints !== 'never')
                results.nul_points = nulPoints
        }
    })

    table.children("tr").each(function(i) {
        const result = {
            year: "",
            song: "",
            place: "",
            points: "",
            qualification: "",
            qualified: true
        }
        result.year = $(this).children("td:nth-child(1)").text()
            // Split by ":" because title would be: title='Eurovision 2019 Netherlands: Duncan Laurence - "Arcade"'
        const song = $(this).children("td:nth-child(2)").find("a").attr("title").split(":")
            // Remove the first item
        song.shift()
            // Join back if there was a ':' somewhere in the song name
        result.song = song.join(":").trim()
        if ($(this).attr("class") == "voting_dnq") {
            result.qualified = false;
            result.qualification = $(this).children("td:nth-child(5)").text()
            result.place = result.qualification;
            result.points = "-"
            results.results.push(result)
        } else {
            result.place = $(this).children("td:nth-child(3)").text().replace("#", "")
            result.points = $(this).children("td:nth-child(4)").text().trim()
            result.qualification = $(this).children("td:nth-child(5)").text().trim()
            results.results.push(result)
        }
    })
    if (config.saveCountry) {
        fs.writeFileSync(`./data/countries/${country}.json`, JSON.stringify(results))
    }
    await browser.close()
    return results
}