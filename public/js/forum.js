$(function(){
    $(".locationArrow").on("click", function(){
        $(".shown").addClass("hidden");
        $(".shown").removeClass("shown");
        $(".up").addClass("down");
        $(".up").removeClass("up");
        
        if($(this).hasClass("down")){
            $(this).addClass("up");
            $(this).removeClass("down");
            $(this).parent().parent().children(".sublocationDiv").removeClass("hidden");
            $(this).parent().parent().children(".sublocationDiv").addClass("shown");
        } else {
            $(this).addClass("down");
            $(this).removeClass("up");
        }
    })
})