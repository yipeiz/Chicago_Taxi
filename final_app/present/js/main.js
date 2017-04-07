
var queryUrlHead = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
var queryUrlTail = '&key=AIzaSyAAv8-7V5dOOKldXwnsqxK6Z8mw0qgbeOc';
var tableId = '1QOI_T6AT-dAOkQUEwEJd7AaSo63dWUIXdSpmpa3J';

var queryUrlHead2 = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
var queryUrlTail2 = '&key=AIzaSyAAv8-7V5dOOKldXwnsqxK6Z8mw0qgbeOc';
var tableId2 = '15sLQ7fajmvYW3AQCvReYwuxBC4nk2C2JUVx2TV12';

var commBoundStr = "https://raw.githubusercontent.com/yipeiz/Chicago_Taxi/master/final_app/present/file/sortedMap.geojson";
var ifTotal; // if it is on pickup mode or Drop-off mode
var maxPick;  // max pickup or Drop-off
var minPick;
var theList;  // contains all the Counts
var community;  // the geoj plot
var tempOriComm;  // the origin community
var oriRow; // the dropoff distribution list
var singlePickCounts; // the dropoff disribution array
var theDate;
var theHour;
var info = L.control(); //the control pad
var totalTrips;

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

        if (parseInt(theHour) > 24) {
            alert("Please reinput the hour!");
            theHour = "1";
        }

        var query = "SELECT * FROM " + tableId + " WHERE 'Hour' = " + theHour +
        " AND 'StartDay' = '" + theDate + "'";// + "' AND 'PickupCommunityArea' = " + "01";
        var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
        var jqxhr = $.get(queryurl, dataHandler);
    }
    getData();

    function dataHandler(resp){
        ifTotal = 1;

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

        function total(theList) {
            var atotal = 0;
            _.each(theList,function(theL){
              atotal += theL;
            });
            return atotal;
        }

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
            if (ifTotal === 0){
                return d > theList[6]  ? '#0b3340' :
                       d > theList[5]  ? '#18353f' :
                       d > theList[4]  ? '#1e536b' :
                       d > theList[3]  ? '#4496b1' :
                       d > theList[2]  ? '#6bb0b9' :
                       d > theList[1]  ? '#8fcbc3' :
                       d > theList[0]  ? '#c9e4ef' :
                                 '#dceaf6';
            }else{
                return d > theList[6]  ? '#4f000d' :
                       d > theList[5]  ? '#730013' :
                       d > theList[4]  ? '#a20d13' :
                       d > theList[3]  ? '#b13740' :
                       d > theList[2]  ? '#bf6a7f' :
                       d > theList[1]  ? '#cc939a' :
                       d > theList[0]  ? '#e2c5bf' :
                                 '#DBDBDB';
            }
        }

        function totalStyle(feature) {
            return {
                fillColor: getColor(feature.properties.totalCount),
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.9
            };
        }

        function singleStyle(feature) {
            return {
                fillColor: getColor(feature.properties.singleCount),
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.9
            };
        }

        giveTotalCount();
        //console.log(commGeoj);
        var totalPickCounts = _.map(commGeoj.features, function(feature){
            return feature.properties.totalCount;
        });
        ceilingFloor(totalPickCounts);
        totalTrips = total(totalPickCounts);
        //L.geoJson(commGeoj, {style: style}).addTo(map);
        community = L.geoJson(commGeoj, {style: totalStyle}).addTo(map);
        console.log(commGeoj);
        //interactive
        // console.log( totalTrips );

        info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        info.update = function (props) {
            if (ifTotal == 1){
              this._div.innerHTML = '<h4>Pick-up Trip Counts</h4>' +  (props ?
                  '<div><span class="glyphicon glyphicon-stats" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' + props.totalCount +
                  ' </b>' + ' Pick-ups</h5></div>'+
                  '<div><span class="glyphicon glyphicon-map-marker" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"> In <b>' +
                  props.community + '</b></h5></div>'+
                  '<div><span class="glyphicon glyphicon-dashboard" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' +
                   Math.ceil(props.totalCount/totalTrips*100) +
                  ' </b>' + '% of Total <b>' + totalTrips + '</b> Trips</h5></div>'
                  : '<h5><b>Hover over a community</b><br />' );
            }else{
              this._div.innerHTML = '<h4>Drop-off Trip Counts</h4>' +  (props ?
                  '<div><span class="glyphicon glyphicon-stats" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' + props.singleCount +
                   ' </b>' + ' Drop-offs</h5></div>' +
                   '<div><span class="glyphicon glyphicon-map-marker" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"> In <b>' +
                   props.community + '</b></h5></div>' +
                   '<div><span class="glyphicon glyphicon-dashboard" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' +
                    Math.ceil(props.singleCount/totalTrips*100) +
                   ' </b>' + '% of Total <b>' + totalTrips + '</b> Trips</h5></div>'
                  : '<h5><b>Hover over a community</b><br />');
            }
            this._div.innerHTML += '<h6 class="pull-left">0</h6><h6 class="pull-right">' + maxPick + '</h6>';
            this._div.innerHTML += '<div><canvas id="myCanvas" width="200" height="12" style="border:1px solid #d3d3d3;"></canvas></div>';
            this._div.innerHTML += '<button id="backToPickup" type="submit" class="btn btn-default btn-sm">Pick-ups</button>';
            $('#backToPickup').click(backToPickup);
        };

        function addCanvas(theP){
            var c = document.getElementById("myCanvas");
            var ctx = c.getContext("2d");

            var grd = ctx.createLinearGradient(0, 0, 200, 0);

            if (ifTotal === 0){
                grd.addColorStop(0, "#dceaf6");
                grd.addColorStop(0.5, "#4496b1");
                grd.addColorStop(1, "#0b3340");
              }else{
                grd.addColorStop(0, "#DBDBDB");
                grd.addColorStop(0.5, "#b13740");
                grd.addColorStop(1, "#4f000d");
              }

            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 200, 100);

            if (ifTotal === 1){
                ctx.strokeStyle="#003049";
                ctx.strokeRect(198 * theP.totalCount / maxPick,0,1,12);
            }else{
                ctx.strokeStyle="#d60270";
                ctx.strokeRect(198 * theP.singleCount / maxPick,0,1,12);
            }
        }

        function backToPickup() {
            ifTotal = 1;
            ceilingFloor(totalPickCounts);
            totalTrips = total(totalPickCounts);
            community.eachLayer(function(newL){
                newL.setStyle(totalStyle(newL.feature));
            });
            info.update();
            addCanvas(0);
        }

        info.addTo(map);
        addCanvas(0);


        community.eachLayer(function(theL){
            theL.on("mouseover",function(e){
                if (this !== tempOriComm){
                    this.setStyle({ weight: 2,
                                    color: '#666',
                                    dashArray: '',
                                    fillOpacity: 0.9
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
                                    fillOpacity: 0.9
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
                    totalTrips = total(singlePickCounts);

                    community.eachLayer(function(newL){
                        newL.setStyle(singleStyle(newL.feature));
                    });

                    this.setStyle({ weight: 2,
                                    opacity: 1,
                                    color: '#ed2893',
                                    dashArray: '3',
                                    fillOpacity: 0.9
                    });
                    tempOriComm = theL;
                }else{
                    console.log("No Pick-ups!");
                }
                info.update();
                addCanvas(0);
            });//end of the click move
        });
    }

//////////////////////////////////animated map///////////////////////////////////
    $('#draw2').click(function(){
        info.removeFrom(map);
        map.removeLayer(community);
        getData2();

        console.log(commGeoj);
    });

    function getData2(){
        theDate = document.getElementById("myDate").value;

        var query = "SELECT * FROM " + tableId2 + " WHERE " +
        "'StartDay' = '" + theDate + "'";// + "' AND 'PickupCommunityArea' = " + "01";
        var queryurl = encodeURI(queryUrlHead2 + query + queryUrlTail2);
        var jqxhr = $.get(queryurl, dataHandler2);
    }

    function dataHandler2(resp2){
        console.log(resp2);
        var themax = 0;
        _.each(resp2.rows,function(anHour){
             var thisHour = anHour[2];
             var theIndex = 3;

             _.each(anHour.slice(3,80),function(thisCount){
                commGeoj.features[theIndex-3].properties[thisHour] = parseInt(thisCount);
                themax = Math.max(parseInt(thisCount),themax);
                theIndex += 1;
             });
        });
        community = L.geoJson(commGeoj).addTo(map);
        // geoLayer = L.geoJson(commGeoj).addTo(map);
        console.log(community);
        // set base styles
        community.setStyle({
         fillOpacity: 0,
         color: '#0e0e0e',
         weight: 0.5
        });

        function animColor(d){
            return d == 1   ? '#fee900' :
                   d > 0.8  ? '#9fdb21' :
                   d > 0.6  ? '#27b778' :
                   d > 0.4  ? '#0f9c88' :
                   d > 0.2  ? '#1e848f' :
                   d > 0.1  ? '#355c8f' :
                   d > 0  ? '#142e3d' :
                             '#001822';
        }

        var twfHour = 0;

        refreshIntervalId = setInterval(function(){
            twfHour = (twfHour + 1) % 24;  // increment the hour

            community.eachLayer(function(layer){
                var col = animColor( layer.feature.properties[twfHour] / themax );
                layer.setStyle({fillColor: col,
                                fillOpacity: 0.8});
            });

        },1000);//

        setTimeout(myPattern, 24000);
        function myPattern() {
            clearInterval(refreshIntervalId);
            map.removeLayer(community);
            getData();
        }
        //
        // updateColors();

        // sets color of each layer randomly
        // function updateColors(){
        //    twfHour = (twfHour + 1) % 24;
        //    community.eachLayer(function(layer){
        //        var col = colors[~~(layer.feature.properties[twfHour] / themax * colors.length)];
        //        layer.setStyle({fillColor: col});
        //    });
        //    setTimeout(updateColors, 1500);
        // }
    }

});

//////////////////////////////////////////////////////////////////////////////
