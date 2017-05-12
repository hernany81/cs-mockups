angular
    .module('homer')
    .directive('loadCustomerDistributor', function() {
        return {
            restrict: 'E',
            require: '',
            scope: {},
            link: function(scope, elem, attrs, ctrl) {
                scope.form = ctrl;
            },
            controller: function($scope) {
                $scope.field = null;

                this.getForm = function() {
                    return $scope.form;
                }


                $scope.loadList=function(){

                }
            }
        }
    });
