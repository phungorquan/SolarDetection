var mysql = require('mysql'); // Khởi tạo câu lệnh DB
var pool = mysql.createPool({
    connectionLimit: 20,
    host: "localhost", // Host mặc định
  	user: "root", // User mặc định
  	password: "", // Password mặc định
  	dateStrings: true, 
  	database: "solardetection" // Tên database
});

// Các hàm bên dưới sẽ được gọi từ file "server.js"

// Hàm này sẽ truy vấn và trả về các giá trị cảm biến 
exports.queryGetHistory = function (date) {
	return new Promise (function (resolve, reject) {
		pool.query("SELECT value,time FROM history where date = '" + date +"';", function(err, rows, fields) { // Truy vấn
			if (err) reject(err); 
			if(rows.length>0){
				resolve(rows);
			}
			else resolve("queryGetHistory-ERROR");
		});
	});
}


