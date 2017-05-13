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
        rows : []
      };
      $scope.activeTab = 0;
      $scope.month = beCalendarService.calculateMonth();
      $scope.weeks = beCalendarService.calculateWeeks();
      $scope.preorders = [];
    //  $rootScope.activeTabIndex = 2;

      createTabs();
      $scope.preorderActive = $scope.preorders[0];

      beConsumerService.loadSelectableItems().then(function(resp) {
        // FIXME Method copied from b2c-buy-module.js controller, this needs to be moved to a pagination service -->
        $scope.data.rows.length = 0;
        $scope.data.dataLoaded = true;

        $scope.data.totalItems = 19;
        //parseInt(resp.headers('X-hedtech-totalCount'));

        $scope.data.rows = $filter('splitCollection')(resp.data, 4);

        //FIXME -> this can be VERY unefficient
        _.each($scope.preorders, function(preorder){
            preorder.items = resp.data;
        })

      });


      $scope.$watch('activeTab', function(newVal, oldVal) {
          if(newVal != oldVal) {
            console.log("change in active - OldValue:"+ oldVal+" and newVal:"+newVal);
              $scope.preorderActive = $scope.preorders[newVal];
          }
      });

//FIXME el calculo del total de la orden ya se esta haciendo en EditOrderController. Sacar todo a un servicio.
      $scope.updateItem = function(item){
          if(item) {
              item.total = item.quantity * item.sellPrice;
          }

          var total = 0;
          _.each($scope.preorderActive.items, function(oi) {
              if(oi.total) {
                  total += oi.total;
              }
          });

          $scope.preorderActive.totalSellCharge = total;

        // $scope.refreshValidationStatus();
        // $scope.refreshInventoryValidation();
      }

      $scope.savePreOrder = function() {
        $scope.data.created = true;
      };

      function createTabs() {
        _.each($scope.weeks, function(item, index){
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
