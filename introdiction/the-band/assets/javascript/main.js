document.addEventListener('DOMContentLoaded', function() {
    //Set su kien silder chay
    var text = [
        {img: "slider1", textHeading: "Chicago", textDescription: "Thank you, Chicago - A night we won't forget."},
        {img: "slider2", textHeading: "Los Angeles", textDescription: "We had the best time playing at Venice Beach!"},
        {img: "slider3", textHeading: "New York", textDescription: "The atmosphere in New York is lorem ipsum."},
    ];

    var image = document.getElementById('slider');
    var h2 = document.getElementsByClassName('text-heading')[0];
    var div = document.getElementsByClassName('text-description')[0];

    var i = 0;
    setInterval(function() {
        if(i < text.length) {
            h2.textContent = text[i].textHeading;
            div.textContent = text[i].textDescription;
            image.style.background = "url('./assets/img/slider/" + text[i].img + ".jpg') top center / cover no-repeat";
            i++;
        } else i = 0;
    }, 3000);


    // Set su kien click co nut ti-menu
    var header = document.getElementById('header');
    var moblie_menu_btn = document.getElementsByClassName('moblie-menu-btn')[0];
    var headerHeight = header.clientHeight;

    moblie_menu_btn.onclick = function() {
        var isClosed = headerHeight === header.clientHeight; // Lay chieu cao cua the
        if(isClosed) {
            header.style.height = 'auto';
        } else {
            header.style.height = null;
        }
    }

    // Tự động đóng khi chọn menu
    var menuItems = document.querySelectorAll('#nav li a[href*="#"'); // Select thẻ a có thuộc tính href chứa xâu "#"
    for(var i of menuItems) {
        i.onclick = function(event) {
        var isParentMenu = this.nextElementSibling && this.nextElementSibling.classList.contains('subnav');
            if(isParentMenu) {
                event.preventDefault(); // Bỏ đi các sự kiện mặc định của thẻ đó
                
            } else {
                header.style.height = null;
            }
        }
    }

    // Show modal

    const close = () =>  modal.classList.remove('d-flex')

    const modal = document.querySelector('.js-modal')

    modal.addEventListener('click', close)

    const buyBtns = document.querySelectorAll('.js-buy-tickets')
    buyBtns.forEach(ai => 
        ai.addEventListener('click', () => modal.classList.add('d-flex'))
    )

    const closeBtn = document.querySelector('.js-modal-close')
    closeBtn.addEventListener('click', close)

    // Trong js khi set sự kiện cho nút cha thì nó cx ảnh hưởng sự kiện đấy lên nút con
    // Để ngăn chặn điều này ta phải bỏ sự kiện nhận ở nút con đi
    const modalContainer = document.querySelector('.js-modal-container')
    modalContainer.addEventListener('click', e => e.stopPropagation())
});