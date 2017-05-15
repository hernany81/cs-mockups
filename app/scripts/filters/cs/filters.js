/**
 * HOMER - Responsive Admin Theme
 * Copyright 2015 Webapplayers.com
 *
 */

angular
    .module('homer')
    .filter('fromImageToBase64', fromImageToBase64)
    .filter('toAbsUrl', toAbsUrl)
    .filter('default', defaultValue)
    .filter('propsFilter', propsFilter)
    .filter('replace', replaceFilter)
    .filter('address', addressFilter)
    .filter('collect', collectFilter)
    .filter('flatten', flattenFilter)
    .filter('flatMap', flatMap)
    .filter('uniq', uniqFilter)
    .filter('sortBy', sortBy)
    .filter('filterCollection', filterCollection)
    .filter('publishPeriod', publishPeriod)
    .filter('leftPad', leftPad)
    .filter('leftPadOrDefault', leftPadOrDefault)
    .filter('join', joinFilter)
    .filter('deliveryDate', deliveryDate)
    .filter('orderGuideItemLeadInterval', orderGuideItemLeadInterval)
    .filter('leadInterval', leadInterval)
    .filter('concat', concatCollections)
    .filter('enumLabel', enumLabel)
    .filter('deliveryTypeEnum', deliveryTypeEnum)
    .filter('splitCollection', splitCollection)
    .filter('longState', longState)
    .filter('tagsUl', ['$sce', tagsUl]); 

/**
 * pageTitle - Directive for set Page title - mata title
 */
function fromImageToBase64() {
    return function(value) {
        return 'data:' + value.mimeType + ';base64,' + value.base64Content;
    }
}

function toAbsUrl() {
    var ABSOLUTE_URL_REGEX = /^https*:/i;

    return function(url) {
        if(!url) return '';

        if(ABSOLUTE_URL_REGEX.test(url)) {
            return url;
        } else {
            return 'http://' + url;
        }
    }
}

function defaultValue() {
    return function(value) {
        var val = value;
        var i = 1;

        while(i < arguments.length && !val) {
            val = arguments[i];
            i++;
        }

        return val;
    }
}

/**
 * AngularJS default filter with the following expression:
 * "person in people | filter: {name: $select.search, age: $select.search}"
 * performs a AND between 'name: $select.search' and 'age: $select.search'.
 * We want to perform a OR.
 */
function propsFilter() {
    return function(items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function(item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
}

function replaceFilter() {
  return function(val, pattern, replace, modifiers) {
      if(!val) return '';

      if(!modifiers) {
          modifiers = 'g';
      }

      return val.replace(new RegExp(pattern, modifiers), replace);
  }
}

function addressFilter($sce) {
    return function(addr) {
        var tmp = '', tmp2;
        var tmpCol = [];

        if(!addr) {
            return '';
        }

        if(addr.streetOne) {
            tmp += '<div class="street-one">' + addr.streetOne + '</div>';
        }

        if(addr.streetTwo) {
            tmp += '<div class="street-two">' + addr.streetTwo + '</div>';
        }

        if(addr.city) {
            tmpCol.push('<div class="city">' + addr.city + '</div>');
        }

        tmp2 = '<div class="state">' + addr.state + '</div>';

        if(addr.zip) {
            tmp2 += '<div class="zip">' + addr.zip + '</div>';
        }

        tmpCol.push(tmp2);

        tmp += '<div class="admin-area">' + tmpCol.join(',&nbsp;') + '</div>';

        return $sce.trustAsHtml(tmp);
    }
}

function collectFilter() {
    return function(list, arg) {
        return _.map(list, arg);
    }
}

function flattenFilter() {
    return function(list) {
        return _.flatten(list);
    }
}

function flatMap() {
    return function(list, arg) {
        return _.flatMap(list, arg);
    }
}

function uniqFilter() {
    return function(list) {
        return _.uniq(list);
    }
}

function sortBy() {
    return function(list, arg) {
        return _.sortBy(list, arg);
    }
}

function filterCollection() {
    return function(list, arg) {
        return _.filter(list, arg);
    }
}

function publishPeriod() {
    return function(period) {
        var messagesMap = {
            'noYear': ' every year [MONTH], [DAY]',
            'noYearAndNoMonth': 'every month [DAY]',
            'empty': '-',
            'full': '[MONTH], [DAY] [YEAR]'
        };

        var messageMatrix = {
            'year:true:month:true:day:true': '[MONTH], [DAY] [YEAR]',
            'year:true:month:true:day:false': '[MONTH] [YEAR]',
            'year:true:month:false:day:true': '[DAY] [YEAR]',
            'year:true:month:false:day:false': '[YEAR]',
            'year:false:month:true:day:true': '[MONTH] [DAY]',
            'year:false:month:true:day:false': '[MONTH]',
            'year:false:month:false:day:true': '[DAY]',
            'year:false:month:false:day:false': ''
        };

        var localeData = moment.localeData();

        function getPeriodStr(year, month, day) {
            var msgKey = 'year:' + (year ? 'true' : 'false') + ':month:' + (month ? 'true' : 'false') + ':day:' + (day ? 'true' : 'false');
            var msg = messageMatrix[msgKey];

            if(year) {
                msg = msg.replace(/\[YEAR\]/g, year);
            }

            if(month) {
                msg = msg.replace(/\[MONTH\]/g, moment.months()[month - 1]);
            }

            if(day) {
                msg = msg.replace(/\[DAY\]/g, localeData.ordinal(day));
            }

            return msg;
        }

        var from = getPeriodStr(period.fromYear, period.fromMonth, period.fromDay);
        var to = getPeriodStr(period.toYear, period.toMonth, period.toDay);

        return (_.isEmpty(from) ? '' : 'from <span class="date">' + from + '</span>') + (_.isEmpty(to) ? '' : ' to <span class="date">' + to + '</span>');
    }
}

function leftPad() {
    return function(val, num, str) {
        return _.padStart(val, num, str);
    }
}

function leftPadOrDefault() {
    return function(val, num, str, defaultStr) {
        if((_.isString(val) && _.isEmpty(val)) || _.isNull(val)) {
            return defaultStr;
        } else {
            return _.padStart(val, num, str);
        }
    }
}

function joinFilter() {
    return function(val, joinStr) {
        if(!val) {
            return '';
        }

        return val.join(joinStr);
    }
}

function deliveryDate($filter) {
    return function(requestDt, requestDateType, requestEndDt) {
        var dateValue = '';

        if(requestDt) {
            if(!requestDateType || 'SIMPLE' == requestDateType) {
                dateValue = $filter('date')(requestDt, 'yyyy-MM-dd');
            } else if('MONTH' == requestDateType) {
                dateValue = $filter('date')(requestDt, 'yyyy-MM');
            } else if('RANGE' == requestDateType) {
                dateValue = $filter('date')(requestDt, 'yyyy-MM-dd') + ' ~ ' + $filter('date')(requestEndDt, 'yyyy-MM-dd');
            } else {
                throw 'Can not determine date type: ' + requestDateType;
            }
        }

        return dateValue;
    }
}

function orderGuideItemLeadInterval($filter) {
    return function(value, ogi) {
        var leadInterval = null;

        if(ogi.lockLeadInterval) {
            leadInterval = ogi.leadInterval;
        } else {
            leadInterval = $filter('default')(ogi.leadInterval, ogi.sku.leadInterval, ogi.sku.farm.leadInterval);
        }

        if(!leadInterval) {
            return '';
        } else {
            if(leadInterval > 1) {
                return leadInterval + ' days';
            } else {
                return leadInterval + ' day';
            }
        }
    }
}

function leadInterval() {
    return function(value) {
        if(!value) {
            return '';
        } else if(value > 1) {
            return value + ' days';
        } else {
            return value + ' day';
        }
    }
}

function concatCollections() {
    return function(arr1, arr2) {
        return _.union(arr1, arr2);
    }
}

function enumLabel() {
    return function(val) {
        if(!val) {
            return '';
        }

        var parts = val.split(/_/g);
        return parts.join(' ');
    }
}

function deliveryTypeEnum() {
    return function(val) {
        if(val == 'PICKED_UP') {
            return 'PICK UP'
        } else if(val == 'DELIVERY') {
            return 'DELIVERY'
        } else {
            return ''
        }
    }
}

function splitCollection() {
    return function(collection, size) {
        var result = [], currentCollection = [];

        _.each(collection, function(val) {
            currentCollection.push(val);

            if(currentCollection.length == size) {
                result.push(currentCollection);
                currentCollection = [];
            }
        });

        if(!_.isEmpty(currentCollection)) {
            result.push(currentCollection);
        }

        return result;
    }
}

function longState(StatesService) {
    var statesMap = StatesService.statesAsMap(StatesService.states());

    return function(code) {
        if(_.isEmpty(code)) {
            return '';
        }

        return _.get(statesMap, [code, 'name'], '');
    }
}

function tagsUl($sce) {
    return function(val) {
        if(_.isEmpty(val)) {
            return '';
        }

        var str = '<ul>';
        var printedTagIds = {};

        _.forEach(val, function(item) {
            if(printedTagIds[item.id]) {
                // Do not print again
            } else {
                str += '<li>' + item.name + '</li>';
                printedTagIds[item.id] = true;
            }

        });
        str += '</ul>';
        return $sce.trustAsHtml(str);
    }
}
