/* =====================
Lab 1: Leaflet Draw

Task 1: Try to draw something on the map

Try to use one or two of the drawing tools. They should allow you to draw
without needing any additional configuration. These shapes will not be added to
the map. We'll fix that in the next task.

Task 2: Add rectangles to map

Add the rectangle layers to the map when they are drawn. Hint: you can use the
addLayer function that we have used in the past.

Task 3: Limit to one rectangle

For our application, we only want one rectangle to be displayed on the map at
any given time. When a user draws a new rectangle, the old rectangle should be
removed from the map. To remove a previously drawn rectangle, we will need to
store some information about it in a global variable. Use the variable
myRectangle, which is already defined in this document, to store the new Leaflet
layer before adding it to the map.

You will also need to remove the previous layer from the map.

If you get the error: "Cannot read property '_leaflet_id' of undefined", it
may be because you are trying to remove a layer that does not yet exist. Can you
check to see if myRectangle is defined before trying to remove it?

Task 4: Add shape to sidebar

Let's add the shape we've created to the sidebar. In the HTML, there is a
container with ID #shapes. Use jQuery's append function to add a new div inside
the #shapes container. The idea should look like the following:

<div class="shape" data-leaflet-id="[the id]"><h1>Current ID: [the id]</h1></div>

Where [the id] is replaced by the Leaflet ID of the layer.

When a new layer is added, you can use jQuery's empty function to clear out the
#shapes container before appending a new .shape.

Stretch Goal 1: Store multiple shapes

Instead of showing one shape at a time, let's allow multiple shapes to be drawn.
Instead of storing one Leaflet layer in the myRectangle variable, we should use
an array to store multiple layers. There will also be multiple shapes displayed
in the sidebar.

Change the variable myRectangle to myRectangles and set it to equal an empty
array. Change the rest of your code to push new layers into the array.

Stretch Goal 2: Connect sidebar and map

The HTML in the sidebar and the Leaflet layers on the map and in our Javascript
variable can be linked by using the Leaflet ID. Modify the application so that
clicking on a shape in the sidebar will do one of the following:

- Change the color of the corresponding shape on the map
- Delete the corresponding shape on the map (be sure to remove it from the
sidebar and the myRectanges array)
- Anything else you can think of!

Stretch Goal 3: Reverse Stretch Goal 2

Modify the application so moving your mouse over a rectangle on the map will
highlight (change style in some way) the corresponding element in the sidebar.
Moving your mouse outside of the circle should remove the highlighting.

===================== */

// Global Variables


var queryUrlHead = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
var queryUrlTail = '&key=AIzaSyAAv8-7V5dOOKldXwnsqxK6Z8mw0qgbeOc';
var tableId = '1QOI_T6AT-dAOkQUEwEJd7AaSo63dWUIXdSpmpa3J';

var commBoundStr = "https://raw.githubusercontent.com/yipeiz/temp/master/map.geojson";

$.ajax(commBoundStr).done(function(theD){
    var commGeoj = $.parseJSON(theD);
    // console.log(commGeoj);
    // _.each(commGeoj.features,function(theF){
    //   console.log(theF.geometry.coordinates.length);
    // });

    // write your SQL as normal, then encode it
    var query = "SELECT * FROM " + tableId + " WHERE 'Hour' = " + "01" +
    " AND 'StartDay' = '" + "01/01/2013'";// + "' AND 'PickupCommunityArea' = " + "01";
    var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
    var jqxhr = $.get(queryurl, dataHandler);

    function dataHandler(resp){

        console.log(resp);
        var myRows = resp.rows;
        var areas = _.map(myRows,function(theR){
            return theR[3];
        });
        var totalMatch = _.map(commGeoj.features, function(theG){
            return $.inArray(theG.properties.area_numbe.toString(),areas);
        });
        //console.log(areas);
        //console.log(totalMatch);

        function numToProp(theF){
            return totalMatch[commGeoj.features.indexOf(theF)];
        }// to transform the area number to the taxi trips number
        function totalTripCount(theN){
            var totalCount = 0;
            if (theN > -1) {
                _.each(myRows[theN].slice(4,77),function(theTC){
                    totalCount += parseInt(theTC);
                });
            }
            return totalCount;
        }
        function giveTotalCount() {
            _.each(commGeoj.features,function(theFeature){
                theFeature.properties.totalCount = totalTripCount([numToProp(theFeature)]);
            });
        }

        giveTotalCount();
        console.log(commGeoj);

        var totalPickCounts = _.map(commGeoj.features, function(feature){
            return feature.properties.totalCount;
        });
        var maxPick = Math.max.apply(Math, totalPickCounts);
        var minPick = Math.min.apply(Math, totalPickCounts);
        var theInter;
        var theList = [];
        if (minPick === 0){
            theInter = (maxPick - minPick) / 6;
        }else{
            theInter = (maxPick - minPick) / 5;
            theList.push(0);
        }
        for (var i = minPick; i <= maxPick; i+= theInter) {
            theList.push(Math.floor(i));
        }
        console.log(theList);

        function getColor(d) {
            return d > theList[6]  ? '#800026' :
                   d > theList[5]  ? '#BD0026' :
                   d > theList[4]  ? '#E31A1C' :
                   d > theList[3]  ? '#FC4E2A' :
                   d > theList[2]  ? '#FD8D3C' :
                   d > theList[1]  ? '#FEB24C' :
                   d > theList[0]  ? '#FED976' :
                             '#FFEDA0';
        }

        function totalStyle(feature) {
            return {
                fillColor: getColor(feature.properties.totalCount),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }

        console.log( maxPick, minPick );
        //L.geoJson(commGeoj, {style: style}).addTo(map);
        var community = L.geoJson(commGeoj, {style: totalStyle}).addTo(map);

        //interactive
        console.log( community );

        community.eachLayer(function(theL){
            theL.on("mouseover",function(e){
                this.setStyle({ weight: 5,
                                color: '#666',
                                dashArray: '',
                                fillOpacity: 0.7
                              });
                this.bringToFront();
            });
            theL.on("mouseout",function(e){
                community.resetStyle(this);
            });
            theL.on("click",function(e){
                var oriComm = this.feature.properties.area_num_1;
                var oriRow;
                _.each(areas,function(theA){
                    if(theA === oriComm.toString()){
                        oriRow = myRows[areas.indexOf(theA)];
                    }
                });

                console.log(oriRow);
            });
        });
    }

});

var myRectangles = [];

// Initialize Leaflet Draw

var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: false,
    rectangle: true,
  }
});

map.addControl(drawControl);

// Run every time Leaflet draw creates a new layer
map.on('draw:created', function (e) {
    var type = e.layerType; // The type of shape
    var layer = e.layer; // The Leaflet layer for the shape
    var id = L.stamp(layer); // The unique Leaflet ID for the layer
    //$(".shape").empty();
    $("#shapes").append(
      "<div class='shape' data-leaflet-id=" +
      id + "><h3>Current ID: "+
      id + "</h3></div>");
    //console.log(myRectangles);
    myRectangles.push(layer.addTo(map));
    // if (myRectangles.length === 0){
    //   myRectangles.push(layer.addTo(map));
    // }else{
    //   map.removeLayer(demoShapes[0]);
    //   demoShapes.pop();
    //   demoShapes.push(layer.addTo(map));
    // }
    $(".shape").click(function(e){
      var selectID = $(this).attr("data-leaflet-id");
      //console.log(selectID);
      _.each(myRectangles,function(theR){
        if (theR._leaflet_id.toString() === selectID){
           map.removeLayer(theR);
        }
      });
      $(this).slideUp();
    });

    _.each(myRectangles,function(theRe){

      theRe.on("mouseover",function(e){
        //console.log(theRe);
        $(".shape").each(function(ok){
          if ( $(this).attr("data-leaflet-id") === theRe._leaflet_id.toString()){
            //console.log(theRe._leaflet_id);
            $(this).css("color","red");
          }
        });
      });

      theRe.on("mouseout",function(e){
        //console.log(theRe);
        $(".shape").each(function(ok){
          if ( $(this).attr("data-leaflet-id") === theRe._leaflet_id.toString()){
            //console.log(theRe._leaflet_id);
            $(this).css("color","black");
          }
        });
      });
    });

});
