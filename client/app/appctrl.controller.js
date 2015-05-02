(function appcController() {
    'use strict';
    angular.module('app')
        .controller('appController', appControllerDefinition);

    /**
     * app - appController
     *
     * @class {appController}
     *
     * @ngInject
     **/
    function appControllerDefinition(scraper, uiGmapGoogleMapApi) {
        var self = this;

        self.refresh = activate;
        self.data = [];

        self.status = [
            'New',
            'Watched',
            'Removed',
            'Viewed',
            'Ignored'
        ];
        self.subStatus = [
            'Active',
            'Contingent'
        ];
        self.activeFilter = self.status[0];

        self.map = {//33.5702636,-101.874539,12z
            center: { latitude: 33.5702636, longitude: -101.874539 },
            zoom: 12,
            markers: []
        };

        self.cacheAge = Date.now();

        self.mapWindow = {
            show: false,
            coords:{},
            record:{},
            options:{
            }
        };

        ///////////////////////////////////////
        activate();
        /**
         * Activate is called upon controller construction
         *
         **/
        function activate() {
            uiGmapGoogleMapApi.then(function() {
                scraper.getScrape().then(function(data){
                    self.data = data;
                    //Get listing data once maps api is loaded
                    self.mapWindow.show = false;
                    //Add map markers
                    self.map.markers = [];
                    self.data.map(function(record){
                        if (record.userStatus!=='Ignored'){
                            addMarker(record);
                        }
                    });
                    self.cacheAge = scraper.getCacheTimeout();
                });
            });
        }
        ///////////////////////////////////////
        function addMarker(record){
            self.map.markers.push(
                {
                    id: record.mls,
                    coords: {
                        latitude: record.lat,
                        longitude: record.lon
                    },
                    options:{
                        title:record.price,
                        visible:record.mapit
                    },
                    data: record
                }
            );
        }

        self.onClick = function(GMarkerObj,event,model) {
            self.mapWindow.coords = model.coords;
            self.mapWindow.show = true;
            self.mapWindow.record = model.data;
        };

        self.closeClick = function() {
            self.mapWindow.show = false;
        };
    }

})();