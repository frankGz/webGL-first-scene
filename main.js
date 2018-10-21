

var canvas;
var gl;

var program ;

var near = -100;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var prevTime = 0.0 ;
var resetTimerFlag = true ;
var animFlag = false ;

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    //gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    gl.clearColor( 0, 0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    setColor(materialDiffuse) ;

    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;


    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );


    gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );


    document.getElementById("sliderXi").onchange = function() {
        RX = this.value ;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").onchange = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").onchange = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
        console.log(animFlag) ;
    };


    render();
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}



function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0,0,10);
    MS = [] ; // Initialize modeling matrix stack

    modelMatrix = mat4() ;

    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);

    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);


    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;



    setAllMatrices() ;

    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;
    }


    /*
      Draw all the static objects
    */

      //big black rocks
      gPush();
      {
        gTranslate(0,-1.55,0) ;
        gScale(0.5,0.5,0.5);
        setColor(vec4(0.35,0.35,0.35,1.0)) ;
        drawSphere();
      }
      gPop();

      //small rock
      gPush();
      {
        gTranslate(-0.75,-1.8,0) ;
        gScale(0.25,0.25,0.25);
        setColor(vec4(0.35,0.35,0.35,1.0)) ;
        drawSphere();

      }
      gPop();

      //green ground
      gPush();
      {
        gTranslate(0,-2.3,0) ;
        setColor(vec4(0.388, 0.56, 0.23,1.0)) ;

        gScale(10,0.24,10);

        drawCube() ;
      }
      gPop();

    /*
      Draw all moving objects
    */

      //Seaweed * 3
      gPush();
      {
        //middle
        gTranslate(0,-0.77,0) ;
        drawSwead();

        //left
        gTranslate(-0.5,-0.5,0) ;
        drawSwead();

        //right
        gTranslate(1,0,0) ;
        drawSwead();

      }
      gPop();

      //draw fish
      gPush();
      {
        gRotate(-TIME*90/3.14159,0,1,0) ;
        gTranslate(2.3,0.6-0.9*(Math.sin(TIME) + 1),0) ;
        drawFish();
      }
      gPop();

    if( animFlag )
        window.requestAnimFrame(render);
}

/*
  draw a Swead made of 10 small green Ovals
*/
function drawSwead(){
      //first part, does not move
      setColor(vec4(0.15,0.70,0.15,1.0)) ;
      gPush();
      {
        gScale(0.10,0.27,0.10);
        drawSphere();
      }
      gPop();

      // rest part * 9
      gPush();
      {

        var direction = 1;
        for(var i = 1; i <= 9; i++){
          //console.log(direction);

          gTranslate(0,0.256,0);

          //staring angle
          gRotate(direction*5,0,0,1) ;
          //shake it!
          gRotate(direction*17*Math.sin(TIME*1.1+i*10),0,0,1) ;
          gTranslate(0,0.256,0);
          gPush();
          {
            gScale(0.10,0.27,0.10);
            drawSphere();
          }
          gPop();

          // change the direction every three pieces
          if(i%3==0)  direction *= -1;

        }


      }
      gPop();



}

/*
  draw a fish with moving tail
*/
function drawFish(){
    //face
    gPush();
    {
        //draw white face
        setColor(vec4(0.6,0.6,0.6,1.0));
        gScale(0.5,0.5,0.5);
        gTranslate(0,0,0.5);
        drawCone();
        //round the face
        gPush();
        {
            setColor(vec4(2.2,2.2,2.2,1.0));
            gTranslate(0,0,-0.5);
            gScale(1.000001,1.000001,0);
            drawSphere();
        }
        gPop();




        //left eye
        gPush();
        {
            gTranslate(0.4,0.5,0);
            setColor(vec4(1.0,1.0,1.0,1.0));
            gScale(0.22,0.22,0.22);
            drawSphere();

            gTranslate(0,0,1);
            setColor(vec4(0,0,0,1.0));
            gScale(0.5,0.5,0.5);
            drawSphere();
        }
        gPop();

        //right eye
        gPush();
        {
            gTranslate(-0.4,0.5,0);
            setColor(vec4(1.0,1.0,1.0,1.0));
            gScale(0.22,0.22,0.22);
            drawSphere();

            gTranslate(0,0,1);
            setColor(vec4(0,0,0,1.0));
            gScale(0.5,0.5,0.5);
            drawSphere();
        }
        gPop();
    }
    gPop();

    //body
    gPush();
    {
        setColor(vec4(0.8,0.1,0.1,1.0));
        gRotate(180,1,0,0);
        gScale(0.5,0.5,2);
        gTranslate(0,0,0.5);
        drawCone();
    }
    gPop();

    //tails
    gPush();
    {
        gTranslate(0,0,-2); //locate to the body end
        //tail movament
        gRotate(45*Math.sin(TIME*10),0,1,0) ;

        //upper tail
        gPush();
        {
          setColor(vec4(0.8,0.1,0.1,1.0));
          gTranslate(0,0.35,-0.35);
          gRotate(225,1,0,0);
          gScale(0.15,0.15,1);
          drawCone();
          //fill the bottom with white
          setColor(vec4(4,4,4,1.0));
          gTranslate(0,0,-0.5);
          gScale(1,1,0);
          drawSphere();
        }
        gPop();

        //lower tail
        gPush();
        {
          setColor(vec4(0.8,0.1,0.1,1.0));
          gTranslate(0,-0.3,-0.245);
          gRotate(135,1,0,0);
          gScale(0.15,0.15,0.7);
          drawCone();
          //fill the bottom with white
          setColor(vec4(4,4,4,1.0));
          gTranslate(0,0,-0.5);
          gScale(1,1,0);
          drawSphere();
        }
        gPop();

    }
    gPop();

}
