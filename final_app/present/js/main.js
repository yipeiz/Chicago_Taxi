
var queryUrlHead = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
var queryUrlTail = '&key=AIzaSyAAv8-7V5dOOKldXwnsqxK6Z8mw0qgbeOc';
var tableId  = '1QOI_T6AT-dAOkQUEwEJd7AaSo63dWUIXdSpmpa3J';
var tableId2 = '15sLQ7fajmvYW3AQCvReYwuxBC4nk2C2JUVx2TV12';
var tableId3 = '1GzTCFrO-iEPyMcgde0V5k7z6YqMgGoe5ifHzcrJE';
var CCId     = '1KYd8-AhEaUBZ9XKyWEM-vNwhHTszuHoxLGV3Aldh';
var CWSId    = '1Clc6OZA2Cp1Zi8XEXGfCUr_-UhgptMxv9vuoZk9m';

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
var info = L.control();
var info2 = L.control(); //the control pad
var info3 = L.control();
var totalTrips;
var oriCommName;
var ifmotion = 0;
var mySwitch = 0;
var today = new Date();
var liveHour = today.getHours() + 1;
var liveDate = today.toISOString().substring(0, 10);

console.log(liveDate);

function disableButtons(){
    $('#draw').prop('disabled', true);
    $('#draw2').prop('disabled', true);
    $('#stop').prop('disabled', true);
}

disableButtons();
$('#draw4').prop('disabled', true);

$('ul#myTabs').click(function(){
    mySwitch += 1;
    if (mySwitch % 2 === 0){
      info.getContainer().style.visibility = "visible";
      if (ifmotion === 1){
         info2.getContainer().style.visibility = "";
      }
      document.getElementById('map02').style.visibility = 'hidden';
    }else{
      info.getContainer().style.visibility = "hidden";
      if (ifmotion === 1){
         info2.getContainer().style.visibility = "hidden";
      }
      document.getElementById('map02').style.visibility = 'visible';
    }
});

$.ajax(commBoundStr).done(function(theD){
    var commGeoj = $.parseJSON(theD);
    var predComm;

    console.log(commGeoj);
    //following part is about history
    $('#draw').click(function(){
        disableButtons();
        info.removeFrom(map);
        map.removeLayer(community);
        // info2.removeFrom(map);
        getData();
    });

    function getData(){
        theDate = document.getElementById("myDate").value;
        theHour = document.getElementById("myHour").value;
        console.log(theDate);
        console.log(liveDate);
        console.log("2017-05-01");
        console.log(theHour);

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
        $('#draw').prop('disabled', false);
        $('#draw2').prop('disabled', false);
        $('#stop').prop('disabled', false);
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
                return d > theList[6]  ? '#990000' :
                       d > theList[5]  ? '#d7301f' :
                       d > theList[4]  ? '#ef6548' :
                       d > theList[3]  ? '#fc8d59' :
                       d > theList[2]  ? '#fdbb84' :
                       d > theList[1]  ? '#fdd49e' :
                       d > theList[0]  ? '#fee8c8' :
                                 '#fff7ec';
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
        // console.log(commGeoj);
        // console.log(community);
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
                   '<div><span class="glyphicon glyphicon-map-marker" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"> From <b>' +
                   oriCommName + '</b></h5></div>' +
                   '<div><span class="glyphicon glyphicon-home" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"> To <b>' +
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
                grd.addColorStop(0, "#fff7ec");
                grd.addColorStop(0.5, "#fc8d59");
                grd.addColorStop(1, "#990000");
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

        if (mySwitch % 2 !== 0){
            info.getContainer().style.visibility = "hidden";
            // info2.getContainer().style.visibility = "hidden";
        }

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
                oriCommName = this.feature.properties.community;
                _.each(areas,function(theA){
                    if(theA === oriComm.toString()){
                        oriRow = myRows[areas.indexOf(theA)];
                    }
                });
                if (this.feature.properties.totalCount !== 0){
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
                  }
            });//end of the click move
        });
    }

//////////////////////////////////animated map///////////////////////////////////
    $('#draw2').click(function(){
        disableButtons();
        ifmotion = 1;
        info.removeFrom(map);
        map.removeLayer(community);
        getData2();
        document.getElementById('stop').style.visibility = 'visible';
        $("#draw2").hide();

        // console.log(commGeoj);
    });

    function getData2(){
        theDate = document.getElementById("myDate").value;
        var query = "SELECT * FROM " + tableId2 + " WHERE " +
        "'StartDay' = '" + theDate + "'";// + "' AND 'PickupCommunityArea' = " + "01";
        var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
        var jqxhr = $.get(queryurl, dataHandler2);
    }

    function dataHandler2(resp2){
        $('#stop').prop('disabled', false);
        // console.log(resp2);
        var themax = 0;
        var dayTotal = 0;
        _.each(resp2.rows,function(anHour){
             var thisHour = anHour[2];
             var theIndex = 3;

             _.each(anHour.slice(3,80),function(thisCount){
                commGeoj.features[theIndex-3].properties[thisHour] = parseInt(thisCount);
                themax = Math.max(parseInt(thisCount),themax);
                dayTotal += parseInt(thisCount);
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



//////////////////////////////////////////////////////////
        info2 = L.control();

        info2.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        info2.update = function (total,max,hour) {
              this._div.innerHTML = '<h4>24-Hour Pick-up Pattern</h4>' + (total ?
                '<div><span class="glyphicon glyphicon-calendar" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;">' +
                theDate + '</h5></div>' +
                '<div><span class="glyphicon glyphicon-time" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;">' +
                ' Hour <b>' + hour + ' </b></h5></div>' +
                '<div><span class="glyphicon glyphicon-stats" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' +
                total + '</b> in total</h5></div>' +
                '<div><span class="glyphicon glyphicon-equalizer" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' +
                Math.ceil(total/dayTotal*100) + '</b> % of total of the day</h5></div>'
                :"");
        };

        info2.addTo(map);
////////////////////////////////////////////////////////

        var twfHour = 0;

        refreshIntervalId = setInterval(function(){
            // twfHour = (twfHour + 1) % 24;// increment the hour
            twfHour += 1;
            var hourTotal = 0;
            var hourMax = 0;
            community.eachLayer(function(layer){
                var col = animColor( layer.feature.properties[twfHour] / themax );
                layer.setStyle({fillColor: col,
                                fillOpacity: 0.8});
                hourTotal += layer.feature.properties[twfHour];
                hourMax = Math.max(parseInt(layer.feature.properties[twfHour]),hourMax);
            });
            info2.update(hourTotal, hourMax, twfHour);
        },1000);//

        var myTimeOut = setTimeout(myPattern, 25000);

        function myPattern() {
            ifmotion = 0;
            clearInterval(refreshIntervalId);
            info2.removeFrom(map);
            map.removeLayer(community);
            getData();
            document.getElementById('stop').style.visibility = "hidden";
            $("#draw2").show();

        }

        $("#stop").unbind('click');// otherwise the stop would execute twice
        $('#stop').click(function(){
            clearTimeout(myTimeOut);
            console.log(commGeoj);
            myPattern();
        });

    }

///////////////////////////////////////////////////////////////////////////////////////////////
    //following part is about prediction
    function getData3(){
      //liveHour liveDate
        var query = "SELECT * FROM " + tableId3 + " WHERE 'Hour' = " + liveHour.toString() +
        " AND 'StartDay' = '" + "2017-05-01" + "'" ;
        var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
        var jqxhr = $.get(queryurl, dataHandler3);
    }

    function dataHandler3(resp3){
        $('#draw4').prop('disabled', false);

        var pred = resp3.rows["0"].slice(3,80);
        pred = _.map(pred,Number);
        // console.log(pred);
        var preIndex = 0;
        _.each(pred,function(thePred){
            commGeoj.features[preIndex].properties.pred = thePred;
            preIndex += 1;
        });
        // console.log(commGeoj.features); check whether properties written in

        var maxPred = Math.max.apply(Math, pred);
        var minPred = Math.min.apply(Math, pred);
        var predList = [];
        var predInter;
        if (minPred === 0){
            predInter = (maxPred - minPred) / 6;
        }else{
            predInter = (maxPred - minPred) / 5;
            predList.push(0);
        }
        for (var i = minPred; i <= maxPred; i+= predInter) {
            predList.push(Math.floor(i));
        }
        // console.log(predList);

        info3 = L.control();

        info3.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        info3.update = function (props) {
          this._div.innerHTML = '<h4>Prediction Pick-ups</h4>' +  (props ?
              '<div><span class="glyphicon glyphicon-stats" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' + props.pred +
              ' </b>' + ' Pick-ups</h5></div>'+
              '<div><span class="glyphicon glyphicon-map-marker" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"> In <b>' +
              props.community + '</b></h5></div>' +
              '<div><span class="glyphicon glyphicon-time" style="font-size: 15px;" aria-hidden="false"></span><h5 style="display: inline-block; margin-left:15px;"><b>' +
              (liveHour-1).toString() + ":00-" + liveHour + ":00 " +  '</b>'+ liveDate +'</h5></div>'
              : '<h5><b>Hover over a community</b><br />' );

          this._div.innerHTML += '<h6 class="pull-left">0</h6><h6 class="pull-right">' + maxPred + '</h6>';
          this._div.innerHTML += '<div><canvas id="myCanvas2" width="200" height="12" style="border:1px solid #d3d3d3;"></canvas></div>';
        };

        function addCanvas(theP){
            var c = document.getElementById("myCanvas2");
            var ctx = c.getContext("2d");
            var grd = ctx.createLinearGradient(0, 0, 200, 0);

            grd.addColorStop(0, "#fff7ec");
            grd.addColorStop(0.5, "#fc8d59");
            grd.addColorStop(1, "#990000");

            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 200, 100);

            ctx.strokeStyle="#003049";
            ctx.strokeRect(198 * theP.pred / maxPred,0,1,12);
        }

        info3.addTo(map2);
        addCanvas(0);

        function getColor(d) {
            return d > predList[6]  ? '#990000' :
                   d > predList[5]  ? '#d7301f' :
                   d > predList[4]  ? '#ef6548' :
                   d > predList[3]  ? '#fc8d59' :
                   d > predList[2]  ? '#fdbb84' :
                   d > predList[1]  ? '#fdd49e' :
                   d > predList[0]  ? '#fee8c8' :
                             '#fff7ec';
        }

        function predStyle(feature) {
            return {
                fillColor: getColor(feature.properties.pred),
                weight: 1,
                opacity: 1,
                color: '#f7f7e5',
                dashArray: '',
                fillOpacity: 0.7
            };
        }

        predComm = L.geoJson(commGeoj, {style: predStyle}).addTo(map2);
        var popup = L.popup();

        predComm.eachLayer(function(theL){
            // console.log(theL);
            theL.on("mouseover",function(e){
                this.setStyle({ weight: 2,
                                color: '#666',
                                dashArray: '3',
                                fillOpacity: 0.9
                              });
                this.bringToFront();
                info3.update(this.feature.properties);
                addCanvas(this.feature.properties);
            });
            theL.on("mouseout",function(e){
                this.setStyle({ weight: 1,
                                opacity: 1,
                                color: '#f7f7e5',
                                dashArray: '',
                                fillOpacity: 0.7
                });
            });
        });

    }
    getData3();

    function recomTime(){

        $('#draw4').click(function(){
            $('#draw4').prop('disabled', true);
            info3.removeFrom(map2);
            map2.removeLayer(predComm);
            showRecom();
        });

        var recommList = [
            [8, 32],
            [28, 76],
            [28, 76, 6],
            [28, 76, 6, 7, 24]
          ];

        _.each(recommList,function(theRec){
            var theOrder = recommList.indexOf(theRec);
            _.each(commGeoj.features, function(theComm){
                theComm.properties["recom" + theOrder.toString()] =
                  theRec.indexOf(theComm.properties.area_num_1) === -1 ?
                  0 : 1;
            });
        });

        function recomColor(phase, prop){
            if (prop.recom0 === 1) {
               return '#990000';
            }else if(prop['recom'+ phase.toString()]===1){
               return '#ef6548';
            }else{
               return '#fff7ec';
            }
        }


        console.log(commGeoj.features);

        function showRecom(){
            var thePhase = 0;
            var recomInterId;

            map2.setView([41.944215, -87.736277]);
            map2.setZoom(11);

            predComm = L.geoJson(commGeoj).addTo(map2);

            predComm.eachLayer(function(layer){
                layer.setStyle({fillColor: recomColor(thePhase,layer.feature.properties),
                                fillOpacity: 0.8,
                                color: '#f7f7e5',
                                weight: 1 });
            });

            recomInterId = setInterval(function(){
                thePhase += 1;
                predComm.eachLayer(function(layer){
                    layer.setStyle({fillColor: recomColor(thePhase,layer.feature.properties),
                                    fillOpacity: 0.8,
                                    color: '#f7f7e5',
                                    weight: 1 });
                });
                info4.update(thePhase);
                addCanvas();
            },2000);

            var recomTimeOut = setTimeout(recomPattern, 8100);

            function recomPattern() {
                clearInterval(recomInterId);
                map.removeLayer(predComm);
                info4.removeFrom(map2);
                getData3();
            }

            var info4 = L.control();

            info4.onAdd = function (map2) {
                this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
                this.update(thePhase);
                return this._div;
            };

            info4.update = function (Phase) {
                this._div.innerHTML = '<div><canvas id="recCanvas01" width="10" height="10" style="border:1px solid #d3d3d3;"></canvas><h5  style="display: inline-block; margin-left:5px; margin-right:5px;">Highest Demand </h5></div>'+
                    '<div><canvas id="recCanvas02" width="10" height="10" style="border:1px solid #d3d3d3;"></canvas><h5 style="display: inline-block; margin-left:5px; margin-right:5px; margin-bottom: 0px;">High Demand </h5></div>';
                this._div.innerHTML += Phase === 0 ? '<h4 style="margin-bottom:0px;">AlWAYS HOTSPOTS</h4>' + '<div><span class="glyphicon glyphicon-globe" style="font-size: 15px;" aria-hidden="false"></span><h4 style="display: inline-block; margin-left:15px;">' +
                        'Monday to Sunday </h4></div>':
                    Phase === 1 ? '<h4 style="margin-bottom:0px;">MONDAY - FRIDAY</h4>' + '<div><span class="glyphicon glyphicon-briefcase" style="font-size: 15px;" aria-hidden="false"></span><h4 style="display: inline-block; margin-left:15px;">' +
                        '8-10 AM 5-8 PM</h4></div>':
                    Phase === 2 ? '<h4 style="margin-bottom:0px;">MONDAY - FRIDAY</h4>' + '<div><span class="glyphicon glyphicon-sunglasses" style="font-size: 15px;" aria-hidden="false"></span><h4 style="display: inline-block; margin-left:15px;">' +
                        '10 PM - Midnight</h4></div>':
                        '<h4 style="margin-bottom:0px;">WEEKENDS</h4>' + '<div><span class="glyphicon glyphicon-glass" style="font-size: 15px;" aria-hidden="false"></span><h4 style="display: inline-block; margin-left:15px;">' +
                            '6 PM - Midnight</h4></div>';
            };

            function addCanvas(){
                var c = document.getElementById("recCanvas01");
                var ctx = c.getContext("2d");
                ctx.rect(0,0, 10, 10);
                ctx.fillStyle = "#990000";
                ctx.fill();

                var c2 = document.getElementById("recCanvas02");
                var ctx2 = c2.getContext("2d");
                ctx2.rect(0,0, 10, 10);
                ctx2.fillStyle = "#d7301f";
                ctx2.fill();
            }
            info4.addTo(map2);
            addCanvas();
        }
    }
    recomTime();
});

function getGameCC(){
    var query = "SELECT * FROM " + CCId + " WHERE 'START.DATE' = '" + liveDate +"'" ;//"2017-4-10'";
    var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
    var jqxhr = $.get(queryurl, dataHandlerCC);
}

function dataHandlerCC(resp){
    console.log(resp);
    if ('rows' in resp){
        var opponent = "Opponent :"+ resp.rows[0][4];
        var startEnd = "Time: " + resp.rows[0][2] + " to " + resp.rows[0][9];
        console.log(startEnd);
        $(".teamCC" ).text(opponent);
        $(".hourCC" ).text(startEnd);
    }else{
        $(".gameCC" ).text('Not a Game Day!');
    }
}

function getGameCWS(){
    var query = "SELECT * FROM " + CWSId + " WHERE 'START.DATE' = '" + liveDate +"'" ;//"2017-04-09'";
    var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
    var jqxhr = $.get(queryurl, dataHandlerCWS);
}

function dataHandlerCWS(resp){
    console.log(resp);
    if ('rows' in resp){
        var opponent = "Opponent :"+ resp.rows[0][4];
        var startEnd = "Time: " + resp.rows[0][2] + " to " + resp.rows[0][9];
        console.log(startEnd);
        $(".teamCWS" ).text(opponent);
        $(".hourCWS" ).text(startEnd);
    }else{
        $(".gameCWS" ).text('Not a Game Day!');
    }
}

getGameCC();
getGameCWS();

var ccIcon = L.icon({
    iconUrl: 'js/images/cc.png',
    iconSize:     [35, 35], // size of the icon
    iconAnchor:   [18, 18], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var ccMarker = L.marker([41.948275, -87.655392], {icon: ccIcon});//.addTo(map2);

var cwsIcon = L.icon({
    iconUrl: 'js/images/cws.png',
    iconSize:     [40, 52], // size of the icon
    iconAnchor:   [20, 25], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var cwsMarker = L.marker([41.829947, -87.634184], {icon: cwsIcon});//.addTo(map2);

$( ".CC" ).mouseover(function() {
   ccMarker.addTo(map2);
});

$( ".CC" ).mouseout(function() {
   map2.removeLayer(ccMarker);
});

$( ".CWS" ).mouseover(function() {
   cwsMarker.addTo(map2);
});

$( ".CWS" ).mouseout(function() {
   map2.removeLayer(cwsMarker);
});




//////////////////////////////////////////////////////////////////////////////
