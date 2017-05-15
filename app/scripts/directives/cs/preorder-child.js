'use strict';

angular
    .module('homer')
    .directive('preorderChild', function() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/cs/directives/preorder/preorder-child.html',
            scope: {
                preorder: '=',
                parentPreorderId: '@',
                totalSelectableItems: '@',
                pageSize: '@'
            },

            link: function(scope, elem) {

            },
            controller: function($scope, $filter, beConsumerService) {
              $scope.data = {
                  showView: "Boxes",
                  dataLoaded: true,
                  //Not using ClientStatusService as each preorder needs her own pagination status and the the service does not offer other logice than storing a single status.
                  pagination: {
                      pageSize: 20,
                      totalItems: 0,
                      currentPage: 1
                  },
                  results: []
              };

              $scope.search = function(pageNbr){
                  $scope.data.results.length = 0; //Removing existing results.
                  var pagination = $scope.data.pagination;
                  var preorder = $scope.preorder;

                  if(!_.isUndefined(pageNbr)) {
                    pagination.currentPage = pageNbr;
                  }

                  var filters = {
                  offset: (pagination.currentPage - 1) * pagination.pageSize,
                  max: pagination.pageSize
                  }

                  beConsumerService.loadSelectableItems(filters).then(function(resp) {
                    pagination.totalItems = 36; //FIXME parseInt(resp.headers('X-hedtech-totalCount'));

                    //Update quantities
                    _.each(resp, function(result){
                        var i = _.find(preorder.items, function(item){
                          return item.sku.id === result.sku.id;
                        });
                        if (i){
                          result.quantity = i.quantity;
                        }    
                    });

                    var rows = $filter('splitCollection')(resp, 4);
                    angular.copy(rows, $scope.data.results);

                    $scope.data.dataLoaded = true;
                  });
              };


              //FIXME el calculo del total de la orden ya se esta haciendo en EditOrderController. Sacar todo a un servicio.
              $scope.updateItem = function(item){
                  var preorder = $scope.preorder;
                  var orderTotal = 0;
                  var previousItemTotal = 0;
                  var newItemTotal = 0;
                  //If existing total is greater than 0, then I only update the item, otherwise I also add the item to the preorder
                  if(item) {
                      previousItemTotal = item.total;
                      newItemTotal = item.quantity * item.sellPrice;

                      item.total = newItemTotal;

                      if (previousItemTotal === 0 && newItemTotal > 0){
                        $scope.preorder.items.push(item);
                      }

                      if (previousItemTotal > 0 && newItemTotal === 0){
                        //Delete the item from the order? is it actually necessary? Can we do it only once when saving the order?
                      }
                  }

                  _.each(preorder.items, function(oi) {
                      if(oi.total) {
                          orderTotal += oi.total;
                      }
                  });

                  preorder.totalSellCharge = orderTotal;

                // $scope.refreshValidationStatus();
                // $scope.refreshInventoryValidation();
              };

              $scope.search(1);

            }
        }
    });
