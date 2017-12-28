# objConverter.js #

This is a Node.js program designed to create a file that holds obj data that can be read by javascript intended to be used with webGL. To start with, I modified [this](https://github.com/Squeakrats/OBJLoader) obj converter and made it for Node.js.

### What is this repository for? ###

I created this for CS 559 Computer Graphics at UW - Madison as a way to help me auto create a file of obj data.
The output format is based off of [this tool](https://github.com/Squeakrats/OBJLoaderl).

### How do I get set up? ###

* You must have [Node.js](https://nodejs.org/en/) downloaded onto your computer in order for this program to run.
* Either copy or download objConverter.js and run using Node.js.
* Save a copy of this program in the directory of your textures and run via the terminal:
```
node objConverter.js
```
or
```
node objConverter.js filename1.obj filename2.obj ...
```
* The new file will be called:
	* original file: filename.obj
```
filename.objjs
```

### How to use filename.objjs in your program? ###
* In html file:
```
<script src="objFolder/filename.objjs"></script>
```
* In the object part of your code:
	* Note: This has only been tested with [twgl.js](https://twgljs.org/docs/) but may still work for normal WebGL. 
```
var myVert = LoadedOBJFiles["filename.obj"].groups["myGroup"].webGL.vertices, 
        myNorm = LoadedOBJFiles["filename.obj"].groups["myGroup"].webGL.normals, 
        myTex = LoadedOBJFiles["falconPoly.obj"].groups["myGroup"].webGL.texCoords;

var arrays = {
                	vpos : { numComponents: 3, data: myVert },
                	vtex : {numComponents: 2, data: myTex},
                	vnormal : {numComponents:3, data: myNorm}
            	};

var buffers = twgl.createBufferInfoFromArrays(gl,arrays);

...more code for making objects...

```
### Notes: ###
* If the normal is not supplied in the obj file, this program will create its own using the vector position data.
	* This is a basic calculation that can be changed if it does not fit your needs. See the ```calcNormal``` function. 
* The group names for each object is included in the output of the Node.js program so you do not need to look inside the output file.
* This converter will work with any face shape (ex. triangles, quad, poly)

### Contribution guidelines ###

* If you would like to make edits, please create a pull request or make an new issue.

### Who do I talk to? ###

* Andrew Tomko
* tomand285@gmail.com
