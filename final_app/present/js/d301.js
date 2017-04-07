var width = $(document).width();
var height = $(document).height();
var commBoundStr2 = "https://raw.githubusercontent.com/yipeiz/Chicago_Taxi/master/final_app/present/file/sortedMap.geojson";
var svg;
var projection;
var path;
var refreshIntervalId;
var mymap;

function setsvg() {
    width = $(document).width();
    height = $(document).height();

    svg = d3.select("svg") // set the width, height and color of the background
        .attr("width", 0.4 * width)
        .attr("height", height)
        .style("background-color","#242426");

    // svg = d3.select(map.getPanes().overlayPane).append("svg"); // set the width, height and color of the background
    // g = svg.append("g").attr("class", "leaflet-zoom-hide");
    // transform = d3.geo.transform({point: projectPoint});
    // path = d3.geo.path().projection(transform);
    $("svg").css({left: 0.6 * $(document).width(), position:'absolute'});

    projection = d3.geoMercator()  // set the map projection
        .scale(60000).center([-87.712962,41.833393])  // these values will change depending on the region you want the map to show
        .translate([width / 5, height / 2]);

    path = d3.geoPath()  // create a function to convert your map's coordinates to an svg path
        .projection(projection);
}

var queryUrlHead2 = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
var queryUrlTail2 = '&key=AIzaSyAAv8-7V5dOOKldXwnsqxK6Z8mw0qgbeOc';
var tableId2 = '15sLQ7fajmvYW3AQCvReYwuxBC4nk2C2JUVx2TV12';

$.ajax(commBoundStr2).done(function(theD){
    var commGeoj2 = $.parseJSON(theD);

    function getData2(){
        theDate = document.getElementById("myDate").value;

        var query = "SELECT * FROM " + tableId2 + " WHERE " +
        "'StartDay' = '" + theDate + "'";// + "' AND 'PickupCommunityArea' = " + "01";
        var queryurl = encodeURI(queryUrlHead2 + query + queryUrlTail2);
        var jqxhr = $.get(queryurl, dataHandler2);
    }

    // setsvg();
    // getData2();

    $('#draw2').click(function(){
        setsvg();
        getData2();

        setTimeout(myPattern, 24000);
        function myPattern() {
            clearInterval(refreshIntervalId);
            d3.select("svg").remove();
        }
    });

    function dataHandler2(resp){
        console.log(resp);
        var themax = 0;
        _.each(resp.rows,function(anHour){
             var thisHour = anHour[2];
             var theIndex = 3;

             _.each(anHour.slice(3,80),function(thisCount){
                commGeoj2.features[theIndex-3].properties[thisHour] = parseInt(thisCount);
                themax = Math.max(parseInt(thisCount),themax);
                theIndex += 1;
             });
        });
        console.log(commGeoj2);
        console.log(themax);

        mymap = svg.selectAll("anystring")  // For these purposes, what goes here is irrelevant
            .data(commGeoj2.features) // The features from your geojson file
            .enter().append("path").attr("d", path)
            .style("fill",function(d){ // set the colors of each feature
                var pickupsInHour0 = d.properties["1"]; // You can reference any of your map's attributes in this way
                return d3.interpolateViridis(pickupsInHour0/themax); // Viridis is one of D3's built in color ramps. More here: https://github.com/d3/d3-scale#interpolateViridis
            });

        var displayHour = svg.append("text") // display the current hour
            .attr("x",width / 3)  // position the text box on the screen. Coordinate [0,0] is the upper left corner.
            .attr("y",30)
            .style("fill","white")
            .text("0");

        // **** ANIMATE THE MAP'S COLORS ACCORDING TO THE HOURLY NUMBER OF PICKUPS ****
        var hour = 0;
        refreshIntervalId = setInterval(function(){
            hour = (hour + 1) % 24;  // increment the hour
            mymap
                .transition()
                .duration(500)
                .style("fill",function(d){
                    var pickupsThisHour = d.properties[hour];
                    return d3.interpolateViridis(pickupsThisHour/themax);
                });// change the colors smoothly
            displayHour.text(hour); // display the updated hour
        },1000);// repeat this function every second
    }
});
