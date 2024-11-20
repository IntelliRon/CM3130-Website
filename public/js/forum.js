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
            console.log(JSON.stringify(postData));
            console.log(postData[0])

            var postContainer = $("#PostsContainer");
            $(".postDiv").remove();

            let i = 0;
            for(post in postData){
                let data = post["data"];
                console.log(post);
                postContainer.append("<div id='" + data["locationID"] + "_" + i + "' class='postDiv'></div>");
                let currentPost = $("#" + data["locationID"] + "_" + i);
                currentPost.append("<div class='postLeftColumn'></div>");
                currentPost.append("<div class='postRightColumn'></div>");

                currentPost.children(".postLeftColumn").append("<h3>" + data["title"] + "</h3>");
                currentPost.children(".postLeftColumn").append("<div class='postDetail'></div>");
                currentPost.children(".postLeftColumn").children(".postDetail").append("<p>Posted By : " + data["postUserID"] + " * </p>")
                currentPost.children(".postLeftColumn").children(".postDetail").append("<p>" + data["comments"].length + " replies * </p>")

                if(post["comments"].length > 0){
                    currentPost.children(".postLeftColumn").children(".postDetail").append("<p>Last Reply " + data["postUserID"] + "</p>")
                }
                if(post["content"].length > 50){
                    currentPost.children(".postLeftColumn").append("<p class='postSampleBody'>" + data["content"].splice(0, 50) + "...</p>")
                } else {
                    currentPost.children(".postLeftColumn").append("<p class='postSampleBody'>" + data["content"] + "</p>")
                }

                i++;
            };
        });
    });
})