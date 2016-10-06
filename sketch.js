var Y_AXIS = 1;
var X_AXIS = 2;
var canvasWidth = 500;
var canvasHeight = 600;
var heightScale = 0.5;
var frmrate = 30;

var attention_values  = [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ];
var attention_helpers = [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ];

var meditation_values  = [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ];
var meditation_helpers = [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ];

var raw_values  = [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
                     0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ];
var raw_helpers = [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
                     0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ];

var eyeblink_values = [ 0 ];
var eyeblink_helpers = [ 0 ];

function receiveOsc(address, value)
{
  console.log("received OSC: " + address + ", " + value);
  if (address == '/mindwave/attention')
  {
      attention_values.shift();
      attention_values.push(value);
  }
  else if (address == '/mindwave/meditation')
  {
        meditation_values.shift();
        meditation_values.push(value);
  }
  else if (address == '/mindwave/raw')
  {
        raw_values.shift();
        raw_values.push(value);
  }
  else if (address == '/mindwave/eyeblink')
  {
        eyeblink_values.shift()
        eyeblink_values.push(100);
  }

  if (address != '/mindwave/eyeblink' && address != '/mindwave/raw')
  {
        eyeblink_values.shift();
        eyeblink_values.push(0);
  }
}

function sendOsc(address, value)
{
  socket.emit('message', [address].concat(value));
}

function setupOsc(oscPortIn, oscPortOut)
{
  var socket = io.connect('http://127.0.0.1', { port: 8081, rememberTransport: false });
  socket.on('connect', function() {
    socket.emit('config', {
      server: { port: oscPortIn,  host: '127.0.0.1'},
      client: { port: oscPortOut, host: '127.0.0.1'}
    });
  });
  socket.on('message', function(msg) {
    if (msg[0] == '#bundle') {
      for (var i=2; i<msg.length; i++) {
        receiveOsc(msg[i][0], msg[i].splice(1));
      }
    } else {
      receiveOsc(msg[0], msg.splice(1));
    }
  });
}

function setGradient(x, y, w, h, c1, c2, axis)
{
  noFill();

  if (axis == Y_AXIS)
  {  // Top to bottom gradient
    for (var i = y; i <= y+h; i++)
    {
      var inter = map(i, y, y+h, 0, 1);
      var c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x+w, i);
    }
  }
  else if (axis == X_AXIS)
  {  // Left to right gradient
    for (var i = x; i <= x+w; i++)
    {
      var inter = map(i, x, x+w, 0, 1);
      var c = lerpColor(c1, c2, inter);
      stroke(c);
      line(i, y, i, y+h);
    }
  }
}

function barGraph(originx, originy, values, helpers, width, spacing, bottomcolor,
                  topcolor, easing)
{
  push();
  translate(originx, originy);
  for (var i=0; i<values.length; i++)
  {

    var targetHeight = values[i]*heightScale;
    var currentHeight = helpers[i]*heightScale;
    var dh = targetHeight - currentHeight;

    if (abs(dh) > 0)
    {
      var h = currentHeight;
      h = h + dh*easing;
      helpers[i] = h/heightScale;
    }

    if (topcolor === bottomcolor)
    {
        if (h >= 0)
        {
          rect(spacing + i*(spacing+width),-h,width,h);
        }
        else
        {
          push();
          h = abs(h);
          translate(0, h);
          rect(spacing + i*(spacing+width),-h,width,h);
          pop();
        }
    }
    else
    {
      if (h >= 0)
      {
        setGradient(spacing + i*(spacing+width), -h, width, h, topcolor,
                    bottomcolor, Y_AXIS);
      }
      else
      {
        push();
        h = abs(h);
        translate(0, h);
        setGradient(spacing + i*(spacing+width), -h, width, h, bottomcolor,
                    topcolor, Y_AXIS);
        pop();
      }
    }
  }
  pop();
}

function setup()
{
    createCanvas(canvasWidth, canvasHeight);
    frameRate(frmrate);
    background(30, 30, 30);
    setupOsc(3333,3334);
}

function draw()
{
  background(30, 30, 30);

  var width = 20;
  var spacing = 3;

  textSize(32);
  fill(0, 102, 153);
  text("attention", 10, 60);
  text("meditation", 10, canvasHeight/4.0 + 60);
  text("raw", 10, 2*canvasHeight/4.0 + 60);
  text("eyeblink", 10, 3*canvasHeight/4.0 + 60);

  barGraph((canvasWidth - (attention_values.length)*(spacing+width))/2.0,
           canvasHeight/4.0, //(canvasHeight - (max(values)-min(values)))/2.0+max(values),
           attention_values,
           attention_helpers,
           width,
           spacing,
           color(218, 165, 32), // yellowish
           color(72, 61, 139),  // blueish
           0.2*(30.0/frmrate));

   barGraph((canvasWidth - (meditation_values.length)*(spacing+width))/2.0,
            2*canvasHeight/4.0, //(canvasHeight - (max(values)-min(values)))/2.0+max(values),
            meditation_values,
            meditation_helpers,
            width,
            spacing,
            color(255, 176, 59), // light brown
            color(182, 73, 38),  // darker brown
            0.2*(30.0/frmrate));

   barGraph((canvasWidth - (raw_values.length)*(spacing+width/4.0))/2.0,
            3*canvasHeight/4.0, //(canvasHeight - (max(values)-min(values)))/2.0+max(values),
            raw_values,
            raw_helpers,
            width/4.0,
            spacing,
            color(0, 255, 0), // green
            color(255, 0, 0),  // red
            0.2*(30.0/frmrate));

   barGraph((canvasWidth - (eyeblink_values.length)*(spacing+width*8))/2.0,
            4*canvasHeight/4.0,
            eyeblink_values,
            eyeblink_helpers,
            width*8,
            spacing,
            color(88, 0, 9), // dark red
            color(240, 60, 125), // pink
            0.3*(30.0/frmrate));

}
