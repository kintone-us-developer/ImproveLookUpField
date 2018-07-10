jQuery.noConflict();
(function($, PLUGIN_ID){
    "use strict";

    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    //activation
    if(config && config.activation !== 'active'){
        return;
    }

    var dataSourceAppId = config.dataSourceAppId;
    var dataSourceFieldCodes = JSON.parse(config.dataSourceFieldCodes);
    var textFieldCode = config.textFieldCode;
    var dataSourceFields = [];

    kintone.events.on(['app.record.edit.show', 'app.record.create.show', 'app.record.index.edit.show'], function(event) {
        
        kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET',
        {'app': dataSourceAppId}, function(resp) {
            for(var key in resp.properties){
                if(dataSourceFieldCodes.includes(resp.properties[key].code)){
                    dataSourceFields.push(resp.properties[key]);
                }
            }
            console.log(dataSourceFields);
        });


        return event;
    });
})(jQuery, kintone.$PLUGIN_ID); 