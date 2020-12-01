var express = require("express");
var app = express();
app.use(express.static("public")); // Sử dụng folder public chứa các file của hệ thống 
app.set('view engine', 'ejs'); // Sử dụng view engine là công nghệ để hiển thị web
app.set("views","./views"); // Sử dụng folder views là nơi để chứa giao diện web

var bodyParser = require("body-parser"); // POST
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ type: 'application/json' }));

var db = require("./db/db"); // Include file db.js để dùng các function truy xuất db (library tự tạo)

var server = require("http").Server(app); // Khởi tạo server HTTP
var io = require("socket.io")(server); // Khởi tạo socket
server.listen(process.env.PORT || 3000, () => { // Server sẽ chạy trên port 3000 trong hệ thống mạng
   console.log('listening on *:3000');
});

// Hàm để lắng nghe sự kiện từ các CLIENTS
io.on("connection", function(socket)
{
  // Xuất ra terminal id của CLIENTS kết nối tới
  console.log("Client connected: " + socket.id);

  // Xuất ra terminal id của CLIENTS vừa ngắt kết nối
  socket.on("disconnect", function() {
    console.log(socket.id + " disconnected");
  });

  // Lắng nghe route "CONTROL_DIRECTIONS"
  // Hàm này gửi lệnh điều khiển cho tất cả CLIENTS
  socket.on("CONTROL_DIRECTIONS",function(dir){
      io.sockets.emit("NODE-control",dir);
      console.log(dir);
  });

  // Lắng nghe route "SAVE_ENERGY" 
  // Hàm này lưu giá trị energy vào database đồng thời hiển thị giá trị lên các CLIENTS
  socket.on("SAVE_ENERGY", function(data) {
    async function saveEnergy() {
      result = await db.querySaveEnergy(data); 
      if(result != "querySaveHistory-ERROR")
        io.sockets.emit("displayEnergy",data);
      else console.log(result);
    }  
    saveHistory(); // Thực thi
  });

// Lắng nghe route "SAVE_MODE_STATUS"
// Hàm này lưu giá trị mode vào database đồng thời thông báo đến tất cả CLIENTS để kịp thời đổi trạng thái
  socket.on("SAVE_MODE_STATUS", function(stt) {
    async function saveModeStatus() {
      result = await db.querySaveModeStatus(stt); 
      if(result != "querySaveModeStatus-ERROR")
        io.sockets.emit("MODE_WAS_CHANGED",stt);
      else console.log(result);
    }  
    saveModeStatus(); // Thực thi
  });

// Lắng nghe route "GET_MODE_STATUS"
// Hàm này lấy giá trị mode hiện tại và gửi đến client nào gọi nó
  socket.on("GET_MODE_STATUS", function() {
    async function getModeStatus() {
      result = await db.queryGetModeStatus(); 
      if(result != "queryGetModeStatus-ERROR")
        socket.emit("MODE_WAS_CHANGED",result);
      else console.log(result);
    }  
    getModeStatus(); // Thực thi
  });
  

  // Lắng nghe route "GET_CHART_DATA" 
  // Hàm này truy xuất database và gửi giá trị lịch sử energy đến CLIENT đã gọi nó
  socket.on("GET_CHART_DATA", function(date) {
    async function getHistory() {
      result = await db.queryGetHistory(date); 
      if(result == "queryGetHistory-ERROR")
      {
        socket.emit("ERROR",result);
        console.log(result);
      }
      else {
        socket.emit("ENERGY_DATA",result);
      }
    }  
    getHistory(); // Thực thi
  });

});

// Khi người dùng truy cập vào url với đường link là '/' thì sẽ hiển thị giao diện trong file "dashboard.ejs" lên
app.get('/',function(req,res){
   res.render("dashboard");
});