jQuery.noConflict();
(function($, PLUGIN_ID){
    "use strict";

    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    //activation
    if(config && config.activation !== 'active'){
        return;
    }

    var dataSourceAppId = config.dataSourceAppId;
    var dataSourceFieldCodes = JSON.parse(config.dataSourceFieldCodes);//Array of the field code of the selected data source fields
    var textFieldCode = config.textFieldCode;
    var sourceRecords = [];
    var queryCriteriaArray = '';//user query inputs separated by commmas
    var matchedRecordArray = [];//store all matched data and its entire record
    var eventList = ['app.record.create.change.' + textFieldCode, 'app.record.edit.change.' + textFieldCode, 'app.record.index.edit.change.' + textFieldCode,];
    var body = {
        "app": dataSourceAppId,
        "fields": dataSourceFieldCodes
    };
    var regexCommaSpace = /, | , | ,/g;
    var regexBESpace = /^\s+|\s+$|,+$/g;

    //Check if the record has any of criterias
    var includesCriteria = function(record, criterias){ 
        let criteria = '';
        for(let property of Object.values(record)){
            let propertyValue = property.value.toUpperCase();
            //console.log("PropertyValue:" + propertyValue + " " + typeof propertyValue);
            for(criteria of criterias){
                //console.log("Criteria:" + criteria + " " + typeof criteria);
                if(propertyValue.includes(criteria)){
                    //console.log("------matched");
                    return true; //means that record has at least one of the criterias
                }
            }
        }
        return false;
    };

    kintone.events.on(eventList, function(event) {
        kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
            sourceRecords = resp.records;
            let queryCriteria1 = event['record'][textFieldCode]['value'].replace(regexCommaSpace, ",");
            let queryCriteria2 = queryCriteria1.replace(regexBESpace, "");
            queryCriteriaArray = queryCriteria2.toUpperCase().split(",");
            console.log(queryCriteriaArray);
            
            for(let record of sourceRecords){
                if(includesCriteria(record, queryCriteriaArray) && !matchedRecordArray.includes(record)){
                    matchedRecordArray.push(record);
                }
            }
            console.log(matchedRecordArray);
            
            matchedRecordArray = [];  
        });
    });
})(jQuery, kintone.$PLUGIN_ID); 