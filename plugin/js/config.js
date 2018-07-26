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
            dataSourceFields: 'Select the data source field(s)<Key Fields>. Hold your command key to select mupltiple fields.',
            textKintoneFields: 'Please follow the steps below.',
            fieldMappings: 'Field Mappings'
        }
    }

    var lang = kintone.getLoginUser().language;
    var i18n = (lang in terms) ? terms[lang] : terms['en'];

    var textMappable = ['SINGLE_LINE_TEXT', 'RADIO_BUTTON', 'DROP_DOWN']; //+'NUMBER' && handle lookup
    var numberMappable = ['NUMBER', 'CALC', 'RECORD_NUMBER'];//handle lookup
    

    // append events
    var appendEvents = function appendEvents(fields) {
        // save plug-in settings
        var configTemplateItems = '';
        $('#submit').click(function() {
            var config = {};
            config.activation = $('#activation').prop('checked') ? 'active' : 'deactive';
            config.dataSourceAppId = $('#dataSourceAppId').val();
            config.dummyAppId = $('#dummyAppId').val();
            config.templateItems = configTemplateItems;
            var textFieldCode = $('#textField').val();

            fields.textFields.forEach(function(e){
                if(textFieldCode === e.code){
                    config.textField = JSON.stringify({'code': textFieldCode, 'label': e.label});
                }
            });
            
            var tempDataSource = $("#dataSourceFieldsId").val();
            if(tempDataSource){
                if(!tempDataSource.includes(fields.recordNumField.code)){
                    tempDataSource.unshift(fields.recordNumField.code); //move the record number to the beginning of the array
                }
            }
            config.dataSourceFieldCodes = JSON.stringify(tempDataSource);

            if(config.dummyAppId && config.dataSourceAppId && config.templateItems){
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
                        
                        kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'POST', body, function(resp) {
                        //create a field in the dummy app
                            console.log(resp);
            
                            body = {
                                "apps":[
                                    {
                                        "app":config.dummyAppId
                                    }
                                ]
                            };
            
                            kintone.api(kintone.api.url('/k/v1/preview/app/deploy', true), 'POST', body, function(resp) {
                            //deploy the change
                                console.log(resp);
                                kintone.plugin.app.setConfig(config);
                            });
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
                dataSourceFields:{}, 
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

            var selectedAppId = $('#dataSourceAppId').val();
 
            kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', {
            'app': selectedAppId}, function(resp) {
                templateItems.fieldMappings.sourceFields = Object.values(resp.properties);
                for (var key in resp.properties) {
                    var field = resp.properties[key];
                    var item = {
                        label: field.label || field.code,
                        code: field.code,
                        type: field.type
                    };
                    fields.appFields.push(item);
                }

                templateItems.dataSourceFields = {
                    title: i18n.dataSourceFields,
                    require: '*',
                    row: '',
                    id: 'dataSourceFieldsId',
                    fields: fields.appFields
                };

                fields.appFields = [];

//Problem: removes even if there is no this div container
                $("#lookupSetting").remove();

                $('#dataSourceApp').after(template(templateItems));
                // $('#plugin-container').append(template(templateItems));

                configTemplateItems = JSON.stringify(templateItems);

                $("#destination, #source").on("change", function(event){
                    if(event.target.id === "destination"){
//Works only with the text destination field
                        if(event.target.selectedOptions[0].text.match(/(?<=\[)(.*?)(?=\])/g)[0] === "SINGLE_LINE_TEXT"){
                            var sourceOptions = Array.from($('#source').children('option:not(:first)').remove());

                            sourceOptions.forEach(function(element){
                                var type = element.text.match(/(?<=\[)(.*?)(?=\])/g)[0];
                                if(textMappable.includes(type)){
                                    var option = '<option value="' + element.value + '">' + element.text + '</option>';
                                    $("#source").append(option);
                                }
                            });
                        }
                    } else if(event.target.id === "source"){

                    } else {
                        alert("somethig else");
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
                    case 'NUMBER' || 'MULTI_LINE_TEXT' || 'RICH_TEXT' || 'RADIO_BUTTON' || 'DROP_DOWN' || 'LINK' ||
                            'DATE' || 'TIME' || 'DATETIME' || 'USER_SELECT' || 'ORGANIZATION_SELECT' || 'GROUP_SELECT':
                        fields['mainAppFieldsForMappings'].push(item);  
                        breal;
                    default:
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
