angular
    .module('homer')
    .factory('beConsumerService',
      function($http){

        return {
          loadSelectableItems: function() {
              return $http.get('selectableItems.json');
          }
        }
      }
  )
