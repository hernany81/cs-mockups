angular
    .module('homer')
    .controller('csEditPreOrder', ['$scope', '$filter', 'beCalendarService','beConsumerService',
    function($scope, $filter, beCalendarService, beConsumerService) {
      // Config variables for DOM edition
      $scope.data = {
        created: false,
        showView: "Boxes",
        dataLoaded: false,
        totalItems: 0,
        results : []
      };

      $scope.month = beCalendarService.calculateMonth();
      $scope.weeks = beCalendarService.calculateWeeks();

      beConsumerService.loadSelectableItems().then(function(resp) {
        // FIXME Method copied from b2c-buy-module.js controller, this needs to be moved to a pagination service -->
        $scope.data.results.length = 0;
        $scope.data.dataLoaded = true;

        $scope.data.totalItems = 19;
        //parseInt(resp.headers('X-hedtech-totalCount'));

        var data = $filter('splitCollection')(resp.data, 4);

        _.each(data, function(item) {
            $scope.data.results.push(item);
        });

      });

      $scope.savePreOrder = function() {
        $scope.data.created = true;
      };



    /*
      $scope.loadCustomersList = function(){

      };

      $scope.loadDistributorsList = function(){

      };
      */

  }]);
