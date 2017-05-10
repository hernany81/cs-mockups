angular
    .module('cs.loading-indicator', [])
    .directive('loadingLine',
        function() {
            return {
                restrict: 'E',
                replace: true,
                template: '<div class="top-loading-bar"><div class="color-line" ng-if="!loading"></div><uib-progressbar value="100" type="success" class="progress-striped active full progress-small" ng-if="loading" style="margin-bottom: 0"></uib-progressbar></div>',
                controller: function($scope, LoadingService) {
                    $scope.loading = false;

                    LoadingService.addListener(function(val) {
                        $scope.loading = val;
                    });
                }
            }
        }
    )
    .factory('LoadingService', function($timeout, $log) {
        var counter = 0, listeners = [], stopCanceler = null, logger = $log.getInstance('components.LoadingService');

        return {
            start: function() {
                counter++;

                if(counter == 1) {
                    // Changed state from not loading to loading

                    if(stopCanceler) {
                        logger.trace("There is a stop loading scheduled, canceling");
                        $timeout.cancel(stopCanceler);
                        stopCanceler = null;
                    } else {
                        logger.trace("Scheduling start loading listener notifications");
                        $timeout(function() {
                            logger.trace("Notifying start loading listeners");
                            _.each(listeners, function(listener) {
                                listener(true);
                            });
                        });
                    }
                }
            },

            stop: function() {
                counter--;

                if(counter == 0) {
                    // Changed state from loading to not loading
                    logger.trace("Scheduling stop loading listener notifications");
                    stopCanceler = $timeout(function() {
                        logger.trace("Notifying stop loading listeners");
                        _.each(listeners, function(listener) {
                            listener(false);
                        });

                        stopCanceler = null;
                    }, 200);
                }

                if(counter < 0) {
                    counter = 0;
                }
            },

            addListener: function(listener) {
                listeners.push(listener);
            }
        }
    });