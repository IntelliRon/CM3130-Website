$(function(){
    $(".locationArrow").on("click", function(){
        $(".shown").addClass("hidden");
        $(".shown").removeClass("shown");
        $(".up").addClass("down");
        $(".up").removeClass("up");

        $(this).addClass("up");
        $(this).removeClass("down");
        $(this).parent().parent().children(".sublocationDiv").removeClass("hidden");
        $(this).parent().parent().children(".sublocationDiv").addClass("shown");
    })
})