angular
    .module('homer')
    .controller('csRegistration', function($scope, sweetAlert, $state, $uibModal) {
        $scope.ctx = {
            recaptchaKey: '6LdhWgMTAAAAAAxtGYdqpX1yl6PUNtzcaXEx-7PK',
            programs: [
                {
                    name: 'Top Box Evanston',
                    pickupLocations: [
                        {
                            name: 'School 1'
                        }, {
                            name: 'School 2'
                        }
                    ]
                }, {
                    name: 'Top Box Chicago',
                    pickupLocations: [
                        {
                            name: 'School 3'
                        }, {
                            name: 'School 4'
                        }
                    ]
                }, {
                    name: 'Top Box CPS',
                    pickupLocations: [
                        {
                            name: 'School 5'
                        }, {
                            name: 'School 6'
                        }
                    ]
                }
            ],
            availableLocations: []
        };

        $scope.data = {
            selectedProgram: null,
            selectedLocation: null,
            recaptcha: null
        };

        $scope.$watch('data.selectedProgram', function(newVal, oldVal) {
            if(newVal != oldVal) {
                $scope.data.selectedLocation = null;

                if(newVal) {
                    _.each(newVal.pickupLocations, function(loc) {
                        $scope.ctx.availableLocations.push(loc);
                    });
                }
            }
        });

        $scope.displayPasswordRecovery = function() {
            $uibModal.open({
                templateUrl: 'views/cs/registration/password-recovery-modal.html',
                windowClass: "hmodal-success"
            }).result.then(function(email) {
                sweetAlert.swal({
                    title: "Reset password link sent",
                    text: "We sent you a temporary password to " + email,
                    type: "success"
                });
            });
        };

        $scope.canDisplayRecaptcha = function(form) {
            var requiredValidFields = ['program', 'pickupLocation', 'username', 'email', 'password', 'repeatPassword'];

            var found = _.find(requiredValidFields, function(field) {
                return form[field].$invalid;
            });

            return found == null;
        };

        $scope.register = function(form) {
            if(form.$valid) {
                sweetAlert.swal({
                    title: "Registration completed",
                    text: "Thank you for your registration you are now ready to start purchasing on our platform",
                    type: "success"
                }, function() {
                    $state.go('common.login');
                });
            }
        };
    });