const {
    Pool
} = require('pg')

/**
 * 入力されたデータをDBに保存します。
 */
exports.WriteData = function (event) {
    return WriteInputData(event);
}

/**
 * DBに保存された情報を返します。
 */
exports.ReadData = function (event) {
    return ReadDataFromDB();
}

function WriteInputData(event) {
    let pool = new Pool({
        user: process.env.POSTGRESS_USER,
        host: process.env.POSTGRESS_HOST,
        database: process.env.POSTGRESS_DATABASE,
        password: process.env.POSTGRESS_PASSWORD,
        port: process.env.POSTGRESS_PORT,
        ssl: true,
    })

    let msg = '';

    if (event.message.type === 'text') {
        msg = event.message.text;
    } else if (event.message.type === 'location') {
        msg ='Location = Lat : ' + event.message.latitude + ', Lon : '+ event.message.longitude;
    }else{
        msg = 'Unknown';
    }

    let query = "INSERT INTO public.input_info SELECT '" +
        event.source.userId +
        "','" +
        msg +
        "',NOW()";

    pool.query(query, (err, res) => {
        console.log('write address')
    })

    pool.end()

    return null;
}

function ReadDataFromDB() {
    return new Promise(function (resolve, reject) {
        let pool = new Pool({
            user: process.env.POSTGRESS_USER,
            host: process.env.POSTGRESS_HOST,
            database: process.env.POSTGRESS_DATABASE,
            password: process.env.POSTGRESS_PASSWORD,
            port: process.env.POSTGRESS_PORT,
            ssl: true,
        })
        let query = 'SELECT * FROM public.input_info ORDER BY "RowId" DESC LIMIT 5 OFFSET 0';

        pool.query(query, (err, res) => {
            if (!err) {
                resolve(res);

            } else {
                reject(err);
            }
        })

        pool.end()

    });





}