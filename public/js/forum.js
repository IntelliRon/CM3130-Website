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

    $(".sublocationDiv").on("click", function(){
        var locationId = $(this).attr("id");
        $.get("/loadthreads", {locationid : locationId}).done(function(postData){
            var postContainer = $("#PostsContainer");
            $(".postDiv").remove();

            let i = 0;
            for(post of postData["data"]){
                postContainer.append("<div id='" + post["locationID"] + "_" + i + "' class='postDiv'></div>");
                let currentPost = $("#" + post["locationID"] + "_" + i);
                currentPost.append("<div class='postLeftColumn'></div>");
                currentPost.append("<div class='postRightColumn'></div>");

                currentPost.children(".postLeftColumn").append("<h3>" + post["title"] + "</h3>");
                currentPost.children(".postLeftColumn").append("<div class='postDetail'></div>");
                currentPost.children(".postLeftColumn").children(".postDetail").append("<p>Posted By : <span class='postHighlight'>" + post["postUserID"] + "</span> * </p>")
                currentPost.children(".postLeftColumn").children(".postDetail").append("<p>" + post["comments"].length + " replies * </p>")

                if(post["comments"].length > 0){
                    currentPost.children(".postLeftColumn").children(".postDetail").append("<p>Last Reply " + post["postUserID"] + "</p>")
                }

                currentPost.children(".postLeftColumn").append("<p class='postSampleBody'>" + post["content"] + "</p>")

                i++;
            };
        });
    });
})