
(function ($) {

    $.fn.storymap = function (options) {

        var defaults = {
            selector: '[data-scene]',
            breakpointPos: '33.333%',
            createMap: function () {
                var map = L.map('map', {
                    zoomControl: false
                }).setView([44, -120], 7);
                L.tileLayer('http://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png');
                return map;
            }
        };

        var settings = $.extend(defaults, options);

        if (typeof(L) === 'undefined') {
            throw new Error('Storymap requires Laeaflet.');
        }


        function getDistanceToTop(elem, top) {

            var docViewTop = $(window).scrollTop();

            var elemTop = $(elem).offset().top;

            var dist = elemTop - docViewTop;

            var d = top - dist;

            if (d < 0) {
                return $(document).height();
            }
            return d;
        }

        function highlightTopPara(sections, top) {

            var distances = $.map(sections, function (element) {
                var dist = getDistanceToTop(element, top);
                return {
                    el: $(element),
                    distance: dist
                };
            });

            ///different from Eagle

            function findMin(pre, cur) {
                if (pre.distance > cur.distance) {
                    return cur;
                } else {
                    return pre;
                }
            }



            var closest = distances.reduce(findMin);

            $.each(sections, function (key, element) {

                var section = $(element);
                if (section[0] !== closest.el[0]) {
                    section.trigger('notviewing');
                }

                if (section.height() <= $(window).height() * 0.33) {
                    section.height($(window).height() * 0.33)
                }


            });

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }

        //^^^

        function watchHighlight(element, searchfor, top) {

            var sections = element.find(searchfor);
            highlightTopPara(sections, top);

            $(window).scroll(function () {
                highlightTopPara(sections, top);
            });


        }


        //support video for IE 8 and 9.///////////////////////////////////////////////////
        document.createElement('video');

        var makeStoryMap = function (element, scenes) {

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();
            var searchfor = settings.selector;
            var sections = $(element).find(searchfor);


            var map = settings.createMap();
            var currentLayerGroup = L.layerGroup().addTo(map);  ///not sure



            // make nav bar on the top.
            if ($(".navbar").length !== 0) {

                var navbar_height = $(".navbar").height();

                var origin_main_top = $(".main").position().top;

                $(".main").css({
                    top: (navbar_height + origin_main_top).toString() + "px"
                });

            }





            function showMapView(key) {

                currentLayerGroup.clearLayers();

                var scene = scenes[key];  //place for scene

                map.setView([scene.lat, scene.lng], scene.zoom, 1);  /////////////stopping point //////

            }


            sections.on('viewing', function () {


                $(this).addClass('viewing');

                $(".arrow-down").css("left", "2%");

                if (scenes[$(this).data('scene')].position === "fullpage") {
                    $(this).addClass('section-opacity')
                        .css('width', "0px")
                        .css('padding', "0 0 0 0");
                    $(this).find(".background-fullscreen-setting")
                        .addClass('fullpage')
                        .css("display", "block");
                    $(".arrow-down").css("left", "50%");
                }



                // // Change the arrow-down icon to the home icon when reaching the last scene.
                if ($(this).data('scene') === sections.last().data('scene')) {
                    $(".arrow-down").removeClass("glyphicon-menu-down")
                        .addClass("glyphicon-home");

                } else {
                    $(".arrow-down").removeClass("glyphicon-home")
                        .addClass("glyphicon-menu-down");
                }

                // Bounce the arrow-down icon when the icon is on the front page.
                if ($(this).data('scene') === sections.first().data('scene') || $(this).data('scene') === sections.last().data('scene')) {
                    $(".arrow-down").addClass("animated");
                } else {
                    $(".arrow-down").removeClass("animated");
                }

                showMapView($(this).data('scene'));

            });

           //connects the scenes to the page
            sections.on('notviewing', function () {

                $(this).removeClass('viewing');

                if (scenes[$(this).data('scene')].position === "fullpage") {
                    $(this).removeClass('section-opacity');
                    $(this).find(".background-fullscreen-setting")
                        .removeClass('fullpage')
                        .css("display", "none");
                }
            });

            watchHighlight(element, searchfor, top);
            window.scrollTo(0, 1);

           //not sure but important
            $('.arrow-down').click(function () {

                if ($(".arrow-down")[0].className.includes("glyphicon-menu-down")) {

                    //if there is a navbar.
                    if ($(".navbar").length !== 0) {
                        window.scrollBy(0, $(".viewing").offset().top + $('.viewing').height() - $(window).scrollTop() - $('.navbar').height() - 10);
                    } else {
                        window.scrollBy(0, $(".viewing").offset().top + $('.viewing').height() - $(window).scrollTop() - 10);
                    }
                } else if ($(".arrow-down")[0].className.includes("glyphicon-home")) {
                    window.scrollTo(0, 0);
                }
            });





            // create a progress line
            $(window).scroll(function () {
                var wintop = $(window).scrollTop(),
                    docheight = $(document).height(),
                    winheight = $(window).height();
                var scrolled = (wintop / (docheight - winheight)) * 100;

                $('.progress-line').css('width', (scrolled + '%'));
            });





        };

        makeStoryMap(this, settings.scenes);
        window.scrollTo(0, 0);

        return this;
    }

}(jQuery));