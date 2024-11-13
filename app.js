var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

// Override the console.log method to write to a debug file instead
console.log = function(d) { //
  log_file.write(new Date().toISOString() + " - " + util.format(d) + '\n');
  log_stdout.write(new Date().toISOString() + " - " + util.format(d) + '\n');
};
console.error = console.log;




console.log("Server is initialising...")

require('dotenv').config();

const SERVER_PORT = process.env.PORT | 8080;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;
const { MongoClient, ServerApiVersion } = require('mongodb'); // npm install mongodb
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

app.get("/", /*async*/ function(req, res) {
    res.render("pages/index");

    /* DATABASE TESTING */

    // col = db.collection("comments");
    // console.log("Got collection");
    // result = await col.findOne();
    // res.send(result);
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
    res.render("pages/dev");
    // Registration page
});

app.get("/profile", function(req, res) {
    res.render("pages/dev");
    // Profile viewing page
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
        reason += "username or password is incorrect";
        encodeURI(reason)
        redirectURL += "/login?reason="+reason;
        res.redirect(redirectURL);
        return;
    }

    // Check if the password is the same
    bcrypt.compare(pword, result.password, function(err, checkPassword) {
        if (checkPassword) { // Log the user in, if the password is correct
            req.session.loggedin = true;
            req.session.uname = uname;
            req.session.userLevel = result.userLevel;
            res.redirect('/profile');
        } else { // The password is wrong
            reason += "username or password is incorrect";
            encodeURI(reason);
            redirectURL += "/?reason="+reason;
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
        reason += "already exists";
        encodeURI(reason);
        redirectURL += "/register?reason="+reason;
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
            req.session.uname = uname;
            req.session.userLevel = 1;
            res.redirect("/profile");
        });
    }
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


// app.listen(8080);
// console.log("Server is running on port 8080");