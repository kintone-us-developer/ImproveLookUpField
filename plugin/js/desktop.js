jQuery.noConflict();
(function($, PLUGIN_ID){
    "use strict";

    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    //activation
    if(config && config.activation !== 'active'){
        return;
    }
    var dataSourceAppId = config.dataSourceAppId;
    var dummyAppId = config.dummyAppId;
    var keyFieldCodes = JSON.parse(config.keyFieldCodes);//Array of the field code of the selected data source fields
    var textField = JSON.parse(config.textField);
    var fieldMapping = JSON.parse(config.fieldMappings);
    var destinationField = JSON.parse(fieldMapping.destinationField);
    var sourceField = JSON.parse(fieldMapping.sourceField);
    fieldMapping = {"destinationField": destinationField, "sourceField": sourceField};
    
    //Those variables are over-written across the multiple events
    var body = "";
    var matchingInfo = []; //index: recordNum in main app / value: recordNum in data source app

    //Used across the index page events
    var setTextFieldUniqueClassName = '';
    var matchingInfoIndexPage = [];
    var aTagArrayIndexPage = [];
    var mainAppRecords =[];



    //Generate the pop up window based on the query and get the record number of the selected record
    kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
        var lookupElement = getSetLookupField("control-single_line_text-field-gaia", textField.label);
        attachAttributes(lookupElement);
        addLookupClear(lookupElement);

        var destinationUniqueNumber = localStorage.getItem("destinationUniqueNumber");
        var destinationClassName = ".value-" + destinationUniqueNumber;
        destinationElement = $(destinationClassName);

        //Once I find the right element, I can give the id like "temp" and use jquery with that id
        console.log(destinationElement);
        if(typeText.includes(destinationField.type)){
            destinationElement[0].children[0].children[0].disabled = true;
        } else if(destinationField.type === 'RICH_TEXT'){
            destinationElement[0].children[0].children[1].contentEditable = false;
        //Change the background color
            //destinationElement[0].children[0].children[1].setAttribute("background-color", "FFFC33");
        } else if(destinationField.type === 'NUMBER'){
            destinationElement[0].children[0].children[1].children[0].children[0].disabled = true;
        } else if(destinationField.type === 'RADIO_BUTTON'){
            Array.from(destinationElement[0].children[0].children).forEach(function(element){
                element.children[0].disabled = true;
            });
        } else if(destinationField.type === 'DROP_DOWN'){
//Stopped here
            console.log($(".value-5523293"));
            console.log("Right type");
            destinationElement[0].disabled = true;
            // destinationElement[0].children[0].disabled = true;
        }

        var selectedItem = {
            "value":'', 
            "recordNum": -1
        };

        var sourceRecordAll = [];
        var sourceRecordFiltered = [];
        $(document).on("click keypress", "#lookup, #inputField", function(e){
            if(e.target.id === "lookup" || e.keyCode === 13){
                body = {
                    "app": dataSourceAppId
                    //,"fields": keyFieldCodes
                };
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                    body = '';
                    sourceRecordAll = resp.records;
                    sourceRecordFiltered = filterRecords(sourceRecordAll, keyFieldCodes);

                    if(sourceRecordFiltered.length > 0){
                        if(Object.values(sourceRecordFiltered[0])[0].type !== "RECORD_NUMBER"){
                            sourceRecordFiltered = bringRecordNumFirst(sourceRecordFiltered);
                        }
                        
                        var queryCriteriaArray = createCriteriaArray(lookupElement.children[1].children[0].children[0].value);
                        var matchedRecordArray = [];//store all matched data and its entire record
    
                        for(let record of sourceRecordFiltered){
                            if(includesCriteria(record, queryCriteriaArray) && !matchedRecordArray.includes(record)){
                                matchedRecordArray.push(record);
                            }
                        }
                        console.log(matchedRecordArray);
        
                        if(matchedRecordArray.length > 0){
                            createPopupContent(matchedRecordArray);
//Here: Place mapping value
                            getValue(lookupElement, selectedItem, sourceRecordAll, fieldMapping);
                            matchedRecordArray = [];    
                        } else {
                            event.record[textField.code].error = 'No records matched.';
    //Show this message if there is no matched records.
                            //return event;
                        }
    
                        lookupElement.children[1].children[0].children[0].onchange = function(e){
                            if(e.target.value === selectedItem.value){
                                validLookup = true;
                            } else {
                                validLookup = false;
                            }
                        };
                    }
                });
            }
        });

        $('#clear').click(function(e){
            lookupElement.children[1].children[0].children[0].value = "";
            selectedItem.recordNum = "";
            selectedItem.value = "";
            localStorage.removeItem("body");
            localStorage.removeItem("method");
            localStorage.removeItem("DataSourceRecordNum");
            validLookup = true;
        });

        //return event;
    });

    //Check the lookup field input
    kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function(event){
        if(!validLookup){
            if(event.record[textField.code].value){
                event.record[textField.code].error = 'Click "Lookup" to get the latest data.';
            } else {
                return event;
            }
            event.error = "Invalid Lookup Input.";
        }
        validLookup = false;
        return event;
    });

    //Decide if it initializes/updates the matching info
    kintone.events.on(['app.record.create.submit.success', 'app.record.edit.submit.success'], function(event){
        var DataSourceRecordNum = localStorage.getItem("DataSourceRecordNum");

        if(DataSourceRecordNum){
            validLookup = false;
            var method = '';
            body = {
                "app": dummyAppId
            };
            kintone.api('/k/v1/records', 'GET', body).then(function(resp) {
                if(resp.records.length > 0){
                alert("Set Update_1-success");

                //when there is a matching info
                    matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                    matchingInfo[event.record.$id.value] = DataSourceRecordNum;

                    method = "PUT";
                    body = {
                        "app": dummyAppId,
                        "id": resp.records[0].Record_number.value,
                        "record": {
                            "recordMatchingInfo": {
                                "value": JSON.stringify(matchingInfo)
                            }
                        }
                    };
                    matchingInfo = [];
                } else {
                //no matching info
                    alert("Set Initialize_1-success");

                    matchingInfo[event.record.$id.value] = DataSourceRecordNum;

                    method = "POST";
                    body = {
                        "app": dummyAppId,
                        "record": {
                            "recordMatchingInfo": {
                                "value": JSON.stringify(matchingInfo)
                            }
                        }
                    };
                    matchingInfo = [];
                }
                alert("localStorage_2");
                localStorage.setItem("body", JSON.stringify(body));
                localStorage.setItem("method", method);
            }).then(function(result){
            });
        }
    });

    //Update/Initialize the matchingInfo and add the link to the record
    kintone.events.on('app.record.detail.show', function(event){
        body = JSON.parse(localStorage.getItem("body"));
        var method = localStorage.getItem("method");
        if(body && method){
        //When the detail page is opened after creating/editting
            kintone.api(kintone.api.url('/k/v1/record', true), method, body, function(resp){
                alert("Initialize/Update_3-detail.show");

                localStorage.removeItem("body");
                localStorage.removeItem("method");
                localStorage.removeItem("DataSourceRecordNum");

                var DataSourceRecordNum = -1;
                var appendURL = false;
                body = {
                    "app": dummyAppId
                };
                
                var promise = new Promise(function(resolve, reject){
                    kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                        body = "";
                        if(resp.records.length > 0){
                        //when there is a matching info
                            resolve("Matching info exists at detail");
                            matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                            DataSourceRecordNum = matchingInfo[event.record.$id.value];
                            if(DataSourceRecordNum){
                                appendURL = true;
                            }
                            matchingInfo = [];
                        } else {
                        //no matching info
                            reject("No matching info at detail");
                        }
                    });
                });
        
                promise.then(function(result){
                    if(appendURL){
                        var lookupElement = getSetLookupField("control-single_line_text-field-gaia", textField.label);
        
                        var aTag = document.createElement("a");
                        aTag.setAttribute("href", "/k/" + config.dataSourceAppId + "/show#record=" + DataSourceRecordNum);
                        aTag.setAttribute("target", "_blank");
        
                        var content = lookupElement.children[1].children[0];
                        content.remove();
                        lookupElement.children[1].appendChild(aTag);
                        lookupElement.children[1].children[0].appendChild(content);
                    }
                });
            });
        } else {
        //When the detail page is opened without creating or editting
            alert("Just show_3-detail.show");

            localStorage.removeItem("DataSourceRecordNum");
            var DataSourceRecordNum = -1;
            var appendURL = false;
            body = {
                "app": dummyAppId
            };
            
            var promise = new Promise(function(resolve, reject){
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                    body = "";
                    if(resp.records.length > 0){
                    //when there is a matching info
                        resolve("Matching info exists at detail");
                        matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                        DataSourceRecordNum = matchingInfo[event.record.$id.value];
                        if(DataSourceRecordNum){
                            appendURL = true;
                        }
                        matchingInfo = [];
                    } else {
                    //no matching info
                        reject("No matching info at detail");
                    }
                });
            });
    
            promise.then(function(result){
                if(appendURL){
                    var lookupElement = getSetLookupField("control-single_line_text-field-gaia", textField.label);
    
                    var aTag = document.createElement("a");
                    aTag.setAttribute("href", "/k/" + config.dataSourceAppId + "/show#record=" + DataSourceRecordNum);
                    aTag.setAttribute("target", "_blank");
    
                    var content = lookupElement.children[1].children[0];
                    content.remove();
                    lookupElement.children[1].appendChild(aTag);
                    lookupElement.children[1].children[0].appendChild(content);
                }
            });
        }
    });

    //Delete the matchingInfo at the index of the record number of the deleted record 
    kintone.events.on(['app.record.detail.delete.submit'], function(event){
        var promise = new Promise(function(resolve, reject){
            body = {
                "app": dummyAppId
            };
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                if(resp.records.length > 0){
                    matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                    matchingInfo[event.record.$id.value] = null;

                    body = {
                        "app": dummyAppId,
                        "id": resp.records[0].Record_number.value,
                        "record": {
                            "recordMatchingInfo": {
                                "value": JSON.stringify(matchingInfo)
                            }
                        }
                    };
                    matchingInfo = [];

                    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
                        body = "";
                        resolve("Deletion updated");
                    });
                } else {
                    alert("No matching info");
                }
            });
        });

        promise.then(function(result){
            console.log(result);
        }, function(err){
            console.log(err);
        });
    });

    //
    kintone.events.on(['app.record.index.show', 'app.record.index.edit.submit.success'], function(event){
//kintone.app.getFieldElements doesn't work if there is no record
        var destinationUniqueNumber = kintone.app.getFieldElements(destinationField.code)[0].className.match(/(?<=value-)(.*)/g)[0];
        localStorage.setItem("destinationUniqueNumber", destinationUniqueNumber);

        if(event.type === 'app.record.index.show'){
            mainAppRecords = event.records;
        }

        if(mainAppRecords.length > 0){
            body = {
                "app": dummyAppId
            };
            
            var promise = new Promise(function(resolve, reject){
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                    body = "";
                    var elementsByFieldCode = kintone.app.getFieldElements(textField.code);
                    setTextFieldUniqueClassName = elementsByFieldCode[0].className.match(/value-\d+/g)[0];

                    if(resp.records.length > 0){
                    //when there is a matching info
                        resolve("Matching info exists");

                        matchingInfoIndexPage = JSON.parse(resp.records[0].recordMatchingInfo.value); //index: recordNum in main app / value: recordNum in data source app
                        var DataSourceRecordNum = -1;
                        var aTag, content;

                        for(let key in mainAppRecords){
                            DataSourceRecordNum = matchingInfoIndexPage[mainAppRecords[key].$id.value];

                            if(DataSourceRecordNum){
                                //The order of mainAppRecords is the same as the order of elementsFieldCode
                                var lookupElement = elementsByFieldCode[key];
                                content = lookupElement.children[0].children[0];

                                if(content.tagName !== "A"){
                                    aTag = document.createElement("a");
                                    aTag.setAttribute("href", "/k/" + config.dataSourceAppId + "/show#record=" + DataSourceRecordNum);
                                    aTag.setAttribute("target", "_blank");
                    
                                    aTag.textContent = content.textContent;
                                    content.remove();
                                    lookupElement.children[0].appendChild(aTag);
                                    aTagArrayIndexPage[mainAppRecords[key].$id.value] = aTag;
                                }
                            }
                        }
                    } else {
                    //no matching info
                        reject("No matching info");
                    }
                });
            });

            promise.then(function(result){
                console.log(result);
            }, function(err){
                console.log(err);
            });
        }
    });

    kintone.events.on('app.record.index.edit.show', function(event){        
        if(aTagArrayIndexPage[event.record.$id.value]){
            var lookupElement = document.getElementsByClassName("recordlist-editcell-gaia recordlist-edit-single_line_text-gaia " + setTextFieldUniqueClassName)[0];
            lookupElement.setAttribute("title","Not editable.");
            lookupElement.setAttribute("class", "recordlist-cell-gaia recordlist-single_line_text-gaia " + setTextFieldUniqueClassName);
            lookupElement.children[0].setAttribute("class", "line-cell-gaia recordlist-ellipsis-gaia");
            lookupElement.children[0].children[0].remove();
            lookupElement.children[0].appendChild(aTagArrayIndexPage[event.record.$id.value]);
        } else {
            var lookupElement = document.getElementsByClassName("recordlist-editcell-gaia recordlist-edit-single_line_text-gaia " + setTextFieldUniqueClassName)[0];
            lookupElement.children[0].children[0].disabled = true;
        }
    });

    kintone.events.on('app.record.index.delete.submit', function(event){
        aTagArrayIndexPage[event.record.$id.value] = null;
        matchingInfoIndexPage[event.record.$id.value] = null;
    });
})(jQuery, kintone.$PLUGIN_ID); 