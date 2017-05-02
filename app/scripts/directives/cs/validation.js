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
                    email: '<%= field_name%> is not a valid email',
                    'card-invalid-number': 'Invalid credit card number',
                    'card-invalid-expiry-month': 'Invalid expiration month',
                    'card-invalid-expiry-year': 'Invalid expiration year',
                    'card-invalid-expiry-year-past': 'Expiration year is in the past',
                    'card-invalid-cvc': 'Invalid security code',
                    'card-invalid-swipe-data': 'Invalid swipe data',
                    'card-incorrect-number': 'Incorrect card number',
                    'card-expired-card': 'Card has expired',
                    'card-incorrect-cvc': 'Incorrect security code',
                    'card-incorrect-zip': 'Zip code failed validation',
                    'card-card-declined': 'Card was declined',
                    'card-missing': 'There is no card on a customer that is being charged',
                    'card-processing-error': 'An error occurred while processing the card'
                };

                $scope.hasErrors = false;

                $scope.getErrorMsg = function() {
                    var errorMsgs = [];

                    _.each(_.keys($scope.parentForm[$scope.field].$error), function(errorKey) {
                        var template = errorsTemplates[errorKey] || errorKey;
                        var customMsgError = $scope.attrs[errorKey + 'ErrorMsg'];
                        var msgError = customMsgError || _.template(template)({'field_name': 'This field'});

                        errorMsgs.push(msgError);
                    });

                    $scope.hasErrors = !_.isEmpty(errorMsgs);
                    return errorMsgs;
                }
            }
        }
    });