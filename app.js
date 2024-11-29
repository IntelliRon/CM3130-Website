/**
 * Placement Hub Server
 * v.0.0.9
 * 
 * 01/11/2024 - 18/11/2024
 */
const VERSION = "v0.0.9";

const CACHE_REFRESH_RATE = 60000; // in milliseconds


var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'a' });
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
const mongo = require('mongodb');

const SERVER_PORT = process.env.PORT | 8080; // Default port to 8080

if (!process.env.DATABASE_USERNAME || !process.env.DATABASE_PASSWORD) {
    console.log("Cannot retrieve database username or password. Please set the database username and password in the file '.env'");
    console.log("Server initialisation stopped");
    return; // Return stops the server
}

const url = "mongodb+srv://" + process.env.DATABASE_USERNAME + ":" + process.env.DATABASE_PASSWORD + "@cluster0.vtqin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new mongo.MongoClient(url, {
    serverApi: {
        version: mongo.ServerApiVersion.v1,
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

// Get a random integer between min (inclusive) and max (exclusive)
function getRandomInt(max=1, min=0) {
    return Math.floor(Math.random() * (max - min) + min);
}

function anonymiseUsers(inputList, ownUserID, ownUserLevel) {
    let userIDs = {};

    let originalPostUserID = inputList.postUserID;
    // Anonymise the posting user ID
    if (ownUserID && inputList.postUserID === ownUserID) {
        inputList.postUserID = "You";
    } else {
        let randomUsername = "user" + getRandomInt(10000, 100);
        userIDs[inputList.postUserID] = randomUsername;
        inputList.postUserID = randomUsername;
    }

    // Moderator can see user IDs
    if (ownUserLevel >= 10) inputList.postUserID += " (" + originalPostUserID + ")";

    /* Anonymise the commenting user IDs by replacing with random usernames.
     * This (and above posting user ID anonymisation) is random each time the page reloads 
     * (e.g. switched to a different thread), so a user cannot be tracked across pages by other users.
     */
    if (inputList.comments) {
        for (let i = 0; i < inputList.comments.length; i++) {
            let originalCommentUserID = inputList.comments[i].commentUserID;
            if (ownUserID && inputList.comments[i].commentUserID === ownUserID) {
                inputList.comments[i].commentUserID = "You";
                if (ownUserLevel >= 10) inputList.comments[i].commentUserID += " (" + originalCommentUserID + ")";
                continue; // Skip to next comment
            }
            if (!userIDs.hasOwnProperty(inputList.comments[i].commentUserID)) {
                randomUsername = "user" + getRandomInt(10000, 100);
                userIDs[inputList.comments[i].commentUserID] = randomUsername;
                inputList.comments[i].commentUserID = randomUsername;
            } else {
                // If the username already exists in the list, then use that username to avoid confusion when reading a thread
                inputList.comments[i].commentUserID = userIDs[inputList.comments[i].commentUserID];
            }
            if (ownUserLevel >= 10) inputList.comments[i].commentUserID += " (" + originalCommentUserID + ")";
        }
    }

    return inputList;
}

function getCachedLocations(callback) {
    // If the cache is outdated, get a new version from the database
    // (to ensure that new locations are actually added)
    if (Date.now() - pLocUpdateTime > CACHE_REFRESH_RATE) {
        pLocUpdateTime = Date.now();
        let cursor = db.collection('Locations').find({})
            if (db.collection('Locations').estimatedDocumentCount({}) === 0) placementLocations = {"Error" : "No locations found"};

            cursor.forEach(element => {
                let area = element.area.replace(" ", "_");
                let location = element.name.replace(" ", "_");
                if (placementLocations.hasOwnProperty(area)) {
                    placementLocations[area][location] = element._id;
                } else {
                    let tempName = {};
                    tempName[location] = element._id;
                    placementLocations[area] = tempName;
                }
            }).then(() => {
                callback(placementLocations);
            });
        
    } else {
        callback(placementLocations);
    }
}

function getDBUser(userID, callback, errorCallback) {
    db.collection('Users').findOne({_id: mongo.ObjectId.createFromHexString(userID)}).then(result => {
        if (!result) {
            if (errorCallback) errorCallback("No result")
                return;
        }
        
        callback(result);

        return;
    });
}

// Tell express to allow use of the public folder for things such as scripts
app.use(express.static('public'));



/* GET Routes */

app.get("/", function(req, res) {
    // Render the homepage
    res.render("pages/index", {loggedin: req.session.loggedin, userLevel: req.session.userLevel});
});


app.get("/forum/placements", function(req, res) {
    getCachedLocations((locations) => {
        if (req.session.loggedin) {
            getDBUser(req.session.userID, (user) => {
                res.render("pages/placementForum", {
                    muted: (user.hasOwnProperty("muted")) ? user.muted : false,
                    loggedin: req.session.loggedin,
                    userLevel: req.session.userLevel,
                    locations: locations, // All locations
                    // Preselect the user's location by their home location
                    preferredLocation: (req.session.loggedin) ? req.session.placementLocationID : null
                });
                return;
            }, e => {
                res.status(404);
                res.render("pages/error404");
            });
        } else {
            res.render("pages/placementForum", {
                muted: true,
                loggedin: req.session.loggedin,
                userLevel: req.session.userLevel,
                locations: locations, // All locations
                // Preselect the user's location by their home location
                preferredLocation: (req.session.loggedin) ? req.session.placementLocationID : null
            });
            return;
        }
    });

    // Render the main forum page here
});

app.get("/forum/accomodation", function(req, res) {
    res.render("pages/dev");
    // Render the main forum page here
});

app.get("/thread", function(req, res) {
    let postID = req.query.postID;

    if (!postID) {
        res.send("Error. PostID not set correctly")
        return;
    }

    db.collection('Threads').findOne({"_id": mongo.ObjectId.createFromHexString(postID)})
    .then(result => {
        if (!result) {
            res.render("pages/error404");
            return;
        }

        if (req.session.loggedin) {
            getDBUser(req.session.userID, (user) => {
                result = anonymiseUsers(result, (req.session.loggedin) ? req.session.userID : null, req.session.userLevel);

                res.render("pages/thread", {
                    muted: (user.hasOwnProperty("muted")) ? user.muted : false, // Could otherwise also be undefined
                    loggedin: req.session.loggedin,
                    userLevel: req.session.userLevel,
                    threadContent: result
                });
                return;
            }, e => {
                res.status(404);
                res.render("pages/error404");
            });
        } else {
            result = anonymiseUsers(result, (req.session.loggedin) ? req.session.userID : null, req.session.userLevel);

            res.render("pages/thread", {
                muted: true,
                loggedin: req.session.loggedin,
                userLevel: req.session.userLevel,
                threadContent: result
            });
            return;
        }
    });
    // Render a thread here (main post, comments, etc.)
})

app.get("/register", function(req, res) {
    res.render("pages/signup", {loggedin: req.session.loggedin, userLevel: req.session.userLevel});
    // Registration page
});

app.get("/profile/edit", function(req, res) {
    res.render("pages/dev");
    // Profile editing page
});

app.get("/moderation", function(req, res) {
    // Admin panel
    if (!req.session.loggedin || req.session.userLevel < 10) {
        res.render("pages/error404");
        res.status(404);
        return;
    }

    res.render("pages/moderatorPanel", {
        loggedin: req.session.loggedin,
        userLevel: req.session.userLevel
    });
});

app.get("/logout", function(req, res) {
    req.session.loggedin = false;
    req.session.email = null;
    req.session.userID = null;
    req.session.userLevel = null;
    req.session.placementLocationID = null;

    res.redirect("/");
});


app.get("/loadthreads", function(req, res) {
    // Sideload all the threads here using pagination and checking location)
    let locationID = req.query.locationid;

    if (!locationID) {
        res.send({"Error": "No locationID provided (must be 24 character hex string)"});
    }

    let page = req.query.page | 1;
    
    let result = db.collection('Threads').aggregate([{
        "$match": {
            "$or": [{"locationID": locationID}]
        }
    }, {
        "$facet" : {
            metadata : [{ "$count": 'totalCount' }],
            data: [{ "$skip": (page - 1) * 10}, { "$limit": 10 }, {"$sort": {"postDateTime": -1}}]
        }
    }]).toArray().then((result) => {
        for (let i = 0; i < result[0].data.length; i++) {
            result[0].data[i] = anonymiseUsers(result[0].data[i], (req.session.loggedin) ? req.session.userID : null, req.session.userLevel);
        }

        res.status(200);
        res.send(result[0]);
        return;
    });
});



/* POST Routes */

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
                req.session.userID = result._id;
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

    let fname = req.body.forename;
    let lname = req.body.surname;
    let email = req.body.universityEmail;
    let pword = req.body.password;

    if (pword !== req.body.confirmPassword) {
        failReason += "password does not match";
        encodeURI(failReason);
        redirectURL += "/register?reason="+failReason;
        res.redirect(redirectURL);
        return;
    }
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
            res.redirect(redirectURL);
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
                db.collection('Users').insertOne({
                    "firstName": fname,
                    "lastName": lname,
                    "email": email,
                    "password": hash,
                    "university": uni,
                    "placementLocationID": null,
                    "userLevel": 1 // Moderation
                }).then((insertResult) => {
                    // Log the new user in
                    req.session.loggedin = true;
                    req.session.email = email;
                    req.session.userLevel = 1;
                    req.session.placementLocationID = insertResult.insertedId;
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
                db.collection('Locations').findOne({"_id": mongo.ObjectId.createFromHexString(result.placementLocationID)}).then(locationResult => {
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
                        id: result._id.toString(),
                        email: result.email,
                        location: locationName
                    });
                });
            } else {
                res.send({
                    firstName: result.firstName, 
                    lastName: result.lastName,
                    id: result._id.toString(),
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

app.post("/moderationUserDetails", function(req, res) {
    if (!req.session.loggedin || req.session.userLevel < 10) {
        res.status(404);
        return;
    }

    let re = /[0-9A-Fa-f]{24}/g;
    let userID = req.body.userID;

    if (!re.test(userID)) return;

    getDBUser(userID, result => {
        let data = {};
        data["UserId"] = result._id.toString();
        data["LastName"] = result.lastName;
        data["muted"] = result.muted || false;
        data["UserLevel"] = result.userLevel;

        if (req.session.userLevel >= 20) {
            // The user is an admin
            data["FirstName"] = result.firstName;
            data["Email"] = result.email;
            data["University"] = result.university;
            if (result.placementLocationID) {
            db.collection('Locations').findOne({"_id" : mongo.ObjectId.createFromHexString(result.placementLocationID)}).then(locationResult => {
                if (!locationResult) {
                    data["Location"] = "Invalid location";
                    data["LocationID"] = -1;
                    res.send(data);
                    return;
                }

                data["Location"] = locationResult.name + " // " + locationResult.area;
                data["LocationID"] = result.placementLocationID;
                res.send(data);
            });
            } else {
                data["Location"] = "Not set";
                data["LocationID"] = -1;
                res.send(data);
            }
        } else {
            res.send(data);
        }
    });
});

app.post("/muteUser", function(req, res) {
    if (!req.session.loggedin || req.session.userLevel < 10) {
        res.status(404);
        return;
    }

    let re = /[0-9A-Fa-f]{24}/g;
    let userID = req.body.userID;

    if (!re.test(userID)) return;

    getDBUser(userID, result => {
        // Toggle muted, or if they were never muted before, mute them
        let muted = !result.muted ?? true;
        
        db.collection('Users').updateOne({"_id" : mongo.ObjectId.createFromHexString(userID)}, {"$set": {muted: muted}}).then(mutedResult => {
            if (!mutedResult) return;

            res.send({muted: muted, success: true});
        });
    });
});

app.post("/adminUserEdit", function(req, res) {
    if (!req.session.loggedin || req.session.userLevel < 20) {
        res.status(404);
        return;
    }

    let re = /[0-9A-Fa-f]{24}/g;
    let userID = req.body.userID;

    if (!re.test(userID)) return;

    getDBUser(userID, result => {
        // Check that the user has a higher level than the user to update
        if (result.userLevel >= req.session.userLevel) return;

        // Update the user
        let lname = req.body.LastName;
        let fname = req.body.FirstName;
        let email = req.body.Email;
        let uni = req.body.University;
        let locationID = req.body.LocationID;
        let userLevel = Number(req.body.UserLevel);

        // Make sure that the user is not giving the other a level higher or equal to themselves
        // This prevents permission bootstrapping
        if (userLevel >= req.session.userLevel) userLevel = req.session.userLevel - 1;

        db.collection('Users').updateOne({"_id" : mongo.ObjectId.createFromHexString(userID)}, 
            {"$set": {
                firstName: fname,
                lastName: lname,
                email: email,
                university: uni,
                placementLocationID: locationID,
                userLevel: userLevel
            }
        }).then(updateResult => {
            if (!updateResult) return;

            res.send({success: true});
        });
    });
});

app.post("/loadLocations", function(req, res) {
    getCachedLocations((locations) => {
        res.send(locations);
    });
});

app.post("/douseredit", function(req, res) {
    res.send("Hmm. You shouldn't be here! This page is still under development");
    // Edit the user details
});

app.post("/sendpost", function(req, res) {
    if (!req.session.loggedin) {
        res.send("Error. User must be logged in");
        return;
    }

    if (req.session.userLevel < 1) {
        res.send("Error. No permission to post");
        return;
    }

    let title = req.body.postTitle;
    let locationID = req.body.locationID;
    let content = req.body.postBody;
    let postUserID = req.session.userID;
    let postDateTime = new Date();

    if (!locationID) {
        res.send("Error. LocationID not set correctly");
        return;
    }

    let insertionObject = {
        "title": title,
        "locationID": locationID,
        "content": content,
        "postUserID": postUserID,
        "postDateTime": postDateTime,
        comments: []
    };
    
    db.collection('Threads').insertOne(insertionObject).then((insertResult) => {
        // Redirect the user to their post once the thread has been created
        res.redirect("/thread?postID="+insertResult.insertedId);
    });

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



// https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
// Cleanup code for when the program finishes.
process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log("Cleaning up")
    };

    if (exitCode || exitCode === 0) console.log("Exit code " + exitCode);
    if (options.exit) {
        console.log("Server stopped");
        client.close(true);
        log_file.close();
        process.exit()
    };
}

// do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));