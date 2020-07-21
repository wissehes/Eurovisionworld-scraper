const express = require('express');
const fs = require('fs');
const axios = require("axios").default;
const cheerio = require('cheerio');
const puppeteer = require("puppeteer")
const app = express();
const config = require("./config")

const countryNameList = require("./countryNameList")

app.get("/year/:year", async(req, res) => {
    console.log("scraping...")
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log(req.params.year)
    await page.goto(`https://eurovisionworld.com/eurovision/${req.params.year}`);

    const content = await page.content();
    const $ = cheerio.load(content)

    let table = $('.v_table > tbody')

    const response = {
        year: req.params.year,
        results: []
    }

    table.children("tr").each(function(i) {
        const countryCode = $(this).attr("id").replace("v_tr_", "").toUpperCase()
        const country = countryNameList[countryCode]
        const points = $(this).children("td:nth-child(5)").text().trim()
        const place = $(this).children("td:nth-child(1)").text()
        response.results.push({
            country_name: country,
            country_code: countryCode,
            points,
            place
        })
    })
    fs.writeFileSync(`./years/${req.params.year}.json`, JSON.stringify(response))
    res.json(response)
    await browser.close()

    res.send("done")
})

app.listen(config.port, () => console.log(`Listening on port ${config.port}`))