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
    var textField = JSON.parse(config.textField);
    var sourceRecords = [];
    var queryCriteriaArray = '';//user query inputs separated by commmas
    var eventList = ['app.record.create.change.' + textField.code, 'app.record.edit.change.' + textField.code, 'app.record.index.edit.change.' + textField.code];
    var body = {
        "app": dataSourceAppId,
        "fields": dataSourceFieldCodes
    };
    var regexCommaSpace = /, | , | ,/g;
    var regexBESpace = /^\s+|\s+$|,+$/g;
    var selectedValue = '';

    //Find the element that is the text field the user chose in the plugin setting page
    var getSetTextField = function(){
        var field = '';
        var textFieldArray = Array.from(document.getElementsByClassName("control-single_line_text-field-gaia"));
        textFieldArray.forEach(function(element, index){
            if(textField.label === element.textContent){
                field = textFieldArray[index];
            }
        });
        return field;
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
        let popup = '<div id="myModal" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true"> <div class="modal-dialog modal-lg"> <div class="modal-content"> <h1>Data Source</h1> <table class="table table-bordered table-dark"> <thead><tr><th scope="row"></th>';
        let temp = '';

        for(let fieldCode of Object.keys(matchedRecordArray[0])){
            temp += '<th scope="col">' + fieldCode + '</th>';
        }
        popup += temp + '</tr></thead><tbody>';

        let num;
        for(let key in matchedRecordArray){
            num = Number(key) + 1;
            temp = '<tr><th scope="row">Record ' + num + '</th>';
            for(let field of Object.values(matchedRecordArray[key])){
                temp += '<td class="options">' + field.value + '</td>';
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
            event.currentTarget.bgColor = '#FF0000';
            selectedValue = event.currentTarget.textContent;
            previousTarget = event.currentTarget;
        });

        $('#setButton').click(function(){
            if(selectedValue){
                $('#myModal').modal('hide');
                $('#myModal').detach();
                setTextFieldElement.children[1].children[0].children[0].value = selectedValue;
            } else {
                alert('Select one value');
            }
        });
    };

    kintone.events.on(eventList, function(event) {
        var setTextFieldElement = getSetTextField();
        kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
            sourceRecords = resp.records;
            if(event['record'][textField.code]['value']){
                queryCriteriaArray = createCriteriaArray(event['record'][textField.code]['value']);
            
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
        });
    });
})(jQuery, kintone.$PLUGIN_ID); 