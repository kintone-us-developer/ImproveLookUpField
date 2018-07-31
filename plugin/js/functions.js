"use strict";

//Used across the record.create/edit events
var validLookup = false;

var regexCommaSpace = /, | , | ,/g;
var regexBESpace = /^\s+|\s+jQuery|,+jQuery/g;

var destinationElement = '';

//Given the className and the field label find the element that is the text field the user chose in the plugin setting page
function getSetLookupField(className, label){
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

//Attach attributes to the user-selected field
var attachAttributes = function(field){
    field.setAttribute("id", "setTextField");
    field.children[1].children[0].setAttribute("id", "divButton");

    field.children[1].children[0].children[0].setAttribute("id", "inputField");
};

//Add the lookup and clear buttons 
var addLookupClear = function(){
    var lookupButton = '<button id="lookup" class="button-simple-cybozu input-lookup-gaia" type="button">Lookup</button>';
    var clearButton = '<button id="clear" class="button-simple-cybozu input-clear-gaia" type="button">Clear</button>';

    jQuery('#divButton').append(lookupButton);
    jQuery('#divButton').append(clearButton);
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

//Given the key and value, create an object
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

//Check if the record ,matches any of criterias
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

//Add teh pop up window to the body and show it
var addModal = function(popup){
    jQuery('body').append(popup);
    jQuery('#myModal').modal('show');
};

//Set the value
var getValue = function(lookupElement, selectedItem, sourceRecordAll, sourceFieldCode){
    jQuery('#myModal').click(function(){
        jQuery('#myModal').modal('hide');
        jQuery('#myModal').detach();
    });

    jQuery('.modal-content').click(function(event){
        event.stopPropagation();
    });

    let previousTarget = '';
    jQuery('.options').click(function(e){
        if(previousTarget){
            previousTarget.bgColor = 'transparent';
        }
        e.currentTarget.bgColor = '#FF0000';
        selectedItem.value = e.currentTarget.textContent;
        selectedItem.recordNum = e.currentTarget.id.replace(/record/g, "");
        previousTarget = event.currentTarget;
    });

    jQuery('#setButton').click(function(){
        if(selectedItem.value){
            jQuery('#myModal').modal('hide');
            jQuery('#myModal').detach();
            placeValue(selectedItem, lookupElement, sourceRecordAll, sourceFieldCode);
        } else {
            alert('Select one value');
        }
    });
};

var placeValue = function(selectedItem, lookupElement, sourceRecordAll, sourceFieldCode){
    lookupElement.children[1].children[0].children[0].value = selectedItem.value;
    localStorage.setItem("DataSourceRecordNum", selectedItem.recordNum);
    validLookup = true;

    sourceRecordAll.forEach(function(record){
        if(record.$id.value === selectedItem.recordNum){
            destinationElement[0].children[0].children[0].value = record[sourceFieldCode].value;
        }
    })
};

//Filter the given records by the given criteria field codes 
var filterRecords = function(all, criterias){
    var newArray = [];
    var obj = {};

    all.forEach(function(record){
        criterias.forEach(function(criteria){
            obj[criteria] = record[criteria];
        });
        newArray.push(obj);
        obj = {};
    });
    return newArray;
}