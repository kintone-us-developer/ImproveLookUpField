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
    var dataSourceFieldCodes = JSON.parse(config.dataSourceFieldCodes);//Array of the field code of the selected data source fields
    var textField = JSON.parse(config.textField);

    var sourceRecords = [];
    var queryCriteriaArray = '';//user query inputs separated by commmas
    var regexCommaSpace = /, | , | ,/g;
    var regexBESpace = /^\s+|\s+$|,+$/g;
    var selectedItem = {
        "value":'', 
        "recordNum": -1
    };
    var body = "";
    var setTextFieldUniqueClassName, setTextFieldElement;
    var aTagArray = [];


    //Given the className and the field label find the element that is the text field the user chose in the plugin setting page
    var getSetTextField = function(className, label){
        var field = '';
        var fieldArray = Array.from(document.getElementsByClassName(className));
        for (let element of fieldArray){
            if(label === element.children[0].textContent){
                field = element;
                break;
            }
        }
        return field;
    };

    //attach some attributes to the user-selected field
    var attachAttributes = function(field){
        field.setAttribute("id", "setTextField");
        field.children[1].children[0].setAttribute("id", "divButton");
    };

    //Add the lookup and clear buttons 
    var addLookupClear = function(setTextFieldElement){
        var lookupButton = '<button id="lookup" class="button-simple-cybozu input-lookup-gaia" type="button">Lookup</button>';
        var clearButton = '<button id="clear" class="button-simple-cybozu input-clear-gaia" type="button">Clear</button>';

        $('#divButton').append(lookupButton);
        $('#divButton').append(clearButton);
    };

    var bringRecordNumFirst = function(records){
        var recordNumIndex = -1;
        var keyArray, valueArray;

        valueArray = Object.values(records[0]);
        for(let key in valueArray){
            if(valueArray[key].type === "RECORD_NUMBER"){
                recordNumIndex = key;
                break;
            }
        }

        records.forEach(function(record, index){
            keyArray = Object.keys(record);
            valueArray = Object.values(record);

            keyArray = elementsSwap(recordNumIndex, keyArray);
            valueArray = elementsSwap(recordNumIndex, valueArray);
            records[index] = toObject(keyArray, valueArray);
        })
        return records;
    };

    var elementsSwap = function(index, array){
        var temp = array[0];
        array[0] = array[index];
        array[index] = temp;

        return array;
    };

    var toObject = function(k, v){
        var o = {};
        for(let key in k){
            o[k[key]] = v[key];
        }
        return o;
    };

    //Take a string of criterias separated by commas and convert them into an array
    var createCriteriaArray = function(criterias){
        let queryCriteria1 = criterias.replace(regexCommaSpace, ",");
        let queryCriteria2 = queryCriteria1.replace(regexBESpace, "");
        return queryCriteria2.toUpperCase().split(",");
    };

    //Check if the record has any of criterias
    var includesCriteria = function(record, criterias){ 
        let criteria = '';
        for(let property of Object.values(record)){
            let propertyValue = property.value.toUpperCase();
            for(criteria of criterias){
                if(propertyValue.includes(criteria)){
                    return true; //means that record has at least one of the criterias
                }
            }
        }
        return false;
    };

    //Create the popup window
    var createPopupContent = function(matchedRecordArray){
        let popup = '<div id="myModal" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true"> <div class="modal-dialog modal-lg"> <div class="modal-content"> <h1>Data Source</h1> <table class="table table-bordered table-dark"> <thead><tr>';
        let temp = '';

        for(let fieldCode of Object.keys(matchedRecordArray[0])){
            temp += '<th scope="col">' + fieldCode + '</th>';
        }
        popup += temp + '</tr></thead><tbody>';

        for(let key in matchedRecordArray){
            temp = '<tr>';
            var valueArray = Object.values(matchedRecordArray[key]);
            var recordNum = valueArray[0].value;
            for(let field of valueArray){
                temp += '<td id="record' + recordNum + '" class="options">' + field.value + '</td>';
            }
            temp += '</tr>';
            popup += temp;
        }
        popup += '</tbody></table><button id="setButton" type="button" class="btn btn-primary">Set Value</button> </div> </div> </div>';
        addModal(popup);
    };
    
    //add teh pop up window to the body and show it
    var addModal = function(popup){
        $('body').append(popup);
        $('#myModal').modal('show');
    };

    //set the value
    var setValue = function(setTextFieldElement){
        let previousTarget = '';
        $('.options').click(function(e){
            if(previousTarget){
                previousTarget.bgColor = 'transparent';
            }
            e.currentTarget.bgColor = '#FF0000';
            selectedItem.value = e.currentTarget.textContent;
            selectedItem.recordNum = e.currentTarget.id.replace(/record/g, "");
            previousTarget = event.currentTarget;
        });

        $('#setButton').click(function(){
            if(selectedItem.value){
                $('#myModal').modal('hide');
                $('#myModal').detach();
                setTextFieldElement.children[1].children[0].children[0].value = selectedItem.value;
                localStorage.setItem("DataSourceRecordNum", selectedItem.recordNum);
            } else {
                alert('Select one value');
            }
        });
    };

//////////////////////////////////////
    kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
        var setTextFieldElement = getSetTextField("control-single_line_text-field-gaia", textField.label);
        attachAttributes(setTextFieldElement);
        addLookupClear(setTextFieldElement);

        body = {
            "app": dataSourceAppId,
            "fields": dataSourceFieldCodes
        };

        $('#lookup').click(function(e){
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                sourceRecords = resp.records;
                if(sourceRecords.length > 0){
                    if(Object.values(sourceRecords[0])[0].type !== "RECORD_NUMBER"){
                        sourceRecords = bringRecordNumFirst(sourceRecords);
                    }
                    if(setTextFieldElement.children[1].children[0].children[0].value){
                        queryCriteriaArray = createCriteriaArray(setTextFieldElement.children[1].children[0].children[0].value);
                        var matchedRecordArray = [];//store all matched data and its entire record

                        for(let record of sourceRecords){
                            if(includesCriteria(record, queryCriteriaArray) && !matchedRecordArray.includes(record)){
                                matchedRecordArray.push(record);
                            }
                        }
                        console.log(matchedRecordArray);
        
                        createPopupContent(matchedRecordArray);
                        setValue(setTextFieldElement);
                        matchedRecordArray = [];
                    }
                }
            });
        });

        $('#clear').click(function(e){
            setTextFieldElement.children[1].children[0].children[0].value = "";
            selectedItem = "";
        })
    });

    kintone.events.on(['app.record.create.submit.success', 'app.record.edit.submit.success'], function(event){
        var matchingInfo = []; //index: recordNum in main app / value: recordNum in data source app
        var DataSourceRecordNum = localStorage.getItem("DataSourceRecordNum");
        body = {
            "app": dummyAppId
        };

        var promise = new Promise(function(resolve, reject){
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                console.log(resp);

                if(resp.records.length > 0){
                //when there is a matching info
                    matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                    matchingInfo[event.recordId] = DataSourceRecordNum;

                    body = {
                        "app": dummyAppId,
                        "id": resp.records[0].Record_number.value,
                        "record": {
                            "recordMatchingInfo": {
                                "value": JSON.stringify(matchingInfo)
                            }
                        }
                    };

                    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
                        console.log(resp);
                        resolve("Matching info exists at submit success");
                    });
                } else {
                //no matching info
                    matchingInfo[event.recordId] = DataSourceRecordNum;

                    body = {
                        "app": dummyAppId,
                        "record": {
                            "recordMatchingInfo": {
                                "value": JSON.stringify(matchingInfo)
                            }
                        }
                    };

                    kintone.api(kintone.api.url('/k/v1/record', true), 'POST', body, function(resp) {
                        console.log(resp);
                        resolve("No matching info at submit success");
                    }, function(error) {
                        // error
                        console.log(error);
                    });
                }
            });
        });

        promise.then(function(result){
            console.log(result);
        }, function(err){
            console.log(err);
        });
    });

    kintone.events.on('app.record.detail.show', function(event){
        var matchingInfo = []; //index: recordNum in main app / value: recordNum in data source app
        var DataSourceRecordNum = -1;
        var appendURL = false;
        body = {
            "app": dummyAppId
        };
        
        var promise = new Promise(function(resolve, reject){
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                console.log(resp);

                if(resp.records.length > 0){
                //when there is a matching info
                    resolve("Matching info exists at detail");

                    matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                    DataSourceRecordNum = matchingInfo[event.recordId];
                    if(DataSourceRecordNum){
                        appendURL = true;
                    }
                } else {
                //no matching info
                    reject("No matching info at detail");
                }
            });
        });

        promise.then(function(result){
            console.log(result);

            if(appendURL){
                var setTextFieldElement = getSetTextField("control-single_line_text-field-gaia", textField.label);

                var aTag = document.createElement("a");
                aTag.setAttribute("href", "/k/" + config.dataSourceAppId + "/show#record=" + DataSourceRecordNum);
                aTag.setAttribute("target", "_blank");

                var content = setTextFieldElement.children[1].children[0];
                content.remove();
                setTextFieldElement.children[1].appendChild(aTag);
                setTextFieldElement.children[1].children[0].appendChild(content);
            }
        }, function(err){
            console.log(err);
        });
    });

    kintone.events.on('app.record.index.show', function(event){
        if(event.records.length > 0){
            var elementsFieldCode = kintone.app.getFieldElements(textField.code);
            setTextFieldUniqueClassName = elementsFieldCode[0].className.match(/value-\d+/g)[0]; //regex: "value..."

            body = {
                "app": dummyAppId
            };
            
            var promise = new Promise(function(resolve, reject){
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                    console.log(resp);

                    if(resp.records.length > 0){
                    //when there is a matching info
                        resolve("Matching info exists");

                        var matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value); //index: recordNum in main app / value: recordNum in data source app
//this matchingInfo array should not contain the deleted element
                        console.log(matchingInfo);
                        var mainAppRecords = event.records;
                        var DataSourceRecordNum = -1;

                        var aTag, content;
                        for(let key in mainAppRecords){
                            DataSourceRecordNum = matchingInfo[mainAppRecords[key].Record_number.value];

                            if(DataSourceRecordNum){
                                //Assume the order of mainAppRecords corresponds to the order of elementsFieldCode
                                setTextFieldElement = elementsFieldCode[key];
                                
                                aTag = document.createElement("a");
                                aTag.setAttribute("href", "/k/" + config.dataSourceAppId + "/show#record=" + DataSourceRecordNum);
                                aTag.setAttribute("target", "_blank");
                
                                content = setTextFieldElement.children[0].children[0];
                                aTag.textContent = content.textContent;
                                content.remove();
                                setTextFieldElement.children[0].appendChild(aTag);
                                aTagArray[mainAppRecords[key].Record_number.value] = aTag;
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
        if(aTagArray[event.record.Record_number.value]){
            setTextFieldElement = document.getElementsByClassName("recordlist-editcell-gaia recordlist-edit-single_line_text-gaia " + setTextFieldUniqueClassName)[0];
            setTextFieldElement.setAttribute("title","Not editable.");
            setTextFieldElement.setAttribute("class", "recordlist-cell-gaia recordlist-single_line_text-gaia " + setTextFieldUniqueClassName);
            setTextFieldElement.children[0].setAttribute("class", "line-cell-gaia recordlist-ellipsis-gaia");
            setTextFieldElement.children[0].children[0].remove();
            setTextFieldElement.children[0].appendChild(aTagArray[event.record.Record_number.value]);
        }
    });

    kintone.events.on('app.record.index.edit.submit.success', function(event){
        location.reload();

        // console.log(event);
        // console.log(kintone.app.getFieldElements(textField.code));

        // if(aTagArray[event.record.Record_number.value]){

        // }
    });

    kintone.events.on(['app.record.detail.delete.submit'], function(event){
        var promise = new Promise(function(resolve, reject){
            body = {
                "app": dummyAppId
            };
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                console.log(resp);

                matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
//empty the element at the index of this record number
                matchingInfo[event.recordId] = null;
                alert("stop");

                body = {
                    "app": dummyAppId,
                    "id": resp.records[0].Record_number.value,
                    "record": {
                        "recordMatchingInfo": {
                            "value": JSON.stringify(matchingInfo)
                        }
                    }
                };

                kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
                    console.log(resp);
                    resolve("Delete update");
                });
                
            });
        });

        promise.then(function(result){
            console.log(result);
        }, function(err){
            console.log(err);
        });
    });
})(jQuery, kintone.$PLUGIN_ID); 