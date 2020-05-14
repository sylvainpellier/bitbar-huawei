#!/usr/bin/env /usr/local/bin/node

//<bitbar.title>Huawei routeur</bitbar.title>
//<bitbar.version>v1.0</bitbar.version>
//<bitbar.author>Sylvain Pellier</bitbar.author>
//<bitbar.author.github>sylvainpellier</bitbar.author.github>
//<bitbar.desc>Get Data from your huawei router</bitbar.desc>
//<bitbar.dependencies>node, dialog-router-api,bitbar</bitbar.dependencies>
//<bitbar.abouturl>http://www.sylvainpellier.fr</bitbar.abouturl>

//INSTALL
//npm i bitbar dialog-router-api -g
//npm link bitbar dialog-router-api

const bitbar = require('bitbar');
const router = require('dialog-router-api').create({
    gateway: '192.168.0.1'
});

const common_unit_gb = "GB";
const common_unit_mb = "MB";
const common_unit_kb = "KB";
const common_unit_tb = "TB";

const batteryStatus = ["sur batterie","branché"];
batteryStatus[-1] = "batterie faible";

const networks = [];
networks[0] = "2G";
networks[2] = "3G";
networks[5] = "G";
networks[7] = "4G";

const etat = [];
etat[900] = "en cours de connexion";
etat[901] = "connecté";
etat[902] = "déconnecté";
etat[903] = "en cours de déconnexion";




const g_monitoring_dumeter_kb = 1024;
const g_monitoring_dumeter_mb = 1024 * 1024;
const g_monitoring_dumeter_gb = 1024 * 1024 * 1024;
const g_monitoring_dumeter_tb = 1024 * 1024 * 1024 * 1024;


router.getToken(function(error, token) {

    if(error) { reject(); return false; }

    const promiseStatus = new Promise((resolve, reject) => {

        if(error) reject();

        router.getStatus(token, function (error, data) {

            resolve(data);
        });

    });


    const promisePLMN = new Promise((resolve, reject) => {

        if(error) reject();

        router.getCurrentPLMN(token, function (error, data) {

            resolve(data);
        });

    });




    const  promiseStats = new Promise((resolve, reject) => {

        if(error) reject();

        router.getMonthStatistics(token, function (error, data) {

            data.total = parseInt(data.CurrentMonthDownload[0],10) + parseInt(data.CurrentMonthUpload[0],10);
            resolve(data);
        });

    });


    const  promiseSignal = new Promise((resolve, reject) => {

        if(error) reject();

        router.getSignal(token, function (error, data) {

            resolve(data);
        });

    });





Promise.all([promiseStats,promiseStatus,promiseSignal,promisePLMN]).then((data)=>{
    let stats = data[0];
    let status = data[1];
    let signal = data[2];
    let plmn = data[3];

    let dateFin = new Date(stats.MonthLastClearTime[0]);
    let dataAujourdHui = new Date();
    let reste = 30 - (dataAujourdHui - dateFin) / 1000 / 60 / 60 / 24;
    let UtilisationNormalJour = (100000000000 / 30) * 0.8;
    let Normal = reste * UtilisationNormalJour;



    bitbar([
        {
            text: getTrafficInfo(stats.total) ,
            color: (parseInt(stats.total) < 90) && ( ((100000000000) - parseInt(stats.total)) < Normal ) ? "white" : "red",
        },
        bitbar.separator,
        {
            text: "Échéance : "+ stats.MonthLastClearTime[0]
        },
        {
            text:"Utilisateur connecté : " + status.CurrentWifiUser[0] + "/"+ status.TotalWifiUser[0]
        },
        {
            text:"Puissance du signal : " + status.SignalIcon[0] + "/"+status.maxsignal[0]
        },
        {
            text:"Connexion : " + networks[plmn.Rat[0]]
        },
        {
            text: "Statut de la batterie : "+ batteryStatus[status.BatteryStatus[0]]
        },
        {
            text:"Batterie restante : " + status.BatteryPercent[0]+"%"
        },
        {
            text:"Réseau : " + plmn.FullName[0]
        },
        {
          text : "État de la connexion : "+ etat[status.ConnectionStatus[0]]
        },
        {
            text:"Rscp: : " + signal.rscp[0]
        },
        {
            text:"Rssi : " + signal.rssi[0]
        }


    ]);
});

});

function formatFloat(src, pos) {
    return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
}

function getTrafficInfo(bit) {
    var final_number = 0;
    var final_str = '';

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

    return final_str;
}