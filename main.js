// Modules to control application life and create native browser window
const {shell, app, BrowserWindow, ipcMain} = require('electron')

var fs = require('fs') // Läser filer
var makeDir = require('make-dir'); // Skapar mappar

var op = require('os');

//Hittar dev mappen. OBS nu enbart stöd för Mac!!!.
//Möjlighet att identifiera: "freebsd" och "sunos".
console.log(process.platform);
if(process.platform == 'darwin'){
	var lanktillfranz = op.homedir() + '/Library/Application Support/Franz/recipes/';
}else if(process.platform == 'win32'){
	var lanktillfranz = op.homedir() + '/AppData/Roaming/Franz/recipes/';
}else if(process.platform == 'linux'){
	var lanktillfranz = op.homedir() + '/.config/Franz/recipes/';
};
console.log(lanktillfranz);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({width: 400, height: 600, icon: 'icon/franz-icon.png'})

	// and load the index.html of the app.
	mainWindow.loadFile('index.html')

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
};

function makeid(namn){return namn.replace(/\s/g,'').replace( /\W/g , '').toLowerCase();};

///////////////////
ipcMain.on('load', (event, data) => {
	fs.readdir(lanktillfranz, function(err, filenames) {
		if(err){
			console.log('Franz folder could not be find');
			event.sender.send('cantfindfranz', '');
			return;
		};
		fs.readdir(lanktillfranz + 'dev/', function(err, filenames) {
			console.log('Franz folder found');
			if (err) {
				console.log('Dev mappen kunde inte hittas');
				makeDir(lanktillfranz + 'dev/').then(path => {
					console.log('Dev mappen skapad.');
					event.sender.send('oldprojects', []);
				});
				return;
			};
			console.log(filenames);
			event.sender.send('oldprojects', filenames);
		});
	});
});
ipcMain.on('loadproject', (event, data) => {
	var projectfolder = lanktillfranz + 'dev/' + data + '/';
	fs.readdir(projectfolder, function(err, filenames) {
		if (err) {
			console.log('Projektet kunde inte hittas!');
		}
		var packagejson = JSON.parse(fs.readFileSync(projectfolder + 'package.json', 'utf8'));
		var webviewjs = fs.readFileSync(projectfolder + 'webview.js', 'utf8');
		var iconsvg = fs.readFileSync(projectfolder + 'icon.svg', 'utf8');
		var athors = [];
		var allathors = packagejson.author.split(', ');
		for (var i = 0; i < allathors.length; i++){
			var athorsplit = allathors[i].split(' <');
			athors.push({"name": athorsplit[0], "email": athorsplit[1].replace('>', '')});
		};
		if(webviewjs.includes('Franz.setBadge(')){
			if(webviewjs.includes('Franz.setBadge(number);')){
				var webviewdata = webviewjs.split('// get unread feeds\n    ')[1].split('\n    // set Franz badge')[0];
			}else{
				var webviewdata = webviewjs;
			};
		}else{
			var webviewdata = '';
		};
		var data = {"projectname": packagejson.name, "description": packagejson.description, "athors": athors, "url": packagejson.config.serviceURL, "advanced": webviewdata, "iconone": iconsvg};
		event.sender.send('pasteproject', data);
	});
});
ipcMain.on('build', (event, data) => {
	console.log(data);
	var projectid = makeid(data.projectname);

	var usernames = data.username.split(', ');
	var emails = data.email.split(', ');
	var users = [];
	for (var i = 0; i < usernames.length; i++){
		users.push(usernames[i] + ' <' + emails[i] + '>');
	};
	var indexjs = '"use strict";\n\n// just pass through Franz\nmodule.exports = Franz => Franz;\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtYWlsL2luZGV4LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJGcmFueiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBQSxPQUFPQyxPQUFQLEdBQWlCQyxTQUFTQSxLQUExQiIsImZpbGUiOiJnbWFpbC9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGp1c3QgcGFzcyB0aHJvdWdoIEZyYW56XG5tb2R1bGUuZXhwb3J0cyA9IEZyYW56ID0+IEZyYW56O1xuIl19';
	var packagejson = '{\n  "id": "' + projectid + '",\n  "name": "' + data.projectname + '",\n  "version": "1.0.0",\n  "description": "' + data.description + '",\n  "main": "index.js",\n  "author": "' + users.join(', ') + '",\n  "license": "MIT",\n  "config": {\n    "serviceURL": "' + data.url + '"\n  }\n}';
	if(data.advanced.includes('Franz.setBadge(')){
		var webviewjs = data.advanced;
	}else{
		var webviewfirst = '\'use strict\';\n\nmodule.exports = Franz => {\n  const getMessages = function getMessages() {\n    ';
		var webviewsecond = '\n  };\n  // check for new messages every second and update Franz badge\n  Franz.loop(getMessages);\n};\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtYWlsL3dlYnZpZXcuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIkZyYW56IiwiZ2V0TWVzc2FnZXMiLCJjb3VudCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImxlbmd0aCIsImdldEF0dHJpYnV0ZSIsInBhcnNlSW50IiwicmVwbGFjZSIsImlzTmFOIiwic2V0QmFkZ2UiLCJsb29wIl0sIm1hcHBpbmdzIjoiOztBQUFBQSxPQUFPQyxPQUFQLEdBQWtCQyxLQUFELElBQVc7QUFDMUIsUUFBTUMsY0FBYyxTQUFTQSxXQUFULEdBQXVCO0FBQ3pDLFFBQUlDLFFBQVEsQ0FBWjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFJQyxTQUFTQyxzQkFBVCxDQUFnQyxPQUFoQyxFQUF5Q0MsTUFBekMsR0FBa0QsQ0FBdEQsRUFBeUQ7QUFDdkRILGNBQVFDLFNBQVNDLHNCQUFULENBQWdDLE9BQWhDLEVBQXlDQyxNQUFqRDtBQUNEOztBQUVELFFBQUlGLFNBQVNDLHNCQUFULENBQWdDLFNBQWhDLEVBQTJDQyxNQUEzQyxHQUFvRCxDQUF4RCxFQUEyRDtBQUN6RDtBQUNBLFVBQUlGLFNBQVNDLHNCQUFULENBQWdDLFNBQWhDLEVBQTJDLENBQTNDLEVBQThDRSxZQUE5QyxDQUEyRCxZQUEzRCxLQUE0RSxJQUFoRixFQUFzRjtBQUNwRkosZ0JBQVFLLFNBQVNKLFNBQVNDLHNCQUFULENBQWdDLFNBQWhDLEVBQTJDLENBQTNDLEVBQThDRSxZQUE5QyxDQUEyRCxZQUEzRCxFQUF5RUUsT0FBekUsQ0FBaUYsVUFBakYsRUFBNkYsRUFBN0YsQ0FBVCxFQUEyRyxFQUEzRyxDQUFSO0FBQ0Q7O0FBRUQ7QUFDQSxVQUFJTCxTQUFTQyxzQkFBVCxDQUFnQyxTQUFoQyxFQUEyQyxDQUEzQyxFQUE4Q0UsWUFBOUMsQ0FBMkQsT0FBM0QsS0FBdUUsSUFBM0UsRUFBaUY7QUFDL0VKLGdCQUFRSyxTQUFTSixTQUFTQyxzQkFBVCxDQUFnQyxTQUFoQyxFQUEyQyxDQUEzQyxFQUE4Q0UsWUFBOUMsQ0FBMkQsT0FBM0QsRUFBb0VFLE9BQXBFLENBQTRFLFVBQTVFLEVBQXdGLEVBQXhGLENBQVQsRUFBc0csRUFBdEcsQ0FBUjtBQUNEO0FBQ0Y7O0FBRUQ7QUFDQSxRQUFJQyxNQUFNUCxLQUFOLENBQUosRUFBa0I7QUFDaEJBLGNBQVEsQ0FBUjtBQUNEOztBQUVEO0FBQ0FGLFVBQU1VLFFBQU4sQ0FBZVIsS0FBZjtBQUNELEdBL0JEOztBQWlDQTtBQUNBRixRQUFNVyxJQUFOLENBQVdWLFdBQVg7QUFDRCxDQXBDRCIsImZpbGUiOiJnbWFpbC93ZWJ2aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSAoRnJhbnopID0+IHtcbiAgY29uc3QgZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbiBnZXRNZXNzYWdlcygpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgLy8gRWFjaCB0ZXN0IGlzIGRvbmUgaW4gb3JkZXIgb2YgbGVhc3QgYWNjdXJhdGUgKGJ1dCBtb3N0IHJvYnVzdClcbiAgICAvLyAtPiBtb3N0IGFjY3VyYXRlIChidXQgbGVhc3Qgcm9idXN0KVxuICAgIC8vIGZvciByZWxpYWJpbGl0eSBvZiBhdCBsZWFzdCBnZXR0aW5nIGEgcmVzdWx0XG5cbiAgICAvLyAzcmQgYmVzdCB0ZXN0IChiYXNpYywgbGVzcyBhY2N1cmF0ZSBidXQgT0sgaWYgbm90aGluZyBlbHNlIHdvcmtzKVxuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd6QSB6RScpLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvdW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnekEgekUnKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ0otS2UgbjAnKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyAybmQgYmVzdCAobW9yZSBkZXRhaWxlZCBjaGVjaywgbXVjaCBtb3JlIGFjY3VyYXRlIGlmIGF2YWlsYWJsZSlcbiAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdKLUtlIG4wJylbMF0uZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykgIT0gbnVsbCkge1xuICAgICAgICBjb3VudCA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ0otS2UgbjAnKVswXS5nZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnKS5yZXBsYWNlKC9bXjAtOS5dL2csICcnKSwgMTApO1xuICAgICAgfVxuXG4gICAgICAvLyAxc3QgYmVzdFxuICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ0otS2UgbjAnKVswXS5nZXRBdHRyaWJ1dGUoJ3RpdGxlJykgIT0gbnVsbCkge1xuICAgICAgICBjb3VudCA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ0otS2UgbjAnKVswXS5nZXRBdHRyaWJ1dGUoJ3RpdGxlJykucmVwbGFjZSgvW14wLTkuXS9nLCAnJyksIDEwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBKdXN0IGluY2FzZSB3ZSBkb24ndCBlbmQgdXAgd2l0aCBhIG51bWJlciwgc2V0IGl0IGJhY2sgdG8gemVybyAocGFyc2VJbnQgY2FuIHJldHVybiBOYU4pXG4gICAgaWYgKGlzTmFOKGNvdW50KSkge1xuICAgICAgY291bnQgPSAwO1xuICAgIH1cblxuICAgIC8vIHNldCBGcmFueiBiYWRnZVxuICAgIEZyYW56LnNldEJhZGdlKGNvdW50KTtcbiAgfTtcblxuICAvLyBjaGVjayBmb3IgbmV3IG1lc3NhZ2VzIGV2ZXJ5IHNlY29uZCBhbmQgdXBkYXRlIEZyYW56IGJhZGdlXG4gIEZyYW56Lmxvb3AoZ2V0TWVzc2FnZXMpO1xufTtcbiJdfQ==';
		if(data.advanced == ''){
			var webviewjs = webviewfirst + '//Nothing todo' + webviewsecond;
		}else{
			var webviewjs = webviewfirst + '// get unread feeds\n    ' + data.advanced + '\n    // set Franz badge\n    Franz.setBadge(number);' + webviewsecond;
		};
	};
	var iconsvg = data.svg;
	var projectfolder = lanktillfranz + 'dev/' + projectid + '/';
	fs.readdir(projectfolder, function(err, filenames) {
		if (err) {
			console.log('Projekt finns inte sedan innan.');
			makeproject(projectfolder, packagejson, indexjs, webviewjs, iconsvg);
		}else{
			if(data.override == 'true') {
				console.log('Projektet finns redan men användaren har godkänt att tidigare filer tas bort!');
				makeproject(projectfolder, packagejson, indexjs, webviewjs, iconsvg);
			}else{
				console.log('Projektet finns redan varnar användaren!');
				event.sender.send('projectexist', []);
				return;
			};
		};
		event.sender.send('projectsaved', []);
	});
});
function makeproject(projectfolder, packagejson, indexjs, webviewjs, iconsvg){
	makeDir(projectfolder).then(path => {
		console.log('Projektmapp skapad.');
		fs.writeFileSync(projectfolder + 'package.json', packagejson, 'utf-8');
		fs.writeFileSync(projectfolder + 'index.js', indexjs, 'utf-8');
		fs.writeFileSync(projectfolder + 'webview.js', webviewjs, 'utf-8');
		fs.writeFileSync(projectfolder + 'icon.svg', iconsvg, 'utf-8');
	});
};
ipcMain.on('opendev', (event, data) => {
	shell.openItem(lanktillfranz + 'dev/');
});
///////////////////

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	};
});