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

const dateFormat = require('dateformat');

const bitbar = require('bitbar');
const router = require('dialog-router-api').create({
    gateway: '192.168.0.1'
});

const common_unit_gb = "Go";
const common_unit_mb = "Mo";
const common_unit_kb = "Ko";
const common_unit_tb = "To";

const batteryStatus = ["branché","sur batterie"];
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

let alreadyError = false;

function errorRouteur()
{
    if(!alreadyError) {
        alreadyError = true;
        bitbar([
            {
                text: "..."
            }]);
    }


}

router.getToken(function(error, token) {

    if(error) {  errorRouteur(); return false; }

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

            if(!data.CurrentMonthDownload) { reject(); return false; }

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
    let plmn = data[3];

    let dateDebut = new Date(stats.MonthLastClearTime[0]);
    let dateAujourdHui = new Date();

    let nombreJourTotal = daysInMonth( dateDebut.getMonth(), dateDebut.getFullYear() );
    let nombreJourPasse = (dateAujourdHui - dateDebut) / 1000 / 60 / 60 / 24;

    let utilisationNormalJour = (100 / nombreJourTotal);
    let total = toGB(stats.total);
    let moyenneJour = parseFloat(((total / nombreJourPasse)).toFixed(1));
    let balance = parseFloat( ((nombreJourPasse * utilisationNormalJour)  - (total)).toFixed(1));

    let color;
    if(total > 95 )
    {
        color = "red";
    } else if( (balance < 0) )
    {
        color = "orange";
    }  else
    {
        color = "white";
    }

    let balanceTexte = (( balance > 0) ? "+" : "")  + balance + " Go";

    bitbar([
        {
            text: (status.BatteryPercent[0] <= 50 && status.BatteryStatus[0] === 1 ? "⦱ " : "") +balanceTexte   , color
        },
        bitbar.separator,
        {
            text: "Total consommé : "+ getTrafficInfo(stats.total)
        },
        {
            text: "Reste à consommer : "+ parseFloat(((100 - total)).toFixed(1)) + " Go"
        },
        {
            text : "Balance : " + balanceTexte
        },
        {
          text : "Moyenne journalière : " + moyenneJour + " Go" + " / "+ parseFloat(utilisationNormalJour).toFixed(1)+ " Go"
        },
        {
            text: "Date de début : "+ dateFormat(dateDebut, "dd-mm-yyyy")
        },
        {
            text:"Batterie restante : " + status.BatteryPercent[0]+"%"
        },
        {
            text: 'Informations',
            dropdown:true,
            alternate:true,
            submenu: [
                {
                    text:"Batterie restante : " + status.BatteryPercent[0]+"%"
                },
                ,{
                    text: "Statut de la batterie : "+ batteryStatus[status.BatteryStatus[0]]
                },bitbar.separator,
                {
                    text:"Utilisateur connecté : " + status.CurrentWifiUser[0] + "/"+ status.TotalWifiUser[0]
                },
                bitbar.separator,
                {
                    text:"Puissance du signal : " + status.SignalIcon[0] + "/"+status.maxsignal[0]
                },
                {
                    text:"Connexion : " + networks[plmn.Rat[0]]
                },
                {
                    text:"Réseau : " + plmn.FullName[0]
                },
                {
                    text : "État de la connexion : "+ etat[status.ConnectionStatus[0]]
                }
            ]
        }


    ]);
},errorRouteur);

});

function formatFloat(src, pos) {
    return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
}

function getTrafficInfo(bit) {
    var final_number = 0;
    var final_str = '';

        if (g_monitoring_dumeter_kb > bit) {
            final_number = formatFloat(parseFloat(bit), 1);
            final_str = final_number + ' ' + common_unit_byte;
        } else if (g_monitoring_dumeter_kb <= bit && g_monitoring_dumeter_mb > bit) {
            final_number = formatFloat(parseFloat(bit) / g_monitoring_dumeter_kb, 1);
            final_str = final_number + ' ' + common_unit_kb;
        } else if (g_monitoring_dumeter_mb <= bit && g_monitoring_dumeter_gb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_mb), 1);
            final_str = final_number + ' ' + common_unit_mb;
        } else if (g_monitoring_dumeter_gb <= bit && g_monitoring_dumeter_tb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_gb), 1);
            final_str = final_number + ' ' + common_unit_gb;
        } else {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_tb), 1);
            final_str = final_number + ' ' + common_unit_tb;
        }

    return final_str;
}

function toGB(bit)
{
    return formatFloat((parseFloat(bit) / g_monitoring_dumeter_gb), 2);
}

function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}