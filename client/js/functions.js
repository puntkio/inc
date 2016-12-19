window.onload = function() {
  (function($){
    $("body").addClass("active");


    $(".modal-loggin-content .login").click(function(){
      $(".modal-wrapper").removeClass("active");
      return false;
    });

    $("header .mobile-nav-trigger").click(function(){
      $("header").toggleClass("active-menu");
      return false;
    });

    // $(".shop-sidebar .buy-btn").click(function(){
    //   $(".modal-wrapper").addClass("active");
    //   return false;
    // });
    // $(document).on("click", ".shop-sidebar .remove-item", function(){
    //   $(this).parent().parent().remove();
    //   return false;
    // });

    // $(".shop-item .add-to-cart-btn").click(function(){
    //   $(".shop-sidebar .ss-item:last").clone().appendTo(".shop-sidebar .ss-item-wrapper");
    //   return false;
    // });
    // $(".modal-wrapper .cancel").click(function(){
    //   $(".modal-wrapper").removeClass("active");
    //   return false;
    // });
  })(jQuery);
}



document.addEventListener("DOMContentLoaded", function(event) {
  function is_touch_device() {
    return (('ontouchstart' in window)
        || (navigator.MaxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0));
    }
  var pHtml = document.getElementsByTagName( 'html' )[0];
  if (!is_touch_device()) {
    pHtml.setAttribute( 'class', 'no-touch' );
  }
  else {
    pHtml.setAttribute( 'class', 'touch' );
  }

});
