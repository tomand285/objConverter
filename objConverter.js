/**
 * @author Andrew Tomko
 * https://github.com/tomand285/objConverter
 *
 * This is a Node.js program for converting obj files into javascript files (objjs) to use with WebGL
 */
var fs = require('fs');
var pathSys = require('path');

 //current directory
var path = ".";
var fileList = new Array();
var activeMaterial = null;

/**
 *	An error message
 */
var errMsg = function(){
	console.log("Usage: node " + pathSys.basename(__filename) +" [ optional: obj files ]");
 	console.log("	NOTE: This converter will scan the \n"+
 				"	entire directory if .obj files\n"+
 				"	are not specified.");
 	process.exit(-1);
}

/**
 *	Iterates through all the lines of the obj file
 *	@param {string} str - the lines of the obj file
 *	@return {JSON} out - the contents of the obj file in JSON format
 */ 
var parse = function (str) {
	var lines = str.split("\n");	
	activeMaterial = null;
	var out = {
		vertices : [],
		normals : [],
		texCoords : [],
		groups : {}
	};

	while(lines.length){
		lines = _parse(lines, out);
	}

	return out;
}

/**
 *	Parses each line of the obj file
 *	@param {string} Lines - a line of the obj file
 *	@param {JSON} out - the contents of the obj file in JSON format
 *	@return {JSON} lines - the contents of the obj file in JSON format
 */
var _parse = function (lines, out) {

	var vertices = out.vertices,
	normals = out.normals,
	coords = out.texCoords,
	groups = out.groups;

	var faces = [];
	var name = null;

	var i = 0;

	mainloop:
	for(i = 0; i < lines.length;i++){
		var tokens = lines[i].replace(/\s+/g, " ").split(" ")
		var t0 = tokens[0];
		switch(t0){
			case 'g':
			if(name === null){
				name = tokens[1];
			}else{

				break mainloop;
			}
			break;
			case "usemtl":
			activeMaterial = tokens[1];
			break;
			case 'v':
			vertices.push([ parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]) ]);
			break;
			case 'vt':
			coords.push([ parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]) ]);
			break;
			case 'vn':
			normals.push([ parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]) ]);
			break;
			case 'f':
			var numSides = tokens.length-2;
			var face = [];
			//can take in a face with any number of sides
			for(var j=1;j<=numSides;j++){
				face.push(tokens[j].split("/"));
			}
			//var face =  [ tokens[1].split("/"),  tokens[2].split("/"), tokens[3].split("/") ]; 
			for(var n = 0; n < face.length;n++){
				var v = face[n];
				for(var j = 0; j < v.length;j++){
					var str = v[j];
					if(str.length){
						var value = parseInt(str);
						v[j] = (value >= 0)? value - 1 : vertices.length + value;
					}else{
						v[j] = null;
					}
				}

				for(var j = v.length; j < 3;j++){
					v[j] = null;
				}
			}
			faces.push(face);
			break;
		}


	}

	if(name !== null){
		groups[name] = {
			vertices : vertices,
			normals : normals,
			texCoords : coords,
			faces : faces,
			material : activeMaterial
		}
	}

	return lines.splice(i+1);
}

/**
 *	Normalizes the given array
 *	@param {int[]} vec - a 3D vector
 *	@return {int[]} norm - a normalized 3D vector
 */
function normalize(vec){
	var sqVec = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
	var norm;
	if(sqVec != 0)
		norm = [vec[0]/sqVec,vec[1]/sqVec,vec[2]/sqVec];
	else
		norm = [0,0,0];

	return norm;
}

/**
 *	Given 3 3D points, calculates the normal
 *	@param {int[]} p1,p2,p3 - a point in 3D
 *	@return {int[]} - a normalized 3D vector
 */
function calcNormal(p1,p2,p3){
	var U = [p1[0]-p2[0],p1[1]-p2[1],p1[2]-p2[2]];
	var V = [p3[0]-p1[0],p3[1]-p1[1],p3[2]-p1[2]];

	var Nx = U[1]*V[2] - U[2]*V[1];
	var Ny = U[2]*V[0] - U[0]*V[2];
	var Nz = U[0]*V[1] - U[1]*V[0];

	return normalize([Nx,Ny,Nz]);

}

/**
 *	Scans the directory for obj files
 *	@param {string[]} path - an Array of file names that are in the current directory
 */
function readList(files){
	for (var i=0; i<files.length; i++) {
 		if(files[i].indexOf('.') == -1)
 			continue;
 		fileList[i] = new Object();
 		fileList[i].fullName = files[i];
 		fileList[i].name = files[i].split('.')[0];
 		fileList[i].ext = (files[i].split('.')[1]).toLowerCase();
 		fileList[i].obj = [];
 		if(fileList[i].ext == "obj"){			
 			fileList[i].obj = parse(fs.readFileSync(fileList[i].fullName, 'utf8'));
 			writeFile(fileList[i]);
 		}
 	}
}

/**
 *	Creates and writes to the obj file's corresponding objjs file
 *	@param {string} file - an array of data for the obj file
 */
function writeFile(file){

//creates a new objjs file or overwrites existing file
var fileName = file.name+".objjs";
var stream = fs.createWriteStream(fileName);

var vert = [], norm = [], tex = [];

/**
 *	Writes to file all the obj data
 */
 stream.once('open', (fd) => {
 	console.log("Writing to "+ fileName +"...");

 	var JsonVert = file.obj.vertices;
 	var JsonNorm = file.obj.normals;
 	var JsonTex = file.obj.texCoords;

 	//copy raw info from obj file
 	stream.write("var LoadedOBJFiles = LoadedOBJFiles || {};\n");
 	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"] = {}\n");
 	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".vertices = " + JSON.stringify(JsonVert) + ";\n");
 	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".normals = " + JSON.stringify(JsonNorm) + ";\n");
 	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".texCoords = " + JSON.stringify(JsonTex) + ";\n");
 	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups = {}\n");
 	console.log("The groups are:");
 	for(var key in file.obj.groups ){
 		var keyStr = "'" + key + "'";
 		console.log("     "+key);
 		var faces = file.obj.groups[key].faces;
 		stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + "] = {}\n");
 		stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + "].vertices = " + "LoadedOBJFiles[\"" + file.fullName + "\"]" + ".vertices;\n");
 		stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + "].normals = " + "LoadedOBJFiles[\"" + file.fullName + "\"]" + ".normals;\n");
 		stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + "].texCoords = " + "LoadedOBJFiles[\"" + file.fullName + "\"]" + ".texCoords;\n");
 		stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + "].faces = " + JSON.stringify(faces) + ";\n");
 		stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + "].material ='" + file.obj.groups[key].material + "';\n");

 		//I know 3 for-loops has bad time complexity so I need to find a faster solution.
 		//convert a face of any shape into triangles
 	   	var newFaces = [];
    	for(var i=0;i<faces.length;i++){
    		var face = faces[i];
    		for(var n=1;n<face.length-1;n++){
    			newFaces.push([face[0], face[n], face[n+1]]);
    		}
    	}
    	
    	for(var i = 0;i<newFaces.length;i++){   //for each face
 			var face = newFaces[i];
        	for(var n = 0;n < face.length;n++){ //for each vertex
        		var indices = face[n];
        		vert.push(JsonVert[indices[0]][0],JsonVert[indices[0]][1],JsonVert[indices[0]][2]);
        		if(indices[1] != null)
        			tex.push(JsonTex[indices[1]][0],JsonTex[indices[1]][1]);
        		if(indices[2] != null)
        			norm.push(JsonNorm[indices[2]][0],JsonNorm[indices[2]][1],JsonNorm[indices[2]][2]);
        		else{
        			var calcNormTmp = calcNormal(JsonVert[face[0][0]],JsonVert[face[1][0]],JsonVert[face[2][0]]);
        			norm.push(calcNormTmp[0],calcNormTmp[1],calcNormTmp[2]);  
        		}
       		}

    	}

    	//output for the twgl buffers
    	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + " ].webGL = {}\n");
    	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + " ].webGL.vertices = "+ JSON.stringify(vert) +"\n");
    	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + " ].webGL.texCoords = "+ JSON.stringify(tex)+"\n");
    	stream.write("LoadedOBJFiles[\"" + file.fullName + "\"]" + ".groups[" + keyStr + " ].webGL.normals = "+ JSON.stringify(norm) +"\n");
    }

 	stream.end();
 	console.log(fileName+" is ready");
 });
}

//If user does not supply the names of the obj file, scan entire directory
if(process.argv.length > 2){
 	console.log("Reading obj list...");
 	var objList = [];
 	for(var i=2;i<process.argv.length;i++){
 		if(process.argv[i].indexOf('.') == -1 || (process.argv[i].split('.')[1]).toLowerCase() != "obj") 
 			errMsg();
 		objList.push(process.argv[i]);
 	}
 	readList(objList);
}else{

 	fs.readdir(path, function(err, files) {	
 		console.log("Reading Directory...");
 		readList(files);
 	});
}