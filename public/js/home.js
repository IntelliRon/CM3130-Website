$(document).ready(function(){
    $(".owl-carousel").owlCarousel({
        rtl:true,
        items:3,
        autoplay:true,
        autoplayTimeout:4000,
        loop: true,
        margin: 10
    });

    $(".owl-stage").on( "mouseenter", function(){
        $('.owl-carousel').trigger('stop.owl.autoplay')
    }).on( "mouseleave", function(){
        $('.owl-carousel').trigger('play.owl.autoplay',[4000])
    });
});