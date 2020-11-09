#!/usr/bin/env /usr/local/bin/node

//<bitbar.title>Huawei routeur</bitbar.title>
//<bitbar.version>v1.0</bitbar.version>
//<bitbar.author>Sylvain Pellier</bitbar.author>
//<bitbar.author.github>sylvainpellier</bitbar.author.github>
//<bitbar.desc>Get Data from your huawei router</bitbar.desc>
//<bitbar.dependencies>node, dialog-router-api,bitbar</bitbar.dependencies>
//<bitbar.abouturl>http://www.sylvainpellier.fr</bitbar.abouturl>

//INSTALL
//npm i bitbar dialog-router-api dateformat request-promise -g ; npm link bitbar dialog-router-api dateformat request-promise

let format = 1;
let forfaitBit = 100 * 1024 * 1024 * 1024;

const dateFormat = require('dateformat');

const bitbar = require('bitbar');
const router = require('dialog-router-api').create({
    gateway: '192.168.0.1'
});

const common_unit_byte = "B";
const common_unit_gb = "Gb";
const common_unit_mb = "Mb";
const common_unit_kb = "Kb";
const common_unit_tb = "Tb";

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


const g_monitoring_dumeter_kb = 1024 ;
const g_monitoring_dumeter_mb = 1024 * 1024;
const g_monitoring_dumeter_gb = 1024 * 1024 * 1024;
const g_monitoring_dumeter_tb = 1024 * 1024 * 1024 * 1024;

let alreadyError = false;


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

    const promiseStats = new Promise((resolve, reject) => {

        if(error) reject();


        router.getMonthStatistics(token, function (error, data) {

            if(!data.CurrentMonthDownload) { reject(); return false; }

            data.total = parseInt(data.CurrentMonthDownload[0],10) + parseInt(data.CurrentMonthUpload[0],10);
            resolve(data);
        });

    });

    const promiseSignal = new Promise((resolve, reject) => {

        if(error) reject();

        router.getSignal(token, function (error, data) {

            resolve(data);
        });

    });



Promise.all([promiseStats,promiseStatus,promiseSignal,promisePLMN]).then((data)=>{

    console
    let stats = data[0];
    let status = data[1];
    let plmn = data[3];

    let dateDebut = new Date(stats.MonthLastClearTime[0]);
    let dateAujourdHui = new Date();

    let nombreJourTotal = daysInMonth( dateDebut.getMonth(), dateDebut.getFullYear() );
    let nombreJourPasse = (dateAujourdHui - dateDebut) / 1000 / 60 / 60 / 24;

    if(nombreJourPasse <= 3 ) format = 2;


    let utilisationNormalJour = (forfaitBit / nombreJourTotal);


    let totalBits = stats.total;
    let totalGb = totalBits / g_monitoring_dumeter_gb;


    let moyenneJour =totalBits / nombreJourPasse;
    let balance = (nombreJourPasse * utilisationNormalJour) - totalBits;

    let resteJournee = 0;

    if(balance > 0)
    {
        let heureMaintenant = dateAujourdHui.getHours();
        let heuresRestantes = 24 - heureMaintenant;
        resteJournee = moyenneJour / heuresRestantes;
    }

    if(totalGb <= 10 ) format = 2;


    let color;
    if(totalGb > 95 )
    {
        color = "red";
    } else if( (balance < 0) )
    {
        color = "orange";
    }  else
    {
        color = "white";
    }

    let balanceTexte = (( balance > 0) ? "+" : "-")  + getTrafficInfo(balance,format);

    bitbar([
        {
            text: (status.BatteryPercent[0] <= 50 && status.BatteryStatus[0] === 1 ? "⚠ " : "") +balanceTexte   , color
        },
        bitbar.separator,
        {
            text: "Total consommé : "+ getTrafficInfo(totalBits,format)
        },
        {
            text: "Reste pour aujourd'hui : "+ getTrafficInfo(resteJournee,format)
        },
        {
            text: "Reste à consommer : "+ getTrafficInfo(forfaitBit - totalBits,format)
        },
        {
            text : "Balance : " + balanceTexte
        },
        {
          text : "Moyenne journalière : " + getTrafficInfo(moyenneJour,format)+ " / "+ getTrafficInfo(utilisationNormalJour,format)
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
                {
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
                },bitbar.separator,
                {
                    text:"Download : "+getTrafficInfo(stats.CurrentMonthDownload,format)
                },
                {
                    text:"Upload : "+getTrafficInfo(stats.CurrentMonthUpload,format)
                },
                {
                    text : "État de la connexion : "+ etat[status.ConnectionStatus[0]]
                }
            ]
        }


    ]);
},errorRouteur);

});

function getTrafficInfo(bit,format) {



    bit = Math.abs(bit);


    let final_number = 0;
    let final_str = '';
    let final_unit = '';

        if (bit < g_monitoring_dumeter_kb) {
            final_number = bit;
            final_unit = common_unit_byte;
        } else if ( bit < g_monitoring_dumeter_mb) {
            final_number = g_monitoring_dumeter_kb;
            final_unit = common_unit_kb;
        } else if ( bit < g_monitoring_dumeter_gb) {
            final_number = bit / g_monitoring_dumeter_mb;
            final_unit = common_unit_mb;
        } else if ( bit < g_monitoring_dumeter_tb) {
            final_number = bit / g_monitoring_dumeter_gb;
            final_unit = common_unit_gb;
        } else {
            final_number = bit / g_monitoring_dumeter_tb;
            final_unit =  common_unit_tb;
        }

    final_str = final_number.toFixed(format) + " "+ final_unit;

    return final_str;
}

function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}

function errorRouteur() {
    if(!alreadyError) {
        alreadyError = true;
        bitbar([
            {
                text: "..."
            }]);
    }


}