var express = require("express");

var axios = require("axios");
var cheerio = require("cheerio");
var db = require("../models");


var router = express.Router();

// Import the model (cat.js) to use its database functions.
var cat = require("../models/cat.js");

// Create all our routes and set up logic within those routes where required.
router.get("/", function (req, res) {
  cat.all(function (data) {
    var hbsObject = {
      cats: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

router.post("/api/cats", function (req, res) {
  cat.create([
    "name", "sleepy"
  ], [
    req.body.name, req.body.sleepy
  ], function (result) {
    // Send back the ID of the new quote
    res.json({ id: result.insertId });
  });
});

router.put("/api/cats/:id", function (req, res) {
  var condition = "id = " + req.params.id;

  console.log("condition", condition);

  cat.update({
    sleepy: req.body.sleepy
  }, condition, function (result) {
    if (result.changedRows == 0) {
      // If no rows were changed, then the ID must not exist, so 404
      return res.status(404).end();
    } else {
      res.status(200).end();
    }
  });
});

router.delete("/api/cats/:id", function (req, res) {
  var condition = "id = " + req.params.id;

  cat.delete(condition, function (result) {
    if (result.affectedRows == 0) {
      // If no rows were changed, then the ID must not exist, so 404
      return res.status(404).end();
    } else {
      res.status(200).end();
    }
  });
});

// --------------------------------------------------------------------------------------------
router.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.echojs.com/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");


      db.Article.findOne({ title: result.title }) //products[i].title
        .then(results => { //update products with results
          console.log(results)
          if (!results) {
            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
              .then(function (dbArticle) {
                // View the added result in the console
                console.log(dbArticle);
              })
              .catch(function (err) {
                // If an error occurred, log it
                console.log(err);
              });
          }
        });


    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

router.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({}).lean()
    .then(function (dbArticle) {
      console.log("we got an object!", dbArticle)
      // If we were able to successfully find Articles, send them back to the client
      res.render("articles", { dbArticle });
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.send(err);
    });
});

// Export routes for server.js to use.
module.exports = router;
