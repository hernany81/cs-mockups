/**
 * HOMER - Responsive Admin Theme
 * Copyright 2015 Webapplayers.com
 *
 */
(function () {
    angular.module('homer', [
        'ui.router',                // Angular flexible routing
        'ui.bootstrap',             // AngularJS native directives for Bootstrap
        'angular-flot',             // Flot chart
        'angles',                   // Chart.js
        'angular-peity',            // Peity (small) charts
        'cgNotify',                 // Angular notify
        'angles',                   // Angular ChartJS
        'ngAnimate',                // Angular animations
        'ui.map',                   // Ui Map for Google maps
        'ui.calendar',              // UI Calendar
        'summernote',               // Summernote plugin
        'ngGrid',                   // Angular ng Grid
        'ui.select',                // Angular ui-select
        'vcRecaptcha',              // Angular recaptcha
        'app.grid',                 // Custom grid component
        'angular-logger',           // Angular logger
        'LocalStorageModule',       // Local storage service
        'restangular',              // Restangular
        'cs.loading-indicator'      // Custom loading indicator
    ]).config(function(localStorageServiceProvider, logEnhancerProvider) {
        localStorageServiceProvider.setPrefix('farmlogix-');

        logEnhancerProvider.prefixPattern = '%s\t[%s]>';
        logEnhancerProvider.datetimePattern = 'ddd hh:mm:ss.SSS';
        logEnhancerProvider.logLevels = {
            '*': logEnhancerProvider.LEVEL.ERROR
            //'components.DatagridController': logEnhancerProvider.LEVEL.TRACE
            //'components.GridStatusPersistenceService': logEnhancerProvider.LEVEL.TRACE
            //'components.LoadingService': logEnhancerProvider.LEVEL.TRACE
            //'components.DynamicMenuBuilderService': logEnhancerProvider.LEVEL.TRACE
            //'component.paginated-selector-container': logEnhancerProvider.LEVEL.TRACE
        };
    });
})();

