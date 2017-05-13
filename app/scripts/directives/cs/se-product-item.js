'use strict';

angular
    .module('homer')
    .directive('seProductItem', function() {
        return {
            restrict: 'E',
            templateUrl: function(elem, attrs) {
                var mappings = {
                    line: 'views/cs/directives/products/product-item-large.html',
                    square: 'views/cs/directives/products/product-item-compact.html'
                };

                return mappings[attrs.layout];
            },
            scope: {
                item: '=',
                onToggleSave: '&',
                onBuy: '&',
                onUpdateItem: '&',
                visibilitySettings: '=',
                edition: '='
            },
            link: function(scope, elem) {
                var imageContainer = elem.find('.image-container');
                var prodPhotoUrl = _.get(scope.item, 'sku.product.photoUrl');

                if(imageContainer.length && prodPhotoUrl) {
                  //  console.log('Before: ', imageContainer.css('background-image'));
                    var backgroundImage = 'url(\'' + prodPhotoUrl + '\')';
                  //  console.log('backgroundImage', backgroundImage);
                    $(imageContainer).css('background-image', backgroundImage);
                  //  console.log('After: ', imageContainer.css('background-image'));
                }
            },
            controller: function($scope, $filter) {
                $scope.data = {
                    certificateTypes: $filter('flatMap')(_.get($scope.item, 'sku.farm.documents'), function(doc) {return _.get(doc, 'type.name')})
                };

                $scope.buy = function(item) {
                    ($scope.onBuy || _.noop)({$item: item});
                };

                $scope.toggleSave = function(item) {
                    ($scope.onToggleSave || _.noop)({$item: item});
                };

                $scope.updateItem = function(item){
                  console.log("updateItem in directve");
                  ($scope.onUpdateItem || _.noop)({$item: item});
                };
            }
        }
    });
