const request = require('request');
const parser = require('xml2json');


exports.getLocByAddress = function (address) {
    return getLatLng(address)
        .then(getAddress)
        .then(getEleve)
        .catch(function (error) {
            console.log(error);
            return reject(error);
        });
}

exports.getEleveByLatLng = function (lat, lng) {
    var value = {
        lat: lat,
        lng: lng
    }

    return getEleve(value);

}

/**
 * Locationから住所を取得します。
 * @param {*} value 
 */
function getAddress(value) {
    return new Promise(function (resolve, reject) {

        // http://www.finds.jp/rgeocode/index.html.ja
        let options = {
            url: 'http://www.finds.jp/ws/rgeocode.php?json&lat=' + value.lat + '&lon=' + value.lng,
            method: 'GET',
            json: true
        }

        request(options, function (error, response, body) {
            if (!error && (body.status == 200 || body.status == 201)) {

                value.address = body.result.prefecture.pname + body.result.municipality.mname;
                if (body.result.local && body.result.local[0]) {
                    value.address += body.result.local[0].section + body.result.local[0].homenumber;
                }
                console.log(body.result.prefecture.pname);


                return resolve(value);
            } else {

                return reject(error);
            }
        })
    });
}


/**
 * 指定された場所のLocationを取得します。
 * @param {} address 
 */
function getLatLng(address) {

    return new Promise(function (resolve, reject) {
        let url = encodeURIComponent(address);

        let options = {
            url: 'https://www.geocoding.jp/api/?v=1.2&q=' + url,
            method: 'GET'
        }

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // From xml to json
                var json = parser.toJson(body);
                // from json to Object
                let res = JSON.parse(json)

                if (!res.result.coordinate) {
                    console.log('NotFound!')
                    return reject(new Error("Not Found!"));

                }

                console.log(res.result.coordinate.lat);
                console.log(res.result.coordinate.lng);

                resolve({
                    lat: res.result.coordinate.lat,
                    lng: res.result.coordinate.lng
                });

            } else {
                return reject(error);
            }
        })
    });
}

function getEleve(value) {
    return new Promise(function (resolve, reject) {
        // https://maps.gsi.go.jp/development/api.html
        let options = {
            url: 'http://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=' + value.lng + '&lat=' + value.lat + '&outtype=JSON',
            method: 'GET',
            json: true
        }

        request(options, function (error, response, body) {

            if (!error && response.statusCode == 200) {

                console.log(body.elevation);

                value.elv = body.elevation;
                value.elvSrs = body.hsrc;

                console.log(value);

                return resolve(value);
            } else {
                return reject(error);
            }
        })
    });
}