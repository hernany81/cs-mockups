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
                parentPreorderId: '@'
            },
            controller: function($scope, $filter, GridColumnConfigBuilder, OrderSettingsService, beConsumerService) {
              $scope.labels = OrderSettingsService.getLabels('REGULAR');
              $scope.settings = OrderSettingsService.getSettings('REGULAR'); //PREORDER

              var showOrderIdColumn = false;

              console.log("$scope.settings.hasSkuItemLevel " +$scope.settings.hasSkuItemLevel);

              function getEditableQuantityTemplate(editableCondition) {
                        var template =
                        '<div class="ngCellInput" ng-if="[EDITABLE_CONDITION]">' +
                            '<form app-validation-wrapper novalidate>' +
                                '<input type="number" ng-model="row.entity.quantity" min="0" '+ //ng-model-options="{allowInvalid: true}" ' +
                                //' min-than-field="sku.inventoryLevel" ' +
                                  //  'min-than-field-validation-key="minSkuStockValidation" min-than-field-validation-active="grid.appScope.data.checkInventoryValidation" ' +
                                    'ng-change="grid.appScope.updateItem(row.entity)" app-validated>' +
                            '</form>' +
                        '</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="![EDITABLE_CONDITION]">{{row.entity.quantity | number}}</div>';

                        return template;
                        //template.replace(/\[EDITABLE_CONDITION\]/g, editableCondition);
                    }


              $scope.columnsConfBuilder = new ConditionalListBuilder();
              $scope.columnsConfBuilder
                .add(GridColumnConfigBuilder.displayName('category').field('sku.product.parent.ancestorNames').minWidth('150').cellFilter("join: ' > '").build(), $scope.settings.hasProductCategoryItemLevel)                .add(GridColumnConfigBuilder.displayName('farm state').field('sku.farm.primaryAddress.state').minWidth('100').build(), $scope.settings.hasCustomerStateItemLevel)
                .add(GridColumnConfigBuilder.displayName('product name').field('sku.product.name').minWidth('300').width('*').sorted().build())
                .add(GridColumnConfigBuilder.displayName('units').field('sku.productUnit.name').minWidth('150').alignRight().build())
                .add(GridColumnConfigBuilder.displayName('vendor').field('sku.farm.name').cellTemplate('<div class="ui-grid-cell-contents">{{row.entity.sku.farm.name}}, {{row.entity.sku.farm.primaryAddress.state}}</div>').minWidth('200').build())
                .add(GridColumnConfigBuilder.displayName('miles').field('sku.distance').minWidth('100').alignRight().build())
                .add(GridColumnConfigBuilder.displayName('tags').field('sku.tags.name').cellClass('tags').cellTemplate('<div class="ngCellText" ng-bind-html="row.entity.sku.tags | concat: row.entity.tags | tagsUl"></div>').minWidth('150').build())
                .add(GridColumnConfigBuilder.displayName('attributes').field('sku.productAttributes').alignCenter().minWidth('100').cellTemplate('<product-attributes-flag product-attributes="row.entity.sku.productAttributes"></product-attributes-flag>').sortable(false).build())
                .add(GridColumnConfigBuilder.displayName('certifications').field('sku.farm.documents').minWidth('120').alignCenter().minWidth('60').cellTemplate('<certificates-flag documents="row.entity.sku.farm.documents"></certificates-flag>').sortable(false).build())
                .add(GridColumnConfigBuilder.displayName($scope.labels.body.sellPrice).field('sellPrice').cellFilter('currency').alignRight().width('100').build(), $scope.settings.hasSellPriceItemLevel)
                //.add(GridColumnConfigBuilder.field('quantity').width('80').pinRight().build())
                .add(GridColumnConfigBuilder.field('total').cellFilter('currency').width('80').pinRight().build())

                .add(GridColumnConfigBuilder.field('quantity').alignRight().width('80').cellTemplate(getEditableQuantityTemplate()).pinRight().build());


              $scope.data = {
                  showView: "Grid",
              //    boxes: {
                    dataLoaded: true,
                    //Not using ClientStatusService as each preorder needs her own pagination status and the the service does not offer other logice than storing a single status.
                    pagination: {
                        pageSize: 20,
                        totalItems: 0,
                        currentPage: 1
                    },
                    rows: [],
                    results: [],
              //    },
                  //Grid options
                    gridConfig: {
                      showCreateBtn: false,
                      gridOptions: {
                        version: 9,
                        columnDefs: $scope.columnsConfBuilder.getList()
                      },
                      dataSource:[]
                    }
              };

              function updateViewItems(){
                  var preorder = $scope.preorder;
                  //scope.data.results-> source of truth
                  //Update quantities from preorder to results
                  _.each($scope.data.results, function(result){
                      var i = _.find(preorder.items, function(item){
                        return item.sku.id === result.sku.id;
                      });
                      if (i){
                        result.quantity = i.quantity;
                      }
                  });

                  var rows = $filter('splitCollection')($scope.data.results, 4);
                  angular.copy(rows, $scope.data.rows);
                  angular.copy($scope.data.results, $scope.data.gridConfig.dataSource);

              };

              $scope.$watch('data.showView', function(){
                  updateViewItems();
              });

              $scope.search = function(pageNbr){
                 console.log("in search - pageNbr "+pageNbr);
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

                    //Update quantities from preorder to results
                    angular.copy(resp, $scope.data.results);

                    updateViewItems();

                    $scope.data.dataLoaded = true;
                  });
              };

              /**************/
              //FIXME set the same results array for both grid and boxes view. Need to isolate and control grid scope.
              /**************/
              $scope.updateItem = function(item){
                  var preorder = $scope.preorder;
                  var orderTotal = 0;
                  var previousItemTotal = 0;
                  var newItemTotal = 0;

                  //If existing total is greater than 0, then I only update the item, otherwise I also add the item to the preorder
                  if(item) {
                      previousItemTotal = item.total;
                      newItemTotal = item.quantity * item.sellPrice;

                      console.log("previousItemTotal is "+ previousItemTotal);
                      console.log("newItemTotal" + newItemTotal);

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

                  console.log("update item, preorder has " + preorder.items.length + " items");

                // $scope.refreshValidationStatus();
                // $scope.refreshInventoryValidation();
              };

              $scope.search(1);
            }
        }
    });
