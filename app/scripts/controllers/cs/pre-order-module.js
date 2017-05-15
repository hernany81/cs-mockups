angular
    .module('homer')
    .controller('csEditPreOrder', ['$scope', '$filter', 'beCalendarService','beConsumerService', 'ClientStatusService',
    function($scope, $filter, beCalendarService, beConsumerService, ClientStatusService) {
      // Config variables for DOM edition
      $scope.data = {
        created: false,
        dataLoaded: false,
        active: 0,
        month: "",
        weeks: [],
        pagination: ClientStatusService.getStatus('preorder/pagination', {
            pageSize: 20,
            totalItems: 0,
            currentPage: []
        })
      };

      $scope.data.month = beCalendarService.calculateMonth();
      $scope.data.weeks = beCalendarService.calculateWeeks();
      $scope.preorders = [];

      createPreorderTabs();

      $scope.createPreorder = function() {
        $scope.data.created = true;
      };

      function createPreorderTabs() {
        _.each($scope.data.weeks, function(item, index){
          var preorder = {
              index: index,
              weekDate: item,
              items: [],
              status: 'DRAFT',
              billingInfo: {},
              shippingInfo: {},
              type: 'PREORDER',
              requestDateType: 'SIMPLE',
              totalSellCharge: 0
            };
          $scope.preorders.push(preorder);
        });
      }
    /*
      $scope.loadCustomersList = function(){

      };

      $scope.loadDistributorsList = function(){

      };
      */

  }]);
