$(function(){
    $(".NavPanelButtonDiv").on("click", function(){
        if($("#NavSideBar").hasClass("closed")){
            $("#NavSideBar").removeClass("closed")
            $("#NavSideBar").addClass("opened")

        } else {
            $("#NavSideBar").removeClass("opened")
            $("#NavSideBar").addClass("closed")
        }
    })

    $("#SidebarProfileIcon").on("click", function(){
        $.post("/profile", function(data){
            console.log(data)
            $("#UsersNameText").text(data.firstName + " " + data.lastName);
            $("#UsersEmailText").text(data.email);
            $("#UsersLocationText").text(data.location);
        });
        $("#UserDiv").css("display", "flex")
        $("#NavSideBar").removeClass("opened")
        $("#NavSideBar").addClass("closed")
    })

    $("#UserDivBackgroundDiv").on("click", function(){
        $("#UserDiv").css("display", "none")
    })
})