const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require("puppeteer")
const config = require("../config")

// Country list from https://github.com/i-rocky/country-list-js/
const countryNameList = require("../countryNameList")
const yearLogos = require("../yearLogos.json")
module.exports = async(year) => {
    console.log(`scraping ${year}...`)

    if (!Number(year)) {
        return {
            error: "Year should be a number."
        }
    } else if (year < 1956 || year > 2019) {
        return {
            error: "Year should be between 1956 and 2019."
        }
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://eurovisionworld.com/eurovision/${year}`);

    const content = await page.content();
    const $ = cheerio.load(content)

    let table = $('.v_table > tbody')

    const results = {
        year: year,
        logo: yearLogos[year],
        results: []
    }

    table.children("tr").each(function(i) {
        const result = {
                song: "",
                country_code: "",
                country_name: "",
                place: "",
                points: "",
                qualified: true
            }
            // Split by ":" because title would be: title='Eurovision 2019 Netherlands: Duncan Laurence - "Arcade"'
        const song = $(this).children("td:nth-child(4)").find("a").attr("title").split(":")
            // Remove the first item
        song.shift()
            // Join back if there was a ':' somewhere in the song name
        result.song = song.join(":").trim()

        result.country_code = $(this).attr("id").replace("v_tr_", "").toUpperCase()
        result.country_name = countryNameList[result.country_code]
        result.place = $(this).children("td:nth-child(1)").text()
        result.points = $(this).children("td:nth-child(5)").text().trim()

        if (year > 2015 && !$(this).children("td:nth-child(6)").text().includes("semi")) {
            //$(this).children("td:nth-child(6)").remove("div")
            result.jury_points = $(this).children("td:nth-child(7)").text()
            result.tele_points = $(this).children("td:nth-child(6)").text().slice(0, result.jury_points.length)
            result.running = $(this).children("td:nth-child(8)").text()
        } else if (!$(this).children("td:nth-child(6)").text().includes("semi")) {
            result.running = $(this).children("td:nth-child(6)").text()
        }

        if ($(this).attr("class") == "voting_dnq") {
            result.qualified = false
            $(this).children("td:nth-child(6)").children("a").children(".r600ib").remove()
            result.semi_final = $(this).children("td:nth-child(6)").text()
        }
        results.results.push(result)
    })
    if (config.saveYear) {
        fs.writeFileSync(`./data/years/${year}.json`, JSON.stringify(results))
    }
    await browser.close()
    return results
}