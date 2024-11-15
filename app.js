/**
 * Placement Hub Server
 * v.0.0.1
 * 
 * 01/11/2024 - 15/11/2024
 */
const VERSION = "v0.0.1";


var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
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

const SERVER_PORT = process.env.PORT | 8080; // Default port to 8080

// Get all environment variables
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb'); // npm install mongodb

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
const dbname = "sample_mflix";

const express = require('express'); //npm install express
const bcrypt = require('bcrypt'); // npm install bcrypt

var app = express();

const http = require("http").Server(app); // npm install http

app.set("view engine", "ejs");

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
    res.render("pages/index");
});

app.get("/forum/placements", function(req, res) {
    res.render("pages/dev");
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

app.post("/dologin", async function(req, res) {
    // Validate the login for the user and reroute them (from the homepage to the profile page)

    // Get the email and password from the request
    let email = req.body.email;
    let pword = req.body.password;

    // Search the database to find a user with this name
    let result = await db.collection('Users').findOne({"email": email});

    let failReason = "";
    let redirectURL = "";

    if (!result) {
        failReason += "username or password is incorrect";
        encodeURI(failReason)
        redirectURL += "/login?reason="+failReason;
        res.redirect(redirectURL);
        return;
    }

    // Check if the password is the same
    bcrypt.compare(pword, result.password, function(err, checkPassword) {
        if (checkPassword) { // Log the user in, if the password is correct
            req.session.loggedin = true;
            req.session.email = email;
            req.session.userLevel = result.userLevel;
            res.redirect('/profile');
        } else { // The password is wrong
            failReason += "username or password is incorrect";
            encodeURI(failReason);
            redirectURL += "/?reason="+failReason;
            res.redirect(redirectURL);

            return;
        }
    });
});

app.post("/doregister", async function(req, res) {
    // Register the new user and log them in. Reroute them to the profile page

    let fname = req.body.first_name;
    let lname = req.body.last_name;
    let email = req.body.email;
    let pword = req.body.password;
    let uni = req.body.university;
    
    let result = await db.collection('Users').findOne({
        "email": email
    });

    let failReason = "";
    let redirectURL = "";

    if (result) { // The user already exists
        failReason += "already exists";
        encodeURI(failReason);
        redirectURL += "/register?reason="+failReason;
    } else {
        // 9 rounds of salting should be enough
        bcrypt.hash(pword, 9, async function(err, hash) {
            if (err) {
                console.log(err);
                res.status(500);
                res.send("500: Internal server error");
                return;
            }

            // Store the new user in the database
            try {
                let result = await db.collection('Users').insertOne({
                    "firstName": fname,
                    "lastName": lname,
                    "email": email,
                    "password": hash,
                    "university": uni,
                    "placementLocationID": null,
                    "userLevel": 1 // Moderation
                });
            } catch (err) {
                console.log(err);
                res.status(500);
                res.send("500: Internal server error");
                return;
            }

            // Log the new user in
            req.session.loggedin = true;
            req.session.email = email;
            req.session.userLevel = 1;
            res.redirect("/profile");
        });
    }
});

app.post("/profile", async function(req, res) {
    // Get the user profile information
    res.send("Hmm. You shouldn't be here! This page is still under development");

    if (!req.session.loggedin) {
        res.send({"Error": 404, "Description": "The user is not logged in, therefore profile information cannot be retrieved"});
        return;
    }

    // Find the user
    let result = await db.collection('Users').findOne({"email": req.session.email});

    if (!result) {
        res.send({Error: 404, Description: "The user does not exist anymore, therefore profile information cannot be retrieved"});
        return;
    }

    // Find the user's associated placement location
    let locationName = "Not set";

    if (result.hasOwnProperty("location")) {
        if (result.location !== undefined && result.location !== null) {
            let locationResult = await db.collection('Locations').findOne({"_id": result.location});

            if (locationResult) {
                locationName = locationResult.name + " // " + locationResult.area;
            } else {
                // If there is no result from the database, then the user set a location at some point that is not valid anymore
                locationName = "Invalid location. Please change"
            }
        }
    }
    
    // Send the processed user information to the user
    res.send({
        firstName: result.firstName, 
        lastName: result.lastName, 
        email: result.email,
        location: locationName
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
