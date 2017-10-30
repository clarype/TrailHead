(function ($) {
    'use strict';


    $.fn.storymap = function (options) {

        var defaults = {
            selector: '[data-marker]',
            breakpointPos: '33.333%',
            createMap: function () {
                // create a map in the "map" div, set the view to a given place and zoom
                var map = L.map('map').setView([45.22195, -117.3992], 12);

                // add an OpenStreetMap tile layer
                L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                var popup = L.popup();

                function onMapClick(e) {
                    popup
                        .setLatLng(e.latlng)
                        .setContent("You clicked the map at " + e.latlng.toString())
                        .openOn(map);
                }

                map.on('click', onMapClick);

                return map;
            }
        };

        var settings = $.extend(defaults, options);


        if (typeof(L) === 'undefined') {
            throw new Error('Storymap requires Laeaflet');
        }
        if (typeof(_) === 'undefined') {
            throw new Error('Storymap requires underscore.js');
        }

        function getDistanceToTop(elem, top) {
            var docViewTop = $(window).scrollTop();

            var elemTop = $(elem).offset().top;

            var dist = elemTop - docViewTop;

            var d1 = top - dist;

            if (d1 < 0) {
                return $(document).height();
            }
            return d1;

        }

        function highlightTopPara(paragraphs, top) {                     ///parargraphs and section change

            var distances = _.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return {el: $(element), distance: dist};
            });

            // added

            function findMin(pre, cur) {
                if (pre.distance > cur.distance) {
                    return cur;
                } else {
                    return pre;
                }
            }

            //^

            /*


            var closest = _.min(distances, function (dist) {
                return dist.distance;
            });

            _.each(paragraphs, function (element) {
                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }
            });

            */

            //added

            var closest = distances.reduce(findMin);

            $.each(paragraphs, function (key, element) {

                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }


                if (paragraph.height() <= $(window).height() * 0.33) {
                    paragraph.height($(window).height() * 0.33)
                }


            });

            //^

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }

        function watchHighlight(element, searchfor, top) {
            var paragraphs = element.find(searchfor);
            highlightTopPara(paragraphs, top);

            $(window).scroll(function () {
                highlightTopPara(paragraphs, top);
            });
        }

        //added
        document.createElement('video');
        //^

        var makeStoryMap = function (element, markers) {      //scenes and makers change

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();
            var searchfor = settings.selector;
            var paragraphs = element.find(searchfor);
//not sure if needed
            paragraphs.on('viewing', function () {
                $(this).addClass('viewing');
            });

            paragraphs.on('notviewing', function () {
                $(this).removeClass('viewing');
            });

            watchHighlight(element, searchfor, top);
////
            var map = settings.createMap();

            var initPoint = map.getCenter();

            var initZoom = map.getZoom();

            var fg = L.featureGroup().addTo(map);

            //added

            // make nav bar on the top.
            if ($(".navbar").length !== 0) {

                var navbar_height = $(".navbar").height();

                var origin_main_top = $(".main").position().top;

                $(".main").css({
                    top: (navbar_height + origin_main_top).toString() + "px"
                });

            }

            //^

            var mystyle = {"color": "#ee0a13"};

            L.geoJson.ajax("../HikeToEagleCap/EagleCap.geojson", {style: mystyle}).addTo(map);


            function showMapView(key) {

                fg.clearLayers();
                if (key === 'overview') {
                    map.setView(initPoint, initZoom, true);
                } else if (markers[key]) {
                    var marker = markers[key];
                    var layer = marker.layer;
                    if (typeof layer !== 'undefined') {
                        fg.addLayer(layer);
                    }
                    fg.addLayer(L.marker([marker.lat, marker.lon]));

                    map.setView([marker.lat, marker.lon], marker.zoom, 1);
                }

                //added


                paragraphs.on('viewing', function () {


                    $(this).addClass('viewing');

                    $(".arrow-down").css("left", "2%");

                    if (markers[$(this).data('marker')].position === "fullpage") {
                        $(this).addClass('section-opacity')
                            .css('width', "0px")
                            .css('padding', "0 0 0 0");
                        $(this).find(".background-fullscreen-setting")
                            .addClass('fullpage')
                            .css("display", "block");
                        $(".arrow-down").css("left", "50%");
                    }


                    // // Change the arrow-down icon to the home icon when reaching the last scene.
                    if ($(this).data('marker') === paragraphs.last().data('marker')) {
                        $(".arrow-down").removeClass("glyphicon-menu-down")
                            .addClass("glyphicon-home");

                    } else {
                        $(".arrow-down").removeClass("glyphicon-home")
                            .addClass("glyphicon-menu-down");
                    }

                    // Bounce the arrow-down icon when the icon is on the front page.
                    if ($(this).data('marker') === paragraphs.first().data('marker') || $(this).data('marker') === paragraphs.last().data('marker')) {
                        $(".arrow-down").addClass("animated");
                    } else {
                        $(".arrow-down").removeClass("animated");
                    }

                    showMapView($(this).data('marker'));

                });


                /*
                                //connects the scenes to the page
                                paragraphs.on('notviewing', function () {

                                    $(this).removeClass('viewing');

                                    if (markers[$(this).data('marker')].position === "fullpage") {
                                        $(this).removeClass('section-opacity');
                                        $(this).find(".background-fullscreen-setting")
                                            .removeClass('fullpage')
                                            .css("display", "none");
                                    }
                                });

                                watchHighlight(element, searchfor, top);
                                window.scrollTo(0, 1);

                                //not sure but important

                */

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

                //^


            }

            paragraphs.on('viewing', function () {
                showMapView($(this).data('place'));
            });
        };


        makeStoryMap(this, settings.markers);
        window.scrollTo(0, 0);

        return this;
    }

}(jQuery));
