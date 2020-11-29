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

  // Lắng nghe route "CONTROL-DIRECTIONS" từ các CLIENTS
  // Hàm này gửi lệnh điều khiển cho tất cả CLIENTS
  socket.on("CONTROL-DIRECTIONS",function(dir){
      io.sockets.emit("NODE-control",dir);
      console.log(dir);
  });

  // Lắng nghe route "ENERGY" từ các CLIENTS
  // Hàm này lưu giá trị energy vào database đồng thời hiển thị giá trị lên các CLIENTS
  socket.on("NODE-energy", function(energy) {
    console.log(energy);
    // async function saveHistory() {
    //   result = await db.querySaveHistory(energy); 
    //   if(result != "querySaveHistory-ERROR")
    //     io.sockets.emit("displayEnergy",energy);
    //   else console.log(result);
    // }  
    // saveHistory(); // Thực thi
  });

  // Lắng nghe route "GET-HISTORY" từ các CLIENTS
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

// Khi người dùng truy cập vào url với đường link là '/' thì sẽ hiển thị giao diện trong file "dashboard.js" lên
app.get('/',function(req,res){
   res.render("dashboard");
});