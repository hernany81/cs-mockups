angular
    .module('homer')
    .factory('beConsumerService',
      function($http, $q){

        return {
          // loadSelectableItems: function(pagination) {
            loadSelectableItems: function(filters) {
              var offset = filters.offset;
              var max = filters.max;

              var promise = $http.get('orderItems.json').then(function (response) {
                // The then function here is an opportunity to modify the response
                var results = response.data;
                var finalResults = results.slice(offset, offset+max);
                // The return value gets picked up by the then in the controller.
                return finalResults;
              });
              // Return the promise to the controller
              return promise;
          }
        }
      }
  )
