(function recordDirective() {
    'use strict';
    angular.module('app')
        .directive('recordDir', recordDirectiveDefinition);

    function recordDirectiveDefinition() {
        return {
            controller: recordController,
            controllerAs: 'r',
            bindToController:true,
            restrict: 'EA',
            replace: true,
            scope: {
                record:'='
            },
            templateUrl: '/app/record.tpl.html'
        };

        /**
         * record Directive Controller
         * @ngInject
         **/
        function recordController(scraper) {
            var self = this;
            self.record.mapit = (self.record.userStatus === 'Watched');

            self.mapToggle = function(){
                self.record.mapit = !self.record.mapit;
            };
            self.ignore = function() {
                scraper.addIgnore(self.record.mls).then(updateUserStatus);
            };
            self.watch = function() {
                scraper.addWatch(self.record.mls).then(updateUserStatus);
            };
            self.reset = function() {
                scraper.resetMLS(self.record.mls).then(updateUserStatus);
            };

            function updateUserStatus(model){
                self.record.userStatus = model.userStatus;
            }

            self.openDetails = function(){
                scraper.goToDetails(self.record);
            };
        }

    }

})();