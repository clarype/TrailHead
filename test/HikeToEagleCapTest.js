(function ($) {
    'use strict';

    $.fn.storymap = function(options) {

        var defaults = {
            selector: '[data-place]',
            breakpointPos: '25%',
            navbar: false,
            navwidget: false,
            legend: true,
            loader: true,
            flyto: false,
            scalebar: false,
            scrolldown: true,
            progressline: true,
            createMap: function () {

                var map = L.map('map').setView([45.2150, -117.3863], 13);
                L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);


                var popup = L.popup();
                function onMapClick(e) {
                    popup
                        .setLatLng(e.latlng)
                        .setContent( e.latlng.toString())
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

        function highlightTopPara(paragraphs, top) {

            var distances = $.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return {
                    el: $(element),
                    distance: dist
                };
            });

            function findMin(pre, cur) {
                if (pre.distance > cur.distance) {
                    return cur;
                } else {
                    return pre;
                }
            }

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

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }
        /*
        function highlightTopPara(paragraphs, top) {

            var distances = _.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return {
                    el: $(element), distance: dist
                };
            });

            var closest = _.min(distances, function (dist) {
                return dist.distance;
            });

            _.each(paragraphs, function (element) {
                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }
            });

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }
*/
        function watchHighlight(element, searchfor, top) {
            var paragraphs = element.find(searchfor);
            highlightTopPara(paragraphs, top);
            $(window).scroll(function () {
                highlightTopPara(paragraphs, top);
            });
        }

        var makeStoryMap = function (element, markers) {

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();

            var searchfor = settings.selector;

            var paragraphs = element.find(searchfor);

            paragraphs.on('viewing', function () {
                $(this).addClass('viewing');
            });

            paragraphs.on('notviewing', function () {
                $(this).removeClass('viewing');
            });

            watchHighlight(element, searchfor, top);  ////////something about a 01 to add maybe

            var map = settings.createMap();

            var initPoint = map.getCenter();

            var initZoom = map.getZoom();

            var fg = L.featureGroup().addTo(map);

            var nav = $("nav");  //mayneed to add to eagle test

            if (settings.legend) {
                $(".storymap").append("<div class='storymap-legend' />")
            }

            if (settings.scrolldown) {
                $(".storymap").append("<div class='zoomIn infinite glyphicon glyphicon-menu-down storymap-scroll-down' />")
            }

            if (settings.progressline) {
                $(".storymap").append("<div class='storymap-progressline' />")

            }

            if (settings.navbar && nav.length > 0) {

                $(".navbar-header").after("<div class='collapse navbar-collapse nav navbar-nav navbar-right storymap-navbar'>");


                $.each(paragraphs, function (key, element) {
                    var paragraph = $(element);
                    // if no name attribute for a specific scene, the name on the navigation bar will be the object name.
                    if (typeof(markers[paragraph.data('marker')].name) === "undefined") {
                       var sceneName = paragraph.data('marker');
                    } else {
                        sceneName = markers[paragraph.data('marker')].name.replace(" ", "&nbsp;");
                    }

                    var scrollScript = "javascript:window.scrollBy(0, $('paragraph[data-place=\\'" + paragraph.data('marker') + "\\']').offset().top - $(window).scrollTop() - $('.storymap-navbar').height() - 10);";

                    $(".storymap-navbar").append('<li><a title="' + sceneName + '" href="' + scrollScript + '" >' + sceneName + '</a></li>');


                });
            }

            var mystyle = {"color": "#ee0a13"};

            L.geoJson.ajax("../HikeToEagleCap/EagleCap.geojson", {style: mystyle}).addTo(map);

            // make nav bar on the top.
            if (nav.length !== 0) {

                var navbar_height = nav.height();

                var origin_main_top = nav.position().top;

                $(".storymap-story").css({
                    top: (navbar_height + origin_main_top).toString() + "px"
                });

            }

            function showMapView(key) {    /////////////////////////////

                fg.clearLayers();
                if (key === 'overview') {
                    map.setView(initPoint, initZoom, true);
                } else if (markers[key]) {
                    var marker = markers[key];
                    var layer = marker.layer;
                    if (typeof layer !== 'undefined') {
                        fg.addLayer(layer);
                    }

                    fg.addLayer(L.marker([marker.lat, marker.lon])); // {icon: myIcon}

                    map.setView([marker.lat, marker.lon], marker.zoom, 1);
                }

            }          //////////////////////////////////

            paragraphs.on('viewing', function () {

                $(this).addClass('viewing');

                $(".storymap-scroll-down").css("left", "2%");

                if (typeof $(this).data("background") !== 'undefined') {
                    $(this)
                        .addClass('section-opacity')
                        .css('width', "0px")
                        .css('padding', "0 0 0 0");

                    $(".storymap-scroll-down").css("left", "50%");


                }

                // // Change the storymap-scroll-down icon to the home icon when reaching the last marker.
                if ($(this).data('marker') === paragraphs.last().data('marker')) {
                    $(".storymap-scroll-down")
                        .removeClass("glyphicon-menu-down")
                        .addClass("glyphicon-home");
                } else {
                    $(".storymap-scroll-down")
                        .removeClass("glyphicon-home")
                        .addClass("glyphicon-menu-down");
                }

                // Bounce the storymap-scroll-down icon when the icon is on the front page.
                if ($(this).data('marker') === paragraphs.first().data('marker') || $(this).data('marker') === paragraphs.last().data('marker')) {
                    $(".storymap-scroll-down")
                        .addClass("animated");
                } else {
                    $(".storymap-scroll-down")
                        .removeClass("animated");
                }

                showMapView($(this).data('marker'));


            });

            paragraphs.on('notviewing', function () {


                $(this).removeClass('viewing');

                if (typeof $(this).data("background") !== 'undefined') {
                    $(this)
                        .removeClass('section-opacity');
                }
            });

            $('.storymap-scroll-down').click(function () {
                var viewing = $(".viewing");
                if (viewing.data("marker") !== $("paragraph:last").data("marker")) {

                    if (nav.length !== 0) {
                        window.scrollBy(0, viewing.offset().top + viewing.height() - $(window).scrollTop() - $('.storymap-navbar').height() - 10);
                    } else {
                        window.scrollBy(0, viewing.offset().top + viewing.height() - $(window).scrollTop() - 10);
                    }
                } else {
                    window.scrollTo(0, 0);
                }
            });

            // create a progress line
            $(window).scroll(function () {
                var wintop = $(window).scrollTop(),
                    docheight = $(document).height(),
                    winheight = $(window).height();
                var scrolled = (wintop / (docheight - winheight)) * 100;

                $('.storymap-progressline').css('width', (scrolled + '%'));
            });

            // create the navigation widget to the left side of the browser's window.
            if (settings.navwidget) {
                $.each(paragraphs, function (key, element) {
                    var para = $(element);
                    // if no name attribute for a specific marker, the name on the navigation bar will be the object name.
                    if (typeof(markers[paragraph.data('marker')].name) === "undefined") {
                        var markerName = paragraph.data('marker');
                    } else {
                        markerName = markers[paragraph.data('marker')].name.replace(" ", "&nbsp;");
                    }

                    //if there is a navbar.
                    if (nav.length !== 0) {
                      var  scrollScript = "javascript:window.scrollBy(0, $('paragraph[data-marker=\\'" + paragraph.data('marker') + "\\']').offset().top - $(window).scrollTop() - $('.storymap-navbar').height() - 10);";
                    } else {
                        scrollScript = "javascript:window.scrollBy(0, $('paragraph[data-marker=\\'" + paragraph.data('marker') + "\\']').offset().top  - $(window).scrollTop() - 10);";
                    }
                    // if key is equal to 0, meaning it is the first marker.
                    if (key === 0) {
                        $(".storymap-navwidget").append('<li><a class="glyphicon glyphicon-home" data-toggle="tooltip" title="' + markerName + '" href="' + scrollScript + '" ></a></li>');
                    } else {
                        $(".storymap-navwidget").append('<li><a class="glyphicon glyphicon-one-fine-full-dot" data-toggle="tooltip" title="' + markerName + '" href="' + scrollScript + '" ></a></li>');
                    }
                });
                /*
                 $('[data-toggle="tooltip"]').tooltip({
                 placement: 'right',
                 html: true
                 });

                 $(".storymap-navwidget").hover(function () {
                 $(this).fadeTo(100, 0.8);
                 }, function () {
                 $(this).fadeTo(300, 0);
                 });
                 */
            }



            paragraphs.on('viewing', function () {
                showMapView($(this).data('place'));
            });
        };

        makeStoryMap(this, settings.markers); ///  window.scrollTo(0, 0);


        return this;

    }

    var popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent( e.latlng.toString())
            .openOn(mymap);
    }

    mymap.on('click', onMapClick);

}(jQuery));
