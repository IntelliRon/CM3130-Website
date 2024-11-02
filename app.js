console.log("Server is initialising...")

const SERVER_PORT = 8080;
const { MongoClient, ServerApiVersion } = require('mongodb'); // npm install mongodb
const url = "mongodb+srv://gulpsabook:siVC2Hx2xDMcfotx@cluster0.vtqin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(url, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const dbname = "sample_mflix";

const express = require('express'); //npm install express

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


/* GET Routes */

app.get("/", /*async*/ function(req, res) {
    res.render("pages/dev");

    /* DATABASE TESTING */

    // col = db.collection("comments");
    // console.log("Got collection");
    // result = await col.findOne();
    // res.send(result);
});

app.get("/forum", function(req, res) {
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

app.post("/dologin", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Validate the login for the user and reroute them (from the homepage to the forum page)
});

app.post("/doregister", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Register the new user
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



// This route is only here for dev. Please remove once done
app.post("/reload-git", async function(req, res) {
    res.status(202).send("Accepted");
    console.log("Starting pull");
    require('simple-git')().pull((err, update) => {
        if (update && update.summary.changes) {
            require("touch")("./tmp/restart.txt", null, ()=>{});
            console.log("Touched restart.txt");
            console.log("Done with pull");
        }
    });
});



/* Error handling */
app.use(function(req, res) {
    res.status(404);
    res.render("pages/error404");
})


// app.listen(8080);
// console.log("Server is running on port 8080");