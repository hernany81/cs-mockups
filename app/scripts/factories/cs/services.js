angular.module('homer')
    .factory('StatesService', [
        function() {
            var statesList = [
                {code: 'AL', name: 'Alabama'},
                {code: 'AK', name: 'Alaska'},
                {code: 'AZ', name: 'Arizona'},
                {code: 'AR', name: 'Arkansas'},
                {code: 'CA', name: 'California'},
                {code: 'CO', name: 'Colorado'},
                {code: 'CT', name: 'Connecticut'},
                {code: 'DE', name: 'Delaware'},
                {code: 'FL', name: 'Florida'},
                {code: 'GA', name: 'Georgia'},
                {code: 'HI', name: 'Hawaii'},
                {code: 'ID', name: 'Idaho'},
                {code: 'IL', name: 'Illinois'},
                {code: 'IN', name: 'Indiana'},
                {code: 'IA', name: 'Iowa'},
                {code: 'KS', name: 'Kansas'},
                {code: 'KY', name: 'Kentucky'},
                {code: 'LA', name: 'Louisiana'},
                {code: 'ME', name: 'Maine'},
                {code: 'MD', name: 'Maryland'},
                {code: 'MA', name: 'Massachusetts'},
                {code: 'MI', name: 'Michigan'},
                {code: 'MN', name: 'Minnesota'},
                {code: 'MS', name: 'Mississippi'},
                {code: 'MO', name: 'Missouri'},
                {code: 'MT', name: 'Montana'},
                {code: 'NE', name: 'Nebraska'},
                {code: 'NV', name: 'Nevada'},
                {code: 'NH', name: 'New Hampshire'},
                {code: 'NJ', name: 'New Jersey'},
                {code: 'NM', name: 'New Mexico'},
                {code: 'NY', name: 'New York'},
                {code: 'NC', name: 'North Carolina'},
                {code: 'ND', name: 'North Dakota'},
                {code: 'OH', name: 'Ohio'},
                {code: 'OK', name: 'Oklahoma'},
                {code: 'OR', name: 'Oregon'},
                {code: 'PA', name: 'Pennsylvania'},
                {code: 'RI', name: 'Rhode Island'},
                {code: 'SC', name: 'South Carolina'},
                {code: 'SD', name: 'South Dakota'},
                {code: 'TN', name: 'Tennessee'},
                {code: 'TX', name: 'Texas'},
                {code: 'UT', name: 'Utah'},
                {code: 'VT', name: 'Vermont'},
                {code: 'VA', name: 'Virginia'},
                {code: 'WA', name: 'Washington'},
                {code: 'WV', name: 'West Virginia'},
                {code: 'WI', name: 'Wisconsin'},
                {code: 'WY', name: 'Wyoming'}
            ];

            return {
                statesAsMap: function(list) {
                    var statesMap = {};

                    _.each(list, function(state) {
                        statesMap[state.code] = _.clone(state);
                    });

                    return statesMap;
                },
                states: function() {
                    return _.cloneDeep(statesList);
                }
            }
        }
    ]).factory('AddressService', function() {
        return {
            types: [{
                code: 'NOT_DEFINED',
                label: 'Not Defined'
            }, {
                code: 'PRIMARY_BILL_TO',
                label: 'Primary Bill to'
            }, {
                code: 'PRIMARY_SHIP_TO',
                label: 'Primary Ship to'
            }, {
                code: 'BILL_TO',
                label: 'Bill to'
            }, {
                code: 'SHIP_TO',
                label: 'Ship to'
            }, {
                code: 'PICKUP',
                label: 'Pick Up'
            }]
        }
    }).factory('PollingService', [
        '$q', '$timeout',
        function($q, $timeout) {
            return {
                startPolling: function(pollingFunction, interval) {
                    var deferred = null;
                    var keepPolling = true;

                    function poll() {
                        deferred = $q.defer();
                        deferred.promise.then(function(res) {
                            if(!res.done && keepPolling) {
                                $timeout(function() {
                                    poll();
                                }, interval);
                            }
                        });
                        pollingFunction(deferred);
                    }

                    poll();

                    return function() {
                        keepPolling = false;
                    }
                }
            }
        }
    ]).factory('DateUtils', function() {
        return {
            convertDates: function(owner, paths) {
                _.each(paths, function(path) {
                    var strDate = _.get(owner, path);

                    if(strDate && _.isString(strDate)) {
                        _.set(owner, path, moment(strDate).toDate());
                    }
                })
            }
        }
    }).factory('StripeService', function() {
        var stripe = Stripe("pk_test_mqOdMBx5L08kX8Lz3es9uk1T");

        return {
            createCard: function(domElementId) {
                var elements = stripe.elements();
                var card = elements.create('card');
                card.mount("#"+domElementId);
                return card;
            },
            createToken: function(card) {
                return stripe.createToken(card);
            }
        }
    });
