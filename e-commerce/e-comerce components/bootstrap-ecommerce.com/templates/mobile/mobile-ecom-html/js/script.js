// // Prevent closing from click inside dropdown
//     $(document).on('click', '.dropdown-menu', function (e) {
//       e.stopPropagation();
//     });

// preload
$(window).on('load', function () {
    $('#preloader').fadeOut('500', function () {
        $(this).remove();
    });
});

// add padding top to show content behind navbar
if ($('.app-header.fixed-top').length > 0) { // check if element exists
    $('body').css('padding-top', $('.app-header').outerHeight() + 'px')
}



// Add class based on scrollup/down to detect scroll direction
var last_scroll_top = 0;
$(window).on('scroll', function(){
    if( $(this).scrollTop() > 7 ){
        scroll_top = $(this).scrollTop();
        
        // detect scroll
        if(scroll_top < last_scroll_top) {
            $('body').removeClass('scrolling-down').addClass('scrolling-up');
        }
        else {
            $('body').removeClass('scrolling-up').addClass('scrolling-down');

        }
        last_scroll_top = scroll_top;

    } else {
        $('body').removeClass('scrolling-down scrolling-up');
    }
});



$('.js-check :radio').change(function () {
    var check_attr_name = $(this).attr('name');
    if ($(this).is(':checked')) {
        $('input[name='+ check_attr_name +']').closest('.js-check').removeClass('active');
        $(this).closest('.js-check').addClass('active');
       // item.find('.radio').find('span').text('Add');

    } else {
        item.removeClass('active');
        // item.find('.radio').find('span').text('Unselect');
    }
});


$('.js-check :checkbox').change(function () {
    var check_attr_name = $(this).attr('name');
    if ($(this).is(':checked')) {
        $(this).closest('.js-check').addClass('active');
       // item.find('.radio').find('span').text('Add');
    } else {
        $(this).closest('.js-check').removeClass('active');
        // item.find('.radio').find('span').text('Unselect');
    }
});