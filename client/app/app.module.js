(function appModule() {
    'use strict';
    angular.module('app',
        [
            'ui.router',
            'uiGmapgoogle-maps'
        ])
        .constant('ScrapeUrl','http://localhost:8080/')
        .config(ConfigFunc)
        .config(MapsAPILoader)
        .filter('yearsAgo', YearsAgoFilter)
        .filter('fromNow', FromNowFilter)
        .filter('numbersOnly', numbersOnlyFilter)
        .filter('downPayment', DownPaymentFilter);

    /**
     * app UI-Router States
     * @ngInject
     **/
    function ConfigFunc($stateProvider,$urlRouterProvider) {
        $urlRouterProvider.otherwise('/listings');
        //Define ui-router states
        $stateProvider
            .state('/', {
                url: '/listings',
                controller:'appController',
                controllerAs:'ctrl',
                templateUrl: '/app/app.tpl.html'
            })
            .state('Help', {
                url: '/help',
                template:'app help'
            });
    }

    /**
     *
     * @param uiGmapGoogleMapApiProvider
     * @ngInject
     */
    function MapsAPILoader(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            //    key: 'your api key',
            v: '3.17',
            //libraries: 'weather,geometry,visualization'
        });
    }


    function YearsAgoFilter() {
        return function (dateString) {
            if(moment && dateString.length===4){
                return dateString + ' ('+ moment().diff('01/01/'+dateString, 'years') + ')';
            }else {
                return dateString;
            }
        };
    }

    function FromNowFilter() {
        return function (dateString) {
            if (dateString === null) {
                return '';
            }
            if (!moment) {
                return dateString;
            } else {
                return moment(dateString).fromNow();
            }
        };
    }

    function DownPaymentFilter(){
        return function (price) {
            if (price === null) {
                return '';
            }
            var newPrice = parseInt(price.replace('$','').replace(',',''));
            return '(5%: $'+Math.round(newPrice*0.05)+', 3.5%: $' + Math.round(newPrice*0.035)+')';

        };
    }

    function numbersOnlyFilter(){
        return function (string) {
            if (string === null) {
                return '';
            }
            var match = /^(\d+)/.exec(string);
            if(match && match.length){
                return match[0];
            }else{
                return string;
            }

        };
    }

})();