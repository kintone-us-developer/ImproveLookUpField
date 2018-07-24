jQuery.noConflict();

(function($, PLUGIN_ID){
    "use strict"
    var terms = {
        'en': {
            pluginCancel: '     Cancel   ',
            configTitle: 'Settings',
            textField: 'Create a text field for query in the main app and select it here.',
            kintoneFieldConfig: 'Kintone field settings for the New LooUp Field plugin',
            pluginActivation: 'Plug-in activation',
            pluginActive: 'Active',
            pluginSubmit: '     Save   ',
            apps: 'Select the data source app. (You will fetch data from this app.)',
            matching: 'Create one additional app with no fields and select the app here.',
            dataSourceFields: 'Select the data source field(s). Hold your command key to select mupltiple fields.',
            textKintoneFields: 'Please follow the steps below.'
        }
    }

    var lang = kintone.getLoginUser().language;
    var i18n = (lang in terms) ? terms[lang] : terms['en'];

    // append events
    var appendEvents = function appendEvents(fields, configTemplateItems) {
        // save plug-in settings
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
            if(!tempDataSource.includes(fields.recordNumField.code)){
                tempDataSource.unshift(fields.recordNumField.code); //move the record number to the beginning of the array
            }
            config.dataSourceFieldCodes = JSON.stringify(tempDataSource);

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
        });
        
        // cancel plug-in settings
        $('#cancel').click(function() {
            history.back();
        });
    };

    // create HTML (call in renderHtml)
    var createHtml = function(fields) {
        // template & items settings
        // '#plugin-template' is defined in config.html
        var template = $.templates(document.querySelector('#plugin-template-appTextFieldSelection'));
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
            }
        };
        // render HTML
        $('#plugin-container').html(template(templateItems));

        var field, item;
        $('#dataSourceAppId').change(function() {
            template  = $.templates(document.querySelector('#plugin-template-sourceFieldsSelection'));
            templateItems = {dataSourceFields:{}, pluginSubmit:'', pluginCancel:''};

            var selectedAppId = $('#dataSourceAppId').val();

            kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', {
            'app': selectedAppId}, function(resp) {
                console.log(resp);
                for (var key in resp.properties) {
                    field = resp.properties[key];
                    item = {
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

                templateItems.pluginSubmit = i18n.pluginSubmit;
                templateItems.pluginCancel = i18n.pluginCancel;

//Removes even if there is no this div container
                $("#sourceFieldsSelection-div").remove();
                // if($("#sourceFieldsSelection-div").val()){
                //     $("#sourceFieldsSelection-div").remove();
                // }

                $('#plugin-container').append(template(templateItems));

                var configTemplateItems = JSON.stringify(templateItems);
                appendEvents(fields, configTemplateItems);
            });
        });

// set existing values
        var config = kintone.plugin.app.getConfig(PLUGIN_ID);
        if (Object.keys(config).length > 0) {
            $('#activation').prop('checked', config.activation === 'active');
            $('#textField').val(JSON.parse(config.textField).code);
            $('#dummyAppId').val(config.dummyAppId);
            $('#dataSourceAppId').val(config.dataSourceAppId);

            var configTemplate = $.templates(document.querySelector('#plugin-template-sourceFieldsSelection'));
            var configTemplateItems = JSON.parse(config.templateItems);
            $('#plugin-container').append(configTemplate(configTemplateItems));

            var dataSourceFields = config.dataSourceFieldCodes;
            $('#dataSourceFieldsId option').each(function(){
                if(dataSourceFields.includes($(this).val())){
                    this.setAttribute("selected", "selected");
                }
            });
            appendEvents(fields, JSON.stringify(configTemplateItems));
        }
    }

    // fetch all fields in an app
    var apiCall = function() {
      kintone.api(kintone.api.url('/k/v1/apps', true), 'GET', {}, function(respApps) {
        var fields = {
          'apps': [],//all apps in the kintone platform
          'textFields': [],//all text fields in the main app with the plugin
          'appFields': [], //all fields in the selected app
          'recordNumField': ''
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
                        break;
                    case 'RECORD_NUMBER':
                        fields.recordNumField = item;
                        break;
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
