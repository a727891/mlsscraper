(function scraperFactory() {
    'use strict';
    angular.module('app')
        .factory('scraper', scraperFactoryDefinition);

    /**
     * app - scrapper Factory
     *
     * @class {scraper}
     * @returns {scraper}
     * @ngInject
     **/
    function scraperFactoryDefinition($http, $window, $q, ScrapeUrl) {
        var scraperFactoryDef = {
            getScrape: scrape,
            addWatch: watch,
            addIgnore: ignore,
            resetMLS: reset,
            goToDetails: goToDetailsView,
            getCacheTimeout: getCacheTime
        };

        var cachedUntil = 0;
        var cachedList = [];
        var sessionId = 0;

        return scraperFactoryDef;
        //////////////////////////////////////////////
        function scrape(){
            if(Date.now() > cachedUntil){
                return $http.get(ScrapeUrl+'scrape').then(function(data){
                    cachedUntil = data.data.cachedUntil;
                    sessionId = data.data.session;
                    return cachedList = data.data.list;
                });
            } else{
                return $q.when(cachedList)
            }

        }
        function getCacheTime(){
            return cachedUntil;
        }

        function goToDetailsView(record){
            var url = 'http://lubbock.rapmls.com/scripts/mgrqispi.dll?'+
                'APPNAME=lubbock&PRGNAME=MLSPropertyDetail'+
                '&ARGUMENTS=-N' + sessionId + '%2C-N' + record.RID + '%2C-N0%2C-A%2C-N1850103'+
                '&VCR_String=' + record.mls + '-'+
                '&VCR_RID_String=' + record.RID + ''+
                '&Listing_Cart_Count=0'+
                '&Listing_RID=' + record.RID + ''+
                '&Section_Type=&IDXSearchType=';
            $window.open(url, '_blank');
        }

        function watch(mls) {
            return $http.get(ScrapeUrl+'watch/'+mls).then(function(data){
                return data.data;
            });
        }

        function ignore(mls) {
            return $http.get(ScrapeUrl+'ignore/'+mls).then(function(data){
                return data.data;
            });
        }

        function reset(mls) {
            return $http.get(ScrapeUrl+'viewed/'+mls).then(function(data){
                return data.data;
            });
        }



    }

})();