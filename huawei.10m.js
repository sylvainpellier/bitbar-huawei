#!/usr/bin/env /usr/local/bin/node

//<bitbar.title>Huawei routeur</bitbar.title>
//<bitbar.version>v1.0</bitbar.version>
//<bitbar.author>Sylvain Pellier</bitbar.author>
//<bitbar.author.github>your-github-username</bitbar.author.github>
//<bitbar.desc>Get Data from your huawei router</bitbar.desc>
//<bitbar.dependencies>node, dialog-router-api,bitbar</bitbar.dependencies>
//<bitbar.abouturl>http://www.sylvainpellier.fr</bitbar.abouturl>

var router = require('dialog-router-api').create({
    gateway: '192.168.0.1'
});
var total = 0;

const bitbar = require('bitbar');
const common_unit_gb = "GB";
const common_unit_mb = "MB";
const common_unit_kb = "KB";

var LANGUAGE_DATA = {
    current_language: 'fr_FR',
    supportted_languages: [],
    privacy_policy_list: {},
    usermanual_language_list: {}
};

ignore_file_names = ['package.json', 'package-lock.json'];


var g_monitoring_dumeter_kb = 1024;
var g_monitoring_dumeter_mb = 1024 * 1024;
var g_monitoring_dumeter_gb = 1024 * 1024 * 1024;
var g_monitoring_dumeter_tb = 1024 * 1024 * 1024 * 1024;

function formatFloat(src, pos) {
    return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
}


function getTrafficInfo(bit) {
    var final_number = 0;
    var final_str = '';
    if (LANGUAGE_DATA.current_language == 'ar_sa' || LANGUAGE_DATA.current_language == 'he_il' || LANGUAGE_DATA.current_language == 'fa_fa') {
        if (g_monitoring_dumeter_kb > bit) {
            final_number = formatFloat(parseFloat(bit), 2);
            final_str = common_unit_byte + ' ' + final_number;
        } else if (g_monitoring_dumeter_kb <= bit && g_monitoring_dumeter_mb > bit) {
            final_number = formatFloat(parseFloat(bit) / g_monitoring_dumeter_kb, 2);
            final_str = common_unit_kb + ' ' + final_number;
        } else if (g_monitoring_dumeter_mb <= bit && g_monitoring_dumeter_gb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_mb), 2);
            final_str = common_unit_mb + ' ' + final_number;
        } else if (g_monitoring_dumeter_gb <= bit && g_monitoring_dumeter_tb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_gb), 2);
            final_str = common_unit_gb + ' ' + final_number;
        } else {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_tb), 2);
            final_str = common_unit_tb + ' ' + final_number;
        }
    } else {
        if (g_monitoring_dumeter_kb > bit) {
            final_number = formatFloat(parseFloat(bit), 2);
            final_str = final_number + ' ' + common_unit_byte;
        } else if (g_monitoring_dumeter_kb <= bit && g_monitoring_dumeter_mb > bit) {
            final_number = formatFloat(parseFloat(bit) / g_monitoring_dumeter_kb, 2);
            final_str = final_number + ' ' + common_unit_kb;
        } else if (g_monitoring_dumeter_mb <= bit && g_monitoring_dumeter_gb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_mb), 2);
            final_str = final_number + ' ' + common_unit_mb;
        } else if (g_monitoring_dumeter_gb <= bit && g_monitoring_dumeter_tb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_gb), 2);
            final_str = final_number + ' ' + common_unit_gb;
        } else {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_tb), 2);
            final_str = final_number + ' ' + common_unit_tb;
        }
    }
    return final_str;
}

function agile_adapter_unit(value, value_unit) {
    var ret = 0;
    if ('B' == value_unit) {
        ret = value;
    } else if ('KB' == value_unit) {
        ret = g_monitoring_dumeter_kb * value;
    } else if ('MB' == value_unit) {
        ret = g_monitoring_dumeter_mb * value;
    } else if ('GB' == value_unit) {
        ret = g_monitoring_dumeter_gb * value;
    } else if ('TB' == value_unit) {
        ret = g_monitoring_dumeter_tb * value;
    }
    return ret;
}


router.getToken(function(error, token) {


    router.getMonthStatistics(token, function(error, stats) {


        router.getSignal(token, (error, signal) => {



        router.getStatus(token,function(error,status) {

        total = (parseInt(stats.CurrentMonthDownload[0],10)) + (parseInt(stats.CurrentMonthUpload[0],10));

        //console.log('Total usage is:', bytes(  total   ));

        bitbar([
            {
                text:    getTrafficInfo(total) ,
                color: "white",
            },
            bitbar.separator,
            {
              text: "Échéance : "+ stats.MonthLastClearTime[0]
            },
            {
                text:"Utilisateur connecté : " + status.CurrentWifiUser[0] + "/"+ status.TotalWifiUser[0]
            },
            ,
            {
                text:"Puissance du signal : " + status.SignalIcon[0] + "/"+status.maxsignal[0]
            },
            ,
            {
                text:"Batterie restante : " + status.BatteryPercent[0]+"%"
            },

            // bitbar.separator,
            // {
            //     text: 'Unicorns',
            //     color: '#ff79d7',
            //     submenu: [
            //         {
            //             text: ':tv: Video',
            //             href: 'https://www.youtube.com/watch?v=9auOCbH5Ns4'
            //         },
            //         {
            //             text: ':book: Wiki',
            //             href: 'https://en.wikipedia.org/wiki/Unicorn'
            //         }
            //     ]
            // }

        ]);

        })

    });        });

});