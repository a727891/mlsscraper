
(function LoadingIndicatorDirective() {
    'use strict';
    angular.module('app')
        .directive('oadingIndicator', LoadingIndicatorDirectiveDefinition);

    /**
     * GCO loading indicator directive
     * @param {$rootScope} $rootScope
     * @returns {{link: LoadingIndicatorLink, restrict: string, templateUrl: string, replace: boolean}}
     * @ngInject
     */
    function LoadingIndicatorDirectiveDefinition($rootScope) {
        return {
            link:         LoadingIndicatorLink,
            restrict:     'EA',
            templateUrl: '/app/LoadingIndicator.tpl.html',
            replace: true
        };

        /**
         * LoadingIndicator Directive Linker
         **/
        function LoadingIndicatorLink(scope) {
            scope.isStateLoading = false;
            scope.isCustomLoading = false;
            scope.error = false;
            scope.message = '';

            function reset() {
                scope.isStateLoading = true;
                scope.error = false;
                scope.message = 'Loading MLS data...';
            }
            reset();
            var start = $rootScope.$on('$stateChangeStart', function() {
                reset();
            });
            var success = $rootScope.$on('$stateChangeSuccess', function() {
                scope.isStateLoading = false;
            });
            var err = $rootScope.$on('$stateChangeError',
                function(event, toState, toParams, fromState, fromParams, error) {
                //Only display string errors at this time
                if (!(typeof error === 'object' || error.toString === '[object object]')) {
                    scope.error = true;
                    scope.message = error.toString();
                } else {
                    scope.isStateLoading = false;
                }
            });

            scope.$on('$destroy', function cleanup() {
                start();
                success();
                err();
            });

        }
    }

})();