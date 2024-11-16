/**
 * Placement Hub Server
 * v.0.0.3
 * 
 * 01/11/2024 - 15/11/2024
 */
const VERSION = "v0.0.3";

const CACHE_REFRESH_RATE = 60000; // in milliseconds


var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + 'logs/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

// Override the console.log method to write to a debug file instead
console.log = function(d) {
  log_file.write(new Date().toISOString() + " - " + util.format(d) + '\n');
  log_stdout.write(new Date().toISOString() + " - " + util.format(d) + '\n');
};
console.error = console.log;



// Print some debug info
console.log("Server is initialising...");
console.log("Running on server version " + VERSION);

// Get all environment variables
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const SERVER_PORT = process.env.PORT | 8080; // Default port to 8080

if (!process.env.DATABASE_USERNAME || !process.env.DATABASE_PASSWORD) {
    console.log("Cannot retrieve database username or password. Please set the database username and password in the file '.env'");
    console.log("Server initialisation stopped");
    return; // Return stops the server
}

const url = "mongodb+srv://" + process.env.DATABASE_USERNAME + ":" + process.env.DATABASE_PASSWORD + "@cluster0.vtqin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(url, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const dbname = "PlacementHub";

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

var app = express();

const http = require("http").Server(app);

const sessionMiddleware = session({
    secret: "19e36b9d4a99ed91b79306ae3999e651ee7d6c3f0a189c2445c6544bbae8c6bf",
    resave: true,
    saveUninitialized: true,
    maxAge: 2592000000
});

app.use(sessionMiddleware);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set("view engine", "ejs");

// Placement location caching
var pLocUpdateTime = 0;
var placementLocations = {} // {areaName: {locationName: locationID}}

var db;

connectDB();

async function connectDB() {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to DB server");
    db = client.db(dbname);

    http.listen(SERVER_PORT, function() {
        console.log("Server is running on port " + SERVER_PORT);
    });
}

// Tell express to allow use of the public folder for things such as scripts
app.use(express.static('public'));



/* GET Routes */

app.get("/", function(req, res) {
    // Render the homepage
    res.render("pages/index", {loggedin: req.session.loggedin});
});


app.get("/forum/placements", function(req, res) {
    // If the cache is outdated, get a new version from the database
    // (to ensure that new locations are actually added)
    if (Date.now() - pLocUpdateTime > CACHE_REFRESH_RATE) {
        pLocUpdateTime = Date.now();
        let cursor = db.collection('Locations').find({})
            if (db.collection('Locations').estimatedDocumentCount({}) === 0) placementLocations = {"Error" : "No locations found"};

            cursor.forEach(element => {
                if (placementLocations.hasOwnProperty(element.area)) {
                    let tempName = {};
                    tempName[element.name] = element._id;
                    placementLocations[element.area].append(tempName);
                } else {
                    let tempName = {};
                    tempName[element.name] = element._id;
                    placementLocations[element.area] = tempName;
                }
            }).then(() => {
                // {areaName: {locationName: locationID}}
                res.render("pages/placementForum", {
                    loggedin: req.session.loggedin,
                    locations: placementLocations, // All locations
                    // Preselect the user's location by their home location
                    preferredLocation: (req.session.loggedin) ? req.session.placementLocationID : null
                });
            });
        
    } else {
        res.render("pages/placementForum", {
            loggedin: req.session.loggedin,
            locations: placementLocations, // All locations
            // Preselect the user's location by their home location
            preferredLocation: (req.session.loggedin) ? req.session.placementLocationID : null
        });
    }

    // Render the main forum page here
});

app.get("/forum/accomodation", function(req, res) {
    res.render("pages/dev");
    // Render the main forum page here
});

app.get("/thread", function(req, res) {
    res.render("pages/dev");
    // Render a thread here (main post, comments, etc.)
})

app.get("/register", function(req, res) {
    res.render("pages/signup");
    // Registration page
});

app.get("/profile/edit", function(req, res) {
    res.render("pages/dev");
    // Profile editing page
});



/* POST Routes */

app.post("/loadthreads", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Sideload all the threads here (remember to use pagination. Don't load ALL posts at once)
});

app.post("/dologin", function(req, res) {
    // Validate the login for the user and reroute them back to home

    // Get the email and password from the request
    let email = req.body.email;
    let pword = req.body.password;

    // Search the database to find a user with this name
    db.collection('Users').findOne({"email": email}).then(result => {
        let failReason = "";
        let redirectURL = "";

        if (!result) {
            failReason += "username or password is incorrect";
            encodeURI(failReason)
            redirectURL += "/?reason="+failReason;
            res.redirect(redirectURL);
            return;
        }

        // Check if the password is the same
        bcrypt.compare(pword, result.password, function(err, checkPassword) {
            if (checkPassword) { // Log the user in, if the password is correct
                req.session.loggedin = true;
                req.session.email = email;
                req.session.userLevel = result.userLevel;
                req.session.placementLocationID = result.placementLocationID;
                res.redirect('/');
            } else { // The password is wrong
                failReason += "username or password is incorrect";
                encodeURI(failReason);
                redirectURL += "/?reason="+failReason;
                res.redirect(redirectURL);

                return;
            }
        });
    });
});

app.post("/doregister", function(req, res) {
    // Register the new user and log them in. Reroute them to the profile page

    let fname = req.body.first_name;
    let lname = req.body.last_name;
    let email = req.body.email;
    let pword = req.body.password;
    let uni = req.body.university;
    
    db.collection('Users').findOne({
        "email": email
    }).then(result => {
        let failReason = "";
        let redirectURL = "";

        if (result) { // The user already exists
            failReason += "already exists";
            encodeURI(failReason);
            redirectURL += "/register?reason="+failReason;
        } else {
            // 9 rounds of salting should be enough
            bcrypt.hash(pword, 9, function(err, hash) {
                if (err) {
                    console.log(err);
                    res.status(500);
                    res.send("500: Internal server error");
                    return;
                }

                // Store the new user in the database
                let result = db.collection('Users').insertOne({
                    "firstName": fname,
                    "lastName": lname,
                    "email": email,
                    "password": hash,
                    "university": uni,
                    "placementLocationID": null,
                    "userLevel": 1 // Moderation
                }).then((err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(500);
                        res.send("500: Internal server error");
                        return;
                    }

                    // Log the new user in
                    req.session.loggedin = true;
                    req.session.email = email;
                    req.session.userLevel = 1;
                    req.session.placementLocationID = null;
                    res.redirect("/");
                });
            });
        }
    });
});

app.post("/profile", function(req, res) {
    // Get the user profile information
    if (!req.session.loggedin) {
        res.send({"Error": 404, "Description": "The user is not logged in, therefore profile information cannot be retrieved"});
        return;
    }

    // Find the user
    db.collection('Users').findOne({"email": req.session.email}).then(result => {
        if (!result) {
            res.send({Error: 404, Description: "The user does not exist anymore, therefore profile information cannot be retrieved"});
            return;
        }

        // Find the user's associated placement location
        let locationName = "Not set";

        if (result.hasOwnProperty("placementLocationID")) {
            if (result.placementLocationID !== undefined && result.placementLocationID !== null) {
                db.collection('Locations').findOne({"_id": result.placementLocationID}).then(locationResult => {
                    if (locationResult) {
                        locationName = locationResult.name + " // " + locationResult.area;
                    } else {
                        // If there is no result from the database, then the user set a location at some point that is not valid anymore
                        locationName = "Invalid location. Please change"
                    }

                    // Send the processed user information to the user
                    res.send({
                        firstName: result.firstName, 
                        lastName: result.lastName, 
                        email: result.email,
                        location: locationName
                    });
                });
            } else {
                res.send({
                    firstName: result.firstName, 
                    lastName: result.lastName, 
                    email: result.email,
                    location: locationName
                });
            }
        } else {
            // Send the processed user information to the user
            res.send({
                firstName: result.firstName, 
                lastName: result.lastName, 
                email: result.email,
                location: locationName
            });
        }
    });
});

app.post("/douseredit", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Edit the user details
});

app.post("/sendpost", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Send the new post to the server
});

app.post("/sendreaction", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Send the new reaction for a post to the server
});

app.post("/sendreply", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Send the new reply for a post to the server
});

/* Error handling */
app.use(function(req, res) {
    res.status(404);
    res.render("pages/error404");
})
