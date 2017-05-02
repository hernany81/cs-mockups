angular
    .module('homer')
    .factory('MyAccountService', function($q) {
        var data = {
            personalData: {
                username: 'consumer1',
                email: 'consumer1@mailinator.com'
            },
            paymentSettings: {
                method: 'CREDIT_CARD',
                cardDetails: {
                    brand: 'Visa',
                    ending: '2345'
                }
            },
            program: {
                name: 'Top Box Evanston',
                pickupLocation: {
                    name: 'Walker Elementary',
                    city: 'Evanston',
                    state: 'IL',
                    streetOne: '3601 Church St',
                    zip: '60203',
                    latitude: 42.0464424,
                    longitude: -87.7188606
                }
            }
        };

        return {
            load: function() {
                return $q(function(resolve) {
                    resolve({data: data});
                });
            },
            save: function(newData) {
                return $q(function(resolve) {
                    _.assign(data, newData);
                    resolve({data: {success: true}});
                })
            }
        }
    })
    .filter('paymentMethod', function() {
        return function(val) {
            return _.startCase(val);
        }
    })
    .factory('StripeService', function() {
        var stripe = Stripe("pk_test_mqOdMBx5L08kX8Lz3es9uk1T");

        return {
            createCard: function(elem) {
                var elements = stripe.elements();
                var card = elements.create('card');
                card.mount(elem);
                return card;
            },
            createToken: function(card) {
                return stripe.createToken(card);
            }
        }
    })
    .directive('stripeCreditCard', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            template: '<div class="stripe-container"></div>',
            link: function(scope, element, attrs, ctrl) {
                scope.$stripeCard.ngModel = ctrl;
            },
            controllerAs: '$stripeCard',
            controller: function($scope, $element, $attrs, StripeService, $parse) {
                var card = StripeService.createCard($element.find('.stripe-container')[0]);
                var vm = this;
                var onSuccessFn = $parse($attrs.onSuccess);

                card.addEventListener('change', function(ev) {
                    function setValidity(error) {
                        var errorKeys = ['invalid_number', 'invalid_expiry_month', 'invalid_expiry_year', 'invalid_expiry_year_past',
                            'invalid_cvc', 'invalid_swipe_data', 'incorrect_number', 'expired_card', 'incorrect_cvc', 'incorrect_zip',
                            'card_declined', 'missing', 'processing_error'];

                        _.each(errorKeys, function(errKey) {
                            var ngErrorKey = _.kebabCase('card_' + errKey);
                            var receivedError = _.get(error, 'code');

                            vm.ngModel.$setValidity(ngErrorKey, !_.isEqual(receivedError, errKey));
                        });
                    }

                    if(ev.error) {
                        $scope.$apply(function() {
                            vm.ngModel.$setViewValue(null);
                            setValidity(ev.error);
                        });
                    } else if(ev.complete) {
                        StripeService.createToken(card).then(function(result) {
                            $scope.$apply(function() {
                                vm.ngModel.$setViewValue(result.token.id);
                                setValidity(null);
                                onSuccessFn($scope, {$scope: $scope, $data: result});
                            })
                        });
                    }
                });
            }
        }
    })
    .controller('csMyAccount', function($scope, MyAccountService) {
        $scope.data = {};
        $scope.ctx = {
            paymentMethods: ['CREDIT_CARD', 'ON_PICKUP']
        };

        MyAccountService.load().then(function(resp) {
            $scope.data = resp.data;
        });

        $scope.savePersonalInformation = function(data, successCallback, errorCallback) {
            MyAccountService.save({personalData: data}).then(successCallback, errorCallback);
        };

        $scope.savePaymentSettings = function(data, successCallback, errorCallback) {
            MyAccountService.save({paymentSettings: data}).then(
                function() {
                    successCallback();
                    $scope.creditCardInputVisible = false;
                },
                errorCallback);
        };

        $scope.cancelPaymentSettingsEdition = function() {
            $scope.creditCardInputVisible = false
        };

        $scope.setCardDetails = function(scope, data) {
            _.assign(_.get(scope.data, 'cardDetails'), {
                brand: _.get(data, 'token.card.brand'),
                ending: _.get(data, 'token.card.last4')
            });
        };
    });