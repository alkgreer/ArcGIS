/*
PROGRAMMER:             Alisha Greer

LAST EDIT:              10/10/18

LAST EDIT DESCRIPTION:  Changed coloring of permits to match legend and changed query to query situs layer
                        for faster permit mapping.

CODE RETRIEVED FROM:    https://developers.arcgis.com/javascript/latest/sample-code/view-hittest/index.html

PROGRAM DESCRIPTION:    This javascript web app shows Permit info for inspections on mouse hover.
                        Also features a legend and Address Search widget
*/


var map, mapview, search, legend, permitLayer;
var legend_hidden = false;
var legend2_hidden = false;
var permit_types = ['CELL TOWER',
    'CELL TOWER ANTENNAS',
    'BUILDING COMMERCIAL',
    'BUILDING COMMERCIAL INFILL',
    'COMMERCIAL POOL',
    'COMMERCIAL FIRE SUPPRESSION',
    'SIGNS-BILLBOARDS'
];
var action_names = ['ELEVATION OF STRUCTURE',
    'BACKWATER VALVE',
    'FEMA',
    'SEWER',
    'YARD GRADE',
    'ONSITE',
    'WASTEWATER TREATMENT SYSTEM',
    'WELL',
    'INITIAL EROSION',
    'ENVIRONMENTAL FINAL',
    'VERIFY ELEVATION CERTIFICATE',
    'REVIEW ELEVATION/FLOODPLAIN',
    'ENVIRONMENTAL REVIEW',
    'SOILS REVIEW',
    'SITE REVIEW',
    'SITE VISIT '
];
require(["esri/Map",
        "esri/views/MapView",
        "esri/layers/MapImageLayer",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Search",
        'esri/Graphic',
        "esri/tasks/support/Query",
        "esri/tasks/QueryTask",
        'dojo/domReady!'
    ],
    function (Map, MapView, MapImageLayer, GraphicsLayer, Search, Graphic, Query, QueryTask) {
        "use strict";



        var graphicLayer = new GraphicsLayer();


        var permitLayer = new MapImageLayer({
            url: "https://gisarc.greenecountymo.gov:6443/arcgis/rest/services/Permits_Work2/MapServer",

        });



        map = new Map({
            basemap: "topo",
            layers: [permitLayer, graphicLayer]
        });

        mapview = new MapView({
            container: "mapview",
            map: map,
            center: [-93.29293475852167, 37.204744440817905],
            scale: 300000
        });

        search = new Search({
            view: mapview
        });
        mapview.ui.add(search, "top-right");


        mapview.ui.add("info", "top-right");
        mapview.ui.add("legend_toggle", "top-left");
        mapview.ui.add("legend", "bottom-left");
        mapview.ui.add("address_toggle", "top-right");
        mapview.ui.add("addressesNotFound", "bottom-right");

        // Set up an event handler for pointer-down (mobile)
        // and pointer-move events (mouse)
        // and retrieve the screen x, y coordinates
        mapview.on("pointer-move", eventHandler);
        mapview.on("pointer-down", eventHandler);


        function eventHandler(event) {
            // the hitTest() checks to see if any graphics in the view
            // intersect the given screen x, y coordinates

            mapview.hitTest(event).then(getGraphics);

        }

        function getGraphics(response) {
            // the topmost graphic from the hurricanesLayer
            // and display select attribute values from the
            // graphic to the user

            if (response.results.length) {
                var graphic = response.results.filter(function (result) {
                    return result.graphic.layer === graphicLayer;
                })[0].graphic;

                var attributes = graphic.attributes;
                var permit_no = attributes.permit_no;
                var permit_type = attributes.permit_type_name;
                var apn = attributes.apn;
                var action_name = attributes.action_name;
                var action_type = attributes.action_type;
                var permit_desc = attributes.permit_desc;
                var request_by = attributes.request_by;
                var phone = attributes.requester_phone;
                var approver = attributes.approver_name;
                var assigner = attributes.assigned_by;
                var instructions = attributes.instructions;
                var street = attributes.permit_loc_street;
                var city = attributes.permit_loc_city;
                var state = attributes.permit_loc_state;
                var zip = attributes.permit_loc_zip;
                var start_date = attributes.sched_start_date;




                document.getElementById("info").removeAttribute('hidden');
                document.getElementById("permitNumber").innerHTML = "<b>PERMIT_NO: </b>" + permit_no;
                document.getElementById("permitType").innerHTML = "<b>PERMIT_TYPE:</b> " + permit_type;
                document.getElementById("apn").innerHTML = "<b>APN:</b> " + apn;
                document.getElementById("actionName").innerHTML = "<b>ACTION_NAME:</b> " + action_name;
                document.getElementById("actionType").innerHTML = "<b>ACTION_TYPE:</b> " + action_type;
                document.getElementById("permitDesc").innerHTML = "<b>PERMIT_DESC:</b> " + permit_desc;
                document.getElementById("requestedBy").innerHTML = "<b>REQUESTER:</b> " + request_by;
                document.getElementById("phone").innerHTML = "<b>PHONE:</b> " + phone;
                document.getElementById("approver").innerHTML = "<b>APPROVER:</b> " + approver;
                document.getElementById("assigner").innerHTML = "<b>ASSIGNER:</b> " + assigner;
                document.getElementById("instructions").innerHTML = "<b>INSTRUCTIONS:</b> " + instructions;
                document.getElementById("address").innerHTML = "<b>ADDRESS:</b> " + street + " " +
                    city + " " + state + " " + zip;
                document.getElementById("date").innerHTML = "<b>START_DATE:</b> " + start_date;

            } else {

                document.getElementById("info").setAttribute('hidden', 'hidden');

            }


        }


        permitLayer.when(function () {
            permitLayer.findSublayerById(9).visible = false;

        });

        $.getJSON('https://int4-dev.greenecountymo.gov/file/json/PermitMap/connect.json', function (data) {
            var myObj = data;

            var query = new Query();
            var string_q;
            var way_q;
            var highway_q;
            for (var index = 0; index < myObj.length; index++) {
                const j = index;
                // Define query SQL expression
                string_q = myObj[j].permit_loc_street;

                way_q = string_q.slice(0, -3);
                highway_q = string_q.slice(-2, string_q.length);
                query.where = "'" + string_q + "'= PRIM_NUM || ' ' ||  PRE_DIR || ' ' || STR_NAM || ' ' || STR_TYPE or" +
                    "'" + string_q + "'= PRIM_NUM || ' ' ||  PRE_DIR || ' ' || STR_NAM or" +
                    "'" + way_q + "'= PRIM_NUM || ' ' ||  PRE_DIR || ' ' || STR_NAM or" +
                    "'" + string_q + "'= PRIM_NUM || ' ' ||  PRE_DIR || ' ' ||  'STATE' || ' ' || STR_TYPE || ' ' ||" + "'" + highway_q + "'" + "or" +
                    "'" + string_q + "'= PRIM_NUM || ' ' ||  PRE_DIR || ' ' ||  'STATE' || ' ' || STR_TYPE ||" + "'" + highway_q + "'";

                query.outFields = ["*"];
                query.returnGeometry = true;

                // Define the query task
                var queryTask = new QueryTask({
                    url: "https://gisarc.greenecountymo.gov:6443/arcgis/rest/services/Permits_Work2/MapServer/6"
                });


                // Execute the query
                queryTask.execute(query)
                    .then(function (result) {
                        var markerSymbol;
                        var point = {
                            type: "point", // autocasts as new Point()
                        };

                        point.x = result.features[0].attributes.XCOORD;
                        point.y = result.features[0].attributes.YCOORD;

                        if (action_names.indexOf(myObj[j].action_name) > -1) {
                            markerSymbol = {
                                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                                color: [0, 255, 0],
                                size: 10
                            };

                        } else if (permit_types.indexOf(myObj[j].permit_type_name) > -1) {
                            markerSymbol = {
                                type: "simple-marker",
                                color: [0, 0, 255],
                                size: 10
                            };

                        } else {
                            markerSymbol = {
                                type: "simple-marker",
                                color: [255, 0, 0],
                                size: 10
                            };

                        }



                        var pointGraphic = new Graphic({
                            geometry: point,
                            symbol: markerSymbol,
                            attributes: {
                                action_name: myObj[j].action_name,
                                permit_no: myObj[j].permit_no,
                                permit_type_name: myObj[j].permit_type_name,
                                apn: myObj[j].apn,
                                action_type: myObj[j].action_type,
                                permit_desc: myObj[j].permit_desc,
                                requested_by: myObj[j].requested_by,
                                requester_phone: myObj[j].requester_phone,
                                approver_name: myObj[j].approver_name,
                                assigned_by: myObj[j].assigned_by,
                                instructions: myObj[j].instructions,
                                permit_loc_street: myObj[j].permit_loc_street,
                                permit_loc_city: myObj[j].permit_loc_city,
                                permit_loc_state: myObj[j].permit_loc_state,
                                permit_loc_zip: myObj[j].permit_loc_zip,
                                sched_start_date: myObj[j].sched_start_date,
                                request_by: myObj[j].request_by


                            }
                        });
                        graphicLayer.add(pointGraphic);
                        //mapview.graphics.add(pointGraphic);


                    })
                    .otherwise(function (e) {
                        document.getElementById("address_toggle").removeAttribute("hidden");
                        document.getElementById("unfoundAddress").innerHTML += "<b>UNFOUND ADDRESS:</b>" + myObj[j].permit_loc_street + '<br>';

                    });
            }

        });

    });



function toggleLegend(input) {
    if (legend_hidden) {
        document.getElementById("legend").removeAttribute("hidden");
        legend_hidden = false;
    } else {
        document.getElementById("legend").setAttribute("hidden", "hidden");
        legend_hidden = true;
    }
}

function toggleUnfoundPermits() {
    if (legend2_hidden) {
        document.getElementById("addressesNotFound").removeAttribute("hidden");
        legend2_hidden = false;
    } else {
        document.getElementById("addressesNotFound").setAttribute("hidden", "hidden");
        legend2_hidden = true;
    }

}