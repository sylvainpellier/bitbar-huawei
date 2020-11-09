const rp = require('request-promise');
const bitbar = require('bitbar');


const promiseDataGouv = new Promise((resolve, reject) => {

    rp('https://dashboard.covid19.data.gouv.fr/data/code-FRA.json')
        .then(function(data){
            var json = JSON.parse(data);
            dataFormat = [];
            dataFormat["last"] = json.slice(-1)[0];

            let tauxIncidence = {};
            let tauxReproductionEffectif = {};
            let tauxOccupationRea = {};
            let tauxPositiviteTests = {};


            json.forEach((d) =>{

                if(d.tauxIncidence && tauxIncidence.value) tauxIncidence.diff = tauxIncidence.value - d.tauxIncidence;
                if(d.tauxReproductionEffectif && tauxReproductionEffectif.value) tauxReproductionEffectif.diff = tauxReproductionEffectif.value - d.tauxReproductionEffectif;
                if(d.tauxOccupationRea && tauxOccupationRea.value) tauxOccupationRea.diff = tauxOccupationRea.value - d.tauxOccupationRea;
                if(d.tauxPositiviteTests && tauxPositiviteTests.value) tauxPositiviteTests.diff = tauxPositiviteTests.value - d.tauxPositiviteTests;

                if(d.tauxIncidence) { tauxIncidence.value = d.tauxIncidence;  tauxIncidence.date = d.date; }
                if(d.tauxReproductionEffectif){ tauxReproductionEffectif.value = d.tauxReproductionEffectif;  tauxReproductionEffectif.date = d.date; }
                if(d.tauxOccupationRea) { tauxOccupationRea.value = d.tauxOccupationRea;  tauxOccupationRea.date = d.date;}
                if(d.tauxPositiviteTests) { tauxPositiviteTests.value = d.tauxPositiviteTests;  tauxPositiviteTests.date = d.date; }

            });


            if(tauxIncidence) dataFormat["tauxIncidence"] = tauxIncidence;
            if(tauxReproductionEffectif) dataFormat["tauxReproductionEffectif"] = tauxReproductionEffectif;

            resolve(dataFormat);
        })
        .catch(function(err){
            reject();
        });
});


Promise.all([promiseDataGouv]).then((dataFormat)=> {



    let data = dataFormat[0]["last"];

    bitbar([
        {
            text: "Covid", color:"white"
        },
        {
            text: "Date : " + data.date.toString()
        }
        ,
        {
            text: "Hospitalisation : " + data.hospitalises.toString() +  " | " + plusOuMoins(data.nouvellesHospitalisations)
        }
        ,
        {
            text: "Réanimation : " + data.reanimation.toString() +  " | " + plusOuMoins(data.nouvellesReanimations)
        },
        {
            text: "Décès : " + (data.deces + data.decesEhpad).toString()
        },
        {
            text: "Occupation en réa : " + ((dataFormat[0]["tauxOccupationRea"]) ? (dataFormat[0]["tauxOccupationRea"].value).toFixed(2) + "% | " + (dataFormat[0]["tauxOccupationRea"].date) : "inconnu")
        }
        ,
        {
            text: "Dernier taux indicence : " + ((dataFormat[0]["tauxIncidence"]) ? (dataFormat[0]["tauxIncidence"].value).toFixed(2) + " | " + (dataFormat[0]["tauxIncidence"].date) : "inconnu") + " | "+ dataFormat[0]["tauxIncidence"].diff.toFixed(2)
        },
        {
            text: "Taux positivité test : " + ((dataFormat[0]["tauxPositiviteTests"]) ? (dataFormat[0]["tauxPositiviteTests"].value).toFixed(2) + "% | " + (dataFormat[0]["tauxPositiviteTests"].date) : "inconnu")
        },
        {
            text: "Taux de reproduction : " + ((dataFormat[0]["tauxReproductionEffectif"]) ? (dataFormat[0]["tauxReproductionEffectif"].value).toFixed(2) + " | " + (dataFormat[0]["tauxReproductionEffectif"].date) : "inconnu")
        }

    ]);



});

function strip_tags(texte)
{
    return texte.toString().replace(/(<([^>]+)>)/gi, "");
}

function plusOuMoins(value)
{
    return ((value>0) ? "+" : "-") + value;
}