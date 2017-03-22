
var queryUrlHead = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
var queryUrlTail = '&key=AIzaSyAAv8-7V5dOOKldXwnsqxK6Z8mw0qgbeOc';
var tableId = '1QOI_T6AT-dAOkQUEwEJd7AaSo63dWUIXdSpmpa3J';

var commBoundStr = "https://raw.githubusercontent.com/yipeiz/Chicago_Taxi/master/final_app/present/file/sortedMap.geojson";
var ifTotal = 1; // if it is on pickup mode or Drop-off mode
var maxPick;  // max pickup or Drop-off
var minPick;
var theList;  // contains all the Counts
var community;  // the geoj plot
var tempOriComm;  // the origin community
var oriRow; // the dropoff distribution list
var singlePickCounts; //
var theDate;
var theHour;
var info = L.control(); //the control pad

$.ajax(commBoundStr).done(function(theD){
    var commGeoj = $.parseJSON(theD);
    // console.log(commGeoj);
    // _.each(commGeoj.features,function(theF){
    //   console.log(theF.geometry.coordinates.length);
    // });
    // write your SQL as normal, then encode it

    $('#draw').click(function(){
        info.removeFrom(map);
        map.removeLayer(community);
        getData();
    });

    function getData(){
        theDate = document.getElementById("myDate").value;
        theHour = document.getElementById("myHour").value;

        var query = "SELECT * FROM " + tableId + " WHERE 'Hour' = " + theHour +
        " AND 'StartDay' = '" + theDate + "'";// + "' AND 'PickupCommunityArea' = " + "01";
        var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
        var jqxhr = $.get(queryurl, dataHandler);
    }
    getData();

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
        } //create array of total counts

        function giveTotalCount() {
            _.each(commGeoj.features,function(theFeature){
                theFeature.properties.totalCount = totalTripCount([numToProp(theFeature)]);
            });
        } //give totalcount property to geoj

        function ceilingFloor(Counts){
            maxPick = Math.max.apply(Math, Counts);
            minPick = Math.min.apply(Math, Counts);
            var theInter;
            theList = [];
            if (minPick === 0){
                theInter = (maxPick - minPick) / 6;
            }else{
                theInter = (maxPick - minPick) / 5;
                theList.push(0);
            }
            for (var i = minPick; i <= maxPick; i+= theInter) {
                theList.push(Math.floor(i));
            }
        }

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
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.7
            };
        }

        function singleStyle(feature) {
            return {
                fillColor: getColor(feature.properties.singleCount),
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.7
            };
        }

        giveTotalCount();
        //console.log(commGeoj);
        var totalPickCounts = _.map(commGeoj.features, function(feature){
            return feature.properties.totalCount;
        });
        ceilingFloor(totalPickCounts);
        //L.geoJson(commGeoj, {style: style}).addTo(map);
        community = L.geoJson(commGeoj, {style: totalStyle}).addTo(map);
        //interactive
        console.log( community );

        info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        info.update = function (props) {
            if (ifTotal == 1){
              this._div.innerHTML = '<h4>Chicago Taxi Pick-up Counts</h4>' +  (props ?
                  '<b>' + props.totalCount + ' </b>' + ' Pick-ups<br /><h3>' + props.community + '</h3>'
                  : 'Hover over a community<br />');
            }else{
              this._div.innerHTML = '<h4>Chicago Taxi Drop-off Counts</h4>' +  (props ?
                  '<b>' + props.singleCount + ' </b>' + ' Drop-offs<br /><h3>' + props.community + '</h3>'
                  : 'Hover over a community<br />');
            }
            this._div.innerHTML += '<div><canvas id="myCanvas" width="200" height="8" style="border:1px solid #d3d3d3;"></canvas></div>';
            this._div.innerHTML += '<h6>0</h6><h5>' + maxPick + '</h5>';
        };

        function addCanvas(theP){
            var c = document.getElementById("myCanvas");
            var ctx = c.getContext("2d");

            var grd = ctx.createLinearGradient(0, 0, 200, 0);
            grd.addColorStop(0, "#FFEDA0");
            grd.addColorStop(1, "#800026");

            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 200, 100);

            if (ifTotal === 1){
                ctx.strokeRect(200 * theP.totalCount / maxPick,0,1,12);
            }else{
                ctx.strokeRect(200 * theP.singleCount / maxPick,0,1,12);
            }
        }

        function backToPickup() {
            ifTotal = 1;
            ceilingFloor(totalPickCounts);
            community.eachLayer(function(newL){
                newL.setStyle(totalStyle(newL.feature));
            });
            info.update();
            addCanvas(0);
        }

        info.addTo(map);
        addCanvas(0);
        $('#backToPickup').click(backToPickup);

        community.eachLayer(function(theL){
            theL.on("mouseover",function(e){
                if (this !== tempOriComm){
                    this.setStyle({ weight: 2,
                                    color: '#666',
                                    dashArray: '',
                                    fillOpacity: 0.7
                                  });
                    this.bringToFront();
                    if(ifTotal === 0){
                        tempOriComm.bringToFront();
                    }
                }
                info.update(this.feature.properties);
                addCanvas(this.feature.properties);
            });//end of the mouseover move

            theL.on("mouseout",function(e){
                if (this !== tempOriComm){
                    this.setStyle({ weight: 1,
                                    opacity: 1,
                                    color: 'white',
                                    dashArray: '',
                                    fillOpacity: 0.7
                    });
                }
            });//end of the mouseout move

            theL.on("click",function(e){
                var oriComm = this.feature.properties.area_num_1;
                _.each(areas,function(theA){
                    if(theA === oriComm.toString()){
                        oriRow = myRows[areas.indexOf(theA)];
                    }
                });
                if (oriRow !== undefined){
                    ifTotal = 0;
                    singlePickCounts = [];
                    _.each(commGeoj.features, function(theF){
                        theF.properties.singleCount = parseInt(oriRow[theF.properties.area_numbe + 3]);
                        singlePickCounts.push(theF.properties.singleCount);//four columns before
                    });
                    ceilingFloor(singlePickCounts);

                    community.eachLayer(function(newL){
                        newL.setStyle(singleStyle(newL.feature));
                    });

                    this.setStyle({ weight: 2,
                                    opacity: 1,
                                    color: 'red',
                                    dashArray: '3',
                                    fillOpacity: 0.7
                    });
                    tempOriComm = this;
                }else{
                    console.log("No Pick-ups!");
                }
                info.update();
                addCanvas(0);
            });//end of the click move
        });
    }

});
