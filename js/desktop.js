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
    var regex = / , /g;

    //Check if the record has any of criterias
    var includesObjectArray = function(record, criterias){ 
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
    // var includesObjectArray = function(criteria, records){
    //     for(let record of records){ //record:an object that holds all data in the specified fields
    //         for(let property of Object.values(record)){
    //             if(property.value.toUpperCase().includes(criteria)){
    //                 return true;
    //             }
    //         }
    //     }
    //     return false;
    // };

    kintone.events.on(eventList, function(event) {
        kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
            sourceRecords = resp.records;
            queryCriteriaArray = event['record'][textFieldCode]['value'].toUpperCase().replace(regex, ",").split(",");
            console.log(queryCriteriaArray);
            
            for(let record of sourceRecords){
                //console.log(includesObjectArray(record, queryCriteriaArray));
                if(includesObjectArray(record, queryCriteriaArray) && !matchedRecordArray.includes(record)){
                    matchedRecordArray.push(record);
                }
            }
            // for(let criteria of queryCriteriaArray){
            //     console.log(includesObjectArray(criteria, sourceRecords));
            //     if(includesObjectArray(criteria, sourceRecords) && !matchedDataArray.includes(record)){
            //         matchedDataArray.push(record);
            //     }
            // }
            // for(let key in dataSourceArray){
            //     for(let element of Object.values(dataSourceArray[key])){
            //         if(element.value){
            //             if(includesObjectArray(element, queryCriteria) && !matchedDataArray.includes(dataSourceArray[key])){
            //                 matchedDataArray.push(dataSourceArray[key]);
            //                 break;
            //             }
            //         }
            //     }
            // }
            console.log(matchedRecordArray);
            
            matchedRecordArray = [];  
        });
    });
})(jQuery, kintone.$PLUGIN_ID); 