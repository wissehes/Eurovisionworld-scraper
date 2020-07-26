const express = require('express');
const fs = require('fs');
const axios = require("axios").default;
const cheerio = require('cheerio');
const puppeteer = require("puppeteer")
const app = express();
const config = require("./config")

// Country list from https://github.com/i-rocky/country-list-js/
const countryNameList = require("./countryNameList")

const scrapeYear = require("./functions/scrapeYear")
const scrapeCountry = require("./functions/scrapeCountry")

app.get("/scrape2000s", async(req, res) => {
    const years = [
        2000,
        2001,
        2002,
        2003,
        2004,
        2005,
        2006,
        2007,
        2008,
        2009,
        2010,
        2011,
        2012,
        2013,
        2014,
        2015,
        2016,
        2017,
        2018,
        2019
    ]
    for (i in years) {
        const year = years[i]
        await scrapeYear(year)
    }
})

app.get("/country/:country", async(req, res) => {
    const c = await scrapeCountry(req.params.country)
    res.json(c)
})

app.get("/year/:year", async(req, res) => {
    const y = await scrapeYear(req.params.year)
    res.json(y)
})



app.listen(config.port, () => console.log(`Listening on port ${config.port}`))