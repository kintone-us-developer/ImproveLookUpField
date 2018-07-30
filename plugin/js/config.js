jQuery.noConflict();

(function($, PLUGIN_ID){
    "use strict"
    var terms = {
        'en': {
            pluginCancel: '     Cancel   ',
            configTitle: 'Settings',
            textField: 'Create a text field for query in the main app and select it here.',
            kintoneFieldConfig: 'Kintone field settings for the New LooUp Field plugin',
            pluginActivation: 'Plug-in activation!',
            pluginActive: 'Active',
            pluginSubmit: '     Save   ',
            apps: 'Select the data source app. (You will fetch data from this app.)',
            matching: 'Create one additional app with no fields and select the app here.',
            keyFields: 'Select the data source field(s)<Key Fields>. Hold your command key to select mupltiple fields.',
            textKintoneFields: 'Please follow the steps below.',
            fieldMappings: 'Field Mappings'
        }
    }

    var lang = kintone.getLoginUser().language;
    var i18n = (lang in terms) ? terms[lang] : terms['en'];
    
    //field types available to be a destination field in the field mappings
    var availableDestionationTypes = ['SINGLE_LINE_TEXT', 'NUMBER', 'MULTI_LINE_TEXT', 'RICH_TEXT', 'RADIO_BUTTON', 'DROP_DOWN', 'LINK', 'DATE',
        'TIME', 'DATETIME', 'USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT'];
    //mappable source field types to the specofied destination field type (Destination to Source)
    var textMappableDtoS = ['SINGLE_LINE_TEXT', 'NUMBER', 'RADIO_BUTTON', 'DROP_DOWN'];
    var numberMappableDtoS = ['NUMBER', 'CALC', 'RECORD_NUMBER'];
    var textAreaMappableDtoS = ['SINGLE_LINE_TEXT', 'NUMBER', 'MULTI_LINE_TEXT'];
    var richTextMappableDtoS = ['SINGLE_LINE_TEXT', 'NUMBER', 'MULTI_LINE_TEXT', 'RICH_TEXT'];
    var radioButtonMappableDtoS = ['RADIO_BUTTON'];
    var dropDownMappableDtoS = ['DROP_DOWN'];
    var linkMappableDtoS = ['LINK'];
    var dateMappableDtoS = ['DATE'];
    var timeMappableDtoS = ['TIME'];
    var dateAndTimeMappableDtoS = ['DATETIME', 'CREATED_TIME', 'UPDATED_TIME'];
    var userMappableDtoS = ['USER_SELECT', 'CREATOR', 'MODIFIER'];
    var departmentMappableDtoS = ['ORGANIZATION_SELECT'];
    var groupMapplableDtoS = ['GROUP_SELECT'];
    //field types available to be a source field in the field mappings
    var availableSourceTypes = ['SINGLE_LINE_TEXT', 'NUMBER', 'RADIO_BUTTON', 'DROP_DOWN', 'CALC', 'RECORD_NUMBER',
     'MULTI_LINE_TEXT', 'RICH_TEXT', 'LINK', 'DATE', 'TIME', 'DATETIME', 'CREATED_TIME', 'UPDATED_TIME', 'CREATOR', 'MODIFIER',
      'USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT'];
    //mappable destination field types to the specofied source field type
    var textMappableStoD = ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'RICH_TEXT'];
    var numberMappableStoD = ['NUMBER'];
    var textAreaMappableStoD = ['MULTI_LINE_TEXT', 'RICH_TEXT'];
    var richTextMappableStoD = ['RICH_TEXT'];
    var radioButtonMappableStoD = ['SINGLE_LINE_TEXT', 'RADIO_BUTTON'];
    var dropDownMappableStoD = ['SINGLE_LINE_TEXT', 'DROP_DOWN'];
    var linkMappableStoD = ['LINK'];
    var dateMappableStoD = ['DATE'];
    var timeMappableStoD = ['TIME'];
    var dateAndTimeMappableStoD = ['DATETIME'];
    var userMappableStoD = ['USER_SELECT'];
    var departmentMappableStoD = ['ORGANIZATION_SELECT'];
    var groupMapplableStoD = ['GROUP_SELECT'];
    var calculatedMappableStoD = ['NUMBER'];
    var recordNumberMappableStoD = ['NUMBER'];
    var createdDateTimeMappableStoD = ['DATETIME'];
    var updatedDateTimeMappableStoD = ['DATETIME'];
    var createdByMappableStoD = ['USER_SELECT'];
    var updatedByMappableStoD = ['USER_SELECT'];

    var updateFieldMappingList = function(id, fieldType, originalFields){
        switch (fieldType){
            case "SINGLE_LINE_TEXT":
                if(id === "#source"){
                    changeList(id, textMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, textMappableStoD, originalFields);
                }
                break;
            case "NUMBER":
                if(id === "#source"){
                    changeList(id, numberMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, numberMappableStoD, originalFields);
                }
                break;
            case "MULTI_LINE_TEXT":
                if(id === "#source"){
                    changeList(id, textAreaMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, textAreaMappableStoD, originalFields);
                }
                break;
            case "RICH_TEXT":
                if(id === "#source"){
                    changeList(id, richTextMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, richTextMappableStoD, originalFields);
                }
                break;
            case "RADIO_BUTTON":
                if(id === "#source"){
                    changeList(id, radioButtonMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, radioButtonMappableStoD, originalFields);
                }
                break;
            case "DROP_DOWN":
                if(id === "#source"){
                    changeList(id, dropDownMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, dropDownMappableStoD, originalFields);
                }
                break;
            case "LINK":
                if(id === "#source"){
                    changeList(id, linkMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, linkMappableStoD, originalFields);
                }
                break;
            case "DATE":
                if(id === "#source"){
                    changeList(id, dateMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, dateMappableStoD, originalFields);
                }
                break;
            case "TIME":
                if(id === "#source"){
                    changeList(id, timeMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, timeMappableStoD, originalFields);
                }
                break;
            case "DATETIME":
                if(id === "#source"){
                    changeList(id, dateAndTimeMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, dateAndTimeMappableStoD, originalFields);
                }
                break;
            case "USER_SELECT":
                if(id === "#source"){
                    changeList(id, userMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, userMappableStoD, originalFields);
                }
                break;
            case "ORGANIZATION_SELECT":
                if(id === "#source"){
                    changeList(id, departmentMappableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, departmentMappableStoD, originalFields);
                }
                break;
            case "GROUP_SELECT":
                if(id === "#source"){
                    changeList(id, groupMapplableDtoS, originalFields);
                } else if(id === "#destination"){
                    changeList(id, groupMapplableStoD, originalFields);
                }
                break;
            case 'CALC':
                if(id === "#destination"){
                    changeList(id, calculatedMappableStoD, originalFields);
                }
                break;
            case 'RECORD_NUMBER':
                if(id === "#destination"){
                    changeList(id, recordNumberMappableStoD, originalFields);
                }
                break;
            case 'CREATED_TIME':
                if(id === "#destination"){
                    changeList(id, createdDateTimeMappableStoD, originalFields);
                }
                break;
            case 'UPDATED_TIME':
                if(id === "#destination"){
                    changeList(id, updatedDateTimeMappableStoD, originalFields);
                }
                break;
            case 'CREATOR':
                if(id === "#destination"){
                    changeList(id, createdByMappableStoD, originalFields);
                }
                break;
            case 'MODIFIER':
                if(id === "#destination"){
                    changeList(id, updatedByMappableStoD, originalFields);
                }
                break;
            default:
                alert("somethig else");
                break;
        }
    };

    var changeList = function(id, mappableTypes, originalSources){
        Array.from($(id).children('option:not(:first)').remove());
        originalSources.forEach(function(source){
            if(mappableTypes.includes(source.type)){
                var option = '<option value="' + source.code + '">' + source.label + ' [' + source.type + ']</option>';
                $(id).append(option);
            }
        });
    }

    // append events
    var appendEvents = function appendEvents(fields) {
        // save plug-in settings
        var configTemplateItems = null;
        var originalSourceFields = [];
        var originalDestinationFields = [];
        $('#submit').click(function() {
            var config = {};
            config.activation = $('#activation').prop('checked') ? 'active' : 'deactive';
            config.dataSourceAppId = $('#dataSourceAppId').val();
            config.dummyAppId = $('#dummyAppId').val();
            if(configTemplateItems){
                config.templateItems = configTemplateItems;
            }
            var textFieldCode = $('#textField').val();

            fields.textFields.forEach(function(e){
                if(textFieldCode === e.code){
                    config.textField = JSON.stringify({'code': textFieldCode, 'label': e.label});
                }
            });
            
            var tempKeyFields = $("#keyFieldId").val();
            if(tempKeyFields){
                if(!tempKeyFields.includes(fields.recordNumField.code)){
                    tempKeyFields.unshift(fields.recordNumField.code); //move the record number to the beginning of the array
                }
            }
            config.keyFieldCodes = JSON.stringify(tempKeyFields);

            if(config.textField && config.dummyAppId && config.dataSourceAppId && config.templateItems){
                alert("hello");
                config.fieldMappings = JSON.stringify({"destinatioFieldCode": $("#destination").val(), "sourceFieldCode": $("#source").val()});
                var body = {
                    "app": config.dummyAppId
                };
                kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, function(resp) {
                    if(resp.records.length === 0){
                        body = {
                            "app": config.dummyAppId,
                            "properties": {
                                "recordMatchingInfo":{
                                    "type": "MULTI_LINE_TEXT",
                                    "code": "recordMatchingInfo",
                                    "label": "Matching Records Info",
                                    "defaultValue": "",
                                    "noLabel": false
                                }
                            }
                        };
                        
                        //create a field in the dummy app
                        kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'POST', body, function(resp) {
                            body = {
                                "apps":[
                                    {
                                        "app":config.dummyAppId
                                    }
                                ]
                            };
                            //deploy the change
                            kintone.api(kintone.api.url('/k/v1/preview/app/deploy', true), 'POST', body, function(resp) {
                                console.log(resp);
                                kintone.plugin.app.setConfig(config);
                            }, function(error){
                                console.log(error);
                            });
                        }, function(error){
                            console.log(error);
                        });
                    } else {
                        kintone.plugin.app.setConfig(config);
                    }
                });
            } else {
                config = {
                    "activation": config.activation
                }
                kintone.plugin.app.setConfig(config);
            }
        });
        
        // cancel plug-in settings
        $('#cancel').click(function() {
            history.back();
        });

        $('#dataSourceAppId').change(function() {
            var template  = $.templates(document.querySelector('#plugin-template-lookupSetting'));
            var templateItems = {
                keyFields:{}, 
                pluginSubmit:'', 
                pluginCancel:'',
                fieldMappings: {
                    title: i18n.fieldMappings,
                    require: '*',
                    row: '',
                    destinationId: 'destination',
                    sourceId: 'source',
                    destinationFields: fields.mainAppFieldsForMappings,
                    sourceFields: []
                }
            };

            originalDestinationFields = templateItems.fieldMappings.destinationFields;
            var selectedAppId = $('#dataSourceAppId').val();
 
            kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', {
            'app': selectedAppId}, function(resp) {

                var tempSources = Object.values(resp.properties);
                tempSources.forEach(function(element){
                    if(availableSourceTypes.includes(element.type)){
                        originalSourceFields.push(element);
                    }
                })
                templateItems.fieldMappings.sourceFields = originalSourceFields;

                for (var key in resp.properties) {
                    var field = resp.properties[key];
                    var item = {
                        label: field.label || field.code,
                        code: field.code,
                        type: field.type
                    };
                    fields.appFields.push(item);
                }

                templateItems.keyFields = {
                    title: i18n.keyFields,
                    require: '*',
                    row: '',
                    id: 'keyFieldId',
                    fields: fields.appFields
                };

                fields.appFields = [];

//Problem: removes even if there is no this div container
                $("#lookupSetting").remove();

                $('#dataSourceApp').after(template(templateItems));
                configTemplateItems = JSON.stringify(templateItems);

//source <-> destination / if the --- is selected
//Plus/Minus buttons
//Have to have the same event listener even when the previous config exists and the element with the "dataSourceAppId" doesn't change
//Users have to delete the field in the mappingInfo app every time they want to change the lookup setting in the plugin settings
//Handle "Lookup: Only when the Text field is specified for Key Field" things.
                var fieldType = '';
                $("#destination, #source").on("change", function(event){
                    if(event.target.id === "destination" && $("#source")[0].selectedOptions[0].text === "-----"){
                        fieldType = event.target.selectedOptions[0].text.match(/(?<=\[)(.*?)(?=\])/g)[0];
                        updateFieldMappingList('#source', fieldType, originalSourceFields);
                    } else if(event.target.id === "source" && $("#destination")[0].selectedOptions[0].text === "-----"){
                        fieldType = event.target.selectedOptions[0].text.match(/(?<=\[)(.*?)(?=\])/g)[0];
                        updateFieldMappingList('#destination', fieldType, originalDestinationFields);
                    }
                });
        
                $("#mappingPlus").click(function(){
        
                });
        
                $("#mappingMinus").click(function(){
                    
                });
            });
        });
    };

    // create HTML (call in renderHtml)
    var createHtml = function(fields) {
        // template & items settings
        // '#plugin-template' is defined in config.html
        var template = $.templates(document.querySelector('#plugin-template'));
        var templateItems = {
            configTitle: i18n.configTitle,
            // section1 activate plug-in
            pluginActivation: {
                pluginActivation: i18n.pluginActivation,
                pluginActive: i18n.pluginActive
            },
            kintoneFieldConfig: i18n.kintoneFieldConfig,
            textKintoneFields: i18n.textKintoneFields,
            textFields: {
                title: i18n.textField,
                require: '*',
                row: '',
                id: 'textField',
                fields: fields.textFields
            },
            kintoneApps: {
                title: i18n.apps,
                require: '*',
                row: '',
                id: 'dataSourceAppId',
                fields: fields.apps
            },
            dummyApp: {
                title: i18n.matching,
                require: '*',
                row: '',
                id: 'dummyAppId',
            },
            pluginSubmit: i18n.pluginSubmit,
            pluginCancel: i18n.pluginCancel
        };
        // render HTML
        $('#plugin-container').html(template(templateItems));

// set existing values
        var config = kintone.plugin.app.getConfig(PLUGIN_ID);
        if (Object.keys(config).length > 0) {
            $('#activation').prop('checked', config.activation === 'active');
            $('#textField').val(JSON.parse(config.textField).code);
            $('#dummyAppId').val(config.dummyAppId);
            $('#dataSourceAppId').val(config.dataSourceAppId);

            var configTemplate = $.templates(document.querySelector('#plugin-template-lookupSetting'));
            var configTemplateItems = JSON.parse(config.templateItems);
            $('#dataSourceApp').after(configTemplate(configTemplateItems));
            //$('#plugin-container').append(configTemplate(configTemplateItems));

            var keyFieldCodes = config.keyFieldCodes;
            $('#keyFieldId option').each(function(){
                if(keyFieldCodes.includes($(this).val())){
                    this.setAttribute("selected", "selected");
                }
            });

            var fieldMappings = JSON.parse(config.fieldMappings);
            $('#destination option').each(function(){
                if(fieldMappings.destination === $(this).val()){
                    this.setAttribute("selected", "selected");
                }
            });
            $('#source option').each(function(){
                if(fieldMappings.source === $(this).val()){
                    this.setAttribute("selected", "selected");
                }
            });
        }

        appendEvents(fields);
    }

    // fetch all fields in an app
    var apiCall = function() {
      kintone.api(kintone.api.url('/k/v1/apps', true), 'GET', {}, function(respApps) {
        var fields = {
          'apps': [],//all apps in the kintone platform
          'textFields': [],//all text fields in the main app with the plugin
          'appFields': [], //all fields in the selected app
          'recordNumField': '',
          'mainAppFieldsForMappings': [] //fields in the main app available to be destination fields in the field mapping
        };
        for (var key in respApps.apps) {
          var field = respApps.apps[key];
          var item = {
            appId: field.appId,
            name: field.name
          };
          fields.apps.push(item);
        }

        kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', {
        'app': kintone.app.getId()}, function(respFields) {
            fields.textFields = [];

            for (var key in respFields.properties) {
                field = respFields.properties[key];
                item = {
                    label: field.label || field.code,
                    code: field.code,
                    type: field.type
                };
                switch (field.type) {
                    case 'SINGLE_LINE_TEXT':
                        fields['textFields'].push(item);
                        fields['mainAppFieldsForMappings'].push(item);
                        break;
                    case 'RECORD_NUMBER':
                        fields.recordNumField = item;
                        break;
                    default:
                        if(availableDestionationTypes.includes(field.type)){
                            fields['mainAppFieldsForMappings'].push(item);  
                        }
                        break;
                }
            }

            createHtml(fields);
        });
      }, function(error) {
        // error
        console.log(error);
      });
    };

    // initiated
    $(document).ready(function() {
        apiCall();
    });
})(jQuery, kintone.$PLUGIN_ID);
