let cachedLocations = [];

$(function() {
    // Locations cache
    let cacheUpdateTime = 0;

    let selectedUserLocationID;

    $("#SearchButton").on("click", function() {
        if ($("#UserIDInput").val().length === 24) {
            $.post("/moderationUserDetails", 
                {userID : $("#UserIDInput").val()}, 
                function(data) {
                    if (data) {
                        $("#UsersIDText").text(data.UserId);
                        $("#UsersLastNameText").text(data.LastName);
                        $("#UsersFirstNameText").text(data.FirstName);
                        $("#UsersEmailModerationText").text(data.Email);
                        $("#UsersUniversityText").text(data.University);
                        $("#UsersLocationModerationText").text(data.Location);
                        $("#UserLevelText").text(data.UserLevel);
                        
                        if (userLevel > data.UserLevel) {
                            $("#EditButton").prop("disabled", false);
                            $("#MuteButton").prop("disabled", false);
                            $("#LastNameInput").val(data.LastName);
                            $("#FirstNameInput").val(data.FirstName);
                            $("#EmailInput").val(data.Email);
                            $("#UniversityInput").val(data.University);
                            $("#LocationInput").val(data.Location);
                            selectedUserLocationID = data.LocationID;
                            loadLocations();
                            $("#UserLevelInput").val(data.UserLevel);
                        } else {
                            $("#EditButton").prop("disabled", true);
                            $("#MuteButton").prop("disabled", true);
                        }

                        if (data.muted) {
                            $("#MuteButton").text("unmute user");
                        }
                        
                        $("#ModerationResultSection").css("display", "inherit");
                    } else {
                        $("#ErrorNameText").text("No result");
                        $("#ErrorDescriptionText").text("Please make sure that you have entered a valid ID in the textbox and search again.");
                        $("#ErrorSection").css("display", "inherit");
                    }
                }
            );
        }
    });

    $("#MuteButton").on("click", function() {
        $.post("/muteUser", 
            {userID : $("#UserIDInput").val()}, 
            function(data) {
                if (data) { // If there is data, then it was successful
                    if (data.muted) {
                        $("#MuteButton").text("unmute user");
                    } else {
                        $("#MuteButton").text("mute user");
                    }
                } else {
                    $("#ErrorNameText").text("Unsuccessful operation");
                    $("#ErrorDescriptionText").text("Unfortunately we were not able to un-/mute this user for you. Please try again or contact an administrator.");
                    $("#ErrorSection").css("display", "inherit");
                }
            }
        );
    });

    $("#EditButton").on("click", function() {
        // Add edit functionality and edit server route
        if ($("#EditButton").text() == "edit user") {
            // Load the locations
            loadLocations();

            $("#UserDetailsSection").css("display", "none");
            $("#UserEditSection").css("display", "initial");
            $("#EditButton").text("save user");
        } else {
            // Send the updated data to the server
            $.post("/adminUserEdit", {
                userID : $("#UsersIDText").text(),
                LastName: $("#LastNameInput").val(),
                FirstName: $("#FirstNameInput").val(),
                Email: $("#EmailInput").val(),
                University: $("#UniversityInput").val(),
                LocationID: $("#LocationInput").val(),
                UserLevel: $("#UserLevelInput").val()
            }, function(data) {
                if (data) { // If there is data, then it was successful
                    $("#UserDetailsSection").css("display", "initial");
                    $("#UserEditSection").css("display", "none");
                    $("#EditButton").text("edit user");
                } else {
                    $("#ErrorNameText").text("Unsuccessful operation");
                    $("#ErrorDescriptionText").text("Unfortunately we were not able to un-/mute this user for you. Please try again or contact an administrator.");
                    $("#ErrorSection").css("display", "inherit");
                }
            });
        }
    });

    function loadLocations() {
        if (Date.now() - cacheUpdateTime >= 30000) { // Update cache after min 30 seconds
            // Use a route to sideload locations

            $.post("/loadLocations", function(data) {
                if (!data) return;
                cachedLocations = data;

                for (let location in cachedLocations) {
                    for (let sublocation in cachedLocations[location]) {
                        let locationID = cachedLocations[location][sublocation];
                        if (locationID === selectedUserLocationID) {
                            $('#LocationInput').append($("<option></option>", {value : locationID}).attr("selected", "selected")
                            .text(sublocation + " // " + location));
                        } else {
                            $('#LocationInput').append($("<option></option>", {value : locationID})
                            .text(sublocation + " // " + location));
                        }
                    }
                }
            });
        } else {
            for (let location in cachedLocations) {
                for (let sublocation in cachedLocations) {
                    let locationID = cachedLocations[location][sublocation];
                    if (locationID === selectedUserLocationID) {
                        $('#LocationInput').append($('<option>', { 
                            value: locationID,
                            text : sublocation + " // " + location,
                            selected: "selected"
                        }));
                    } else {
                        $('#LocationInput').append($('<option>', { 
                            value: locationID,
                            text : sublocation + " // " + location
                        }));
                    }
                }
            }
        }
    }
});