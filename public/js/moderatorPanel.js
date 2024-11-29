$(function() {
    $("#SearchButton").on("click", function() {
        if ($("#UserIDInput").val().length === 24) {
            $.post("/moderationUserDetails", 
                {userID : $("#UserIDInput").val()}, 
                function(data) {
                    if (data) {
                        $("#UsersIDText").text(data.UserId);
                        $("#UsersLastNameText").text(data.LastName);

                        if (userLevel > data.UserLevel) {
                            $("#MuteButton").prop("disabled", false);
                        } else {
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
        console.log("I'm running")
        $.post("/muteUser", 
            {userID : $("#UserIDInput").val()}, 
            function(data) {
                console.log(data);
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
});