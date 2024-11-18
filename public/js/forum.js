$(function(){
    $(".locationArrow").on("click", function(){
        if($(this).hasClass("down")){
            $(".shown").addClass("hidden");
            $(".shown").removeClass("shown");
            $(".up").addClass("down");
            $(".up").removeClass("up");
            $(this).addClass("up");
            $(this).removeClass("down");
            $(this).parent().parent().children(".sublocationDiv").removeClass("hidden");
            $(this).parent().parent().children(".sublocationDiv").addClass("shown");
        } else {
            $(".shown").addClass("hidden");
            $(".shown").removeClass("shown");
            $(".up").addClass("down");
            $(".up").removeClass("up");
        }
    })

    $("#AddPostButton").on("click", function(){
        $("#PostPopupDiv").css("display", "flex")
        $("#CreatePostPopupDiv").css("display", "block")
        $("#DeletePostPopupDiv").css("display", "none")
    })

    $("#CreatePostBackground").on("click", function(){
        $("#PostPopupDiv").css("display", "none")
        $("#CreatePostPopupDiv").css("display", "none")
        $("#DeletePostPopupDiv").css("display", "none")
    })

    $("#CreatePostExitButton").on("click", function(){
        $("#PostPopupDiv").css("display", "none")
        $("#CreatePostPopupDiv").css("display", "none")
        $("#DeletePostPopupDiv").css("display", "none")
    })
})