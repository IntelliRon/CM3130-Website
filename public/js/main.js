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
})