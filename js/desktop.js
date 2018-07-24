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

    
    // var selectedItem = {
    //     "value":'', 
    //     "recordNum": -1
    // };
    //Those variables are used across the multiple events
    var body = "";
    var matchingInfo = []; //index: recordNum in main app / value: recordNum in data source app
    var setTextFieldUniqueClassName, setTextFieldElement;
    var matchingInfoIndexPage = []; //for the index page
    var aTagArrayIndexPage = []; //for the index page
    var validLookup = false;


    var regexCommaSpace = /, | , | ,/g;
    var regexBESpace = /^\s+|\s+$|,+$/g;

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

        field.children[1].children[0].children[0].setAttribute("id", "inputField");
    };

    //Add the lookup and clear buttons 
    var addLookupClear = function(){
        var lookupButton = '<button id="lookup" class="button-simple-cybozu input-lookup-gaia" type="button">Lookup</button>';
        var clearButton = '<button id="clear" class="button-simple-cybozu input-clear-gaia" type="button">Clear</button>';

        $('#divButton').append(lookupButton);
        $('#divButton').append(clearButton);
    };

    //Bring the record number field to the beginning of the records
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

    //Swap the element at the first index and the specified index in the given array
    var elementsSwap = function(index, array){
        var temp = array[0];
        array[0] = array[index];
        array[index] = temp;

        return array;
    };

    //given the key and value, create an object
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
    var setValue = function(setTextFieldElement, selectedItem){
        $('#myModal').click(function(event){
            console.log("Outside");
            $('#myModal').modal('hide');
            $('#myModal').detach();
            //validLookup = true;
        });

        $('.modal-content').click(function(event){
            console.log("Inside");
            event.stopPropagation();
        });

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
                validLookup = true;
            } else {
                alert('Select one value');
            }
        });
    };
    
//////////////////////////////////////
    //generate the pop up window based on the query and get the record number of the selected record
    kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
        var setTextFieldElement = getSetTextField("control-single_line_text-field-gaia", textField.label);

        attachAttributes(setTextFieldElement);
        addLookupClear(setTextFieldElement);

        body = {
            "app": dataSourceAppId,
            "fields": dataSourceFieldCodes
        };

        var selectedItem = {
            "value":'', 
            "recordNum": -1
        };

        var sourceRecords = [];
        $(document).on("click keypress", "#lookup, #inputField", function(e){
            if(e.target.id === "lookup" || e.keyCode === 13){
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                    sourceRecords = resp.records;
                    if(sourceRecords.length > 0){
                        if(Object.values(sourceRecords[0])[0].type !== "RECORD_NUMBER"){
                            sourceRecords = bringRecordNumFirst(sourceRecords);
                        }
                        
                        var queryCriteriaArray = createCriteriaArray(setTextFieldElement.children[1].children[0].children[0].value);
                        var matchedRecordArray = [];//store all matched data and its entire record
    
                        for(let record of sourceRecords){
                            if(includesCriteria(record, queryCriteriaArray) && !matchedRecordArray.includes(record)){
                                matchedRecordArray.push(record);
                            }
                        }
                        console.log(matchedRecordArray);
        
                        if(matchedRecordArray.length > 0){
                            createPopupContent(matchedRecordArray);
                            setValue(setTextFieldElement, selectedItem);
                            matchedRecordArray = [];    
                        } else {
                            event.record[textField.code].error = 'No records matched.';
    //Show this message if there is no matched records.
                            //return event;
                        }
    
                        setTextFieldElement.children[1].children[0].children[0].onchange = function(e){
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
            setTextFieldElement.children[1].children[0].children[0].value = "";
            selectedItem.recordNum = "";
            selectedItem.value = "";
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
                }
                alert("localStorage_2");
                localStorage.setItem("body", JSON.stringify(body));
                localStorage.setItem("method", method);
            }).then(function(result){
            });
        }
    });

    //update/initialize the matchingInfo and add the link to the record
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
                        if(resp.records.length > 0){
                        //when there is a matching info
                            resolve("Matching info exists at detail");
                            matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                            DataSourceRecordNum = matchingInfo[event.record.$id.value];
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
                    if(resp.records.length > 0){
                    //when there is a matching info
                        resolve("Matching info exists at detail");
                        matchingInfo = JSON.parse(resp.records[0].recordMatchingInfo.value);
                        DataSourceRecordNum = matchingInfo[event.record.$id.value];
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
            });
        }
    });

    //delete the matchingInfo at the index of the record number of the deleted record 
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

                    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', body, function(resp) {
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

    kintone.events.on(['app.record.index.show', 'app.record.index.edit.submit.success'], function(event){
        var mainAppRecords;
        if(event.type === 'app.record.index.show'){
            mainAppRecords = event.records;
        }

        if(mainAppRecords.length > 0){
            body = {
                "app": dummyAppId
            };
            
            var promise = new Promise(function(resolve, reject){
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
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
                                setTextFieldElement = elementsByFieldCode[key];
                                content = setTextFieldElement.children[0].children[0];

                                if(content.tagName !== "A"){
                                    aTag = document.createElement("a");
                                    aTag.setAttribute("href", "/k/" + config.dataSourceAppId + "/show#record=" + DataSourceRecordNum);
                                    aTag.setAttribute("target", "_blank");
                    
                                    aTag.textContent = content.textContent;
                                    content.remove();
                                    setTextFieldElement.children[0].appendChild(aTag);
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
            setTextFieldElement = document.getElementsByClassName("recordlist-editcell-gaia recordlist-edit-single_line_text-gaia " + setTextFieldUniqueClassName)[0];
            setTextFieldElement.setAttribute("title","Not editable.");
            setTextFieldElement.setAttribute("class", "recordlist-cell-gaia recordlist-single_line_text-gaia " + setTextFieldUniqueClassName);
            setTextFieldElement.children[0].setAttribute("class", "line-cell-gaia recordlist-ellipsis-gaia");
            setTextFieldElement.children[0].children[0].remove();
            setTextFieldElement.children[0].appendChild(aTagArrayIndexPage[event.record.$id.value]);
        } else {
            setTextFieldElement = document.getElementsByClassName("recordlist-editcell-gaia recordlist-edit-single_line_text-gaia " + setTextFieldUniqueClassName)[0];
            console.log(setTextFieldElement);
            setTextFieldElement.children[0].children[0].disabled = true;
        }
    });

    kintone.events.on('app.record.index.delete.submit', function(event){
        aTagArrayIndexPage[event.record.$id.value] = null;
        matchingInfoIndexPage[event.record.$id.value] = null;
    });
})(jQuery, kintone.$PLUGIN_ID); 