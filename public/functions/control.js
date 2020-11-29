var socket = io(); // Khởi tạo socket
var controlDirPress = "";
var pressIntervalUpdate; 
var mouseIsDown = false;
var chartIntervalUpdate;
var getDate = "";
var controlOnce = false;

$(document).ready(function() {

  socket.on("ENERGY-HISTORY",function(data){ // Nhận giá trị cảm biến từ SERVER thông qua route "SensorsData"
    console.log(data);
    var getValueField = Array();
    var getTimeField = Array();

    for(var i = 0; i < data.length; i++)
    {
      getValueField.push(data[i].value);
      getTimeField.push(data[i].time.substr(0, 5));
    }
    Draw_Func(getValueField,getTimeField,getDate);
  });
});

function controlDirection(dir)
{
  clearInterval(pressIntervalUpdate);
  if(controlOnce == true)
  {
    socket.emit("CONTROL-DIRECTIONS",dir+"o"); // Gửi thiết bị và giá trị trạng thái muốn điều khiển đến SERVER
  }
  else{
    controlOnce = true;
  } 
}

var Quantity = 0;

// Khi ấn nút Get , sẽ vào đây và lấy giá trị trong ô nhập ra
function Change_Quantity()
{ 
  var Tmp_Quantity = document.getElementById("GetQuantityBtn").value;
  if(Tmp_Quantity > 50) // Nếu nhập lớn hơn 50 giá trị hiển thị thì sẽ bị rối mắt nên là báo nhập lại
  {
    document.getElementById("GetQuantityBtn").value=0; //update lại giá trị 0 cho cái ô input
    alert("The Quantity Should Be Lower Than 50");
  }
  else  // Còn k thì hiển thị ra và update lại giá trị 0 cho cái ô input
  {
    Quantity = document.getElementById("GetQuantityBtn").value;
    document.getElementById("GetQuantityBtn").value=0;  
  }
  
}

// Hàm lấy ngày hôm nay và ép về kiểu như trong database để dễ xử lý
function getToday() {
 var today = new Date();    // Lấy date theo định dặng mặc định nào đó
 var dd = today.getDate();    // Tách ngày
 var mm = today.getMonth() + 1; // Tách tháng nhưng phải +1 vì January trả về 0
 var yyyy = today.getFullYear();// Lấy năm 4 chữ số

 if (dd <  10)  // Thêm số 0 cho ngày < 10
  dd = '0' + dd
 if (mm <  10)  // Thêm số 0 cho tháng < 10
  mm = '0' + mm 

 return yyyy + '-' + mm + '-' + dd;

}

// Hàm vẽ truyền vào mảng JSON đã được phân rã thành 3 giá trị Value,Time và ngày(Dùng để hiển thị tên sơ đồ)
function Draw_Func(Value,Time,DateTitle) {
 var ctx = document.getElementById('myChart').getContext('2d');// Xuất ra 2d ở thẻ có id myChart
 

 if (typeof Draw != 'undefined') {
  Draw.destroy(); // Xoá cache chart cũ
 }

 
 Chart.defaults.global.defaultFontFamily = 'Lato';  // Set font chữ cho toàn chart
 Chart.defaults.global.defaultFontSize = 11;    // Size chữ
 Chart.defaults.global.defaultFontColor = '#111'; // Màu

 
 // khởi tạo Chart với tham số ctx , và các thông số giao diện 
 Draw = new Chart(ctx, {
  type: 'line', //Loại line
  data: {

  // Labels này biểu thị cho tên trục X 
   labels: Time,  // Mảng các thời gian tương ứng với giá trị điện thu được

   datasets: [{
  showLine: true,
    label: 'Value', // Đơn vị của myData , khi trỏ vào điểm tròn sẽ hiển thị
    yAxisID: 'Rate', // ID của trục Y
    xAxisID: 'Date', // ID của trục X
  
    data: Value,  // Mảng data với các giá trị điện thu được
    
  pointBackgroundColor: 'rgba(150, 102, 255, 0.6)', // Mảng các màu Warning và không Warning (Warning : Red , Not Warning : Violet)
    pointBorderWidth: 2,    // Viền
    pointBorderColor: '#777', // Màu viền
    pointHoverBorderWidth: 2, // Viền Animation
    pointHoverBorderColor: '#000',  // Màu viền animation
    pointRadius: 3,       // Độ to của điểm tròn
  backgroundColor: 'white',
   }]
  },
  options: {
  responsive: true,
  maintainAspectRatio: false,
   animation: {
    duration: 0   // Animation của chart , nên set về 0
   },
   title: {     // Title
    display: true,
    text: "Day: "+DateTitle,
    fontSize: 25
   },
   legend:{   // Thanh nhỏ hồng bên trái
     display:false,
     position:'right',
     labels:{
     fontColor:'#000'
     }
   },
   layout: { // Layout charts
    padding: {
     left: 0,
     right: 0,
     bottom: 0,
     top: 0
    }
   },
   scales: { // Đặt tên cho các trục X Y
    yAxes: [{
    
     id: 'Rate',
     position: 'left',
     scaleLabel: {
      display: true,
      labelString: 'Rate(mA)',  
      fontSize: 25
     },
    ticks: {
            min: 0,
            max: 100,
            stepSize: 10
        }
   
    }],
    xAxes: [{
     id: 'Date',
     position: 'bottom',
     scaleLabel: {
      display: true,
      labelString: 'Time',
      fontSize: 25
     }
    }]
   },
  }
 });
}

// Hiển thị dữ liệu trong ngày hôm đó 
function displayChart() {

  document.getElementById('idHistoryChart').style.display='block'; // Hiển thị form ra
  document.getElementById("idDateSelection").value = null; // Reset lịch
  getDate = getToday();
  clearInterval(chartIntervalUpdate);// Xoá cache 
  var ajax_call = function() {
    socket.emit("GET-HISTORY",getDate);
  }
  chartIntervalUpdate = setInterval(ajax_call, 1000);
}

// Hàm này được gọi khi người dùng nhấn vào xem lịch sử
function displayHistory() 
{
  clearInterval(chartIntervalUpdate);
  getDate = getToday();
  if(document.getElementById("idDateSelection").value){
    if(document.getElementById("idDateSelection").value == getDate)
      displayChart();
    else
    {
      getDate = document.getElementById("idDateSelection").value;
      socket.emit("GET-HISTORY",getDate);
    }
  }
}

function closeChart(){
  clearInterval(chartIntervalUpdate);// Xoá cache 
  document.getElementById('idHistoryChart').style.display = "none"; // Tắt form
}


/////// ####### WINDOWS EVENTS #######

// Hàm này hô trợ cho việc FORM hiển thị lịch sử DHT sẽ tắt đi khi người dùng nhấn bất cứ đâu ngoài cái form
window.onclick = function(event) {
    if (event.target == document.getElementById('idHistoryChart')) {
        closeChart();
    }
}

// Hàm này hỗ trợ cho việc click and hold các nút xoay
window.addEventListener('mousedown', function(e) {
  mouseIsDown = true;
  controlDirPress = e.target.id;
  controlOnce = true;
  clearInterval(pressIntervalUpdate);
  var ajax_call = function() {
    if(mouseIsDown) {
      if(controlDirPress != "" && controlOnce == true)
        {
          controlOnce = false;
          socket.emit("CONTROL-DIRECTIONS",controlDirPress); // Gửi thiết bị và giá trị trạng thái muốn điều khiển đến SERVER
        }
    }
  }
  pressIntervalUpdate = setInterval(ajax_call, 200);
});


// Hàm này hỗ trợ cho việc click and hold các nút xoay
window.addEventListener('mouseup', function() {
  mouseIsDown = false;
  controlDirPress = "";
  clearInterval(pressIntervalUpdate);
  if(controlOnce == false)
  {
      socket.emit("CONTROL-DIRECTIONS","stop");
  }  
});