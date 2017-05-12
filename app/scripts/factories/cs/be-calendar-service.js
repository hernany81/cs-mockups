angular
    .module('homer')
    .factory('beCalendarService',
    function(){
      return {
          calculateMonth: function(){
            var eMoment =  moment(new Date());
            var dateNextMonth = moment().add(1, 'months');
            var nextMonthStr  = dateNextMonth.format("MMMM YYYY");
            return nextMonthStr;
          },
          calculateWeeks : function(){
              //TODO need to check February's case.
              var eMoment =  moment(new Date());
              var dateNextMonth = moment().add(1, 'months');
              var mondayMonth = dateNextMonth.startOf('month').day("Monday");
              var weeks = [];
              if (mondayMonth.date() > 7) mondayMonth.add(7,'d');

              var nextMonth = mondayMonth.month();
              while(nextMonth === mondayMonth.month()){
                  weeks.push(mondayMonth.format('MMMM Do, YYYY'));
                  mondayMonth = mondayMonth.weekday(8);
              }
              return weeks;
          },
        }
    })
