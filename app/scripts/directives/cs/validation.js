angular
    .module('homer')
    .directive('validatedForm', function() {
        return {
            restrict: 'A',
            require: 'form',
            scope: {},
            link: function(scope, elem, attrs, ctrl) {
                scope.form = ctrl;
            },
            controller: function($scope) {
                $scope.form = null;

                this.getForm = function() {
                    return $scope.form;
                }
            }
        }
    }).directive('fieldError', function() {
        return {
            restrict: 'E',
            require: '^validatedForm',
            templateUrl: 'views/cs/directives/validation/field-error.html',
            replace: true,
            scope: {
                field: '@'
            },
            link: function(scope, elem, attrs, ctrl) {
                scope.parentForm = ctrl.getForm();
                scope.attrs = attrs;
            },
            controller: function($scope) {
                var errorsTemplates = {
                    required: '<%= field_name%> is required',
                    email: '<%= field_name%> is not a valid email'
                };

                $scope.hasErrors = false;

                $scope.getErrorMsg = function() {
                    var errorMsgs = [];

                    _.each(_.keys(errorsTemplates), function(errorKey) {
                        if($scope.parentForm[$scope.field].$error[errorKey]) {
                            var template = errorsTemplates[errorKey];
                            var customMsgError = $scope.attrs[errorKey + 'ErrorMsg'];
                            var msgError = customMsgError || _.template(template)({'field_name': 'This field'});

                            errorMsgs.push(msgError);
                        }
                    });

                    $scope.hasErrors = !_.isEmpty(errorMsgs);
                    return _.join(errorMsgs, '. ');
                }
            }
        }
    });