angular
    .module('homer')
    .factory('OrderSettingsService', function() {
        var labels = {
            'REGULAR': {
                header: {
                    dateInput: 'Delivery Date',
                    orderNbr: 'Order #',
                    type: 'Order',
                    submissionDate: 'Order Date',
                    fromDate: 'Earliest Delivery Date',
                    toDate: 'Latest Delivery Date'
                },
                body: {
                    sellPrice: 'Sell Price'
                }
            },
            'TRACKING': {
                header: {
                    dateInput: 'Tracking Period',
                    orderNbr: 'Tracking #',
                    type: 'Tracking Order',
                    submissionDate: 'Order Date',
                    fromDate: 'Earliest Tracking Date',
                    toDate: 'Latest Tracking Date'
                },
                body: {
                    sellPrice: 'Sell Price'
                }
            },
            'INVOICING': {
                header: {
                    dateInput: 'Invoice Period',
                    orderNbr: 'FL Invoice #',
                    type: 'Invoice',
                    submissionDate: 'Submission Date',
                    fromDate: 'Earliest Invoicing Date',
                    toDate: 'Latest Invoicing Date'
                },
                body: {
                    sellPrice: 'Price'
                }
            }
        };

        var settings = {
            'REGULAR': {
                autoPopulateOrderItems: true,
                supportsAddingItems: false,
                supportsRangePeriod: false,
                hasFarmTrackingInfo: true,
                hasConfirmationDate: true,
                hasFulfillmentDate: true,
                hasBillingShippingInfo: true,
                hasCpInvoiceNbr: false,
                hasCustomerOrderNbr: true,
                hasLeadIntervalItemLevel: true,
                hasBasePriceItemLevel: true,
                hasSellPriceItemLevel: true,
                hasResellPriceItemLevel: true,
                hasDeliveryDateItemLevel: false,
                hasVendorInvoiceNbrItemLevel: false,
                hasCpInvoiceNbrItemLevel: false,
                hasCustomerItemLevel: false,
                hasCustomerCityItemLevel: false,
                hasCustomerStateItemLevel: false,
                hasProductCategoryItemLevel: true,
                hasSkuItemLevel: true,
                hasNoteItemLevel: false
            },
            'TRACKING': {
                autoPopulateOrderItems: true,
                supportsAddingItems: false,
                supportsRangePeriod: true,
                hasFarmTrackingInfo: false,
                hasConfirmationDate: false,
                hasFulfillmentDate: false,
                hasBillingShippingInfo: true,
                hasCpInvoiceNbr: false,
                hasCustomerOrderNbr: true,
                hasLeadIntervalItemLevel: false,
                hasBasePriceItemLevel: true,
                hasSellPriceItemLevel: true,
                hasResellPriceItemLevel: true,
                hasDeliveryDateItemLevel: false,
                hasVendorInvoiceNbrItemLevel: false,
                hasCpInvoiceNbrItemLevel: false,
                hasCustomerItemLevel: false,
                hasCustomerCityItemLevel: false,
                hasCustomerStateItemLevel: false,
                hasProductCategoryItemLevel: true,
                hasSkuItemLevel: true,
                hasNoteItemLevel: false
            },
            'INVOICING': {
                autoPopulateOrderItems: false,
                supportsAddingItems: true,
                supportsRangePeriod: true,
                hasFarmTrackingInfo: false,
                hasConfirmationDate: true,
                hasFulfillmentDate: true,
                hasBillingShippingInfo: false,
                hasCpInvoiceNbr: true,
                hasCustomerOrderNbr: false,
                hasLeadIntervalItemLevel: false,
                hasBasePriceItemLevel: false,
                hasSellPriceItemLevel: true,
                hasResellPriceItemLevel: false,
                hasDeliveryDateItemLevel: true,
                hasVendorInvoiceNbrItemLevel: true,
                hasCpInvoiceNbrItemLevel: true,
                hasCustomerItemLevel: true,
                hasCustomerCityItemLevel: true,
                hasCustomerStateItemLevel: true,
                hasProductCategoryItemLevel: false,
                hasSkuItemLevel: false,
                hasNoteItemLevel: true
            }
        };

        //var isAdminUser = LoggedUserService.userInfo().isAdmin;
        var isAdminUser = true;

        var selectableOrderStatuses = {
            'REGULAR': ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'FULFILLED', 'ARCHIVED', 'CANCELED'],
            'TRACKING': ['DRAFT', 'DATA'],
            'INVOICING': ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PAID', 'ARCHIVED', 'CANCELED']
        };

        var defaultOrderStatuses = {
            'REGULAR': isAdminUser ? selectableOrderStatuses['REGULAR'] : ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'FULFILLED', 'CANCELED'],
            'TRACKING': selectableOrderStatuses['TRACKING'],
            'INVOICING': isAdminUser ? selectableOrderStatuses['INVOICING'] : ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PAID', 'CANCELED']
        };

        return {
            getLabels: function(orderType) {
                var result = labels[orderType];

                return _.cloneDeep(result);
            },

            getSettings: function(orderType) {
                var result = settings[orderType];

                return _.cloneDeep(result);
            },

            getSelectableOrderStatuses: function(orderType) {
                var result = selectableOrderStatuses[orderType];

                return _.cloneDeep(result);
            },

            getDefaultOrderStatuses: function(orderType) {
                var result = defaultOrderStatuses[orderType];

                return _.cloneDeep(result);
            }
        }
    });