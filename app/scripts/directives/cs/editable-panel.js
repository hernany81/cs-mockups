angular
    .module('homer')
    .directive('editablePanel', function() {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'views/cs/directives/editable-panel/editable-panel.html',
            scope: {
                title: '@',
                editable: '=',
                datasource: '=',
                onSave: '&',
                onCancel: '&',
                form: '='
            },
            link: function(scope, element, attrs, ctrl, transclude) {
                transclude(scope, function(clone) {
                    element.find('.panel-body').append(clone);
                });
            },
            controllerAs: '$ctrl',
            controller: function($scope) {
                var vm = this;

                $scope.editing = false;
                $scope.data = _.cloneDeep($scope.datasource);
                $scope.parentContext = $scope.$parent;

                var successSaveCallback = function() {
                    $scope.editing = false;
                };

                vm.edit = function() {
                    $scope.data = _.cloneDeep($scope.datasource);
                    $scope.editing = true;
                };

                vm.commit = function() {
                    if($scope.form == null || $scope.form.$valid) {
                        console.log('Committing changes');
                        if($scope.onSave) {
                            $scope.onSave({
                                $newValues: $scope.data,
                                $successCallback: successSaveCallback,
                                $errorCallback: vm.cancel
                            })
                        }
                    }
                };

                vm.cancel = function() {
                    console.log('Cancelling changes');
                    $scope.data = _.cloneDeep($scope.datasource);
                    $scope.editing = false;

                    if($scope.onCancel) {
                        $scope.onCancel();
                    }
                };
            }
        }
    });