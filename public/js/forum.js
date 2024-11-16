$(function(){
    $(".locationArrow").on("click", function(){
        $(".shown").addClass("hidden");
        $(".shown").removeClass("shown");
        $(".up").addClass("down");
        $(".up").removeClass("up");

        $(this).addClass("up");
        $(this).removeClass("down");
        let sublocations = $(this).parent().parent().children(".sublocationDiv");
        console.log(sublocations);
        for(let sublocation in sublocations){
            $(sublocation).removeClass("hidden");
            $(sublocation).addClass("shown");
        }
    })
})