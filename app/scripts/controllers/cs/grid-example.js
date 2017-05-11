angular
    .module('homer')
    .controller('csGridExample', ['$scope', '$timeout', 'GridColumnConfigBuilder', 'OrderSettingsService', 'GRID_EVENT', 'sweetAlert',
        function ($scope, $timeout, colBuilder, OrderSettingsService, GRID_EVENT, sweetAlert) {

            $scope.labels = OrderSettingsService.getLabels('REGULAR');
            $scope.settings = OrderSettingsService.getSettings('REGULAR');

            var showOrderIdColumn = true;

            $scope.columnsConfBuilder = new ConditionalListBuilder();
            $scope.columnsConfBuilder
                .add(colBuilder.displayName('customer').field('customer.name').minWidth('250').build())
                .add(colBuilder.displayName($scope.labels.header.orderNbr).field('order.orderId').minWidth('110').width('*').cellFilter("leftPad: 10 : '0'").alignRight().build(), showOrderIdColumn)
                .add(colBuilder.displayName('CP Invoice #').field('order.cpInvoiceNbr').minWidth('110').alignRight().build(), $scope.settings.hasCpInvoiceNbr)
                .add(colBuilder.displayName('customer').field('customer.name').sortable(true).minWidth('250').build())
                .add(colBuilder.displayName('ship to').field('order.shippingInfo.name').width('150').build())
                .add(colBuilder.displayName('distributor').field('distributor.name').minWidth('200').build())
                .add(colBuilder.displayName('cust ord #').field('order.customerOrderNbr').minWidth('100').alignRight().build(), $scope.settings.hasCustomerOrderNbr)
                .add(colBuilder.displayName('status').field('order.status').cellTemplate('<div class="ui-grid-cell-contents"><order-status-label status="row.entity.order.status"/></div>').width('100').build())
                .add(colBuilder.displayName('submit date').field('order.submissionDt').cellFilter("date: 'yyyy-MM-dd'").alignRight().width('110').build())
                .add(colBuilder.displayName('confirm date').field('order.confirmedDt').cellFilter("date: 'yyyy-MM-dd'").alignRight().width('110').build(), $scope.settings.hasConfirmationDate)
                .add(colBuilder.displayName('fulfillment date').field('order.fulfillmentDt').cellFilter("date: 'yyyy-MM-dd'").alignRight().width('110').build(), $scope.settings.hasFulfillmentDate)
                .add(colBuilder.displayName($scope.labels.header.dateInput).field('order.requestDt').cellFilter("deliveryDate: row.entity.order.requestDateType:row.entity.order.requestEndDt").alignRight().width('150').build())
                .add(colBuilder.displayName('total charge').field('order.totalCharge').cellFilter('currency').alignRight().width('150').build())
                .add(colBuilder.displayName('farm tracking').field('order.missingFarmTrackingItems').cellTemplate('<div class="ui-grid-cell-contents">{{row.entity.order.missingFarmTrackingItems == 0 ? "COMPLETE" : "INCOMPLETE"}}</div>').alignRight().width('120').sortable(false).build(), $scope.settings.hasFarmTrackingInfo)
                .add(colBuilder.displayName('created on').field('order.dateCreated').cellFilter("date: 'yyyy-MM-dd HH:mm'").minWidth('125').sorted('desc').build())
                .add(colBuilder.displayName('created by').field('order.createdBy.name').minWidth('150').build())
                .add(colBuilder.toolbar().cellTemplate('<grid-item-crud-toolbar item="row.entity" editable="row.entity.order.editable" deletable="row.entity.order.deletable"/>').build());

            $scope.datagridConfig = {
                dataSource: function (params) {
                    return $scope.getExampleEntities();
                },
                gridOptions: {
                    version: 9,
                    columnDefs: $scope.columnsConfBuilder.getList()
                }
            };

            $scope.$on(GRID_EVENT.VIEW_ITEM, function(ev, item) {
                sweetAlert.swal({
                    title: "View Item",
                    text: "It should open the view item details screen",
                    type: "success"
                });            });

            $scope.$on(GRID_EVENT.UPDATE_ITEM, function(ev, item) {
                sweetAlert.swal({
                    title: "Edit Item",
                    text: "It should open the edit item screen",
                    type: "success"
                });
            });

            $scope.$on(GRID_EVENT.DELETE_ITEM, function(ev, item) {
                sweetAlert.swal({
                    title: "Item deleted",
                    text: "But not really",
                    type: "success"
                });
            });

            $scope.getExampleEntities = function () {
                return new Promise(function (resolve, reject) {
                    resolve( {
                        total: 10,
                        data: [
                            {
                                "id": 8395,
                                "orderId": 8277,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "FULFILLED",
                                "submissionDt": "2017-04-19T15:56:19Z",
                                "confirmedDt": "2017-04-19T16:01:58Z",
                                "fulfillmentDt": "2017-04-19T16:08:52Z",
                                "requestDt": "2017-04-28",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 32.0,
                                "shippingInfo": {
                                    "name": "Constantine"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-04-19T15:56:19Z",
                                "createdBy": {
                                    "id": 783,
                                    "name": "Constantine"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Chef Constantine"
                                },
                                "distributor": {
                                    "name": "FarmLogix"
                                },
                                "missingFarmTrackingItems": 0
                            },
                            {
                                "id": 8394,
                                "orderId": 8276,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "CONFIRMED",
                                "submissionDt": "2017-04-18T21:51:19Z",
                                "confirmedDt": "2017-04-18T22:02:00Z",
                                "fulfillmentDt": null,
                                "requestDt": "2017-04-26",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 89.9,
                                "shippingInfo": {
                                    "name": "Jeff Muldrow"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-04-18T21:51:19Z",
                                "createdBy": {
                                    "id": 592,
                                    "name": "Mather Evanston"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Jeff Muldrow"
                                },
                                "distributor": {
                                    "name": "FarmLogix"
                                },
                                "missingFarmTrackingItems": 0
                            },
                            {
                                "id": 8393,
                                "orderId": 8275,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "FULFILLED",
                                "submissionDt": "2017-04-18T21:23:38Z",
                                "confirmedDt": "2017-04-18T21:46:43Z",
                                "fulfillmentDt": "2017-04-18T21:46:55Z",
                                "requestDt": "2017-04-28",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 271.2,
                                "shippingInfo": {
                                    "name": "Jeff Muldrow"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-04-18T21:23:38Z",
                                "createdBy": {
                                    "id": 592,
                                    "name": "Mather Evanston"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Jeff Muldrow"
                                },
                                "distributor": {
                                    "name": "FarmLogix"
                                },
                                "missingFarmTrackingItems": 0
                            },
                            {
                                "id": 8392,
                                "orderId": 8274,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "ARCHIVED",
                                "submissionDt": "2017-04-18T19:54:59Z",
                                "confirmedDt": null,
                                "fulfillmentDt": null,
                                "requestDt": "2017-04-28",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 49.75,
                                "shippingInfo": {
                                    "name": "Jeff Muldrow"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-04-18T19:54:59Z",
                                "createdBy": {
                                    "id": 592,
                                    "name": "Mather Evanston"
                                },
                                "editable": false,
                                "deletable": false,
                                "customer": {
                                    "name": "Jeff Muldrow"
                                },
                                "distributor": {
                                    "name": "FarmLogix"
                                },
                                "missingFarmTrackingItems": 0
                            },
                            {
                                "id": 8379,
                                "orderId": 8273,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "CONFIRMED",
                                "submissionDt": "2017-03-30T18:33:35Z",
                                "confirmedDt": "2017-04-18T14:45:16Z",
                                "fulfillmentDt": null,
                                "requestDt": "2017-04-06",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 10.0,
                                "shippingInfo": {
                                    "name": "Chandler High School"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-03-30T18:16:47Z",
                                "createdBy": {
                                    "id": 777,
                                    "name": "CHS Production Chef"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Chandler High School"
                                },
                                "distributor": {
                                    "name": "Sysco AZ"
                                },
                                "missingFarmTrackingItems": 1
                            },
                            {
                                "id": 8378,
                                "orderId": 8272,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "SUBMITTED",
                                "submissionDt": "2017-03-30T15:12:18Z",
                                "confirmedDt": null,
                                "fulfillmentDt": null,
                                "requestDt": "2017-04-07",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 152.43,
                                "shippingInfo": {
                                    "name": "Chandler High School"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-03-30T15:12:18Z",
                                "createdBy": {
                                    "id": 777,
                                    "name": "CHS Production Chef"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Chandler High School"
                                },
                                "distributor": {
                                    "name": "Sysco AZ"
                                },
                                "missingFarmTrackingItems": 11
                            },
                            {
                                "id": 8377,
                                "orderId": 8271,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "SUBMITTED",
                                "submissionDt": "2017-03-20T18:29:39Z",
                                "confirmedDt": null,
                                "fulfillmentDt": null,
                                "requestDt": "2017-03-24",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 13.61,
                                "shippingInfo": {
                                    "name": "Irv and Shelly Wholesale Customer"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-03-20T18:28:58Z",
                                "createdBy": {
                                    "id": 728,
                                    "name": "Martin Garcia"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Irv and Shelly Wholesale Customer"
                                },
                                "distributor": {
                                    "name": "FarmLogix"
                                },
                                "missingFarmTrackingItems": 3
                            },
                            {
                                "id": 8363,
                                "orderId": 8270,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "SUBMITTED",
                                "submissionDt": "2017-03-10T17:17:09Z",
                                "confirmedDt": null,
                                "fulfillmentDt": null,
                                "requestDt": "2017-03-23",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 25.8,
                                "shippingInfo": {
                                    "name": "Irv and Shelly Retail Customer"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-03-10T17:17:09Z",
                                "createdBy": {
                                    "id": 776,
                                    "name": "Irv Customer Retail"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Irv and Shelly Retail Customer"
                                },
                                "distributor": {
                                    "name": "Irv and Shelly DIST"
                                },
                                "missingFarmTrackingItems": 1
                            },
                            {
                                "id": 8362,
                                "orderId": 8269,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "FULFILLED",
                                "submissionDt": "2017-03-09T20:59:30Z",
                                "confirmedDt": "2017-03-09T21:37:50Z",
                                "fulfillmentDt": "2017-03-09T21:38:41Z",
                                "requestDt": "2017-03-29",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 23.26,
                                "shippingInfo": {
                                    "name": "Irv and Shelly Retail Customer"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-03-09T20:59:30Z",
                                "createdBy": {
                                    "id": 776,
                                    "name": "Irv Customer Retail"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Irv and Shelly Retail Customer"
                                },
                                "distributor": {
                                    "name": "Irv and Shelly DIST"
                                },
                                "missingFarmTrackingItems": 0
                            },
                            {
                                "id": 8361,
                                "orderId": 8268,
                                "customerOrderNbr": null,
                                "cpInvoiceNbr": null,
                                "status": "FULFILLED",
                                "submissionDt": "2017-03-09T20:58:21Z",
                                "confirmedDt": "2017-03-09T21:38:02Z",
                                "fulfillmentDt": "2017-03-09T21:38:32Z",
                                "requestDt": "2017-03-27",
                                "requestEndDt": null,
                                "requestDateType": "SIMPLE",
                                "totalCharge": 27.72,
                                "shippingInfo": {
                                    "name": "Irv and Shelly Retail Customer"
                                },
                                "type": "REGULAR",
                                "dateCreated": "2017-03-09T20:58:21Z",
                                "createdBy": {
                                    "id": 776,
                                    "name": "Irv Customer Retail"
                                },
                                "editable": true,
                                "deletable": false,
                                "customer": {
                                    "name": "Irv and Shelly Retail Customer"
                                },
                                "distributor": {
                                    "name": "Irv and Shelly DIST"
                                },
                                "missingFarmTrackingItems": 0
                            }
                        ]
                    });
                }, 1000);
            }


        }

    ]);