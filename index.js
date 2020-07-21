const express = require('express');
const fs = require('fs');
const axios = require("axios").default;
const cheerio = require('cheerio');
const puppeteer = require("puppeteer")
const app = express();
const config = require("./config")

// Country list from https://github.com/i-rocky/country-list-js/
const countryNameList = require("./countryNameList")

app.get("/year/:year", async(req, res) => {
    console.log("scraping...")
    const year = req.params.year
    if (!Number(year)) {
        return res.status(400).json({
            error: "Year should be a number."
        })
    } else if (year < 1956 || year > 2019) {
        return res.status(400).json({
            error: "Year should be between 1956 and 2019."
        })
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://eurovisionworld.com/eurovision/${year}`);

    const content = await page.content();
    const $ = cheerio.load(content)

    let table = $('.v_table > tbody')

    const response = {
        year: req.params.year,
        results: []
    }

    table.children("tr").each(function(i) {
            const result = {}
            result.country_code = $(this).attr("id").replace("v_tr_", "").toUpperCase()
            result.country_name = countryNameList[result.country_code]
            result.points = $(this).children("td:nth-child(5)").text().trim()
            result.place = $(this).children("td:nth-child(1)").text()
            if (year > 2015 && !$(this).children("td:nth-child(6)").text().includes("semi")) {
                //$(this).children("td:nth-child(6)").remove("div")
                result.jury_points = $(this).children("td:nth-child(7)").text()
                result.tele_points = $(this).children("td:nth-child(6)").text().slice(0, result.jury_points.length)
            }
            response.results.push(result)
        })
        //fs.writeFileSync(`./years/${req.params.year}.json`, JSON.stringify(response))
    res.json(response)
    await browser.close()
})

app.listen(config.port, () => console.log(`Listening on port ${config.port}`))